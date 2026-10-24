import { LoginForm } from "./login-form";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-8 sm:px-6 lg:px-8">
      <div className="grid w-full max-w-5xl overflow-hidden rounded-[28px] border border-slate-800 bg-slate-900/80 shadow-2xl shadow-cyan-950/20 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="flex flex-col justify-center bg-gradient-to-br from-cyan-500/12 via-slate-900 to-slate-950 p-6 sm:p-8 lg:p-10">
          <div className="mb-6 inline-flex w-fit items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-cyan-200">
            <span className="h-2 w-2 rounded-full bg-cyan-300" />
            Betta Track
          </div>

          <h1 className="max-w-md text-3xl font-bold tracking-tight text-white sm:text-4xl">
            จัดการสายพันธุ์ปลากัดอย่างมีระบบ
          </h1>

          <p className="mt-4 max-w-md text-sm leading-6 text-slate-300 sm:text-base">
            บันทึกทะเบียนปลา พ่อแม่พันธุ์ และข้อมูลการผสมพันธุ์ไว้ในที่เดียว
            เพื่อให้เห็นสายเลือดชัดเจนและลดความสับสนแบบไม่ต้องเดา.
          </p>

          <div className="mt-8 space-y-3 text-sm text-slate-200">
            {[
              "จัดเก็บข้อมูลปลาและสายพันธ์ุแบบครบถ้วน",
              "ติดตามพ่อแม่พันธุ์และความสัมพันธ์ของลูกทุกตัว",
              "เก็บรูปภาพและประวัติผสมพันธุ์ในระบบเดียว",
            ].map((item) => (
              <div key={item} className="flex items-center gap-3 rounded-2xl border border-slate-700 bg-slate-900/60 p-3">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-cyan-500/10 text-xs font-bold text-cyan-300">
                  ✓
                </span>
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-center p-5 sm:p-8 lg:p-10">
          <div className="w-full max-w-md">
            <div className="mb-8 text-center">
              <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Welcome back</p>
              <h2 className="mt-2 text-2xl font-bold text-white sm:text-3xl">เข้าสู่ระบบ</h2>
            </div>

            <LoginForm />
          </div>
        </div>
      </div>
    </main>
  );
}
