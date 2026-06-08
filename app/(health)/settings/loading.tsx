export default function SettingsLoading() {
  return (
    <div className="animate-pulse">
      <div className="px-4 pt-6 pb-4 border-b border-white/[0.06]">
        <div className="h-6 w-24 bg-white/[0.06] rounded-lg" />
      </div>
      <div className="p-4 space-y-5">
        <div className="bg-[#111111] border border-white/[0.06] rounded-[20px] h-32" />
        <div className="bg-[#111111] border border-white/[0.06] rounded-[20px] h-16" />
        <div className="bg-[#111111] border border-white/[0.06] rounded-[20px] h-48" />
        <div className="bg-[#111111] border border-white/[0.06] rounded-[20px] h-14" />
      </div>
    </div>
  );
}
