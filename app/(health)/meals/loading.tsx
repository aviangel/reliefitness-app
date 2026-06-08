export default function MealsLoading() {
  return (
    <div className="absolute inset-0 animate-pulse">
      <div className="px-4 py-4 border-b border-border flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-5 w-32 bg-surface-2 rounded-lg" />
          <div className="h-3 w-24 bg-surface-2 rounded" />
        </div>
        <div className="h-8 w-16 bg-surface-2 rounded-xl" />
      </div>
      <div className="p-4 space-y-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-surface border border-border rounded-[20px] h-24" />
        ))}
      </div>
    </div>
  );
}
