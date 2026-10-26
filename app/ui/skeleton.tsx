type SkeletonProps = {
  className?: string;
};

/**
 * Reusable shimmer skeleton block.
 * ใช้คู่กับคลาส `.skeleton` ใน globals.css (มี shimmer animation + รองรับ prefers-reduced-motion)
 */
export function Skeleton({ className = "" }: SkeletonProps) {
  return <div className={`skeleton rounded-md ${className}`} aria-hidden="true" />;
}

/** การ์ดสถิติแบบ skeleton สำหรับ Dashboard */
export function StatCardSkeleton() {
  return (
    <div className="min-w-[76%] snap-start rounded-[22px] border border-slate-800 bg-slate-900/80 p-5 sm:min-w-[48%] md:min-w-0">
      <Skeleton className="h-4 w-24" />
      <div className="mt-6">
        <Skeleton className="h-8 w-16" />
      </div>
    </div>
  );
}

/** แถวรายการปลาแบบ skeleton (ใช้ใน Dashboard list + mobile cards) */
export function FishRowSkeleton() {
  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl border border-slate-800 bg-slate-950/70 p-3">
      <div className="flex items-center gap-3">
        <Skeleton className="h-11 w-11 rounded-xl" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-3 w-40" />
        </div>
      </div>
      <Skeleton className="h-6 w-16 rounded-full" />
    </div>
  );
}

/** แถว skeleton ในรายการสายพันธุ์ */
export function StrainRowSkeleton() {
  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl border border-slate-800 bg-slate-950/70 p-3">
      <Skeleton className="h-4 w-32" />
      <Skeleton className="h-6 w-14 rounded-full" />
    </div>
  );
}

/** แถว skeleton สำหรับตารางปลา (desktop) */
export function FishTableRowSkeleton() {
  return (
    <tr>
      <td className="px-4 py-4">
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-xl" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-3 w-16" />
          </div>
        </div>
      </td>
      <td className="px-4 py-4">
        <Skeleton className="h-4 w-20" />
      </td>
      <td className="px-4 py-4">
        <Skeleton className="h-4 w-10" />
      </td>
      <td className="px-4 py-4">
        <Skeleton className="h-6 w-14 rounded-full" />
      </td>
      <td className="px-4 py-4">
        <Skeleton className="h-4 w-24" />
      </td>
      <td className="px-4 py-4">
        <Skeleton className="h-6 w-16 rounded-full" />
      </td>
    </tr>
  );
}

/** การ์ดปลาแบบ skeleton (mobile) */
export function FishCardSkeleton() {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <Skeleton className="h-11 w-11 rounded-xl" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-3 w-16" />
          </div>
        </div>
        <Skeleton className="h-6 w-16 rounded-full" />
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-4 w-24" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-4 w-24" />
        </div>
      </div>
    </div>
  );
}
