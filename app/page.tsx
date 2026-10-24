import Link from "next/link";

const features = [
  {
    title: "ทะเบียนปลาเวอร์ชันจริงจัง",
    text: "บันทึกข้อมูลทุกตัวอย่างละเอียด ทั้งสายพันธุ์ เพศ ประวัติการเจริญเติบโต และภาพถ่ายบันทึก" ,
  },
  {
    title: "ติดตามพ่อแม่พันธุ์ได้ชัดเจน",
    text: "ลดความสับสนเรื่องสายเลือดและปัญหาการจำพ่อแม่พันธุ์ไม่ได้ด้วยข้อมูลที่เชื่อมโยงกันแบบครบวงจร",
  },
  {
    title: "ผสมพันธุ์และฟักไข่แบบมีประวัติ",
    text: "ดูคู่ผสมทุกครั้ง ผลลัพธ์ และสถานะการฟักแบบเรียลไทม์ในหน้าเดียว",
  },
];

const stats = [
  { label: "ปลาทั้งหมดในระบบ", value: "248" },
  { label: "คู่ผสมที่บันทึก", value: "67" },
  { label: "สายพันธุ์ที่มีอยู่", value: "18" },
];

export default function Home() {
  return (
    <main className="min-h-screen text-slate-100">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-10">
        <header className="mb-8 rounded-full border border-slate-800 bg-slate-900/70 px-4 py-3 backdrop-blur-sm">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-cyan-500/15 text-sm font-bold text-cyan-300">
                BT
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-cyan-300">Betta Track</p>
              </div>
            </div>

            <Link
              href="/login"
              className="inline-flex items-center justify-center rounded-full border border-slate-700 bg-slate-900 px-4 py-2 text-sm font-medium text-slate-100 transition hover:border-cyan-500 hover:text-cyan-300"
            >
              เข้าสู่ระบบ
            </Link>
          </div>
        </header>

        <section className="grid items-center gap-8 overflow-hidden rounded-[32px] border border-slate-800 bg-slate-900/75 p-6 shadow-2xl shadow-cyan-950/20 sm:p-8 lg:grid-cols-[1.15fr_0.85fr] lg:p-12">
          <div>
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-cyan-200">
              Breeding registry system
            </div>

            <h1 className="max-w-xl text-4xl font-bold leading-tight tracking-tight text-white sm:text-5xl lg:text-6xl">
              ระบบจัดการสายพันธุ์ปลากัดแบบมืออาชีพ
            </h1>

            <p className="mt-5 max-w-xl text-base leading-7 text-slate-300 sm:text-lg">
              บันทึกพ่อแม่พันธุ์ สายเลือด และประวัติการผสมพันธุ์ให้เห็นชัดเจนเพื่อป้องกันปัญหาการจำพ่อแม่ไม่ได้ และจัดการข้อมูลได้แบบเป็นระบบ.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/login"
                className="inline-flex items-center justify-center rounded-xl bg-cyan-500 px-5 py-3.5 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400"
              >
                เริ่มใช้งาน
              </Link>
              <Link
                href="/fish"
                className="inline-flex items-center justify-center rounded-xl border border-slate-700 bg-slate-950 px-5 py-3.5 text-sm font-semibold text-slate-100 transition hover:border-slate-500 hover:bg-slate-800"
              >
                ดูทะเบียนปลา
              </Link>
            </div>
          </div>

          <div className="rounded-[28px] border border-slate-800 bg-slate-950/70 p-4 sm:p-5">
            <div className="rounded-[22px] border border-slate-800 bg-gradient-to-br from-cyan-500/10 via-slate-900 to-slate-950 p-5">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Today</p>
                  <p className="mt-2 text-2xl font-bold text-white">12/10/2026</p>
                </div>
                <div className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-300">
                  Active
                </div>
              </div>

              <div className="mt-5 space-y-3">
                <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-3">
                  <p className="text-xs text-slate-400">คู่ผสมที่รอผล</p>
                  <p className="mt-2 text-xl font-semibold text-white">BT-2048 × BT-2049</p>
                </div>
                <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-3">
                  <p className="text-xs text-slate-400">ฟักล่าสุด</p>
                  <p className="mt-2 text-xl font-semibold text-white">18 ตัว</p>
                </div>
                <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-3">
                  <p className="text-xs text-slate-400">สายพันธุ์ที่ยังติดตาม</p>
                  <p className="mt-2 text-xl font-semibold text-white">9 รายการ</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-10 grid gap-4 md:grid-cols-3">
          {stats.map((stat) => (
            <div key={stat.label} className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
              <p className="text-sm text-slate-400">{stat.label}</p>
              <p className="mt-4 text-3xl font-bold text-white">{stat.value}</p>
            </div>
          ))}
        </section>

        <section className="mt-10 grid gap-4 lg:grid-cols-3">
          {features.map((feature) => (
            <div key={feature.title} className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-300">
                •
              </div>
              <h2 className="text-xl font-semibold text-white">{feature.title}</h2>
              <p className="mt-3 text-sm leading-6 text-slate-300">{feature.text}</p>
            </div>
          ))}
        </section>
      </div>
    </main>
  );
}
