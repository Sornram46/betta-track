"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { LogoutButton } from "@/app/ui/logout-button";
import { FishRowSkeleton, StatCardSkeleton, StrainRowSkeleton } from "@/app/ui/skeleton";

type FishRecord = {
  id: string;
  name: string;
  sex: string;
  strain: string;
  age: string;
  parents: string;
};

export default function DashboardPage() {
  const [fish, setFish] = useState<FishRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let isCurrent = true;

    async function loadDashboard() {
      try {
        const fishResponse = await fetch("/api/fish", { cache: "no-store" });
        const fishResult: unknown = await fishResponse.json();

        if (!fishResponse.ok) {
          throw new Error("โหลดข้อมูล dashboard ไม่สำเร็จ");
        }
        if (!Array.isArray(fishResult)) {
          throw new Error("รูปแบบข้อมูลจาก API ไม่ถูกต้อง");
        }

        if (isCurrent) {
          setFish(fishResult as FishRecord[]);
        }
      } catch (error) {
        if (isCurrent) {
          setErrorMessage(error instanceof Error ? error.message : "เกิดข้อผิดพลาดในการโหลด dashboard");
        }
      } finally {
        if (isCurrent) setIsLoading(false);
      }
    }

    void loadDashboard();
    return () => {
      isCurrent = false;
    };
  }, []);

  const maleCount = fish.filter((item) => item.sex === "ผู้").length;
  const femaleCount = fish.filter((item) => item.sex === "เมีย").length;
  const lineageCount = fish.filter((item) => item.parents !== "- / -").length;
  const strainSummary = [...new Set(fish.map((item) => item.strain).filter((strain) => strain !== "ไม่ระบุสาย"))]
    .map((strain) => ({ name: strain, count: fish.filter((item) => item.strain === strain).length }));
  const fishSummary = [
    { label: "ปลาทั้งหมด", value: fish.length },
    { label: "ตัวผู้", value: maleCount },
    { label: "ตัวเมีย", value: femaleCount },
    { label: "มีข้อมูลพ่อแม่", value: lineageCount },
  ];

  return (
    <main className="min-h-screen px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <header className="mb-6 flex flex-col gap-4 rounded-[24px] border border-slate-800 bg-slate-900/80 p-5 shadow-xl shadow-cyan-950/10 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[11px] uppercase tracking-[0.2em] text-cyan-300">Betta Track</p>
            <h1 className="mt-2 text-2xl font-bold text-white sm:text-3xl">Dashboard</h1>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/fish"
              className="rounded-xl border border-slate-700 bg-slate-800 px-4 py-2.5 text-sm font-medium text-slate-100 transition hover:border-cyan-500 hover:text-cyan-300"
            >
              ดูทะเบียนปลา
            </Link>
            <Link
              href="/fish/new"
              className="rounded-xl bg-cyan-500 px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400"
            >
              + เพิ่มปลา
            </Link>
            <LogoutButton />
          </div>
        </header>

        <section className="overflow-hidden">
          <div className="-mx-2 flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:grid md:grid-cols-2 md:overflow-visible md:[&::-webkit-scrollbar]:block xl:grid-cols-4">
            {isLoading
              ? Array.from({ length: 4 }).map((_, index) => <StatCardSkeleton key={index} />)
              : fishSummary.map((item) => (
                  <div
                    key={item.label}
                    className="group min-w-[76%] snap-start rounded-[22px] border border-slate-800 bg-slate-900/80 p-5 transition hover:border-cyan-500/50 hover:bg-slate-900 sm:min-w-[48%] md:min-w-0"
                  >
                    <p className="text-sm text-slate-400">{item.label}</p>
                    <div className="mt-4 flex items-end justify-between gap-3">
                      <span className="text-3xl font-bold text-white transition group-hover:text-cyan-300">
                        {item.value}
                      </span>
                    </div>
                  </div>
                ))}
          </div>
        </section>

        {errorMessage ? <p className="mt-6 rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-200" role="alert">{errorMessage}</p> : null}

        <section className="mt-8 grid gap-6 xl:grid-cols-[1.55fr_1fr]">
          <div className="rounded-[24px] border border-slate-800 bg-slate-900/80 p-5">
            <div className="mb-5 flex items-center justify-between gap-3">
              <h2 className="text-lg font-semibold text-white">ปลาในระบบล่าสุด</h2>
              <Link href="/fish" className="text-sm text-cyan-300 hover:text-cyan-200">
                ดูทั้งหมด
              </Link>
            </div>

            <div className="space-y-3" role={isLoading ? "status" : undefined} aria-busy={isLoading}>
              {isLoading
                ? Array.from({ length: 4 }).map((_, index) => <FishRowSkeleton key={index} />)
                : null}
              {!isLoading && fish.length === 0 && !errorMessage ? <p className="py-6 text-center text-sm text-slate-400">ยังไม่มีข้อมูลปลา</p> : null}
              {!isLoading && fish.slice(0, 4).map((item) => (
                <div
                  key={item.id}
                  className="flex flex-col gap-3 rounded-2xl border border-slate-800 bg-slate-950/70 p-3 transition hover:border-cyan-500/40 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-cyan-500/10 text-xs font-bold text-cyan-300">
                      {item.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium text-white">{item.name}</p>
                      <p className="text-xs text-slate-400">
                        {item.id} • {item.sex} • {item.strain}
                      </p>
                    </div>
                  </div>
                  <span className="inline-flex w-fit rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-1 text-[11px] text-emerald-300">
                    {item.age}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[24px] border border-slate-800 bg-slate-900/80 p-5">
            <div className="mb-5 flex items-center justify-between gap-3">
              <h2 className="text-lg font-semibold text-white">สายพันธุ์ในระบบ</h2>
              <Link href="/fish" className="text-sm text-cyan-300 hover:text-cyan-200">ดูทั้งหมด</Link>
            </div>
            <div className="space-y-3" role={isLoading ? "status" : undefined} aria-busy={isLoading}>
              {isLoading
                ? Array.from({ length: 4 }).map((_, index) => <StrainRowSkeleton key={index} />)
                : null}
              {!isLoading && strainSummary.length === 0 && !errorMessage ? <p className="py-6 text-center text-sm text-slate-400">ยังไม่มีข้อมูลสายพันธุ์</p> : null}
              {!isLoading && strainSummary.slice(0, 4).map((strain) => (
                <div key={strain.name} className="flex items-center justify-between gap-3 rounded-2xl border border-slate-800 bg-slate-950/70 p-3">
                  <p className="font-medium text-white">{strain.name}</p>
                  <span className="rounded-full border border-slate-700 px-2.5 py-1 text-xs text-slate-300">{strain.count} ตัว</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
