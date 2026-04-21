import React, { useState, useMemo } from "react";

const AdminInvoiceGraph = ({
  invoices = [],
  projects = [],
  rfqs = [],
  onInvoiceClick,
}) => {
  const [selectedYear, setSelectedYear] = useState("2026");
  const [selectedMonth, setSelectedMonth] = useState("all");

  const { jobSummaries, totalRaised, totalPaid, totalPending } = useMemo(() => {
    const jobMap = {};

    const filteredInvoices = invoices.filter((inv) => {
      let dateField = inv.invoiceDate || inv.createdAt;
      if (!dateField) return true;
      try {
        const date = new Date(dateField);
        if (selectedYear !== "all" && date.getFullYear().toString() !== selectedYear) return false;
        if (selectedMonth !== "all" && (date.getMonth() + 0).toString() !== selectedMonth) return false;
      } catch (e) {
        return true;
      }
      return true;
    });

    filteredInvoices.forEach((inv) => {
      const job = inv.jobName || "Unknown Job";
      if (!jobMap[job]) {
        const project = projects.find(
          (p) => p.name === job || p.projectNumber === job,
        );
        let bidPrice = 0;
        let rfqSerial = "";

        let matchedRfq = null;
        if (project && project.rfqId) {
          matchedRfq = rfqs.find((r) => r.id === project.rfqId);
        }
        if (!matchedRfq) {
          matchedRfq = rfqs.find(
            (r) =>
              r.projectName?.toLowerCase() === job.toLowerCase() ||
              r.projectNumber === job ||
              (project && r.projectNumber === project.projectNumber),
          );
        }

        if (matchedRfq) {
          if (matchedRfq.bidPrice) {
            bidPrice = parseFloat(matchedRfq.bidPrice.toString().replace(/[^0-9.-]+/g, "")) || 0;
          }
          if (matchedRfq.serialNo) {
            rfqSerial = matchedRfq.serialNo;
          }
        }

        jobMap[job] = {
          jobName: job,
          rfqSerial: rfqSerial || (project ? project.projectNumber : ""),
          totalRaised: 0,
          paid: 0,
          pending: 0,
          bidPrice: bidPrice,
          invoices: [],
          invoiceNumbers: [],
        };
      }

      const amount = parseFloat(inv.totalInvoiceValue) || 0;
      jobMap[job].totalRaised += amount;
      if (inv.paymentStatus === true || inv.paymentStatus === "Paid") {
        jobMap[job].paid += amount;
      } else {
        jobMap[job].pending += amount;
      }
      jobMap[job].invoices.push(inv);
      if (inv.invoiceNumber && !jobMap[job].invoiceNumbers.includes(inv.invoiceNumber)) {
        jobMap[job].invoiceNumbers.push(inv.invoiceNumber);
      }
    });

    let tr = 0, tp = 0, tpen = 0;
    const jobArray = Object.values(jobMap).map((job) => {
      tr += job.totalRaised;
      tp += job.paid;
      tpen += job.pending;

      const formatStr = (s) => (s && s.toString().startsWith("#") ? s : `#${s}`);
      const uniqueNums = [...new Set(job.invoiceNumbers)];
      job.invoiceNumber = uniqueNums.map(formatStr).join(", ") || "No Invoices";

      return job;
    });

    return {
      jobSummaries: jobArray.sort((a, b) => b.totalRaised - a.totalRaised),
      totalRaised: tr,
      totalPaid: tp,
      totalPending: tpen,
    };
  }, [invoices, projects, rfqs, selectedYear, selectedMonth]);

  const months = [
    { label: "Jan", value: "0" }, { label: "Feb", value: "1" }, { label: "Mar", value: "2" },
    { label: "Apr", value: "3" }, { label: "May", value: "4" }, { label: "Jun", value: "5" },
    { label: "Jul", value: "6" }, { label: "Aug", value: "7" }, { label: "Sep", value: "8" },
    { label: "Oct", value: "9" }, { label: "Nov", value: "10" }, { label: "Dec", value: "11" },
  ];

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => (currentYear - i).toString());

  return (
    <div className="bg-white rounded-2xl shadow-none border-none p-6 w-full flex flex-col gap-6">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start gap-6">
        <div className="w-full md:w-auto">
          <h2 className="text-[14px] font-black text-gray-500 uppercase tracking-widest mb-6">
            INVOICE SUMMARY
          </h2>
          <div className="flex flex-wrap items-center gap-12">
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Total Raised</span>
              <span className="text-2xl font-semibold text-gray-900">${totalRaised.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="h-10 w-px bg-gray-100 hidden md:block"></div>
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Total Paid</span>
              <span className="text-2xl font-semibold text-[#5da63c]">${totalPaid.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="h-10 w-px bg-gray-100 hidden md:block"></div>
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Total Pending</span>
              <span className="text-2xl font-semibold text-red-500">${totalPending.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className="py-2.5 px-6 text-sm font-bold bg-white border border-gray-200 rounded-xl outline-none focus:ring-1 focus:ring-black shadow-sm cursor-pointer"
          >
            <option value="all">All Years</option>
            {years.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="py-2.5 px-6 text-sm font-bold bg-white border border-gray-200 rounded-xl outline-none focus:ring-1 focus:ring-black shadow-sm cursor-pointer"
          >
            <option value="all">All Months</option>
            {months.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
          </select>
        </div>
      </div>

      {/* Jobs List */}
      <div className="flex flex-col gap-6 overflow-y-auto max-h-[600px] pr-2 scrollbar-hide">
        {jobSummaries.map((job) => {
          const maxVal = Math.max(job.totalRaised, job.bidPrice || 0);
          const paidWidth = maxVal > 0 ? (job.paid / maxVal) * 100 : 0;
          const pendingWidth = maxVal > 0 ? (job.pending / maxVal) * 100 : 0;

          return (
            <div key={job.jobName} className="flex flex-col gap-2 rounded-xl p-4 bg-white border border-gray-50/50 hover:bg-gray-50/30 transition-colors">
              <div className="flex justify-between items-start">
                <div className="flex flex-col">
                  <h4 className="text-md font-semibold text-gray-800 uppercase tracking-tight">{job.jobName}</h4>

                  <div className="flex flex-wrap gap-2 mt-1">
                    {job.invoices.map((inv, idx) => (
                      <span 
                        key={inv.id || idx}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onInvoiceClick) onInvoiceClick(inv.id);
                        }}
                        className="text-[11px] font-bold text-gray-600 uppercase tracking-wider opacity-70 hover:text-[#6bbd45] transition-colors cursor-pointer"
                      >
                        {inv.invoiceNumber ? (inv.invoiceNumber.toString().startsWith('#') ? inv.invoiceNumber : `#${inv.invoiceNumber}`) : '#N/A'}
                        {idx < job.invoices.length - 1 ? "," : ""}
                      </span>
                    ))}
                  </div>

                </div>
                <div className="flex flex-col items-end">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest opacity-60">TOTAL RAISED / BID PRICE</span>
                  <div className="flex items-baseline gap-1 mt-1">
                    <span className="text-[16px] font-semibold text-gray-900">${job.totalRaised.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                    <span className="text-gray-300 font-bold">/</span>
                    <span className="text-[15px] font-semibold text-gray-500">${(job.bidPrice || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-end mb-1">
                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    <span className="text-[12px] font-semibold text-[#6bbd45] uppercase tracking-wider">PAID: ${job.paid.toLocaleString()}</span>
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">({job.invoices.length} INVOICES)</span>
                  </div>
                </div>
                <span className="text-[12px] font-semibold text-red-500 uppercase tracking-wider">PENDING: ${job.pending.toLocaleString()}</span>
              </div>

              {/* Thick Progress Bar */}
              <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden flex shadow-inner border border-gray-50">
                <div
                  className="h-full bg-[#6bbd45] transition-all duration-700"
                  style={{ width: `${paidWidth}%` }}
                />
                <div
                  className="h-full bg-red-500 transition-all duration-700"
                  style={{ width: `${pendingWidth}%` }}
                />
              </div>
            </div>
          );
        })}
        {jobSummaries.length === 0 && (
          <div className="text-center py-12 text-gray-300 font-bold uppercase tracking-widest text-xs italic">
            No Records Found
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminInvoiceGraph;
