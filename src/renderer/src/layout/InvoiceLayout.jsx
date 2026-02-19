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
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold uppercase tracking-wider transition-all border ${activeTab === "dashboard"
              ? "bg-[#ebf5ea] text-black border-black shadow-sm"
              : "bg-white text-gray-500 border-gray-300 hover:border-black hover:bg-gray-50 hover:text-black"
              }`}
          >
            Invoice Home
          </button>

          <button
            onClick={() => setActiveTab("allInvoices")}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold uppercase tracking-wider transition-all border ${activeTab === "allInvoices"
              ? "bg-[#ebf5ea] text-black border-black shadow-sm"
              : "bg-white text-gray-500 border-gray-300 hover:border-black hover:bg-gray-50 hover:text-black"
              }`}
          >
            All Invoices
          </button>

          <button
            onClick={() => setActiveTab("addInvoice")}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold uppercase tracking-wider transition-all border ${activeTab === "addInvoice"
              ? "bg-[#ebf5ea] text-black border-black shadow-sm"
              : "bg-white text-gray-500 border-gray-300 hover:border-black hover:bg-gray-50 hover:text-black"
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
