import { ClipboardList, FileText, RefreshCw, Activity, Search } from 'lucide-react'

const PendingActions = ({ dashboardStats, onActionClick }) => {
  const actions = [
    {
      title: 'Pending RFI',
      count: dashboardStats?.pendingRFI || 0,
      subtitle: 'New RFI',
      subcount: dashboardStats?.newRFI || 0,
      icon: FileText,
      color: 'amber'
    },
    {
      title: 'Pending Submittals',
      count: dashboardStats?.pendingSubmittals || 0,
      subtitle: 'Response Pending',
      icon: ClipboardList,
      color: 'purple'
    },
    {
      title: 'Change Orders',
      count: dashboardStats?.pendingChangeOrders || 0,
      subtitle: 'New Change Orders',
      subcount: dashboardStats?.newChangeOrders || 0,
      icon: RefreshCw,
      color: 'rose'
    },
    {
      title: 'Pending RFQ',
      count: dashboardStats?.pendingRFQ || 0,
      subcount: dashboardStats?.newRFQ || 0,
      subtitle: 'New RFQ',
      icon: Search,
      color: 'cyan'
    }
  ]

  const colorClasses = {
    amber: {
      bg: 'bg-amber-50',
      text: 'text-amber-700'
    },
    purple: {
      bg: 'bg-indigo-50',
      text: 'text-indigo-700'
    },
    rose: {
      bg: 'bg-red-50',
      text: 'text-red-700'
    },
    cyan: {
      bg: 'bg-primary/5',
      text: 'text-primary'
    }
  }
  return (
    <div className="bg-white p-4 lg:p-6 rounded-3xl border border-black shadow-[0_15px_40px_rgba(22,163,74,0.08),0_10px_20px_rgba(0,0,0,0.05)] transition-all duration-500 hover:shadow-[0_20px_60px_rgba(22,163,74,0.15),0_15px_30px_rgba(0,0,0,0.1)] h-full">
      <div className="flex items-center justify-between mb-6 px-1">
        <h2 className="text-base font-black text-primary uppercase tracking-[0.15em]">Pending Actions</h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {actions.map((action) => {
          const colors = colorClasses[action.color]

          return (
            <div
              key={action.title}
              onClick={() => {
                if (onActionClick) {
                  const typeMap = {
                    'Pending RFI': 'PENDING_RFI',
                    'Pending Submittals': 'PENDING_SUBMITTALS',
                    'Change Orders': 'CHANGE_ORDERS',
                    'Pending RFQ': 'PENDING_RFQ'
                  }
                  onActionClick(typeMap[action.title])
                }
              }}
              className="flex items-center justify-between p-4 rounded-2xl border border-black bg-green-50/20 hover:bg-green-50/50 hover:border-black/50 transition-all duration-300 cursor-pointer group hover:shadow-lg hover:-translate-y-0.5"
            >
              <div className="flex items-center gap-3">
                <div
                  className={`p-2.5 rounded-xl ${colors.bg} ${colors.text} shadow-md shrink-0 transition-all group-hover:scale-105`}
                >
                  <action.icon size={20} />
                </div>

                <div className="flex flex-col text-left">
                  <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">{action.title}</span>
                  <span className="text-[9px] text-gray-400 font-bold uppercase mt-0.5 tracking-wider">
                    {action.subtitle}: {action.subcount || 0}
                  </span>
                </div>
              </div>

              <span className={`text-3xl font-black tracking-tight ${colors.text}`}>
                {action.count}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default PendingActions
