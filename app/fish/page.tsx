"use client";

import Link from "next/link";
import QRCode from "qrcode";
import { useEffect, useRef, useState } from "react";

type FishColor = "cyan" | "amber" | "emerald" | "rose";

type Ancestor = { id: string; name: string; age: string; imageUrl?: string | null };

type ParentFish = Ancestor & {
  imageUrl?: string | null;
  generation?: number;
  parents: { father: Ancestor; mother: Ancestor };
};

type FishRecord = {
  recordId: string;
  id: string;
  name: string;
  imageUrl: string | null;
  strain: string;
  sex: string;
  parents: string;
  age: string;
  generation: number;
  color: FishColor;
  father: ParentFish;
  mother: ParentFish;
  lineage: string;
};

const createFishPreviewArt = (name: string, tone: "cyan" | "pink") => {
  const palette =
    tone === "cyan"
      ? {
          start: "#22d3ee",
          end: "#0f172a",
          accent: "#dbeafe",
          body: "#38bdf8",
        }
      : {
          start: "#f9a8d4",
          end: "#1f2937",
          accent: "#fdf2f8",
          body: "#f472b6",
        };

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="640" height="420" viewBox="0 0 640 420">
      <defs>
        <linearGradient id="bg" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%" stop-color="${palette.start}" stop-opacity="0.88"/>
          <stop offset="100%" stop-color="${palette.end}" stop-opacity="1"/>
        </linearGradient>
      </defs>
      <rect width="640" height="420" fill="url(#bg)"/>
      <circle cx="500" cy="90" r="72" fill="${palette.accent}" opacity="0.12"/>
      <circle cx="120" cy="300" r="90" fill="${palette.accent}" opacity="0.08"/>
      <ellipse cx="340" cy="230" rx="180" ry="110" fill="${palette.body}" opacity="0.9"/>
      <path d="M105 232c20 13 47 27 92 30l-25 28c-47-8-93-31-116-65l49-27Z" fill="${palette.accent}" opacity="0.9"/>
      <path d="M160 190c28-25 61-44 96-56 20-7 42-12 76-11l-28 30c-22 6-39 14-62 31l-82 6Z" fill="${palette.accent}" opacity="0.8"/>
      <path d="M421 183l82-17-28 36 28 42-90-22 8-39Z" fill="${palette.accent}" opacity="0.8"/>
      <circle cx="235" cy="217" r="12" fill="#f8fafc"/>
      <circle cx="235" cy="217" r="5" fill="#0f172a"/>
      <path d="M514 130l34 20" stroke="${palette.accent}" stroke-width="6" stroke-linecap="round"/>
      <path d="M525 170l34 13" stroke="${palette.accent}" stroke-width="6" stroke-linecap="round"/>
      <path d="M514 84l32 8" stroke="${palette.accent}" stroke-width="6" stroke-linecap="round"/>
      <text x="50%" y="82%" fill="${palette.accent}" text-anchor="middle" font-size="30" font-family="Arial, sans-serif" font-weight="700">${name}</text>
    </svg>
  `;

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
};

function ParentCard({
  label,
  fish,
  tone,
}: {
  label: string;
  fish: { id: string; name: string; age: string; generation?: number; imageUrl?: string | null };
  tone: "cyan" | "pink";
}) {
  const [isPreviewVisible, setIsPreviewVisible] = useState(false);
  const holdTimer = useRef<number | null>(null);

  const clearHoldTimer = () => {
    if (holdTimer.current) {
      window.clearTimeout(holdTimer.current);
      holdTimer.current = null;
    }
  };

  const startPreview = () => {
    clearHoldTimer();
    holdTimer.current = window.setTimeout(() => {
      setIsPreviewVisible(true);
    }, 350);
  };

  const stopPreview = () => {
    clearHoldTimer();
    setIsPreviewVisible(false);
  };

  return (
    <div
      className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4"
      onPointerDown={startPreview}
      onPointerUp={stopPreview}
      onPointerLeave={stopPreview}
      onPointerCancel={stopPreview}
      onTouchStart={startPreview}
      onTouchEnd={stopPreview}
    >
      <p className={`text-xs uppercase tracking-[0.2em] ${tone === "cyan" ? "text-cyan-300" : "text-pink-300"}`}>
        {label}
      </p>
      <div className="mt-3 flex items-center gap-3">
        <div
          className={`flex h-11 w-11 items-center justify-center rounded-xl text-xs font-bold ${
            tone === "cyan" ? "bg-cyan-500/10 text-cyan-300" : "bg-pink-500/10 text-pink-300"
          }`}
        >
          {fish.name.slice(0, 2).toUpperCase()}
        </div>
        <div>
          <p className="font-medium text-white">{fish.name}</p>
          <p className="text-xs text-slate-400">{fish.id}</p>
        </div>
      </div>
      <div className="mt-3 flex items-center justify-between gap-2 text-xs text-slate-300">
        <span>อายุ: {fish.age}</span>
        {fish.generation ? <span className="rounded-full border border-slate-700 px-2 py-0.5">รุ่น {fish.generation}</span> : null}
      </div>

      {isPreviewVisible ? (
        <div className="mt-4 overflow-hidden rounded-xl border border-slate-700 bg-slate-900/90">
          <img
            src={fish.imageUrl ?? createFishPreviewArt(fish.name, tone)}
            alt={`รูป ${fish.name}`}
            className="h-32 w-full object-cover"
          />
          <div className="flex items-center justify-between gap-3 px-3 py-2 text-xs text-slate-200">
            <span>{fish.name}</span>
            <span className="rounded-full border border-slate-600 px-2 py-0.5 text-[10px] text-slate-300">{fish.id}</span>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function TreeNode({
  label,
  fish,
  tone,
  selected = false,
  onClick,
}: {
  label: string;
  fish: { id: string; name: string; age: string; generation?: number };
  tone: "cyan" | "pink";
  selected?: boolean;
  onClick?: () => void;
}) {
  const accent = tone === "cyan" ? "border-cyan-500/40 bg-cyan-500/10" : "border-pink-500/40 bg-pink-500/10";

  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex flex-col items-center text-left transition ${selected ? "scale-[1.01]" : "hover:scale-[1.01]"}`}
    >
      <div className="mb-2 text-[10px] font-medium uppercase tracking-[0.2em] text-slate-400">{label}</div>
      <div
        className={`w-full min-w-[150px] rounded-2xl border px-3 py-2.5 shadow-sm ${accent} ${
          selected ? "ring-2 ring-cyan-400/80 shadow-lg shadow-cyan-900/30" : ""
        }`}
      >
        <div className="flex items-center gap-2.5">
          <div
            className={`flex h-9 w-9 items-center justify-center rounded-xl text-[10px] font-bold ${
              tone === "cyan" ? "bg-cyan-500/20 text-cyan-100" : "bg-pink-500/20 text-pink-100"
            }`}
          >
            {fish.name.slice(0, 2).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-white">{fish.name}</p>
            <p className="text-[10px] text-slate-300">{fish.id}</p>
          </div>
        </div>
        <div className="mt-2 flex items-center justify-between text-[10px] text-slate-200">
          <span>{fish.age}</span>
          {fish.generation ? <span className="rounded-full border border-slate-700 px-2 py-0.5">รุ่น {fish.generation}</span> : null}
        </div>
      </div>
    </button>
  );
}

