import { useState } from "react";
import { AddInvoice, AllInvoices, InvoiceDashboard } from "../components";

const InvoiceLayout = () => {
  const [activeTab, setActiveTab] = useState("dashboard");

  return (
    <div className="w-full overflow-y-hidden overflow-x-hidden">
      <div className="flex flex-col w-full h-full">
        <div className="px-3 py-2 backdrop-blur-2xl bg-linear-to-t from-white/60 to-white/80 rounded-t-2xl flex flex-wrap items-center justify-center md:justify-end gap-3">
          <button
            onClick={() => setActiveTab("dashboard")}
            className={`flex items-center gap-2 px-4 md:px-6 py-2 md:py-3 rounded-[1.25rem] text-sm md:text-base font-semibold transition-all ${activeTab === "dashboard"
                ? "bg-green-500 text-white shadow-[0_8px_20px_-4px_rgba(34,197,94,0.4)] hover:bg-green-600 hover:shadow-[0_12px_24px_-4px_rgba(34,197,94,0.5)]"
                : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 hover:text-green-600 shadow-sm"
              }`}
          >
            Invoice Home
          </button>

          <button
            onClick={() => setActiveTab("allInvoices")}
            className={`flex items-center gap-2 px-4 md:px-6 py-2 md:py-3 rounded-[1.25rem] text-sm md:text-base font-semibold transition-all ${activeTab === "allInvoices"
                ? "bg-green-500 text-white shadow-[0_8px_20px_-4px_rgba(34,197,94,0.4)] hover:bg-green-600 hover:shadow-[0_12px_24px_-4px_rgba(34,197,94,0.5)]"
                : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 hover:text-green-600 shadow-sm"
              }`}
          >
            All Invoices
          </button>

          <button
            onClick={() => setActiveTab("addInvoice")}
            className={`flex items-center gap-2 px-4 md:px-6 py-2 md:py-3 rounded-[1.25rem] text-sm md:text-base font-semibold transition-all ${activeTab === "addInvoice"
                ? "bg-green-500 text-white shadow-[0_8px_20px_-4px_rgba(34,197,94,0.4)] hover:bg-green-600 hover:shadow-[0_12px_24px_-4px_rgba(34,197,94,0.5)]"
                : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 hover:text-green-600 shadow-sm"
              }`}
          >
            Add Invoice
          </button>
        </div>
      </div>
      <div className="flex-1 min-h-0 bg-white p-2 rounded-b-2xl overflow-y-auto laptop-fit">
        {activeTab === "dashboard" && (
          <InvoiceDashboard
            navigateToCreate={() => setActiveTab("addInvoice")}
          />
        )}
        {activeTab === "allInvoices" && (
          <div>
            <AllInvoices />
          </div>
        )}
        {activeTab === "addInvoice" && (
          <div>
            <AddInvoice />
          </div>
        )}
      </div>
    </div>
  );
};

export default InvoiceLayout;
