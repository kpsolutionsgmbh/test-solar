export default function AnalyticsLoading() {
  return (
    <div className="animate-pulse">
      <div className="mb-8">
        <div className="h-7 bg-gray-200 rounded w-24" />
        <div className="h-4 bg-gray-200 rounded w-56 mt-2" />
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-24 bg-gray-200 rounded-xl" />
        ))}
      </div>
      <div className="h-64 bg-gray-200 rounded-xl" />
    </div>
  );
}
