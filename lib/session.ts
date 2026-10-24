export const SESSION_COOKIE = "bt_session";
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

const encoder = new TextEncoder();

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

export async function createSessionToken(secret: string) {
  const expiresAt = String(Date.now() + SESSION_MAX_AGE_SECONDS * 1000);
  const signature = await crypto.subtle.sign("HMAC", await importKey(secret, ["sign"]), encoder.encode(expiresAt));
  return `${expiresAt}.${toHex(signature)}`;
}

export async function verifySessionToken(token: string, secret: string) {
  const [expiresAt, signatureHex, ...rest] = token.split(".");
  if (!expiresAt || !signatureHex || rest.length > 0 || Number(expiresAt) <= Date.now()) return false;

  const signature = fromHex(signatureHex);
  if (!signature) return false;

  return crypto.subtle.verify("HMAC", await importKey(secret, ["verify"]), signature, encoder.encode(expiresAt));
}
