import { ClipboardList, FileText, RefreshCw, Search } from 'lucide-react'

const PendingActions = ({ dashboardStats, onActionClick }) => {

  const userRole = sessionStorage.getItem('userRole')

  const actions = [
    {
      title: 'RFQ',
      count: dashboardStats?.pendingRFQ || 0,
      wbtCount: dashboardStats?.pendingRfqWbt || 0,
      clientCount: dashboardStats?.pendingRfqClient || 0,
      subcount: dashboardStats?.newRFQ || 0,
      subtitle: 'New RFQ',
      icon: Search,
      hidden: userRole?.toUpperCase() === 'PROJECT_MANAGER' || userRole?.toUpperCase() === 'DEPT_MANAGER'
    },
    {
      title: 'RFI',
      count: dashboardStats?.pendingRFI || 0,
      wbtCount: dashboardStats?.pendingRfiWbt || 0,
      clientCount: dashboardStats?.pendingRfiClient || 0,
      subtitle: 'New RFI',
      subcount: dashboardStats?.newRFI || 0,
      icon: FileText,
      hidden: userRole?.toUpperCase() === 'PROJECT_MANAGER_OFFICER'
    },
    {
      title: 'Submittals',
      count: dashboardStats?.pendingSubmittals || 0,
      wbtCount: dashboardStats?.pendingSubmittalsWbt || 0,
      clientCount: dashboardStats?.pendingSubmittalsClient || 0,
      subtitle: 'Response Pending',
      icon: ClipboardList,
    },
    {
      title: 'Change Orders',
      count: dashboardStats?.pendingChangeOrders || 0,
      wbtCount: dashboardStats?.pendingChangeOrdersWbt || 0,
      clientCount: dashboardStats?.pendingChangeOrdersClient || 0,
      subtitle: 'New Change Orders',
      subcount: dashboardStats?.newChangeOrders || 0,
      icon: RefreshCw,
    },
  ].filter(action => !action.hidden)

  return (
    <div className="transition-all duration-500 h-full bg-green-50 p-5 rounded-lg border border-green-300 shadow-lg">
      <div className="flex items-center justify-between mb-5 px-1">
        <h2 className="text-xl font-semibold text-black uppercase tracking-normal flex items-center gap-2">
          Pending Actions
        </h2>
      </div>

      <div className={`grid grid-cols-1 sm:grid-cols-2 ${userRole?.toUpperCase() === 'PROJECT_MANAGER_OFFICER' ? 'lg:grid-cols-3' : 'lg:grid-cols-2'} gap-4`}>
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
                    'Unapproved Change Orders': 'UNAPPROVED_CHANGE_ORDERS',
                  }
                  onActionClick(typeMap[action.title])
                }
              }}
              className="flex items-center justify-between p-4 rounded-lg border border-black border-l-5 border-l-[#48b614] bg-white hover:bg-gray-50 transition-all duration-300 cursor-pointer group hover:shadow-md hover:-translate-y-0.5"
            >
              <div className="flex flex-row items-center gap-2 flex-1 min-w-0 justify-between">
                <div className="flex flex-row items-center gap-2 min-w-0 pr-1">
                  <div
                    className="p-2.5 rounded-full bg-white border border-gray-100 text-black shadow-sm shrink-0 transition-all group-hover:bg-green-100"
                  >
                    <action.icon size={20} strokeWidth={2.5} />
                  </div>
                  <div className="flex flex-col text-left min-w-0">
                    <span className="text-sm font-semibold text-black uppercase tracking-wide leading-none truncate">{action.title}</span>
                  </div>
                </div>
                {['admin', 'deputy_manager', 'operation_executive', 'dept_manager', 'project_manager'].includes(userRole?.toLowerCase()) && (action.wbtCount > 0 || action.clientCount > 0) && (
                  <div className="flex flex-row items-center gap-2 lg:gap-3 xl:gap-4 shrink-0">
                    <div className="flex flex-col items-center">
                      <span className="text-[10px] font-bold text-black/60 uppercase tracking-tighter leading-none">WBT</span>
                      <span className="text-base font-black text-gray-800 leading-tight">{action.wbtCount}</span>
                    </div>
                    <div className="w-px h-5 bg-gray-200"></div>
                    <div className="flex flex-col items-center">
                      <span className="text-[10px] font-bold text-black/60 uppercase tracking-tighter leading-none">CLIENT</span>
                      <span className="text-base font-black text-gray-800 leading-tight">{action.clientCount}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* <span className="text-3xl font-black tracking-tight text-black shrink-0 ml-2">
                {action.count}
              </span> */}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default PendingActions
