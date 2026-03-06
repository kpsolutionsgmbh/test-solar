export default function ReferencesLoading() {
  return (
    <div className="animate-pulse">
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="h-7 bg-gray-200 rounded w-32" />
          <div className="h-4 bg-gray-200 rounded w-64 mt-2" />
        </div>
        <div className="h-10 bg-gray-200 rounded w-36" />
      </div>
      <div className="space-y-2">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-16 bg-gray-200 rounded-xl" />
        ))}
      </div>
    </div>
  );
}
