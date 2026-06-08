export default function DrinksLoading() {
  return (
    <div className="animate-pulse">
      <div className="px-4 pt-6 pb-4 border-b border-white/[0.06]">
        <div className="h-6 w-28 bg-white/[0.06] rounded-lg" />
      </div>
      <div className="p-4 space-y-4">
        <div className="bg-[#111111] border border-white/[0.06] rounded-[24px] h-36" />
        <div className="bg-[#111111] border border-white/[0.06] rounded-[24px] h-52" />
      </div>
    </div>
  );
}
