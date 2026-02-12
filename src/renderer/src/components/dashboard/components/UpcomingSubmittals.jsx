import React, { useMemo } from 'react'
import { ClipboardList, AlertCircle } from 'lucide-react'

const UpcomingSubmittals = ({ pendingSubmittals = [], invoices = [] }) => {
  const [activeTab, setActiveTab] = React.useState('submittals')
  const userRole = sessionStorage.getItem('userRole')?.toLowerCase() || ''
  const isOverdue = (dateString) => {
    if (!dateString) return false
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const approvalDate = new Date(dateString)
    return approvalDate < today
  }

  const groupedSubmittals = useMemo(() => {
    const groups = {}
    pendingSubmittals.forEach((submittal) => {
      const projectName = submittal.project?.name || submittal.name || 'Other Projects'
      if (!groups[projectName]) {
        groups[projectName] = []
      }
      groups[projectName].push(submittal)
    })
    return groups
  }, [pendingSubmittals])

  const invoiceNeedRaise = useMemo(() => {
    // Filter invoices that are not paid or need action
    return invoices.filter((inv) => !inv.paymentStatus)
  }, [invoices])

  return (
    <div className="p-6 rounded-3xl border border-primary/5 shadow-[0_15px_40px_rgba(22,163,74,0.08),0_10px_20px_rgba(0,0,0,0.05)] transition-all duration-500 hover:shadow-[0_20px_60px_rgba(22,163,74,0.15),0_15px_30px_rgba(0,0,0,0.1)] flex flex-col h-full bg-green-50/5">
      <div className="flex items-center justify-between mb-6 px-1">
        <div className="flex items-center gap-6">
          <button
            onClick={() => setActiveTab('submittals')}
            className={`text-lg font-black transition-all uppercase tracking-widest ${activeTab === 'submittals'
              ? 'text-primary border-b-2 border-primary pb-1'
              : 'text-gray-300 hover:text-gray-500'
              }`}
          >
            Upcoming Submittals
          </button>
          {userRole === 'project_manager_officer' && (
            <button
              onClick={() => setActiveTab('invoices')}
              className={`text-lg font-black transition-all uppercase tracking-widest ${activeTab === 'invoices'
                ? 'text-primary border-b-2 border-primary pb-1'
                : 'text-gray-300 hover:text-gray-500'
                }`}
            >
              Invoice Need Raise
            </button>
          )}
        </div>
        <span className="px-4 py-1.5 bg-primary text-white text-[10px] font-black rounded-xl shadow-md uppercase tracking-widest">
          {activeTab === 'submittals'
            ? `${pendingSubmittals.length} Pending`
            : `${invoiceNeedRaise.length} Need Raise`}
        </span>
      </div>

      <div className="flex-1 overflow-y-auto pr-2 space-y-6 max-h-[400px] custom-scrollbar">
        {activeTab === 'submittals' ? (
          pendingSubmittals.length > 0 ? (
            Object.entries(groupedSubmittals).map(([projectName, items]) => (
              <div key={projectName} className="space-y-4">
                <div className="flex items-center gap-3 sticky top-0 bg-white/80 backdrop-blur-md py-2 px-1 z-10 rounded-lg shadow-sm">
                  <div className="w-1.5 h-4 bg-primary rounded-full"></div>
                  <h3 className="text-xs font-black text-gray-400 uppercase tracking-wider">
                    {projectName}
                  </h3>
                  <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-md font-black">
                    {items.length}
                  </span>
                </div>
                <div className="grid grid-cols-1 gap-4 pb-2">
                  {items.map((submittal, index) => {
                    const overdue = isOverdue(submittal.approvalDate)
                    return (
                      <div
                        key={submittal.id || index}
                        className={`p-5 rounded-2xl border transition-all duration-300 group ${overdue
                          ? 'bg-red-50/50 border-red-100 hover:bg-red-100/50 hover:border-red-200 shadow-sm'
                          : 'bg-white border-primary/5 hover:border-primary/20 hover:bg-green-50/50 hover:shadow-lg hover:-translate-y-0.5'
                          }`}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex items-center gap-2">
                            {overdue && <AlertCircle size={16} className="text-red-500" />}
                            <h4
                              className={`text-sm font-black transition-colors ${overdue
                                ? 'text-red-700'
                                : 'text-gray-800 group-hover:text-primary'
                                }`}
                            >
                              {submittal.subject || 'No Subject'}
                            </h4>
                          </div>
                          <span
                            className={`text-[9px] font-black uppercase tracking-widest ${overdue ? 'text-red-500' : 'text-gray-400'
                              }`}
                          >
                            {submittal.approvalDate
                              ? new Date(submittal.approvalDate).toLocaleDateString()
                              : 'No Date'}
                          </span>
                        </div>
                        <div className="flex flex-col gap-0.5 mt-2">
                          <span
                            className={`text-[9px] uppercase font-black tracking-widest ${overdue ? 'text-red-400' : 'text-gray-400'
                              }`}
                          >
                            Fabricator
                          </span>
                          <span
                            className={`text-sm font-black truncate ${overdue ? 'text-red-600' : 'text-gray-700'
                              }`}
                          >
                            {submittal.fabricator?.fabName || submittal.fabName || 'N/A'}
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))
          ) : (
            <div className="flex flex-col items-center justify-center h-full py-12 text-gray-400">
              <ClipboardList size={48} className="mb-4 opacity-20" />
              <p className="text-sm">No upcoming submittals found.</p>
            </div>
          )
        ) : invoiceNeedRaise.length > 0 ? (
          <div className="space-y-3">
            {invoiceNeedRaise.map((invoice, index) => (
              <div
                key={invoice.id || index}
                className="p-4 rounded-xl border border-gray-50 bg-gray-50/50 hover:bg-white hover:border-green-100 hover:shadow-md hover:shadow-green-50/50 transition-all group"
              >
                <div className="flex justify-between items-start mb-2">
                  <h4 className=" text-sm text-gray-700 group-hover:text-green-700 transition-colors">
                    {invoice.invoiceNumber || 'No Number'}
                  </h4>
                  <span className="text-[10px]  text-gray-400 uppercase tracking-wider">
                    {invoice.invoiceDate
                      ? new Date(invoice.invoiceDate).toLocaleDateString()
                      : 'No Date'}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col">
                    <span className="text-[10px] text-gray-400 uppercase font-medium">
                      Customer
                    </span>
                    <span className="text-xs font-semibold text-gray-700 truncate">
                      {invoice.customerName || 'N/A'}
                    </span>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-[10px] text-gray-400 uppercase font-medium">Amount</span>
                    <span className="text-xs  text-green-600">
                      ${invoice.totalInvoiceValue?.toLocaleString() || '0'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full py-12 text-gray-400">
            <ClipboardList size={48} className="mb-4 opacity-20" />
            <p className="text-sm">No invoices need raising.</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default UpcomingSubmittals
