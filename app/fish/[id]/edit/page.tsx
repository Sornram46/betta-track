"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Suspense, useEffect, useState, type FormEvent } from "react";

const inputClassName =
  "w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-cyan-500";
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

type FishDetail = {
  id: string;
  code: string;
  name: string;
  sex: "male" | "female" | "unknown";
  line_name: string | null;
  hatch_date: string | null;
  generation: number | null;
  father_id: string | null;
  mother_id: string | null;
  father_label: string | null;
  father_line: string | null;
  mother_label: string | null;
  mother_line: string | null;
  notes: string | null;
  imageUrl: string | null;
  fatherImageUrl: string | null;
  motherImageUrl: string | null;
};

type ParentOption = { recordId: string; id: string; name: string; sex: string; imageUrl?: string | null };

/** Shows the saved image (or a preview of a newly picked file) above the file input. */
function ParentImageField({
  name,
  label,
  currentUrl,
  buttonClassName,
}: {
  name: string;
  label: string;
  currentUrl: string | null;
  buttonClassName: string;
}) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const shownUrl = previewUrl ?? currentUrl;

  return (
    <div className="grid gap-2">
      {shownUrl ? (
        <div className="flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element -- signed Supabase URL or local blob preview */}
          <img src={shownUrl} alt={label} className="h-20 w-20 shrink-0 rounded-lg border border-slate-700 object-cover" />
          <p className="text-xs text-slate-400">{previewUrl ? "รูปใหม่ (จะบันทึกเมื่อกดบันทึก)" : "รูปปัจจุบัน"}</p>
        </div>
      ) : (
        <p className="text-xs text-slate-500">ยังไม่มีรูป</p>
      )}
      <label className="text-sm text-slate-300">
        {currentUrl ? `เปลี่ยน${label} (ไม่บังคับ)` : `เพิ่ม${label} (ไม่บังคับ)`}
        <input
          name={name}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={(event) => {
            const file = event.target.files?.[0];
            setPreviewUrl(file ? URL.createObjectURL(file) : null);
          }}
          className={`mt-2 block w-full text-sm text-slate-300 file:mr-3 file:rounded-lg file:border-0 file:px-3 file:py-2 file:text-sm file:font-medium ${buttonClassName}`}
        />
      </label>
    </div>
  );
}

/** Image of a parent picked from the registry (that fish's own photo). */
function RegistryParentImage({ option }: { option: ParentOption | undefined }) {
  if (!option?.imageUrl) return <p className="text-xs text-slate-500">ปลาตัวนี้ยังไม่มีรูปในทะเบียน</p>;
  return (
    <div className="flex items-center gap-3">
      {/* eslint-disable-next-line @next/next/no-img-element -- signed Supabase URL */}
      <img src={option.imageUrl} alt={option.name} className="h-20 w-20 shrink-0 rounded-lg border border-slate-700 object-cover" />
      <p className="text-xs text-slate-400">รูปจากทะเบียน · {option.id}</p>
    </div>
  );
}

function messageFrom(result: unknown, fallback: string) {
  if (typeof result === "object" && result !== null && "message" in result) {
    const message = result.message;
    return Array.isArray(message) ? message.join(", ") : String(message);
  }
  return fallback;
}

// The fish id is only known at request time, so stream the form in after prerendering.
export default function EditFishPage() {
  return (
    <Suspense fallback={<p className="py-10 text-center text-sm text-slate-400" role="status">กำลังโหลดข้อมูลปลา...</p>}>
      <EditFishForm />
    </Suspense>
  );
}

