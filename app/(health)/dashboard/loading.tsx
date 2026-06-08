export default function DashboardLoading() {
  return (
    <div className="p-4 space-y-4 animate-pulse">
      {/* Header skeleton */}
      <div className="flex items-center justify-between pt-2">
        <div className="space-y-2">
          <div className="h-6 w-36 bg-white/[0.06] rounded-lg" />
          <div className="h-3 w-28 bg-white/[0.04] rounded" />
        </div>
        <div className="h-12 w-14 bg-white/[0.06] rounded-2xl" />
      </div>

      {/* Ring card skeleton */}
      <div className="bg-[#111111] border border-white/[0.06] rounded-[24px] p-5 flex flex-col items-center gap-5">
        <div className="w-[188px] h-[188px] rounded-full bg-white/[0.05]" />
        <div className="w-full space-y-3">
          <div className="h-[6px] bg-white/[0.05] rounded-full" />
          <div className="h-[6px] bg-white/[0.05] rounded-full" />
          <div className="h-[6px] bg-white/[0.05] rounded-full" />
        </div>
      </div>

      {/* Stats row skeleton */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-[#111111] border border-white/[0.06] rounded-[20px] h-28" />
        <div className="bg-[#111111] border border-white/[0.06] rounded-[20px] h-28" />
      </div>

      {/* Workout skeleton */}
      <div className="bg-[#111111] border border-white/[0.06] rounded-[20px] h-16" />

      {/* Meals skeleton */}
      <div className="space-y-2.5">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-[#111111] border border-white/[0.06] rounded-[18px] h-16" />
        ))}
      </div>
    </div>
  );
}
