import { ClipboardList, FileText, RefreshCw, Activity, Search } from 'lucide-react'

const PendingActions = ({ dashboardStats, onActionClick }) => {

  console.log(dashboardStats);

  const userRole = sessionStorage.getItem('userRole')

  const actions = [
    {
      title: 'RFQ',
      count: dashboardStats?.pendingRFQ || 0,
      subcount: dashboardStats?.newRFQ || 0,
      subtitle: 'New RFQ',
      icon: Search,
      color: 'cyan'
    },
    {
      title: 'RFI',
      count: dashboardStats?.pendingRFI || 0,
      subtitle: 'New RFI',
      subcount: dashboardStats?.newRFI || 0,
      icon: FileText,
      color: 'amber'
    },
    {
      title: 'Submittals',
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
  ].filter((action) => {
    if (action.title === 'RFQ') {
      return !['project_manager', 'department_manager', 'staff'].includes(userRole)
    }
    return true
  })

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
    <div className="bg-white p-4 lg:p-6 rounded-3xl border border-gray-200 transition-all duration-500 h-full">
      <div className="flex items-center justify-between mb-6 px-1">
        <h2 className="text-base font-black text-black uppercase tracking-[0.15em]">Pending Actions</h2>
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
                    'RFQ': 'PENDING_RFQ',
                    'RFI': 'PENDING_RFI',
                    'Submittals': 'PENDING_SUBMITTALS',
                    'Change Orders': 'CHANGE_ORDERS',
                  }
                  onActionClick(typeMap[action.title])
                }
              }}
              className="flex items-center justify-between p-4 rounded-2xl border border-gray-200 bg-green-50/20 hover:bg-green-50/50 hover:border-primary/20 transition-all duration-300 cursor-pointer group hover:shadow-lg hover:-translate-y-0.5"
            >
              <div className="flex flex-row items-center gap-3">
                <div
                  className={`p-2.5 rounded-xl ${colors.bg} ${colors.text} shadow-md shrink-0 transition-all group-hover:scale-105`}
                >
                  <action.icon size={20} />
                </div>

                <div className="flex flex-col text-left">
                  <span className="text-[15px] font-black text-gray-500 uppercase tracking-widest">{action.title}</span>
                  {/* <span className="text-[9px] text-gray-400 font-bold uppercase mt-0.5 tracking-wider">
                    {action.subtitle}: {action.subcount || 0}
                  </span> */}
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
