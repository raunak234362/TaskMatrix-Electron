import { useState } from "react";
import { AddInvoice, AllInvoices, InvoiceDashboard, WireTransfers } from "../components";
import AccountLayout from "./AccountLayout";

const InvoiceLayout = () => {
  const [activeTab, setActiveTab] = useState("dashboard");

  return (
    <div className="w-full overflow-y-hidden overflow-x-hidden">
      <div className="flex flex-col w-full h-full">
        <div className="px-3 py-2 backdrop-blur-2xl bg-linear-to-t from-white/60 to-white/80 rounded-t-2xl flex flex-wrap items-center justify-center md:justify-end gap-3">
          <button
            onClick={() => setActiveTab("dashboard")}
            className={`flex items-center gap-2 px-6 py-1.5 rounded-lg text-sm font-bold uppercase tracking-tight transition-all border-2 shadow-sm ${activeTab === "dashboard"
              ? "bg-green-50 text-black border-green-700/80"
              : "bg-white text-gray-500 border-gray-300 hover:bg-green-50/40 hover:border-green-700/30 hover:text-black"
              }`}
          >
            Invoice Home
          </button>

          <button
            onClick={() => setActiveTab("allInvoices")}
            className={`flex items-center gap-2 px-6 py-1.5 rounded-lg text-sm font-bold uppercase tracking-tight transition-all border-2 shadow-sm ${activeTab === "allInvoices"
              ? "bg-green-50 text-black border-green-700/80"
              : "bg-white text-gray-500 border-gray-300 hover:bg-green-50/40 hover:border-green-700/30 hover:text-black"
              }`}
          >
            All Invoices
          </button>

          <button
            onClick={() => setActiveTab("addInvoice")}
            className={`flex items-center gap-2 px-6 py-1.5 rounded-lg text-sm font-bold uppercase tracking-tight transition-all border-2 shadow-sm ${activeTab === "addInvoice"
              ? "bg-green-50 text-black border-green-700/80"
              : "bg-white text-gray-500 border-gray-300 hover:bg-green-50/40 hover:border-green-700/30 hover:text-black"
              }`}
          >
            Add Invoice
          </button>

          <button
            onClick={() => setActiveTab("wireTransfers")}
            className={`flex items-center gap-2 px-6 py-1.5 rounded-lg text-sm font-bold uppercase tracking-tight transition-all border-2 shadow-sm ${activeTab === "wireTransfers"
              ? "bg-green-50 text-black border-green-700/80"
              : "bg-white text-gray-500 border-gray-300 hover:bg-green-50/40 hover:border-green-700/30 hover:text-black"
              }`}
          >
            Wire Transfers
          </button>

          <button
            onClick={() => setActiveTab("accounts")}
            className={`flex items-center gap-2 px-6 py-1.5 rounded-lg text-sm font-bold uppercase tracking-tight transition-all border-2 shadow-sm ${activeTab === "accounts"
              ? "bg-green-50 text-black border-green-700/80"
              : "bg-white text-gray-500 border-gray-300 hover:bg-green-50/40 hover:border-green-700/30 hover:text-black"
              }`}
          >
            Accounts
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
        {activeTab === "accounts" && (
          <div>
            <AccountLayout />
          </div>
        )}
        {activeTab === "wireTransfers" && (
          <div>
            <WireTransfers />
          </div>
        )}
      </div>
    </div>
  );
};

export default InvoiceLayout;
