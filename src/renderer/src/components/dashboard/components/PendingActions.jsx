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
    <div className="transition-all duration-500 h-full border border-green-200 bg-white p-4 rounded-lg">
      <div className="flex items-center justify-between mb-6 px-1 ">
        <h2 className="text-base font-black text-black uppercase tracking-[0.15em] flex items-center gap-2 ">
          <ClipboardList className="w-5 h-5 text-green-600" />
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
                  }
                  onActionClick(typeMap[action.title])
                }
              }}
              className="flex items-center justify-between p-4 rounded-lg border border-black border-l-5 border-l-[#48b614] bg-white hover:bg-gray-50 transition-all duration-300 cursor-pointer group hover:shadow-md hover:-translate-y-0.5"
            >
              <div className="flex flex-row items-center gap-3 flex-1 min-w-0 justify-between">
                <div className="flex flex-row items-center gap-2">
                  <div
                    className="p-2.5 rounded-none bg-white border border-gray-100 text-black shadow-sm shrink-0 transition-all group-hover:bg-green-600 group-hover:text-white"
                  >
                    <action.icon size={20} strokeWidth={3} />
                  </div>
                  <div className="flex flex-col text-left min-w-0">
                    <span className="text-sm font-semibold text-black uppercase tracking-wide leading-none truncate">{action.title}</span>
                  </div>
                </div>
                {['admin', 'deputy_manager', 'operation_executive', 'dept_manager', 'project_manager'].includes(userRole?.toLowerCase()) && (action.wbtCount > 0 || action.clientCount > 0) && (
                  <div className="flex flex-col md:flex-row items-center gap-5 mt-2">
                    <div className="flex flex-col">
                      <span className="text-md font-medium text-black uppercase tracking-tighter">WBT</span>
                      <span className="text-lg font-black text-gray-700">{action.wbtCount}</span>
                    </div>
                    <div className="w-[1px] h-4 bg-gray-200 mt-2"></div>
                    <div className="flex flex-col">
                      <span className="text-md font-medium text-black uppercase tracking-tighter">CLIENT</span>
                      <span className="text-lg font-black text-gray-700">{action.clientCount}</span>
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
