export default function SettingsLoading() {
  return (
    <div className="animate-pulse">
      <div className="h-7 bg-gray-200 rounded w-36 mb-2" />
      <div className="h-4 bg-gray-200 rounded w-64 mb-8" />
      <div className="space-y-6 max-w-3xl">
        <div className="h-64 bg-gray-200 rounded-xl" />
        <div className="h-48 bg-gray-200 rounded-xl" />
        <div className="h-32 bg-gray-200 rounded-xl" />
      </div>
    </div>
  );
}
