export default function DrinksLoading() {
  return (
    <div className="absolute inset-0 animate-pulse">
      <div className="px-4 pt-6 pb-4 border-b border-border">
        <div className="h-6 w-28 bg-surface-2 rounded-lg" />
      </div>
      <div className="p-4 space-y-4">
        <div className="bg-surface border border-border rounded-[24px] h-36" />
        <div className="bg-surface border border-border rounded-[24px] h-52" />
      </div>
    </div>
  );
}
