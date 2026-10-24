import Link from "next/link";
import { Suspense } from "react";
import { forwardToBettaApi } from "@/app/api/_lib/proxy";

type ParentDetails = {
  code?: string | null;
  name: string | null;
  line: string | null;
  age: string;
  imageUrl: string | null;
};

type FishDetails = {
  code: string;
  name: string;
  sex: string;
  line: string | null;
  age: string;
  imageUrl: string | null;
  generation: number | null;
  father: ParentDetails;
  mother: ParentDetails;
};

export default function FishQrPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <Suspense fallback={<QrLoading />}>
      {params.then(({ id }) => <FishQrContent id={id} />)}
    </Suspense>
  );
}

function QrLoading() {
  return (
    <main className="min-h-screen px-4 py-10 sm:px-6">
      <p className="mx-auto max-w-xl py-10 text-center text-sm text-slate-300" role="status">กำลังโหลดข้อมูลปลา...</p>
    </main>
  );
}

async function FishQrContent({ id }: { id: string }) {
  const response = await forwardToBettaApi(`/fish/qr/${encodeURIComponent(id)}`);
  const result: unknown = await response.json().catch(() => null);

  if (!response.ok || !result || typeof result !== "object" || !("father" in result)) {
    const message =
      typeof result === "object" && result !== null && "message" in result
        ? String(result.message)
        : "ไม่พบข้อมูลปลานี้";

    return (
      <main className="min-h-screen px-4 py-10 sm:px-6">
        <div className="mx-auto max-w-xl rounded-2xl border border-rose-500/30 bg-slate-900 p-6 text-center">
          <h1 className="text-xl font-semibold text-white">ไม่พบข้อมูลปลา</h1>
          <p className="mt-3 text-sm text-rose-200">{message}</p>
        </div>
      </main>
    );
  }

  const fish = result as FishDetails;
  const parents: Array<[string, ParentDetails, string]> = [
    ["พ่อ", fish.father, "border-cyan-500/30"],
    ["แม่", fish.mother, "border-pink-500/30"],
  ];

  return (
    <main className="min-h-screen px-4 py-6 sm:px-6 sm:py-10">
      <div className="mx-auto max-w-2xl">
        <header className="border-b border-slate-800 pb-5">
          <p className="text-[11px] uppercase tracking-[0.2em] text-cyan-300">Betta Track · Fish record</p>
          <div className="mt-3 flex flex-wrap items-start justify-between gap-3">
            <div>
              <h1 className="text-3xl font-bold text-white">{fish.name}</h1>
              <p className="mt-1 text-sm text-slate-400">{fish.code} · {fish.sex}</p>
            </div>
            {fish.generation ? <span className="rounded-full border border-slate-700 px-3 py-1.5 text-xs text-slate-300">รุ่น {fish.generation}</span> : null}
          </div>
        </header>

        {fish.imageUrl ? (
          <img src={fish.imageUrl} alt={fish.name} className="mt-5 max-h-[420px] w-full rounded-2xl border border-slate-800 object-contain" />
        ) : null}

        <section className="grid gap-3 py-5 sm:grid-cols-2">
          <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
            <p className="text-xs text-slate-400">สายพันธุ์/สาย</p>
            <p className="mt-2 font-medium text-white">{fish.line || "ไม่ระบุสาย"}</p>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
            <p className="text-xs text-slate-400">อายุ</p>
            <p className="mt-2 font-medium text-white">{fish.age}</p>
          </div>
        </section>

        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-[0.12em] text-slate-300">สายพ่อแม่</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {parents.map(([label, parent, borderClass]) => (
              <article key={label} className={`rounded-xl border ${borderClass} bg-slate-900/70 p-4`}>
                <p className="text-xs text-slate-400">{label}</p>
                <h3 className="mt-2 font-semibold text-white">{parent.name || "ยังไม่มีข้อมูล"}</h3>
                <p className="mt-1 text-sm text-slate-400">{parent.code ? `${parent.code} · ` : ""}{parent.line || "ไม่ระบุสาย"}</p>
                {parent.imageUrl ? <img src={parent.imageUrl} alt={`รูป ${label} ปลา`} className="mt-3 h-32 w-full rounded-lg object-cover" /> : null}
                <p className="mt-3 text-xs text-slate-500">อายุ {parent.age}</p>
              </article>
            ))}
          </div>
        </section>

        <footer className="mt-8 border-t border-slate-800 pt-4 text-center">
          <Link href="/fish" className="text-sm text-cyan-300 hover:text-cyan-200">Betta Track</Link>
        </footer>
      </div>
    </main>
  );
}