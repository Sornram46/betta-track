"use client";

import Link from "next/link";
import QRCode from "qrcode";
import { useEffect, useState, type FormEvent } from "react";

const inputClassName =
  "w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-cyan-500";

type SavedFish = { id: string; code: string; name: string; imageWarning?: string };
type ParentOption = { recordId: string; id: string; name: string; strain: string; sex: string; age: string; imageUrl: string | null };

export default function NewFishPage() {
  const [parentOptions, setParentOptions] = useState<ParentOption[]>([]);
  const [parentsLoading, setParentsLoading] = useState(true);
  const [parentsError, setParentsError] = useState<string | null>(null);
  const [fatherId, setFatherId] = useState("");
  const [motherId, setMotherId] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [savedFish, setSavedFish] = useState<SavedFish | null>(null);

  useEffect(() => {
    let isCurrent = true;

    async function loadParentOptions() {
      try {
        const response = await fetch("/api/fish", { cache: "no-store" });
        const result: unknown = await response.json();
        if (!response.ok) throw new Error("โหลดรายชื่อปลาเพื่อเลือกพ่อแม่ไม่สำเร็จ");
        if (!Array.isArray(result)) throw new Error("รูปแบบข้อมูลปลาไม่ถูกต้อง");
        if (isCurrent) setParentOptions(result as ParentOption[]);
      } catch (error) {
        if (isCurrent) setParentsError(error instanceof Error ? error.message : "โหลดรายชื่อปลาไม่สำเร็จ");
      } finally {
        if (isCurrent) setParentsLoading(false);
      }
    }

    void loadParentOptions();
    return () => {
      isCurrent = false;
    };
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    setErrorMessage(null);
    setSavedFish(null);

    const form = event.currentTarget;
    const formData = new FormData(form);
    const fatherImage = formData.get("fatherImage");
    const motherImage = formData.get("motherImage");
    const generation = formData.get("generation")?.toString();
    const payload = {
      code: formData.get("code")?.toString().trim(),
      name: formData.get("name")?.toString().trim(),
      sex: formData.get("sex")?.toString(),
      lineName: formData.get("lineName")?.toString().trim() || undefined,
      hatchDate: formData.get("hatchDate")?.toString() || undefined,
      generation: generation ? Number(generation) : undefined,
      fatherId: fatherId || undefined,
      fatherLabel: fatherId ? undefined : formData.get("fatherLabel")?.toString().trim() || undefined,
      fatherLine: fatherId ? undefined : formData.get("fatherLine")?.toString().trim() || undefined,
      motherId: motherId || undefined,
      motherLabel: motherId ? undefined : formData.get("motherLabel")?.toString().trim() || undefined,
      motherLine: motherId ? undefined : formData.get("motherLine")?.toString().trim() || undefined,
      notes: formData.get("notes")?.toString().trim() || undefined,
    };

    try {
      if ([fatherImage, motherImage].some((image) => image instanceof File && image.size > 5 * 1024 * 1024)) {
        throw new Error("รูปพ่อหรือแม่ต้องมีขนาดไม่เกิน 5 MB");
      }

      const response = await fetch("/api/fish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result: unknown = await response.json().catch(() => null);

      if (!response.ok) {
        const message =
          typeof result === "object" && result !== null && "message" in result
            ? result.message
            : "บันทึกข้อมูลปลาไม่สำเร็จ";
        throw new Error(Array.isArray(message) ? message.join(", ") : String(message));
      }

      if (typeof result !== "object" || result === null || !("id" in result)) {
        throw new Error("บันทึกปลาแล้ว แต่สร้างลิงก์ QR ไม่สำเร็จ");
      }

      const savedFish = result as { id: string; code: string; name: string };
      const imageWarnings: string[] = [];
      const parentImages = [
        ["father", fatherImage, "รูปพ่อ"],
        ["mother", motherImage, "รูปแม่"],
      ] as const;

      for (const [role, image, label] of parentImages) {
        if (!(image instanceof File) || image.size === 0) continue;

        const uploadData = new FormData();
        uploadData.append("image", image);
        const uploadResponse = await fetch(`/api/fish/${encodeURIComponent(savedFish.id)}/image?role=${role}`, {
          method: "POST",
          body: uploadData,
        });

        if (!uploadResponse.ok) {
          const uploadResult: unknown = await uploadResponse.json().catch(() => null);
          const uploadMessage =
            typeof uploadResult === "object" && uploadResult !== null && "message" in uploadResult
              ? uploadResult.message
              : "อัปโหลดไม่สำเร็จ";
          imageWarnings.push(`${label}: ${Array.isArray(uploadMessage) ? uploadMessage.join(", ") : String(uploadMessage)}`);
        }
      }

      const scanUrl = `${window.location.origin}/fish/qr/${encodeURIComponent(savedFish.id)}`;
      await QRCode.toDataURL(scanUrl, {
        errorCorrectionLevel: "H",
        margin: 2,
        width: 360,
      });

      setSavedFish({ ...savedFish, imageWarning: imageWarnings.length ? imageWarnings.join("; ") : undefined });
      form.reset();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "เกิดข้อผิดพลาดในการบันทึกข้อมูล");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <main className="min-h-screen px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl rounded-[28px] border border-slate-800 bg-slate-900/80 p-5 shadow-2xl shadow-cyan-950/10 sm:p-8">
        <div className="mb-6 flex items-center justify-between gap-3">
          <div>
            <p className="text-[11px] uppercase tracking-[0.2em] text-cyan-300">Betta Track</p>
            <h1 className="mt-2 text-2xl font-bold text-white sm:text-3xl">เพิ่มปลากัดใหม่</h1>
          </div>
          <Link
            href="/fish"
            className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800/80 px-3 py-2 text-sm font-medium text-slate-200 transition hover:border-cyan-500 hover:text-cyan-300"
          >
            <span aria-hidden="true">←</span>
            ย้อนกลับ
          </Link>
        </div>

        {savedFish ? (
          <section className="mb-6 rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-5" role="status">
            <p className="text-sm font-semibold text-emerald-300">บันทึกข้อมูลและสร้าง QR Code สำเร็จ</p>
            <p className="mt-2 text-sm text-slate-200">{savedFish.name} · {savedFish.code}</p>
            <p className="mt-2 text-sm text-slate-400">หากต้องการดาวน์โหลด QR Code ให้ไปที่ทะเบียนปลา แล้วเลือกปลาตัวนี้</p>
            {savedFish.imageWarning ? <p className="mt-2 text-sm text-amber-300" role="alert">บันทึกปลาแล้ว แต่รูปอัปโหลดไม่สำเร็จ: {savedFish.imageWarning}</p> : null}
            <Link href="/fish" className="mt-4 inline-flex rounded-lg bg-cyan-500 px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400">
              ไปทะเบียนปลา
            </Link>
          </section>
        ) : null}

        <form className="grid gap-5 md:grid-cols-2" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="name" className="mb-2 block text-sm font-medium text-slate-200">ชื่อปลา</label>
            <input id="name" name="name" className={inputClassName} placeholder="เช่น Royal Blue" maxLength={100} required />
          </div>
          <div>
            <label htmlFor="code" className="mb-2 block text-sm font-medium text-slate-200">รหัสปลา</label>
            <input id="code" name="code" className={inputClassName} placeholder="เช่น BT-2052" maxLength={40} required />
          </div>
          <div>
            <label htmlFor="sex" className="mb-2 block text-sm font-medium text-slate-200">เพศ</label>
            <select id="sex" name="sex" className={inputClassName} defaultValue="male" required>
              <option value="male">ผู้</option>
              <option value="female">เมีย</option>
              <option value="unknown">ไม่ทราบ</option>
            </select>
          </div>
          <div>
            <label htmlFor="lineName" className="mb-2 block text-sm font-medium text-slate-200">สายพันธุ์/สาย</label>
            <input id="lineName" name="lineName" className={inputClassName} placeholder="เช่น Blue Halfmoon" maxLength={100} />
          </div>
          <div>
            <label htmlFor="hatchDate" className="mb-2 block text-sm font-medium text-slate-200">วันฟัก</label>
            <input id="hatchDate" name="hatchDate" type="date" className={inputClassName} />
          </div>
          <div>
            <label htmlFor="generation" className="mb-2 block text-sm font-medium text-slate-200">รุ่น</label>
            <input id="generation" name="generation" type="number" min={1} max={20} className={inputClassName} placeholder="เช่น 2" />
          </div>
          <section className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4 sm:p-5">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="text-lg font-semibold text-white">ข้อมูลพ่อปลา</h2>
              <span className="rounded-full bg-cyan-500/10 px-2.5 py-1 text-[11px] font-medium text-cyan-300">เพศผู้</span>
            </div>
            <div className="grid gap-4">
              <div>
                <label htmlFor="fatherId" className="mb-2 block text-sm font-medium text-slate-200">เลือกพ่อจากทะเบียน</label>
                <select id="fatherId" value={fatherId} onChange={(event) => setFatherId(event.target.value)} className={inputClassName}>
                  <option value="">ไม่มีในทะเบียน — กรอกเอง</option>
                  {parentOptions.filter((fish) => fish.sex === "ผู้").map((fish) => (
                    <option key={fish.recordId} value={fish.recordId}>{fish.id} · {fish.name}</option>
                  ))}
                </select>
              </div>
              {fatherId ? (
                <div className="flex items-center gap-3 text-sm text-slate-400">
                  {parentOptions.find((fish) => fish.recordId === fatherId)?.imageUrl ? <img src={parentOptions.find((fish) => fish.recordId === fatherId)?.imageUrl ?? undefined} alt="รูปพ่อปลา" className="h-16 w-16 rounded-lg object-cover" /> : null}
                  <span>{parentOptions.find((fish) => fish.recordId === fatherId)?.strain} · อายุ {parentOptions.find((fish) => fish.recordId === fatherId)?.age}</span>
                </div>
              ) : (
                <>
                  <div>
                    <label htmlFor="fatherLabel" className="mb-2 block text-sm font-medium text-slate-200">รหัส/ชื่อพ่อ</label>
                    <input id="fatherLabel" name="fatherLabel" className={inputClassName} placeholder="เช่น BT-1802" maxLength={100} />
                  </div>
                  <div>
                    <label htmlFor="fatherLine" className="mb-2 block text-sm font-medium text-slate-200">สายของพ่อ</label>
                    <input id="fatherLine" name="fatherLine" className={inputClassName} placeholder="เช่น Blue Halfmoon" maxLength={100} />
                  </div>
                  <div>
                    <label htmlFor="fatherImage" className="mb-2 block text-sm font-medium text-slate-200">รูปพ่อ (ไม่บังคับ)</label>
                    <input id="fatherImage" name="fatherImage" type="file" accept="image/jpeg,image/png,image/webp" className="block w-full rounded-xl border border-dashed border-slate-700 bg-slate-950/60 px-3 py-3 text-sm text-slate-300 file:mr-3 file:rounded-lg file:border-0 file:bg-cyan-500 file:px-3 file:py-2 file:text-sm file:font-medium file:text-slate-950" />
                  </div>
                </>
              )}
            </div>
          </section>

          <section className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4 sm:p-5">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="text-lg font-semibold text-white">ข้อมูลแม่ปลา</h2>
              <span className="rounded-full bg-pink-500/10 px-2.5 py-1 text-[11px] font-medium text-pink-300">เพศเมีย</span>
            </div>
            <div className="grid gap-4">
              <div>
                <label htmlFor="motherId" className="mb-2 block text-sm font-medium text-slate-200">เลือกแม่จากทะเบียน</label>
                <select id="motherId" value={motherId} onChange={(event) => setMotherId(event.target.value)} className={inputClassName}>
                  <option value="">ไม่มีในทะเบียน — กรอกเอง</option>
                  {parentOptions.filter((fish) => fish.sex === "เมีย").map((fish) => (
                    <option key={fish.recordId} value={fish.recordId}>{fish.id} · {fish.name}</option>
                  ))}
                </select>
              </div>
              {motherId ? (
                <div className="flex items-center gap-3 text-sm text-slate-400">
                  {parentOptions.find((fish) => fish.recordId === motherId)?.imageUrl ? <img src={parentOptions.find((fish) => fish.recordId === motherId)?.imageUrl ?? undefined} alt="รูปแม่ปลา" className="h-16 w-16 rounded-lg object-cover" /> : null}
                  <span>{parentOptions.find((fish) => fish.recordId === motherId)?.strain} · อายุ {parentOptions.find((fish) => fish.recordId === motherId)?.age}</span>
                </div>
              ) : (
                <>
                  <div>
                    <label htmlFor="motherLabel" className="mb-2 block text-sm font-medium text-slate-200">รหัส/ชื่อแม่</label>
                    <input id="motherLabel" name="motherLabel" className={inputClassName} placeholder="เช่น BT-1809" maxLength={100} />
                  </div>
                  <div>
                    <label htmlFor="motherLine" className="mb-2 block text-sm font-medium text-slate-200">สายของแม่</label>
                    <input id="motherLine" name="motherLine" className={inputClassName} placeholder="เช่น Blue Halfmoon" maxLength={100} />
                  </div>
                  <div>
                    <label htmlFor="motherImage" className="mb-2 block text-sm font-medium text-slate-200">รูปแม่ (ไม่บังคับ)</label>
                    <input id="motherImage" name="motherImage" type="file" accept="image/jpeg,image/png,image/webp" className="block w-full rounded-xl border border-dashed border-slate-700 bg-slate-950/60 px-3 py-3 text-sm text-slate-300 file:mr-3 file:rounded-lg file:border-0 file:bg-pink-500 file:px-3 file:py-2 file:text-sm file:font-medium file:text-white" />
                  </div>
                </>
              )}
            </div>
          </section>

          {parentsLoading ? <p className="md:col-span-2 text-sm text-slate-400" role="status">กำลังโหลดรายชื่อปลา...</p> : null}
          {parentsError ? <p className="md:col-span-2 text-sm text-amber-300" role="status">{parentsError} สามารถกรอกข้อมูลพ่อแม่เองได้</p> : null}

          <div className="md:col-span-2">
            <label htmlFor="notes" className="mb-2 block text-sm font-medium text-slate-200">หมายเหตุ</label>
            <textarea id="notes" name="notes" rows={4} maxLength={1000} className={inputClassName} placeholder="บันทึกข้อมูลเพิ่มเติม" />
          </div>

          {errorMessage ? (
            <p className="md:col-span-2 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-sm text-rose-200" role="alert">
              {errorMessage}
            </p>
          ) : null}

          <div className="md:col-span-2 flex flex-col-reverse justify-end gap-3 sm:flex-row">
            <Link href="/fish" className="rounded-xl border border-slate-700 bg-slate-800 px-5 py-3 text-center text-sm font-medium text-slate-200 transition hover:border-slate-500">
              ยกเลิก
            </Link>
            <button type="submit" disabled={isSaving} className="rounded-xl bg-cyan-500 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400 disabled:cursor-wait disabled:opacity-60">
              {isSaving ? "กำลังบันทึกข้อมูลและสร้าง QR Code..." : "บันทึกข้อมูล"}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}