import React, { useMemo } from "react";
import { ClipboardList, AlertCircle } from "lucide-react";

const UpcomingSubmittals = ({
  pendingSubmittals,
  invoices = [],
}) => {
  const [activeTab, setActiveTab] = React.useState("submittals");

  const isOverdue = (dateString) => {
    if (!dateString) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const approvalDate = new Date(dateString);
    return approvalDate < today;
  };

  const groupedSubmittals = useMemo(() => {
    const groups = {};
    pendingSubmittals.forEach((submittal) => {
      const projectName =
        submittal.project?.name || submittal.name || "Other Projects";
      if (!groups[projectName]) {
        groups[projectName] = [];
      }
      groups[projectName].push(submittal);
    });
    return groups;
  }, [pendingSubmittals]);

  const invoiceNeedRaise = useMemo(() => {
    // Filter invoices that are not paid or need action
    return invoices.filter((inv) => !inv.paymentStatus);
  }, [invoices]);

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col h-full">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setActiveTab("submittals")}
            className={`text-md font-semibold transition-all ${activeTab === "submittals"
                ? "text-green-600 border-b-2 border-green-600"
                : "text-gray-400 hover:text-gray-700"
              }`}
          >
            Upcoming Submittals
          </button>
          <button
            onClick={() => setActiveTab("invoices")}
            className={`text-md font-semibold transition-all ${activeTab === "invoices"
                ? "text-green-600 border-b-2 border-green-600"
                : "text-gray-400 hover:text-gray-700"
              }`}
          >
            Invoice Need Raise
          </button>
        </div>
        <span className="px-3 py-1 bg-green-50 text-green-700 text-xs font-bold rounded-full">
          {activeTab === "submittals"
            ? `${pendingSubmittals.length} Pending`
            : `${invoiceNeedRaise.length} Need Raise`}
        </span>
      </div>

      <div className="flex-1 overflow-y-auto pr-2 space-y-6 max-h-[380px] no-scrollbar">
        {activeTab === "submittals" ? (
          pendingSubmittals.length > 0 ? (
            Object.entries(groupedSubmittals).map(([projectName, items]) => (
              <div key={projectName} className="space-y-3">
                <div className="flex items-center gap-2 sticky top-0 bg-white py-1 z-10">
                  <div className="w-1 h-4 bg-green-500 rounded-full"></div>
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                    {projectName}
                  </h3>
                  <span className="text-[10px] bg-gray-100 text-gray-700 px-1.5 py-0.5 rounded-md font-bold">
                    {items.length}
                  </span>
                </div>
                <div className="space-y-3">
                  {items.map((submittal, index) => {
                    const overdue = isOverdue(submittal.approvalDate);
                    return (
                      <div
                        key={submittal.id || index}
                        className={`p-4 rounded-xl border transition-all group ${overdue
                            ? "bg-red-50 border-red-100 hover:bg-red-100/50 hover:border-red-200 shadow-sm shadow-red-50"
                            : "bg-gray-50/50 border-gray-50 hover:bg-white hover:border-green-100 hover:shadow-md hover:shadow-green-50/50"
                          }`}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex items-center gap-2">
                            {overdue && (
                              <AlertCircle size={14} className="text-red-500" />
                            )}
                            <h4
                              className={`font-bold text-sm transition-colors ${overdue
                                  ? "text-red-700"
                                  : "text-gray-700 group-hover:text-green-700"
                                }`}
                            >
                              {submittal.subject || "No Subject"}
                            </h4>
                          </div>
                          <span
                            className={`text-[10px] font-bold uppercase tracking-wider ${overdue ? "text-red-500" : "text-gray-400"
                              }`}
                          >
                            {submittal.approvalDate
                              ? new Date(
                                submittal.approvalDate
                              ).toLocaleDateString()
                              : "No Date"}
                          </span>
                        </div>
                        <div className="grid grid-cols-1 gap-2">
                          <div className="flex flex-col">
                            <span
                              className={`text-[10px] uppercase font-medium ${overdue ? "text-red-400" : "text-gray-400"
                                }`}
                            >
                              Fabricator
                            </span>
                            <span
                              className={`text-xs font-semibold truncate ${overdue ? "text-red-600" : "text-gray-700"
                                }`}
                            >
                              {submittal.fabricator?.fabName ||
                                submittal.fabName ||
                                "N/A"}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
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
                  <h4 className="font-bold text-sm text-gray-700 group-hover:text-green-700 transition-colors">
                    {invoice.invoiceNumber || "No Number"}
                  </h4>
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                    {invoice.invoiceDate
                      ? new Date(invoice.invoiceDate).toLocaleDateString()
                      : "No Date"}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col">
                    <span className="text-[10px] text-gray-400 uppercase font-medium">
                      Customer
                    </span>
                    <span className="text-xs font-semibold text-gray-700 truncate">
                      {invoice.customerName || "N/A"}
                    </span>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-[10px] text-gray-400 uppercase font-medium">
                      Amount
                    </span>
                    <span className="text-xs font-bold text-green-600">
                      ${invoice.totalInvoiceValue?.toLocaleString() || "0"}
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
  );
};

export default UpcomingSubmittals;
