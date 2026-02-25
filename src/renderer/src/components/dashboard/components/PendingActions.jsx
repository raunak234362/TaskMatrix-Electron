import { ClipboardList, FileText, RefreshCw, Search } from 'lucide-react'

const PendingActions = ({ dashboardStats, onActionClick }) => {

  const userRole = sessionStorage.getItem('userRole')

  const actions = [
    {
      title: 'RFQ',
      count: dashboardStats?.pendingRFQ || 0,
      subcount: dashboardStats?.newRFQ || 0,
      subtitle: 'New RFQ',
      icon: Search,
      hidden: userRole?.toUpperCase() === 'PROJECT_MANAGER' || userRole?.toUpperCase() === 'DEPARTMENT_MANAGER'
    },
    {
      title: 'RFI',
      count: dashboardStats?.pendingRFI || 0,
      subtitle: 'New RFI',
      subcount: dashboardStats?.newRFI || 0,
      icon: FileText,
    },
    {
      title: 'Submittals',
      count: dashboardStats?.pendingSubmittals || 0,
      subtitle: 'Response Pending',
      icon: ClipboardList,
    },
    {
      title: 'Change Orders',
      count: dashboardStats?.pendingChangeOrders || 0,
      subtitle: 'New Change Orders',
      subcount: dashboardStats?.newChangeOrders || 0,
      icon: RefreshCw,
    },
  ].filter(action => !action.hidden)

  return (
    <div className="p-0 transition-all duration-500 h-full border border-gray-200 bg-white p-4 rounded-lg">
      <div className="flex items-center justify-between mb-6 px-1 ">
        <h2 className="text-base font-black text-black uppercase tracking-[0.15em] flex items-center gap-2 ">
          <ClipboardList className="w-5 h-5 text-green-600" />
          Pending Actions
        </h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {actions.map((action) => {
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
              className="flex items-center justify-between p-4 rounded-none border border-gray-200 border-l-4 border-l-green-600 bg-white hover:bg-gray-50 transition-all duration-300 cursor-pointer group hover:shadow-md hover:-translate-y-0.5"
            >
              <div className="flex flex-row items-center gap-4">
                <div
                  className="p-2.5 rounded-none bg-white border border-gray-100 text-black shadow-sm shrink-0 transition-all group-hover:bg-green-600 group-hover:text-white"
                >
                  <action.icon size={20} strokeWidth={3} />
                </div>

                <div className="flex flex-col text-left">
                  <span className="text-[13px] font-black text-black uppercase tracking-widest leading-none">{action.title}</span>
                </div>
              </div>

              <span className="text-3xl font-black tracking-tight text-black">
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
