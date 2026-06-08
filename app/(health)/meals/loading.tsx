export default function MealsLoading() {
  return (
    <div className="animate-pulse">
      <div className="px-4 py-4 border-b border-white/[0.06] flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-5 w-32 bg-white/[0.06] rounded-lg" />
          <div className="h-3 w-24 bg-white/[0.04] rounded" />
        </div>
        <div className="h-8 w-16 bg-white/[0.06] rounded-xl" />
      </div>
      <div className="p-4 space-y-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-[#111111] border border-white/[0.06] rounded-[20px] h-24" />
        ))}
      </div>
    </div>
  );
}
