"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { List, Plus, RefreshCw, TriangleAlert } from "lucide-react";
import { LogoutButton } from "@/app/ui/logout-button";
import { FishRowSkeleton, Skeleton } from "@/app/ui/skeleton";

type FishRecord = {
  recordId?: string;
  id: string;
  name: string;
  sex: string;
  strain: string;
  age: string;
  parents: string;
  imageUrl?: string | null;
};

type FishSnapshot = { savedAt: number; fish: FishRecord[] };

// Keep the last successful response for this browser tab so revisiting the
// dashboard renders instantly, then refreshes in the background.
const CACHE_KEY = "betta:dashboard-fish:v1";
const CACHE_EVENT = "betta:dashboard-fish-updated";
// Refresh when the user returns to the tab, but not more often than this (avoids 429s).
const MIN_REFRESH_INTERVAL_MS = 60_000;
// Render's free plan can take up to ~1 minute to wake up.
const REQUEST_TIMEOUT_MS = 70_000;
const SLOW_HINT_DELAY_MS = 4_000;
const RECENT_FISH_COUNT = 5;

function subscribeToCache(onChange: () => void) {
  window.addEventListener(CACHE_EVENT, onChange);
  return () => window.removeEventListener(CACHE_EVENT, onChange);
}

function getCacheSnapshot(): string | null {
  try {
    return sessionStorage.getItem(CACHE_KEY);
  } catch {
    return null;
  }
}

function getServerCacheSnapshot(): string | null {
  return null;
}

function parseCache(raw: string | null): FishSnapshot | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as FishSnapshot;
    return Array.isArray(parsed.fish) && typeof parsed.savedAt === "number" ? parsed : null;
  } catch {
    return null;
  }
}

function writeCache(snapshot: FishSnapshot) {
  try {
    sessionStorage.setItem(CACHE_KEY, JSON.stringify(snapshot));
    window.dispatchEvent(new Event(CACHE_EVENT));
  } catch {
    // Storage full or disabled: caching is optional.
  }
}

function formatTime(timestamp: number) {
  return new Date(timestamp).toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" });
}

