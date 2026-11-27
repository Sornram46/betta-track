export const SESSION_COOKIE = "bt_session";
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

export type UserRole = "owner" | "member";

export type Session = {
  userId: string;
  username: string;
  role: UserRole;
  expiresAt: number;
};

const encoder = new TextEncoder();
const decoder = new TextDecoder();

function importKey(secret: string, usage: KeyUsage[]) {
  return crypto.subtle.importKey("raw", encoder.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, usage);
}

function toHex(buffer: ArrayBuffer) {
  return Array.from(new Uint8Array(buffer), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function fromHex(hex: string) {
  if (!/^(?:[0-9a-f]{2})+$/i.test(hex)) return null;
  const bytes = new Uint8Array(hex.length / 2);
  for (let index = 0; index < bytes.length; index += 1) {
    bytes[index] = Number.parseInt(hex.slice(index * 2, index * 2 + 2), 16);
  }
  return bytes;
}

// base64url helpers that work in both the Node.js and Edge (proxy) runtimes.
function toBase64Url(text: string) {
  let binary = "";
  for (const byte of encoder.encode(text)) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(value: string) {
  if (!/^[A-Za-z0-9_-]+$/.test(value)) return null;
  try {
    const binary = atob(value.replace(/-/g, "+").replace(/_/g, "/"));
    return decoder.decode(Uint8Array.from(binary, (char) => char.charCodeAt(0)));
  } catch {
    return null;
  }
}

/** Admin = the farm owner account. Members can view and add fish but not edit or delete. */
export function isAdmin(session: Session | null) {
  return session?.role === "owner";
}

export async function createSessionToken(
  secret: string,
  user: { id: string; username: string; role: UserRole },
) {
  const payload = toBase64Url(
    JSON.stringify({
      uid: user.id,
      usr: user.username,
      role: user.role,
      exp: Date.now() + SESSION_MAX_AGE_SECONDS * 1000,
    }),
  );
  const signature = await crypto.subtle.sign("HMAC", await importKey(secret, ["sign"]), encoder.encode(payload));
  return `${payload}.${toHex(signature)}`;
}

/** Returns the session if the token is authentic and not expired, otherwise null. */
export async function readSessionToken(token: string | undefined, secret: string | undefined): Promise<Session | null> {
  if (!token || !secret) return null;

  const [payload, signatureHex, ...rest] = token.split(".");
  if (!payload || !signatureHex || rest.length > 0) return null;

  const signature = fromHex(signatureHex);
  if (!signature) return null;

  const isValid = await crypto.subtle.verify(
    "HMAC",
    await importKey(secret, ["verify"]),
    signature,
    encoder.encode(payload),
  );
  if (!isValid) return null;

  const json = fromBase64Url(payload);
  if (!json) return null;

  try {
    const data = JSON.parse(json) as { uid?: unknown; usr?: unknown; role?: unknown; exp?: unknown };
    if (
      typeof data.uid !== "string" ||
      typeof data.usr !== "string" ||
      (data.role !== "owner" && data.role !== "member") ||
      typeof data.exp !== "number" ||
      data.exp <= Date.now()
    ) {
      return null;
    }
    return { userId: data.uid, username: data.usr, role: data.role, expiresAt: data.exp };
  } catch {
    return null;
  }
}
