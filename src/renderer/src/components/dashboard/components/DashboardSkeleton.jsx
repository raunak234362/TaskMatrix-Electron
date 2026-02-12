const DashboardSkeleton = () => {
  return (
    <div className="space-y-6 animate-pulse p-1">
      {/* Stats Grid Skeleton */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {/* Project Stats Skeleton */}
        <div className="bg-white p-6 rounded-2xl shadow-[0_15px_40px_rgba(22,163,74,0.08),0_10px_20px_rgba(0,0,0,0.05)] border border-primary/5 space-y-6">
          <div className="flex justify-between items-center">
            <div className="h-6 w-32 bg-primary/10 rounded-full"></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-20 bg-primary/5 rounded-xl"></div>
            ))}
          </div>
        </div>

        {/* Pending Actions Skeleton */}
        <div className="bg-white p-6 rounded-2xl shadow-[0_15px_40px_rgba(22,163,74,0.08),0_10px_20px_rgba(0,0,0,0.05)] border border-primary/5 space-y-6">
          <div className="h-6 w-32 bg-primary/10 rounded-full"></div>
          <div className="grid grid-cols-2 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-primary/5 rounded-xl"></div>
            ))}
          </div>
        </div>
      </div>

      {/* Charts Section Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Invoice Trends Skeleton */}
        <div className="bg-white p-6 rounded-2xl shadow-[0_15px_40px_rgba(22,163,74,0.08),0_10px_20px_rgba(0,0,0,0.05)] border border-primary/5 space-y-6">
          <div className="h-6 w-40 bg-primary/10 rounded-full"></div>
          <div className="h-64 bg-primary/5 rounded-xl"></div>
        </div>

        {/* Upcoming Submittals Skeleton */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-6">
          <div className="h-6 w-32 bg-primary/10 rounded-full"></div>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center gap-4">
                <div className="h-12 w-12 bg-primary/5 rounded-xl"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-3/4 bg-primary/5 rounded"></div>
                  <div className="h-3 w-1/2 bg-primary/5 rounded"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default DashboardSkeleton
