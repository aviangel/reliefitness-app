export default function DashboardLoading() {
  return (
    <div className="absolute inset-0 flex flex-col px-5 pt-6 pb-28 animate-pulse">
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <div className="h-7 w-40 bg-surface-2 rounded-lg" />
          <div className="h-3 w-28 bg-surface-2 rounded" />
        </div>
        <div className="flex gap-1.5">
          <div className="h-9 w-9 bg-surface-2 rounded-xl" />
          <div className="h-9 w-9 bg-surface-2 rounded-xl" />
        </div>
      </div>
      <div className="flex-1 flex items-center justify-center">
        <div className="w-[200px] h-[200px] rounded-full bg-surface-2" />
      </div>
      <div className="h-14 bg-surface-2 rounded-[18px]" />
    </div>
  );
}
