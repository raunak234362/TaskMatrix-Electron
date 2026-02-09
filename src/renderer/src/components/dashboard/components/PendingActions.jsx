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
      hoverBg: 'bg-amber-100',
      text: 'text-amber-600'
    },
    purple: {
      bg: 'bg-purple-50',
      hoverBg: 'bg-purple-100',
      text: 'text-purple-600'
    },
    rose: {
      bg: 'bg-rose-50',
      hoverBg: 'bg-rose-100',
      text: 'text-rose-600'
    },
    cyan: {
      bg: 'bg-cyan-50',
      hoverBg: 'bg-cyan-100',
      text: 'text-cyan-600'
    }
  }

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
      <h3 className="font-semibold text-lg text-gray-800 mb-6 flex items-center gap-3">
        <ClipboardList className="text-green-600" size={24} />
        Pending Actions
      </h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4">
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
              className="flex flex-row items-center gap-4 p-4 rounded-xl hover:bg-gray-50 transition-all duration-200 cursor-pointer group"
            >
              <div
                className={`p-3 rounded-lg ${colors.bg} ${colors.text} group-hover:${colors.hoverBg} transition-colors`}
              >
                <action.icon size={24} />
              </div>

              <div className="flex flex-col">
                <span className="font-semibold text-gray-700">{action.title}</span>
                <span
                  className="text-2xl  mt-1"
                  style={{ color: colors.text.replace('text-', '#') }}
                >
                  {action.count}
                </span>
                <span className="text-xs text-gray-500 uppercase tracking-wider mt-2">
                  {action.subtitle} - {action.subcount}
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default PendingActions
