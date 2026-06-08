export default function SettingsLoading() {
  return (
    <div className="absolute inset-0 animate-pulse">
      <div className="px-4 pt-6 pb-4 border-b border-border">
        <div className="h-6 w-24 bg-surface-2 rounded-lg" />
      </div>
      <div className="p-4 space-y-5">
        <div className="bg-surface border border-border rounded-[20px] h-32" />
        <div className="bg-surface border border-border rounded-[20px] h-16" />
        <div className="bg-surface border border-border rounded-[20px] h-48" />
        <div className="bg-surface border border-border rounded-[20px] h-14" />
      </div>
    </div>
  );
}
