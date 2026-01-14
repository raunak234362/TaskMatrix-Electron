const DashboardSkeleton = () => {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Stats Grid Skeleton */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Project Stats Skeleton */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-6">
          <div className="flex justify-between items-center">
            <div className="h-8 w-48 bg-gray-200 rounded"></div>
            <div className="h-10 w-32 bg-gray-200 rounded"></div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="h-4 w-20 bg-gray-200 rounded"></div>
                <div className="h-8 w-16 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        </div>

        {/* Pending Actions Skeleton */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-6">
          <div className="h-8 w-48 bg-gray-200 rounded"></div>
          <div className="grid grid-cols-2 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded-xl"></div>
            ))}
          </div>
        </div>
      </div>

      {/* Charts Section Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Invoice Trends Skeleton */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-6">
          <div className="flex justify-between items-center">
            <div className="h-8 w-40 bg-gray-200 rounded"></div>
            <div className="h-8 w-24 bg-gray-200 rounded"></div>
          </div>
          <div className="h-64 bg-gray-200 rounded-xl"></div>
        </div>

        {/* Upcoming Submittals Skeleton */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-6">
          <div className="h-8 w-48 bg-gray-200 rounded"></div>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center gap-4">
                <div className="h-12 w-12 bg-gray-200 rounded-full"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-3/4 bg-gray-200 rounded"></div>
                  <div className="h-3 w-1/2 bg-gray-200 rounded"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardSkeleton;
