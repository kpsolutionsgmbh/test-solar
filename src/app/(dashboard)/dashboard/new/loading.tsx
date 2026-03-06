export default function NewDealroomLoading() {
  return (
    <div className="animate-pulse">
      <div className="h-4 bg-gray-200 rounded w-16 mb-6" />
      <div className="h-7 bg-gray-200 rounded w-40 mb-2" />
      <div className="flex items-center gap-2 mb-8">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-8 w-8 bg-gray-200 rounded-full" />
        ))}
      </div>
      <div className="h-96 bg-gray-200 rounded-xl" />
    </div>
  );
}
