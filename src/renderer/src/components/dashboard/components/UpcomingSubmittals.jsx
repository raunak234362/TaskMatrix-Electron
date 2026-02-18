import React, { useMemo } from 'react'
import { ClipboardList, AlertCircle, ChevronRight } from 'lucide-react'

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
      const projectName = submittal.project?.name || submittal.projectName || submittal.name || 'Other Projects'
      if (!groups[projectName]) {
        groups[projectName] = []
      }
      groups[projectName].push(submittal)
    })
    return groups
  }, [pendingSubmittals])

  const invoiceNeedRaise = useMemo(() => {
    return invoices.filter((inv) => !inv.paymentStatus)
  }, [invoices])

  return (
    <div className="bg-white flex-1 flex flex-col min-h-0">
      <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-100">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setActiveTab('submittals')}
            className={`text-xs font-black uppercase tracking-[0.2em] transition-all pb-1 border-b-2 ${activeTab === 'submittals' ? 'text-primary border-primary' : 'text-gray-400 border-transparent hover:text-gray-600'}`}
          >
            Upcoming Submittals
          </button>
          {userRole === 'project_manager_officer' && (
            <button
              onClick={() => setActiveTab('invoices')}
              className={`text-xs font-black uppercase tracking-[0.2em] transition-all pb-1 border-b-2 ${activeTab === 'invoices' ? 'text-primary border-primary' : 'text-gray-400 border-transparent hover:text-gray-600'}`}
            >
              Invoices
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {activeTab === 'submittals' ? (
          pendingSubmittals.length > 0 ? (
            <div className="w-full">
              {/* Table Header */}
              <div className="grid grid-cols-12 gap-4 px-4 py-2 bg-gray-50/50 rounded-lg mb-2 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                <div className="col-span-12 lg:col-span-5">Project / Subject</div>
                <div className="hidden lg:block lg:col-span-4">Fabricator</div>
                <div className="hidden lg:block lg:col-span-2 text-right">Due Date</div>
                <div className="hidden lg:block lg:col-span-1"></div>
              </div>

              {Object.entries(groupedSubmittals).map(([projectName, items]) => (
                <div key={projectName} className="mb-6">
                  <div className="px-4 py-1 mb-2">
                    <h3 className="text-[10px] font-black text-primary uppercase tracking-[0.15em] flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
                      {projectName}
                    </h3>
                  </div>
                  <div className="space-y-1">
                    {items.map((submittal, index) => {
                      const dueDate = submittal.approvalDate || submittal.dueDate || submittal.date
                      const overdue = isOverdue(dueDate)
                      return (
                        <div
                          key={submittal.id || index}
                          className="grid grid-cols-12 gap-4 px-4 py-3 items-center hover:bg-green-50/30 transition-colors border-b border-gray-50 group last:border-0"
                        >
                          <div className="col-span-12 lg:col-span-5 flex items-center gap-3 overflow-hidden">
                            {overdue ? (
                              <div className="p-1.5 bg-red-50 text-red-500 rounded-lg shrink-0">
                                <AlertCircle size={14} />
                              </div>
                            ) : (
                              <div className="p-1.5 bg-blue-50 text-blue-500 rounded-lg shrink-0">
                                <ClipboardList size={14} />
                              </div>
                            )}
                            <div className="flex flex-col min-w-0">
                              <span
                                className={`text-xs font-bold truncate ${overdue ? 'text-red-700' : 'text-gray-800'}`}
                                title={submittal.subject || submittal.name}
                              >
                                {submittal.subject || submittal.name || 'No Subject'}
                              </span>
                              <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider lg:hidden">
                                {submittal.fabricator?.fabName || submittal.fabName || 'No Fab'}
                              </span>
                            </div>
                          </div>

                          <div className="hidden lg:block lg:col-span-4">
                            <span className="text-[11px] font-bold text-gray-600 truncate block">
                              {submittal.fabricator?.fabName || submittal.fabName || 'N/A'}
                            </span>
                          </div>

                          <div className="col-span-12 lg:col-span-2 lg:text-right">
                            <span
                              className={`text-[10px] font-black uppercase tracking-widest ${overdue ? 'text-red-500' : 'text-gray-500'}`}
                            >
                              {dueDate ? new Date(dueDate).toLocaleDateString() : 'NO DATE'}
                            </span>
                          </div>

                          <div className="hidden lg:flex lg:col-span-1 justify-end">
                            <ChevronRight size={16} className="text-gray-300 group-hover:text-primary transition-colors" />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-48 text-gray-300 space-y-3">
              <ClipboardList size={40} className="text-gray-100" strokeWidth={1} />
              <p className="text-[10px] font-black uppercase tracking-widest">No upcoming submittals</p>
            </div>
          )
        ) : (
          <div className="w-full">
            {invoiceNeedRaise.length > 0 ? (
              <div className="space-y-1">
                <div className="grid grid-cols-12 gap-4 px-4 py-2 bg-gray-50/50 rounded-lg mb-2 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                  <div className="col-span-5">Invoice # / Customer</div>
                  <div className="col-span-4">Value</div>
                  <div className="col-span-3 text-right">Date</div>
                </div>
                {invoiceNeedRaise.map((invoice, index) => (
                  <div
                    key={invoice.id || index}
                    className="grid grid-cols-12 gap-4 px-4 py-3 items-center hover:bg-indigo-50/30 transition-colors border-b border-gray-50 group"
                  >
                    <div className="col-span-5 flex flex-col">
                      <span className="text-xs font-bold text-gray-800 uppercase tracking-tight">
                        {invoice.invoiceNumber || 'No Number'}
                      </span>
                      <span className="text-[9px] text-gray-400 font-bold uppercase truncate">
                        {invoice.customerName || 'N/A'}
                      </span>
                    </div>
                    <div className="col-span-4">
                      <span className="text-xs font-black text-indigo-600 tracking-tight">
                        ${invoice.totalInvoiceValue?.toLocaleString() || '0'}
                      </span>
                    </div>
                    <div className="col-span-3 text-right">
                      <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">
                        {invoice.invoiceDate ? new Date(invoice.invoiceDate).toLocaleDateString() : 'NO DATE'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-48 text-gray-300 space-y-3">
                <ClipboardList size={40} className="text-gray-100" strokeWidth={1} />
                <p className="text-[10px] font-black uppercase tracking-widest">No invoices need raising</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default UpcomingSubmittals