function EditFishForm() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [fish, setFish] = useState<FishDetail | null>(null);
  const [parentOptions, setParentOptions] = useState<ParentOption[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [fatherId, setFatherId] = useState("");
  const [motherId, setMotherId] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let isCurrent = true;

    async function load() {
      try {
        const [fishResponse, listResponse] = await Promise.all([
          fetch(`/api/fish/${encodeURIComponent(id)}`, { cache: "no-store" }),
          fetch("/api/fish", { cache: "no-store" }),
        ]);
        const fishResult: unknown = await fishResponse.json().catch(() => null);
        if (!fishResponse.ok) throw new Error(messageFrom(fishResult, `โหลดข้อมูลปลาไม่สำเร็จ (${fishResponse.status})`));

        const listResult: unknown = await listResponse.json().catch(() => null);
        const detail = fishResult as FishDetail;
        if (!isCurrent) return;

        setFish(detail);
        setFatherId(detail.father_id ?? "");
        setMotherId(detail.mother_id ?? "");
        // A fish cannot be its own parent, so leave it out of the parent lists.
        if (listResponse.ok && Array.isArray(listResult)) {
          setParentOptions((listResult as ParentOption[]).filter((option) => option.recordId !== detail.id));
        }
      } catch (error) {
        if (isCurrent) setLoadError(error instanceof Error ? error.message : "โหลดข้อมูลปลาไม่สำเร็จ");
      }
    }

    void load();
    return () => {
      isCurrent = false;
    };
  }, [id]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!fish) return;
    setIsSaving(true);
    setErrorMessage(null);

    const formData = new FormData(event.currentTarget);
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
      if ([fatherImage, motherImage].some((image) => image instanceof File && image.size > MAX_IMAGE_BYTES)) {
        throw new Error("รูปพ่อหรือแม่ต้องมีขนาดไม่เกิน 5 MB");
      }

      const response = await fetch(`/api/fish/${encodeURIComponent(fish.id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result: unknown = await response.json().catch(() => null);
      if (!response.ok) throw new Error(messageFrom(result, `บันทึกไม่สำเร็จ (${response.status})`));

      const imageWarnings: string[] = [];
      for (const [role, image, label] of [
        ["father", fatherImage, "รูปพ่อ"],
        ["mother", motherImage, "รูปแม่"],
      ] as const) {
        if (!(image instanceof File) || image.size === 0) continue;
        const uploadData = new FormData();
        uploadData.append("image", image);
        const uploadResponse = await fetch(`/api/fish/${encodeURIComponent(fish.id)}/image?role=${role}`, {
          method: "POST",
          body: uploadData,
        });
        if (!uploadResponse.ok) {
          imageWarnings.push(`${label}: ${messageFrom(await uploadResponse.json().catch(() => null), "อัปโหลดไม่สำเร็จ")}`);
        }
      }

      if (imageWarnings.length > 0) {
        throw new Error(`บันทึกข้อมูลแล้ว แต่รูปอัปโหลดไม่สำเร็จ: ${imageWarnings.join("; ")}`);
      }
      router.push("/fish");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "เกิดข้อผิดพลาดในการบันทึกข้อมูล");
    } finally {
      setIsSaving(false);
    }
  }

  const fathers = parentOptions.filter((option) => option.sex === "ผู้");
  const mothers = parentOptions.filter((option) => option.sex === "เมีย");

  return (
    <main className="min-h-screen px-3 py-4 sm:px-6 sm:py-6 lg:px-8">
      <div className="mx-auto max-w-5xl rounded-[24px] border border-slate-800 bg-slate-900/80 p-4 sm:p-8">
        <div className="mb-5 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[11px] uppercase tracking-[0.2em] text-cyan-300">Betta Track</p>
            <h1 className="mt-1 truncate text-2xl font-bold text-white">แก้ไขข้อมูลปลา</h1>
          </div>
          <Link
            href="/fish"
            className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-slate-700 bg-slate-800/80 px-3 py-2 text-sm font-medium text-slate-200 transition hover:border-cyan-500 hover:text-cyan-300"
          >
            <span aria-hidden="true">←</span>
            ย้อนกลับ
          </Link>
        </div>

        {loadError ? (
          <p className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-200" role="alert">{loadError}</p>
        ) : !fish ? (
          <p className="py-10 text-center text-sm text-slate-400" role="status">กำลังโหลดข้อมูลปลา...</p>
        ) : (
          <form className="grid gap-5 md:grid-cols-2" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="name" className="mb-2 block text-sm font-medium text-slate-200">ชื่อปลา</label>
              <input id="name" name="name" defaultValue={fish.name} className={inputClassName} maxLength={100} required />
            </div>
            <div>
              <label htmlFor="code" className="mb-2 block text-sm font-medium text-slate-200">รหัสปลา</label>
              <input id="code" name="code" defaultValue={fish.code} className={inputClassName} maxLength={40} required />
            </div>
            <div>
              <label htmlFor="sex" className="mb-2 block text-sm font-medium text-slate-200">เพศ</label>
              <select id="sex" name="sex" defaultValue={fish.sex} className={inputClassName} required>
                <option value="male">ผู้</option>
                <option value="female">เมีย</option>
                <option value="unknown">ไม่ทราบ</option>
              </select>
            </div>
            <div>
              <label htmlFor="lineName" className="mb-2 block text-sm font-medium text-slate-200">สายพันธุ์/สาย</label>
              <input id="lineName" name="lineName" defaultValue={fish.line_name ?? ""} className={inputClassName} maxLength={100} />
            </div>
            <div>
              <label htmlFor="hatchDate" className="mb-2 block text-sm font-medium text-slate-200">วันฟัก</label>
              <input id="hatchDate" name="hatchDate" type="date" defaultValue={fish.hatch_date ?? ""} className={inputClassName} />
            </div>
            <div>
              <label htmlFor="generation" className="mb-2 block text-sm font-medium text-slate-200">รุ่น</label>
              <input id="generation" name="generation" type="number" min={1} max={20} defaultValue={fish.generation ?? ""} className={inputClassName} />
            </div>

            <section className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4">
              <h2 className="mb-3 text-base font-semibold text-white">พ่อปลา</h2>
              <div className="grid gap-3">
                <select aria-label="เลือกพ่อจากทะเบียน" value={fatherId} onChange={(event) => setFatherId(event.target.value)} className={inputClassName}>
                  <option value="">ไม่มีในทะเบียน — กรอกเอง</option>
                  {fathers.map((option) => (
                    <option key={option.recordId} value={option.recordId}>{option.id} · {option.name}</option>
                  ))}
                </select>
                {fatherId ? (
                  <RegistryParentImage option={fathers.find((option) => option.recordId === fatherId)} />
                ) : (
                  <>
                    <input name="fatherLabel" aria-label="รหัส/ชื่อพ่อ" placeholder="รหัส/ชื่อพ่อ" defaultValue={fish.father_label ?? ""} className={inputClassName} maxLength={100} />
                    <input name="fatherLine" aria-label="สายของพ่อ" placeholder="สายของพ่อ" defaultValue={fish.father_line ?? ""} className={inputClassName} maxLength={100} />
                    <ParentImageField name="fatherImage" label="รูปพ่อ" currentUrl={fish.fatherImageUrl} buttonClassName="file:bg-cyan-500 file:text-slate-950" />
                  </>
                )}
              </div>
            </section>

            <section className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4">
              <h2 className="mb-3 text-base font-semibold text-white">แม่ปลา</h2>
              <div className="grid gap-3">
                <select aria-label="เลือกแม่จากทะเบียน" value={motherId} onChange={(event) => setMotherId(event.target.value)} className={inputClassName}>
                  <option value="">ไม่มีในทะเบียน — กรอกเอง</option>
                  {mothers.map((option) => (
                    <option key={option.recordId} value={option.recordId}>{option.id} · {option.name}</option>
                  ))}
                </select>
                {motherId ? (
                  <RegistryParentImage option={mothers.find((option) => option.recordId === motherId)} />
                ) : (
                  <>
                    <input name="motherLabel" aria-label="รหัส/ชื่อแม่" placeholder="รหัส/ชื่อแม่" defaultValue={fish.mother_label ?? ""} className={inputClassName} maxLength={100} />
                    <input name="motherLine" aria-label="สายของแม่" placeholder="สายของแม่" defaultValue={fish.mother_line ?? ""} className={inputClassName} maxLength={100} />
                    <ParentImageField name="motherImage" label="รูปแม่" currentUrl={fish.motherImageUrl} buttonClassName="file:bg-pink-500 file:text-white" />
                  </>
                )}
              </div>
            </section>

            <div className="md:col-span-2">
              <label htmlFor="notes" className="mb-2 block text-sm font-medium text-slate-200">หมายเหตุ</label>
              <textarea id="notes" name="notes" rows={3} maxLength={1000} defaultValue={fish.notes ?? ""} className={inputClassName} />
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
                {isSaving ? "กำลังบันทึก..." : "บันทึกการแก้ไข"}
              </button>
            </div>
          </form>
        )}
      </div>
    </main>
  );
}