export default function FishPage() {
  const [fishList, setFishList] = useState<FishRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [qrImage, setQrImage] = useState<string | null>(null);
  const [qrError, setQrError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [relationshipView, setRelationshipView] = useState<"detail" | "tree">("detail");
  const [selectedLineage, setSelectedLineage] = useState<{
    label: string;
    fish: { id: string; name: string; age: string; generation?: number; imageUrl?: string | null };
    tone: "cyan" | "pink";
  } | null>(null);

  useEffect(() => {
    let isCurrent = true;

    async function loadFish() {
      setIsLoading(true);
      setLoadError(null);

      try {
        const response = await fetch("/api/fish", { cache: "no-store" });
        const payload: unknown = await response.json();

        if (!response.ok) {
          const message =
            typeof payload === "object" && payload !== null && "message" in payload &&
            typeof payload.message === "string"
              ? payload.message
              : "โหลดข้อมูลปลาไม่สำเร็จ";
          throw new Error(message);
        }
        if (!Array.isArray(payload)) throw new Error("รูปแบบข้อมูลปลาจาก API ไม่ถูกต้อง");

        if (isCurrent) setFishList(payload as FishRecord[]);
      } catch (error) {
        if (isCurrent) {
          setLoadError(error instanceof Error ? error.message : "เกิดข้อผิดพลาดในการโหลดข้อมูล");
        }
      } finally {
        if (isCurrent) setIsLoading(false);
      }
    }

    void loadFish();
    return () => {
      isCurrent = false;
    };
  }, [reloadKey]);

  const selectedFish = fishList.find((fish) => fish.id === selectedId) ?? null;

  useEffect(() => {
    if (!selectedFish) {
      setQrImage(null);
      setQrError(null);
      return;
    }

    let isCurrent = true;
    setQrImage(null);
    setQrError(null);
    const scanUrl = `${window.location.origin}/fish/qr/${encodeURIComponent(selectedFish.recordId)}`;

    QRCode.toDataURL(scanUrl, { errorCorrectionLevel: "H", margin: 2, width: 360 })
      .then((image) => {
        if (isCurrent) setQrImage(image);
      })
      .catch(() => {
        if (isCurrent) setQrError("สร้าง QR Code ไม่สำเร็จ");
      });

    return () => {
      isCurrent = false;
    };
  }, [selectedFish?.recordId]);

  useEffect(() => {
    if (selectedFish && !selectedLineage) {
      setSelectedLineage({
        label: "พ่อปลา",
        fish: selectedFish.father,
        tone: "cyan",
      });
    }

    if (!selectedFish) {
      setSelectedLineage(null);
    }
  }, [selectedFish, selectedLineage]);

  useEffect(() => {
    if (!selectedFish) {
      document.body.style.overflow = "";
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [selectedFish]);

  return (
    <main className="min-h-screen px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <header className="mb-6 flex flex-col gap-4 rounded-[24px] border border-slate-800 bg-slate-900/80 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[11px] uppercase tracking-[0.2em] text-cyan-300">Betta Track</p>
            <h1 className="mt-2 text-2xl font-bold text-white">ทะเบียนปลา</h1>
          </div>

          <Link
            href="/fish/new"
            className="inline-flex items-center justify-center rounded-xl bg-cyan-500 px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400"
          >
            + เพิ่มปลาใหม่
          </Link>
        </header>

        <div className="rounded-[22px] border border-slate-800 bg-slate-900/80 p-3 sm:p-4">
          {isLoading ? (
            <p className="px-3 py-6 text-center text-sm text-slate-300" role="status">กำลังโหลดข้อมูลปลา...</p>
          ) : null}

          {loadError ? (
            <div className="mb-4 flex flex-col items-start justify-between gap-3 rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 sm:flex-row sm:items-center">
              <p className="text-sm text-rose-200" role="alert">{loadError}</p>
              <button
                type="button"
                onClick={() => setReloadKey((key) => key + 1)}
                className="rounded-lg border border-rose-400/40 px-3 py-2 text-sm font-medium text-rose-100 transition hover:bg-rose-400/10"
              >
                ลองอีกครั้ง
              </button>
            </div>
          ) : null}

          {!isLoading && !loadError && fishList.length === 0 ? (
            <p className="px-3 py-8 text-center text-sm text-slate-400">ยังไม่มีข้อมูลปลาในฐานข้อมูล</p>
          ) : null}

          <div className="hidden overflow-hidden rounded-2xl border border-slate-800 bg-slate-950/60 md:block">
            <table className="min-w-full divide-y divide-slate-800 text-left text-sm">
              <thead className="bg-slate-950 text-slate-300">
                <tr>
                  <th className="px-4 py-3 font-medium">ปลา</th>
                  <th className="px-4 py-3 font-medium">สายพันธุ์</th>
                  <th className="px-4 py-3 font-medium">เพศ</th>
                  <th className="px-4 py-3 font-medium">รุ่น</th>
                  <th className="px-4 py-3 font-medium">พ่อ/แม่</th>
                  <th className="px-4 py-3 font-medium">อายุ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-200">
                {fishList.map((fish) => (
                  <tr
                    key={fish.id}
                    onClick={() => setSelectedId(fish.id)}
                    className={`cursor-pointer transition hover:bg-slate-800/60 ${selectedId === fish.id ? "bg-cyan-500/5" : ""}`}
                  >
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div
                          className={`flex h-10 w-10 items-center justify-center rounded-xl text-xs font-bold ${
                            fish.color === "cyan"
                              ? "bg-cyan-500/10 text-cyan-300"
                              : fish.color === "amber"
                                ? "bg-amber-500/10 text-amber-300"
                                : fish.color === "emerald"
                                  ? "bg-emerald-500/10 text-emerald-300"
                                  : "bg-rose-500/10 text-rose-300"
                          }`}
                        >
                          {fish.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-white">{fish.name}</p>
                          <p className="text-xs text-slate-400">{fish.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">{fish.strain}</td>
                    <td className="px-4 py-4">{fish.sex}</td>
                    <td className="px-4 py-4">
                      <span className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-2 py-1 text-[11px] text-cyan-300">
                        รุ่น {fish.generation}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-slate-300">{fish.parents}</td>
                    <td className="px-4 py-4">
                      <span className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-2 py-1 text-[11px] text-cyan-300">
                        {fish.age}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="grid gap-3 md:hidden">
            {fishList.map((fish) => (
              <div
                key={fish.id}
                onClick={() => setSelectedId(fish.id)}
                className={`cursor-pointer rounded-2xl border p-4 transition ${selectedId === fish.id ? "border-cyan-500/60 bg-cyan-500/5" : "border-slate-800 bg-slate-950/60"}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex h-11 w-11 items-center justify-center rounded-xl text-xs font-bold ${
                        fish.color === "cyan"
                          ? "bg-cyan-500/10 text-cyan-300"
                          : fish.color === "amber"
                            ? "bg-amber-500/10 text-amber-300"
                            : fish.color === "emerald"
                              ? "bg-emerald-500/10 text-emerald-300"
                              : "bg-rose-500/10 text-rose-300"
                      }`}
                    >
                      {fish.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-semibold text-white">{fish.name}</p>
                      <p className="text-xs text-slate-400">{fish.id}</p>
                    </div>
                  </div>
                  <span className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-2 py-1 text-[10px] text-cyan-300">
                    {fish.age}
                  </span>
                </div>

                <div className="mt-3 flex items-center justify-between gap-2">
                  <span className="text-xs text-slate-400">รุ่น {fish.generation}</span>
                  <span className="rounded-full border border-slate-700 px-2 py-1 text-[10px] text-slate-300">{fish.sex}</span>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3 text-xs text-slate-300">
                  <div>
                    <p className="text-slate-400">สายพันธุ์</p>
                    <p className="mt-1 font-medium text-white">{fish.strain}</p>
                  </div>
                  <div>
                    <p className="text-slate-400">พ่อ/แม่</p>
                    <p className="mt-1 font-medium text-white">{fish.parents}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {selectedFish && (
            <div
              className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/75 p-4 backdrop-blur-sm animate-[fadeIn_0.2s_ease-out]"
              onClick={() => setSelectedId(null)}
            >
              <div className="flex min-h-full items-center justify-center">
                <div
                  className="w-full max-w-3xl max-h-[90vh] overflow-y-auto animate-[scaleIn_0.22s_ease-out] rounded-[24px] border border-slate-800 bg-slate-900 shadow-2xl shadow-cyan-950/20"
                  onClick={(event) => event.stopPropagation()}
                >
                  <div className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-slate-800 bg-slate-900/95 px-5 py-4 backdrop-blur-sm">
                    <div>
                      <p className="text-[11px] uppercase tracking-[0.2em] text-cyan-300">สายพันธุ์</p>
                      <h2 className="mt-2 text-xl font-semibold text-white">{selectedFish.name}</h2>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedId(null)}
                      className="rounded-full border border-slate-700 px-3 py-1.5 text-sm text-slate-200 transition hover:border-cyan-500 hover:text-cyan-300"
                    >
                      ปิด
                    </button>
                  </div>

                  <div className="p-5">
                    <div className="mb-4 flex items-center justify-between gap-3 rounded-2xl border border-slate-800 bg-slate-950/70 p-3">
                      <div>
                        <p className="text-xs text-slate-400">รหัสปลา</p>
                        <p className="mt-1 font-medium text-white">{selectedFish.id}</p>
                      </div>
                      <span className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-2 py-1 text-[10px] text-cyan-300">
                        รุ่น {selectedFish.generation}
                      </span>
                    </div>

                    <section className="mb-4 flex flex-col items-center gap-4 rounded-2xl border border-slate-800 bg-slate-950/60 p-4 sm:flex-row sm:justify-between">
                      <div>
                        <h3 className="font-semibold text-white">QR Code</h3>
                        {qrError ? <p className="mt-2 text-sm text-rose-300" role="alert">{qrError}</p> : null}
                        <div className="mt-3 flex flex-wrap gap-2">
                          {qrImage ? (
                            <a href={qrImage} download={`fish-${selectedFish.id}-qr.png`} className="rounded-lg bg-cyan-500 px-3 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400">
                              ดาวน์โหลด QR
                            </a>
                          ) : <span className="text-sm text-slate-400">กำลังสร้าง QR...</span>}
                          <button type="button" onClick={() => window.print()} className="rounded-lg border border-slate-700 px-3 py-2 text-sm text-slate-200 transition hover:border-cyan-500">
                            พิมพ์
                          </button>
                        </div>
                      </div>
                      {qrImage ? <img src={qrImage} alt={`QR Code ${selectedFish.name}`} className="h-36 w-36 rounded-lg bg-white p-2" /> : null}
                    </section>

                    {selectedFish.imageUrl ? (
                      <img src={selectedFish.imageUrl} alt={selectedFish.name} className="mb-4 max-h-[420px] w-full rounded-2xl border border-slate-800 object-contain" />
                    ) : null}

                    <div className="mb-4 flex rounded-xl border border-slate-800 bg-slate-950/60 p-1">
                      <button
                        type="button"
                        onClick={() => setRelationshipView("detail")}
                        className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium transition ${
                          relationshipView === "detail" ? "bg-cyan-500 text-slate-950" : "text-slate-300 hover:text-white"
                        }`}
                      >
                        สายเลือด
                      </button>
                      <button
                        type="button"
                        onClick={() => setRelationshipView("tree")}
                        className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium transition ${
                          relationshipView === "tree" ? "bg-cyan-500 text-slate-950" : "text-slate-300 hover:text-white"
                        }`}
                      >
                        Tree relationship
                      </button>
                    </div>

                    {relationshipView === "detail" ? (
                      <>
                        <div className="mb-5 rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
                          <p className="mb-3 text-xs uppercase tracking-[0.2em] text-cyan-300">สายเลือด</p>
                          <div className="grid gap-4 md:grid-cols-2">
                            <ParentCard label="พ่อปลา" fish={{ ...selectedFish.father, generation: selectedFish.father.generation }} tone="cyan" />
                            <ParentCard label="แม่ปลา" fish={{ ...selectedFish.mother, generation: selectedFish.mother.generation }} tone="pink" />
                          </div>
                        </div>

                        <div className="space-y-4 rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
                          <div>
                            <p className="mb-3 text-xs uppercase tracking-[0.2em] text-cyan-300">ย้อนกลับไปดูรุ่นก่อนหน้า</p>
                            <div className="grid gap-4 md:grid-cols-2">
                              {selectedFish.father.parents ? (
                                <>
                                  <ParentCard
                                    label="พ่อของพ่อ"
                                    fish={{ ...selectedFish.father.parents.father, id: selectedFish.father.parents.father.id, name: selectedFish.father.parents.father.name, age: selectedFish.father.parents.father.age }}
                                    tone="cyan"
                                  />
                                  <ParentCard
                                    label="แม่ของพ่อ"
                                    fish={{ ...selectedFish.father.parents.mother, id: selectedFish.father.parents.mother.id, name: selectedFish.father.parents.mother.name, age: selectedFish.father.parents.mother.age }}
                                    tone="pink"
                                  />
                                </>
                              ) : null}

                              {selectedFish.mother.parents ? (
                                <>
                                  <ParentCard
                                    label="พ่อของแม่"
                                    fish={{ ...selectedFish.mother.parents.father, id: selectedFish.mother.parents.father.id, name: selectedFish.mother.parents.father.name, age: selectedFish.mother.parents.father.age }}
                                    tone="cyan"
                                  />
                                  <ParentCard
                                    label="แม่ของแม่"
                                    fish={{ ...selectedFish.mother.parents.mother, id: selectedFish.mother.parents.mother.id, name: selectedFish.mother.parents.mother.name, age: selectedFish.mother.parents.mother.age }}
                                    tone="pink"
                                  />
                                </>
                              ) : null}
                            </div>
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
                        <p className="mb-4 text-xs uppercase tracking-[0.2em] text-cyan-300">Relationship tree</p>

                        <div className="overflow-x-auto pb-2">
                          <div className="mx-auto min-w-[680px] pt-2">
                            <div className="flex justify-center">
                              <div className="max-w-[220px] rounded-2xl border border-cyan-500/50 bg-cyan-500/10 p-3 shadow-lg shadow-cyan-950/30 ring-1 ring-cyan-400/40">
                                <p className="text-[10px] uppercase tracking-[0.2em] text-cyan-200">ลูกปลา</p>
                                <div className="mt-2 flex items-center gap-3">
                                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/20 text-[10px] font-bold text-cyan-100">
                                    {selectedFish.name.slice(0, 2).toUpperCase()}
                                  </div>
                                  <div>
                                    <p className="font-semibold text-white">{selectedFish.name}</p>
                                    <p className="text-[11px] text-slate-300">{selectedFish.id}</p>
                                  </div>
                                </div>
                              </div>
                            </div>

                            <div className="mx-auto mt-3 h-8 w-[2px] bg-gradient-to-b from-cyan-400/90 to-slate-500/80" />

                            <div className="mx-auto mt-1 flex max-w-[540px] justify-center gap-10">
                              <div className="flex flex-col items-center">
                                <div className="mb-2 h-5 w-[2px] bg-cyan-400/90" />
                                <TreeNode
                                  label="พ่อปลา"
                                  fish={{ ...selectedFish.father, generation: selectedFish.father.generation }}
                                  tone="cyan"
                                  selected={selectedLineage?.label === "พ่อปลา"}
                                  onClick={() => setSelectedLineage({ label: "พ่อปลา", fish: selectedFish.father, tone: "cyan" })}
                                />
                              </div>
                              <div className="flex flex-col items-center">
                                <div className="mb-2 h-5 w-[2px] bg-pink-400/90" />
                                <TreeNode
                                  label="แม่ปลา"
                                  fish={{ ...selectedFish.mother, generation: selectedFish.mother.generation }}
                                  tone="pink"
                                  selected={selectedLineage?.label === "แม่ปลา"}
                                  onClick={() => setSelectedLineage({ label: "แม่ปลา", fish: selectedFish.mother, tone: "pink" })}
                                />
                              </div>
                            </div>

                            <div className="mx-auto mt-5 flex max-w-[560px] justify-center gap-12">
                              <div className="flex flex-col items-center">
                                <div className="mb-2 flex items-center justify-center">
                                  <div className="h-[2px] w-12 bg-cyan-400/90" />
                                  <div className="h-6 w-[2px] bg-cyan-400/90" />
                                </div>
                                <div className="flex flex-col items-center gap-3">
                                  <TreeNode
                                    label="พ่อของพ่อ"
                                    fish={{ ...selectedFish.father.parents.father, id: selectedFish.father.parents.father.id, name: selectedFish.father.parents.father.name, age: selectedFish.father.parents.father.age }}
                                    tone="cyan"
                                    selected={selectedLineage?.label === "พ่อของพ่อ"}
                                    onClick={() => setSelectedLineage({ label: "พ่อของพ่อ", fish: selectedFish.father.parents.father, tone: "cyan" })}
                                  />
                                  <TreeNode
                                    label="แม่ของพ่อ"
                                    fish={{ ...selectedFish.father.parents.mother, id: selectedFish.father.parents.mother.id, name: selectedFish.father.parents.mother.name, age: selectedFish.father.parents.mother.age }}
                                    tone="pink"
                                    selected={selectedLineage?.label === "แม่ของพ่อ"}
                                    onClick={() => setSelectedLineage({ label: "แม่ของพ่อ", fish: selectedFish.father.parents.mother, tone: "pink" })}
                                  />
                                </div>
                              </div>

                              <div className="flex flex-col items-center">
                                <div className="mb-2 flex items-center justify-center">
                                  <div className="h-[2px] w-12 bg-pink-400/90" />
                                  <div className="h-6 w-[2px] bg-pink-400/90" />
                                </div>
                                <div className="flex flex-col items-center gap-3">
                                  <TreeNode
                                    label="พ่อของแม่"
                                    fish={{ ...selectedFish.mother.parents.father, id: selectedFish.mother.parents.father.id, name: selectedFish.mother.parents.father.name, age: selectedFish.mother.parents.father.age }}
                                    tone="cyan"
                                    selected={selectedLineage?.label === "พ่อของแม่"}
                                    onClick={() => setSelectedLineage({ label: "พ่อของแม่", fish: selectedFish.mother.parents.father, tone: "cyan" })}
                                  />
                                  <TreeNode
                                    label="แม่ของแม่"
                                    fish={{ ...selectedFish.mother.parents.mother, id: selectedFish.mother.parents.mother.id, name: selectedFish.mother.parents.mother.name, age: selectedFish.mother.parents.mother.age }}
                                    tone="pink"
                                    selected={selectedLineage?.label === "แม่ของแม่"}
                                    onClick={() => setSelectedLineage({ label: "แม่ของแม่", fish: selectedFish.mother.parents.mother, tone: "pink" })}
                                  />
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        {selectedLineage ? (
                          <div className="mt-5 rounded-2xl border border-slate-800 bg-slate-900/90 p-4">
                            <div className="flex items-center justify-between gap-3">
                              <div>
                                <p className="text-[10px] uppercase tracking-[0.2em] text-slate-400">Selected node</p>
                                <h3 className="mt-2 text-lg font-semibold text-white">{selectedLineage.label}</h3>
                              </div>
                              <span className={`rounded-full border px-2 py-1 text-[10px] ${selectedLineage.tone === "cyan" ? "border-cyan-500/30 bg-cyan-500/10 text-cyan-300" : "border-pink-500/30 bg-pink-500/10 text-pink-300"}`}>
                                {selectedLineage.tone === "cyan" ? "พ่อ" : "แม่"}
                              </span>
                            </div>

                            <div className="mt-4 grid gap-3 sm:grid-cols-2">
                              {selectedLineage.fish.imageUrl ? (
                                <img src={selectedLineage.fish.imageUrl} alt={`รูป ${selectedLineage.fish.name}`} className="h-40 w-full rounded-xl object-cover sm:col-span-2" />
                              ) : null}
                              <div>
                                <p className="text-xs text-slate-400">ชื่อ</p>
                                <p className="mt-1 font-medium text-white">{selectedLineage.fish.name}</p>
                              </div>
                              <div>
                                <p className="text-xs text-slate-400">รหัส</p>
                                <p className="mt-1 font-medium text-white">{selectedLineage.fish.id}</p>
                              </div>
                              <div>
                                <p className="text-xs text-slate-400">อายุ</p>
                                <p className="mt-1 font-medium text-white">{selectedLineage.fish.age}</p>
                              </div>
                              <div>
                                <p className="text-xs text-slate-400">รุ่น</p>
                                <p className="mt-1 font-medium text-white">{selectedLineage.fish.generation ?? "-"}</p>
                              </div>
                            </div>
                          </div>
                        ) : null}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
