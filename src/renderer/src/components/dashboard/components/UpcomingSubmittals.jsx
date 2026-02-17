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
    <div className="bg-white p-4 lg:p-6 rounded-2xl border border-black shadow-[0_15px_40px_rgba(22,163,74,0.08),0_10px_20px_rgba(0,0,0,0.05)] transition-all duration-500 hover:shadow-[0_20px_60px_rgba(22,163,74,0.15),0_15px_30px_rgba(0,0,0,0.1)] h-full flex flex-col hover:-translate-y-1">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-indigo-50 rounded-[4px]">
            <ClipboardList className="w-4 h-4 text-indigo-600" />
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => setActiveTab('submittals')}
              className={`text-sm font-bold uppercase tracking-wider transition-colors ${activeTab === 'submittals' ? 'text-gray-900' : 'text-gray-400 hover:text-gray-600'}`}
            >
              Submittals
            </button>
            {userRole === 'project_manager_officer' && (
              <button
                onClick={() => setActiveTab('invoices')}
                className={`text-sm font-bold uppercase tracking-wider transition-colors ${activeTab === 'invoices' ? 'text-gray-900' : 'text-gray-400 hover:text-gray-600'}`}
              >
                Invoices
              </button>
            )}
          </div>
        </div>
        <span className="text-[10px] font-bold bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full uppercase tracking-widest shadow-sm border border-indigo-100">
          {activeTab === 'submittals'
            ? `${pendingSubmittals.length} Pending`
            : `${invoiceNeedRaise.length} Need Raise`}
        </span>
      </div>

      <div className="flex-1 overflow-y-auto pr-2 space-y-3 custom-scrollbar">
        {activeTab === 'submittals' ? (
          pendingSubmittals.length > 0 ? (
            Object.entries(groupedSubmittals).map(([projectName, items]) => (
              <div key={projectName} className="space-y-2">
                <div className="flex items-center gap-2 sticky top-0 bg-white/95 backdrop-blur-sm py-1 z-10">
                  <div className="w-1 h-3 bg-indigo-500 rounded-full"></div>
                  <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest truncate max-w-[150px]">
                    {projectName}
                  </h3>
                </div>
                <div className="grid grid-cols-1 gap-2">
                  {items.map((submittal, index) => {
                    const overdue = isOverdue(submittal.approvalDate)
                    return (
                      <div
                        key={submittal.id || index}
                        className={`p-3 rounded-xl border transition-all duration-300 group ${overdue
                          ? 'bg-red-50/30 border-red-100 hover:border-red-200'
                          : 'bg-gray-50/50 border-gray-100 hover:bg-white hover:border-indigo-100 hover:shadow-md'
                          }`}
                      >
                        <div className="flex justify-between items-start mb-1">
                          <div className="flex items-center gap-1.5 overflow-hidden">
                            {overdue && <AlertCircle size={14} className="text-red-500 shrink-0" />}
                            <h4
                              className={`text-xs font-bold truncate ${overdue
                                ? 'text-red-700'
                                : 'text-gray-700 group-hover:text-indigo-600'
                                }`}
                              title={submittal.subject}
                            >
                              {submittal.subject || 'No Subject'}
                            </h4>
                          </div>
                          <span
                            className={`text-[9px] font-black uppercase tracking-wider shrink-0 ml-2 ${overdue ? 'text-red-500' : 'text-gray-400'
                              }`}
                          >
                            {submittal.approvalDate
                              ? new Date(submittal.approvalDate).toLocaleDateString()
                              : 'No Date'}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">Fab:</span>
                          <span className="text-[9px] text-gray-600 font-bold truncate max-w-[100px]" title={submittal.fabricator?.fabName || submittal.fabName}>
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
            <div className="flex flex-col items-center justify-center h-full text-gray-300 space-y-3 font-bold uppercase tracking-widest text-xs">
              <ClipboardList size={40} className="text-gray-200" strokeWidth={1.5} />
              <p>No upcoming submittals</p>
            </div>
          )
        ) : invoiceNeedRaise.length > 0 ? (
          <div className="space-y-3">
            {invoiceNeedRaise.map((invoice, index) => (
              <div
                key={invoice.id || index}
                className="p-3 rounded-xl border border-gray-100 bg-gray-50/50 hover:bg-white hover:border-indigo-100 hover:shadow-md transition-all group"
              >
                <div className="flex justify-between items-start mb-1">
                  <h4 className="text-xs font-bold text-gray-700 group-hover:text-indigo-600 transition-colors">
                    {invoice.invoiceNumber || 'No Number'}
                  </h4>
                  <span className="text-[9px] text-gray-400 uppercase tracking-wider font-bold">
                    {invoice.invoiceDate
                      ? new Date(invoice.invoiceDate).toLocaleDateString()
                      : 'No Date'}
                  </span>
                </div>
                <div className="flex justify-between items-end mt-1">
                  <div className="flex flex-col">
                    <span className="text-[9px] text-gray-400 uppercase font-bold tracking-wider">Customer</span>
                    <span className="text-[10px] font-bold text-gray-600 truncate max-w-[100px]">{invoice.customerName || 'N/A'}</span>
                  </div>
                  <span className="text-xs font-black text-indigo-600">
                    ${invoice.totalInvoiceValue?.toLocaleString() || '0'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-gray-300 space-y-3 font-bold uppercase tracking-widest text-xs">
            <ClipboardList size={40} className="text-gray-200" strokeWidth={1.5} />
            <p>No invoices need raising</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default UpcomingSubmittals
