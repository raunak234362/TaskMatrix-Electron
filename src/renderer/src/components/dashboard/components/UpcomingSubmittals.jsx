import React, { useMemo } from "react";
import { ClipboardList, AlertCircle, ChevronRight } from "lucide-react";

const UpcomingSubmittals = ({ pendingSubmittals = [], invoices = [] }) => {
  const [activeTab, setActiveTab] = React.useState("submittals");
  const userRole = sessionStorage.getItem("userRole")?.toLowerCase() || "";

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
        submittal.project?.name ||
        submittal.projectName ||
        submittal.name ||
        "Other Projects";

      if (!groups[projectName]) groups[projectName] = [];
      groups[projectName].push(submittal);
    });

    return groups;
  }, [pendingSubmittals]);

  const invoiceNeedRaise = useMemo(() => {
    return invoices.filter((inv) => !inv.paymentStatus);
  }, [invoices]);

  return (
    <div className="bg-white flex-1 flex flex-col min-h-0 rounded-xl p-4 shadow-sm border border-gray-200">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-100">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setActiveTab("submittals")}
            className={`text-xs font-black uppercase tracking-widest pb-1 border-b-2 transition-all ${
              activeTab === "submittals"
                ? "text-primary border-primary"
                : "text-gray-400 border-transparent hover:text-gray-600"
            }`}
          >
            Upcoming Submittals
          </button>

          {userRole === "project_manager_officer" && (
            <button
              onClick={() => setActiveTab("invoices")}
              className={`text-xs font-black uppercase tracking-widest pb-1 border-b-2 transition-all ${
                activeTab === "invoices"
                  ? "text-primary border-primary"
                  : "text-gray-400 border-transparent hover:text-gray-600"
              }`}
            >
              Invoices
            </button>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {activeTab === "submittals" ? (
          pendingSubmittals.length > 0 ? (
            <div className="w-full">
              {/* Table Header */}
              <div className="grid grid-cols-12 gap-4 px-4 py-2 bg-slate-50 rounded-lg mb-2 border border-gray-100 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                <div className="col-span-12 lg:col-span-5">
                  Project / Subject
                </div>
                <div className="hidden lg:block lg:col-span-4">
                  Fabricator
                </div>
                <div className="hidden lg:block lg:col-span-2 text-right">
                  Due Date
                </div>
                <div className="hidden lg:block lg:col-span-1"></div>
              </div>

              {Object.entries(groupedSubmittals).map(
                ([projectName, items]) => (
                  <div
                    key={projectName}
                    className="mb-5 bg-white border border-gray-200 rounded-xl shadow-sm"
                  >
                    {/* Project Header */}
                    <div className="px-4 py-3 border-b border-gray-100 bg-gray-50/40 rounded-t-xl">
                      <h3 className="text-xs font-black text-primary uppercase tracking-widest flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
                        {projectName}
                      </h3>
                    </div>

                    {/* Rows */}
                    <div className="divide-y divide-gray-100">
                      {items.map((submittal, index) => {
                        const dueDate =
                          submittal.approvalDate ||
                          submittal.dueDate ||
                          submittal.date;

                        const overdue = isOverdue(dueDate);

                        return (
                          <div
                            key={submittal.id || index}
                            className="grid grid-cols-12 gap-4 px-4 py-3 items-center hover:bg-slate-50 transition-colors group"
                          >
                            {/* Subject */}
                            <div className="col-span-12 lg:col-span-5 flex items-center gap-3 min-w-0">
                              {overdue ? (
                                <div className="p-2 rounded-lg bg-red-50 text-red-500">
                                  <AlertCircle size={14} />
                                </div>
                              ) : (
                                <div className="p-2 rounded-lg bg-blue-50 text-blue-500">
                                  <ClipboardList size={14} />
                                </div>
                              )}

                              <div className="flex flex-col min-w-0">
                                <span
                                  className={`text-sm font-semibold truncate ${
                                    overdue
                                      ? "text-red-600"
                                      : "text-gray-800"
                                  }`}
                                  title={submittal.subject || submittal.name}
                                >
                                  {submittal.subject ||
                                    submittal.name ||
                                    "No Subject"}
                                </span>

                                <span className="text-[10px] text-gray-400 font-medium lg:hidden">
                                  {submittal.fabricator?.fabName || "No Fab"}
                                </span>
                              </div>
                              <div>
                                
                              </div>
                               <span
                                className={`text-xs font-semibold uppercase ${
                                  overdue
                                    ? "text-red-500"
                                    : "text-gray-500"
                                }`}
                              >
                                {dueDate
                                  ? new Date(dueDate).toLocaleDateString()
                                  : "No Date"}
                              </span>
                            </div>

                            {/* Fabricator */}
                            <div className="hidden lg:block lg:col-span-4">
                              <span className="text-sm font-medium text-gray-600 truncate block">
                                {submittal.fabricator?.fabName || "N/A"}
                              </span>
                            </div>

                            {/* Due Date */}
                            <div className="col-span-12 lg:col-span-2 lg:text-right">
                             
                            </div>

                            {/* Arrow */}
                            <div className="hidden lg:flex lg:col-span-1 justify-end">
                              <ChevronRight
                                size={16}
                                className="text-gray-300 group-hover:text-primary transition-colors"
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ),
              )}
            </div>
          ) : (
            <EmptyState text="No upcoming submittals" />
          )
        ) : (
          <div className="w-full">
            {invoiceNeedRaise.length > 0 ? (
              <div className="space-y-2">
                {invoiceNeedRaise.map((invoice, index) => (
                  <div
                    key={invoice.id || index}
                    className="flex justify-between px-4 py-3 rounded-lg hover:bg-slate-50"
                  >
                    <span className="text-sm font-medium">
                      {invoice.invoiceNumber || "No Number"}
                    </span>
                    <span className="text-sm font-semibold text-indigo-600">
                      ${invoice.totalInvoiceValue || 0}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState text="No invoices need raising" />
            )}
          </div>
        )}
      </div>
    </div>
  );
};

const EmptyState = ({ text }) => (
  <div className="flex flex-col items-center justify-center h-40 text-gray-300">
    <ClipboardList size={32} strokeWidth={1.5} />
    <p className="text-xs font-semibold uppercase mt-2">{text}</p>
  </div>
);

export default UpcomingSubmittals;
