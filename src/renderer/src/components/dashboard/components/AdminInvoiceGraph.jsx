import { useState, useMemo } from 'react'
import { createPortal } from 'react-dom'

const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

const AdminInvoiceGraph = ({ invoices = [], onInvoiceClick = () => {} }) => {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [selectedMonth, setSelectedMonth] = useState(null) // null means all months in the year
  const [selectedJobInvoices, setSelectedJobInvoices] = useState(null)

  const processedData = useMemo(() => {
    // 1. Filter by year and optionally month
    const filteredInvoices = invoices.filter((inv) => {
      if (!inv.invoiceDate) return false
      const d = new Date(inv.invoiceDate)
      if (d.getFullYear() !== selectedYear) return false
      if (selectedMonth !== null && d.getMonth() !== selectedMonth) return false
      return true
    })

    // 2. Group by jobName and type
    const jobMap = {}
    filteredInvoices.forEach((inv) => {
      const jobName = inv.jobName || 'Unknown Job'
      const invoiceType = inv.invoiceType || 'Unknown Type'
      const groupKey = `${jobName}_${invoiceType}`
      
      if (!jobMap[groupKey]) {
        jobMap[groupKey] = { name: `${jobName} (${invoiceType})`, raised: 0, paid: 0, pending: 0, bidPrice: 0, invoices: [] }
      }
      
      jobMap[groupKey].invoices.push(inv)
      
      // Determine bidPrice
      const bidPrice = parseFloat(inv.rfq?.bidPrice) || parseFloat(inv.project?.rfq?.bidPrice) || parseFloat(inv.rfqId?.bidPrice) || 0;
      if (bidPrice > jobMap[groupKey].bidPrice) {
        jobMap[groupKey].bidPrice = bidPrice;
      }
      
      const amount = parseFloat(inv.totalInvoiceValue) || 0
      jobMap[groupKey].raised += amount
      
      if (inv.paymentStatus === true || String(inv.paymentStatus).toLowerCase() === 'paid') {
        jobMap[groupKey].paid += amount
      } else {
        jobMap[groupKey].pending += amount
      }
    })

    // 3. Convert to array and sort by raised amount (descending)
    return Object.values(jobMap)
      .sort((a, b) => b.raised - a.raised)
      .slice(0, 15) // Limit to top 15 jobs for better visibility
  }, [invoices, selectedYear, selectedMonth])

  const years = useMemo(() => {
    const currentYear = new Date().getFullYear()
    return Array.from({ length: 5 }, (_, i) => currentYear - i)
  }, [])

  const { totalRaised, totalPaid, totalPending } = useMemo(() => {
    let r = 0, pa = 0, pe = 0;
    processedData.forEach(item => {
      r += item.raised;
      pa += item.paid;
      pe += item.pending;
    });
    return { totalRaised: r, totalPaid: pa, totalPending: pe };
  }, [processedData]);

  return (
    <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col h-full">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-800 uppercase tracking-widest flex items-center gap-2">
            Invoice Summary
          </h2>
          <div className="flex items-center gap-4 mt-2">
             <div className="flex flex-col">
                <span className="text-md font-semibold tracking-wider text-gray-500">Total Raised</span>
                <span className="text-md font-semibold text-gray-800">${totalRaised.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
             </div>
             <div className="w-px h-6 bg-gray-200"></div>
             <div className="flex flex-col">
                <span className="text-md font-semibold tracking-wider text-gray-500">Total Paid</span>
                <span className="text-md font-semibold text-green-600">${totalPaid.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
             </div>
             <div className="w-px h-6 bg-gray-200"></div>
             <div className="flex flex-col">
                <span className="text-md font-semibold tracking-wider text-gray-500">Total Pending</span>
                <span className="text-md font-semibold text-red-500">${totalPending.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
             </div>
          </div>
        </div>

        <div className="flex items-center gap-3 bg-gray-50 p-2 rounded-xl border border-gray-200">
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
            className="px-3 py-1.5 text-sm bg-white border border-gray-200 rounded-lg outline-none focus:border-primary font-bold cursor-pointer"
          >
            {years.map((year) => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
          <select
            value={selectedMonth === null ? 'all' : selectedMonth}
            onChange={(e) => {
              const val = e.target.value
              setSelectedMonth(val === 'all' ? null : parseInt(val))
            }}
            className="px-3 py-1.5 text-sm bg-white border border-gray-200 rounded-lg outline-none focus:border-primary font-bold cursor-pointer"
          >
            <option value="all">All Months</option>
            {months.map((m, i) => (
              <option key={i} value={i}>{m}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pr-2 no-scrollbar h-[400px]">
        {processedData.length > 0 ? (
          <div className="flex flex-col gap-4">
            {processedData.map((job, idx) => (
              <div 
                key={idx}
                onClick={() => setSelectedJobInvoices(job.invoices)}
                className="p-4 rounded-2xl border border-gray-100 hover:border-green-200 hover:shadow-md cursor-pointer transition-all bg-gray-50/30 group"
              >
                <div className="flex justify-between items-end mb-3">
                  <div className="flex-1 pr-4">
                    <h3 className="text-sm font-semibold text-gray-800 uppercase tracking-widest line-clamp-1 group-hover:text-green-700 transition-colors">{job.name}</h3>
                    <p className="text-[10px] font-bold text-gray-500 mt-1 line-clamp-1">
                      {job.invoices.map((inv) => `#${inv.invoiceNumber || 'N/A'}`).join(', ')}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Total Raised {job.bidPrice > 0 && '/ Bid Price'}</span>
                    <span className="text-lg font-semibold text-gray-900">
                      ${job.raised.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      {job.bidPrice > 0 && <span className="text-sm text-gray-500 ml-1">/ ${job.bidPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>}
                    </span>
                  </div>
                </div>
                
                <div className="flex justify-between items-center mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-widest text-green-600">Paid: ${job.paid.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</span>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">({job.invoices.length} Invoices)</span>
                  </div>
                  <span className="text-xs font-bold uppercase tracking-widest text-red-500">Pending: ${job.pending.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</span>
                </div>

                <div className="w-full h-2 rounded-full overflow-hidden flex bg-gray-200 shadow-inner">
                   <div 
                     className="bg-green-500 h-full transition-all duration-1000 ease-out" 
                     style={{ width: `${(job.raised > 0 || job.bidPrice > 0) ? (job.paid / Math.max(job.raised, job.bidPrice || job.raised)) * 100 : 0}%` }}
                   />
                   <div 
                     className="bg-red-500 h-full transition-all duration-1000 ease-out" 
                     style={{ width: `${(job.raised > 0 || job.bidPrice > 0) ? (job.pending / Math.max(job.raised, job.bidPrice || job.raised)) * 100 : 0}%` }}
                   />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-gray-50/50 rounded-2xl border border-dashed border-gray-200 py-10">
            <span className="text-gray-400 font-bold uppercase tracking-widest text-sm">No Invoice Data Found</span>
            <span className="text-gray-400 text-xs mt-1">Try selecting a different date range</span>
          </div>
        )}
      </div>

      {selectedJobInvoices && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white max-w-md w-full rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <div className="flex flex-col">
                <h3 className="text-sm font-black uppercase tracking-widest text-gray-800">Job Invoices</h3>
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{selectedJobInvoices.length} Found</span>
              </div>
              <button 
                onClick={() => setSelectedJobInvoices(null)} 
                className="px-4 py-1.5 bg-red-100 text-red-700 hover:bg-red-200 font-black uppercase tracking-widest text-[10px] rounded-xl transition-colors shrink-0"
              >
                Close
              </button>
            </div>
            <div className="max-h-[60vh] overflow-y-auto p-3 flex flex-col gap-2 bg-gray-50/30">
              {selectedJobInvoices.map((inv) => (
                 <div 
                   key={inv._id || inv.id} 
                   onClick={() => {
                      onInvoiceClick(inv._id || inv.id);
                      setSelectedJobInvoices(null);
                   }}
                   className="flex flex-col p-4 rounded-2xl border border-gray-100 bg-white hover:bg-green-50/50 hover:border-green-200 hover:shadow-md cursor-pointer transition-all group"
                 >
                   <div className="flex justify-between items-center mb-2">
                     <span className="text-sm font-black text-gray-900 group-hover:text-green-700 transition-colors">#{inv.invoiceNumber || 'N/A'}</span>
                     <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest bg-gray-100 px-2 py-1 rounded-md">
                        {new Date(inv.invoiceDate).toLocaleDateString()}
                     </span>
                   </div>
                   <div className="flex justify-between items-end">
                     <div className="flex flex-col">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Amount</span>
                        <span className="text-sm font-black text-gray-800">${parseFloat(inv.totalInvoiceValue).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                     </div>
                     <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-lg ${inv.paymentStatus === true || String(inv.paymentStatus).toLowerCase() === 'paid' ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-red-100 text-red-700 border border-red-200'}`}>
                       {inv.paymentStatus === true || String(inv.paymentStatus).toLowerCase() === 'paid' ? 'Paid' : 'Pending'}
                     </span>
                   </div>
                 </div>
              ))}
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}

export default AdminInvoiceGraph