function FishAvatar({ name, imageUrl }: { name: string; imageUrl?: string | null }) {
  const [failed, setFailed] = useState(false);

  if (imageUrl && !failed) {
    return (
      // Signed Supabase URLs expire, so fall back to initials when the image fails.
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={imageUrl}
        alt=""
        loading="lazy"
        decoding="async"
        onError={() => setFailed(true)}
        className="h-10 w-10 shrink-0 rounded-lg object-cover"
      />
    );
  }
  return (
    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-cyan-500/10 text-xs font-bold text-cyan-300">
      {name.slice(0, 2).toUpperCase()}
    </div>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const rawCache = useSyncExternalStore(subscribeToCache, getCacheSnapshot, getServerCacheSnapshot);
  const cached = useMemo(() => parseCache(rawCache), [rawCache]);
  // Fallback for browsers where sessionStorage is unavailable.
  const [latest, setLatest] = useState<FishSnapshot | null>(null);
  const [isFetching, setIsFetching] = useState(true);
  const [isSlow, setIsSlow] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  // Bumping this re-runs the fetch effect (refresh button, returning to the tab).
  const [reloadKey, setReloadKey] = useState(0);
  const lastFetchRef = useRef(0);

  const refresh = useCallback(() => {
    setIsFetching(true);
    setErrorMessage(null);
    setReloadKey((key) => key + 1);
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    lastFetchRef.current = Date.now();
    const timeout = setTimeout(() => controller.abort("timeout"), REQUEST_TIMEOUT_MS);
    const slowHint = setTimeout(() => setIsSlow(true), SLOW_HINT_DELAY_MS);

    async function loadFish() {
      try {
        const response = await fetch("/api/fish", { cache: "no-store", signal: controller.signal });
        const result: unknown = await response.json().catch(() => null);

        if (response.status === 401) {
          router.replace("/login");
          return;
        }
        if (response.status === 429) {
          throw new Error("มีการเรียกระบบถี่เกินไป กรุณารอสักครู่แล้วกดลองใหม่");
        }
        if (!response.ok) {
          throw new Error(`โหลดข้อมูลไม่สำเร็จ (${response.status})`);
        }
        if (!Array.isArray(result)) {
          throw new Error("รูปแบบข้อมูลจาก API ไม่ถูกต้อง");
        }

        const snapshot = { savedAt: Date.now(), fish: result as FishRecord[] };
        setLatest(snapshot);
        setErrorMessage(null);
        writeCache(snapshot);
      } catch (error) {
        if (controller.signal.aborted && controller.signal.reason !== "timeout") return;
        setErrorMessage(
          controller.signal.reason === "timeout"
            ? "เซิร์ฟเวอร์ตอบช้าเกินไป กรุณาลองใหม่"
            : error instanceof Error && error.message !== "Failed to fetch"
              ? error.message
              : "เชื่อมต่อไม่ได้ ตรวจสอบอินเทอร์เน็ตแล้วลองใหม่",
        );
      } finally {
        clearTimeout(timeout);
        clearTimeout(slowHint);
        if (!controller.signal.aborted || controller.signal.reason === "timeout") {
          setIsFetching(false);
          setIsSlow(false);
        }
      }
    }

    void loadFish();
    return () => {
      clearTimeout(timeout);
      clearTimeout(slowHint);
      controller.abort();
    };
  }, [reloadKey, router]);

  useEffect(() => {
    function refreshIfStale() {
      if (document.visibilityState !== "visible") return;
      if (Date.now() - lastFetchRef.current >= MIN_REFRESH_INTERVAL_MS) refresh();
    }
    document.addEventListener("visibilitychange", refreshIfStale);
    return () => document.removeEventListener("visibilitychange", refreshIfStale);
  }, [refresh]);

  const data = latest ?? cached;
  const fish = data?.fish ?? null;
  const updatedAt = data?.savedAt ?? null;
  const list = fish ?? [];
  const hasData = fish !== null;
  const strainSummary = [...list.reduce((counts, item) => {
    if (item.strain !== "ไม่ระบุสาย") counts.set(item.strain, (counts.get(item.strain) ?? 0) + 1);
    return counts;
  }, new Map<string, number>())]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);
  const fishSummary = [
    { label: "ทั้งหมด", value: list.length },
    { label: "ตัวผู้", value: list.filter((item) => item.sex === "ผู้").length },
    { label: "ตัวเมีย", value: list.filter((item) => item.sex === "เมีย").length },
    { label: "มีพ่อแม่", value: list.filter((item) => item.parents !== "- / -").length },
  ];

  return (
    <main className="min-h-screen pb-[calc(5rem+env(safe-area-inset-bottom))] md:pb-8">
      <header className="sticky top-0 z-20 border-b border-slate-800/80 bg-slate-950/85 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-2 px-3 py-2 sm:px-6">
          <div className="min-w-0">
            <h1 className="text-lg font-bold leading-tight text-white">Dashboard</h1>
            <p className="truncate text-[11px] text-slate-400" aria-live="polite">
              {isFetching
                ? isSlow
                  ? "เซิร์ฟเวอร์กำลังเริ่มทำงาน อาจใช้เวลาถึง 1 นาที…"
                  : "กำลังอัปเดต…"
                : updatedAt
                  ? `อัปเดต ${formatTime(updatedAt)}`
                  : "Betta Track"}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/fish"
              className="hidden rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-sm font-medium text-slate-100 transition hover:border-cyan-500 hover:text-cyan-300 md:inline-flex"
            >
              ดูทะเบียนปลา
            </Link>
            <Link
              href="/fish/new"
              className="hidden rounded-xl bg-cyan-500 px-3 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400 md:inline-flex"
            >
              + เพิ่มปลา
            </Link>
            <button
              type="button"
              onClick={refresh}
              disabled={isFetching}
              aria-label="รีเฟรชข้อมูล"
              title="รีเฟรชข้อมูล"
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-700 bg-slate-800 text-slate-100 transition hover:border-cyan-500 hover:text-cyan-300 disabled:opacity-60"
            >
              <RefreshCw size={18} aria-hidden="true" className={isFetching ? "animate-spin" : undefined} />
            </button>
            <LogoutButton />
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl space-y-3 px-3 pt-3 sm:px-6 md:space-y-5 md:pt-5">
        {errorMessage ? (
          <div
            className="flex items-center gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-200"
            role="alert"
          >
            <TriangleAlert size={16} aria-hidden="true" className="shrink-0" />
            <p className="min-w-0 flex-1">
              {errorMessage}
              {hasData ? <span className="text-rose-300/80"> (แสดงข้อมูลล่าสุดที่มี)</span> : null}
            </p>
            <button
              type="button"
              onClick={refresh}
              disabled={isFetching}
              className="shrink-0 rounded-lg border border-rose-400/40 px-2.5 py-1 text-xs font-medium text-rose-100 disabled:opacity-60"
            >
              ลองใหม่
            </button>
          </div>
        ) : null}

        <section aria-label="สรุปจำนวนปลา" className="grid grid-cols-4 gap-2 md:gap-4">
          {fishSummary.map((item) => (
            <div
              key={item.label}
              className="rounded-xl border border-slate-800 bg-slate-900/80 px-2 py-2.5 text-center md:p-5 md:text-left"
            >
              {hasData ? (
                <p className="text-xl font-bold leading-none text-white md:text-3xl">{item.value}</p>
              ) : (
                <Skeleton className="mx-auto h-5 w-8 md:mx-0 md:h-8 md:w-14" />
              )}
              <p className="mt-1.5 truncate text-[11px] text-slate-400 md:text-sm">{item.label}</p>
            </div>
          ))}
        </section>

        <div className="grid gap-3 md:gap-5 xl:grid-cols-[1.55fr_1fr]">
          <section className="rounded-2xl border border-slate-800 bg-slate-900/80 p-3 md:p-5">
            <div className="mb-2 flex items-center justify-between gap-3">
              <h2 className="text-base font-semibold text-white">ปลาล่าสุด</h2>
              <Link href="/fish" className="py-1 text-sm text-cyan-300 hover:text-cyan-200">
                ดูทั้งหมด
              </Link>
            </div>

            <div aria-busy={!hasData}>
              {!hasData ? (
                <div className="space-y-2" role="status">
                  {Array.from({ length: 3 }).map((_, index) => <FishRowSkeleton key={index} />)}
                </div>
              ) : list.length === 0 ? (
                <div className="py-6 text-center">
                  <p className="text-sm text-slate-400">ยังไม่มีข้อมูลปลา</p>
                  <Link href="/fish/new" className="mt-2 inline-block text-sm font-medium text-cyan-300">
                    + เพิ่มปลาตัวแรก
                  </Link>
                </div>
              ) : (
                <ul className="divide-y divide-slate-800">
                  {list.slice(0, RECENT_FISH_COUNT).map((item) => (
                    <li key={item.recordId ?? item.id} className="flex items-center gap-3 py-2">
                      <FishAvatar name={item.name} imageUrl={item.imageUrl} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-white">{item.name}</p>
                        <p className="truncate text-xs text-slate-400">
                          {item.id} • {item.sex} • {item.strain}
                        </p>
                      </div>
                      <span className="shrink-0 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[11px] text-emerald-300">
                        {item.age}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>

          <section className="rounded-2xl border border-slate-800 bg-slate-900/80 p-3 md:p-5">
            <h2 className="mb-2 text-base font-semibold text-white">สายพันธุ์</h2>
            {!hasData ? (
              <div className="flex flex-wrap gap-2" role="status">
                {Array.from({ length: 4 }).map((_, index) => (
                  <Skeleton key={index} className="h-7 w-20 rounded-full" />
                ))}
              </div>
            ) : strainSummary.length === 0 ? (
              <p className="py-3 text-center text-sm text-slate-400">ยังไม่มีข้อมูลสายพันธุ์</p>
            ) : (
              <ul className="flex flex-wrap gap-2">
                {strainSummary.map((strain) => (
                  <li
                    key={strain.name}
                    className="inline-flex items-center gap-1.5 rounded-full border border-slate-700 bg-slate-950/70 py-1 pl-3 pr-1 text-xs text-slate-200"
                  >
                    {strain.name}
                    <span className="rounded-full bg-slate-800 px-1.5 py-0.5 text-[11px] text-slate-300">{strain.count}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>

      <nav
        aria-label="เมนูหลัก"
        className="fixed inset-x-0 bottom-0 z-20 border-t border-slate-800 bg-slate-950/95 px-3 pt-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))] backdrop-blur md:hidden"
      >
        <div className="grid grid-cols-2 gap-2">
          <Link
            href="/fish"
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-800 text-sm font-medium text-slate-100"
          >
            <List size={18} aria-hidden="true" />
            ทะเบียนปลา
          </Link>
          <Link
            href="/fish/new"
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-cyan-500 text-sm font-semibold text-slate-950"
          >
            <Plus size={18} aria-hidden="true" />
            เพิ่มปลา
          </Link>
        </div>
      </nav>
    </main>
  );
}
