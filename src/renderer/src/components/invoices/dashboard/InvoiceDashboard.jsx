import { useEffect, useState } from "react";
import { Calendar, ChevronDown } from "lucide-react";
import Service from "../../../api/Service";
import InvoiceStatsCards from "./InvoiceStatsCards";
import InvoiceAnalytics from "./InvoiceAnalytics";
import PendingInvoiceList from "./PendingInvoiceList";
import RecentInvoiceActivity from "./RecentInvoiceActivity";
import QuickActionsPanel from "./QuickActionsPanel";


const InvoiceDashboard = ({ navigateToCreate }) => {
    const [invoices, setInvoices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [dateFilter, setDateFilter] = useState("This Month");

    useEffect(() => {
        const fetchInvoices = async () => {
            try {
                const res = await Service.GetAllInvoice();
                setInvoices(Array.isArray(res) ? res : res?.data || []);
            } catch (error) {
                console.error("Error fetching invoices:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchInvoices();
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6 pb-10">
            {/* Header & Filter */}
            <div className="flex flex-col gap-4">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                    {/* <div>
                        <h2 className="text-2xl  text-gray-800">Invoice Dashboard</h2>
                        <p className="text-gray-500">Welcome back! Here's your financial overview.</p>
                    </div> */}
                </div>

                {/* Date Filter Pills */}
                <div className="flex-1 w-full md:w-auto min-w-0">
                    {/* Mobile Date Filter Dropdown */}
                    <div className="md:hidden relative w-full mb-4">
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <select
                            value={dateFilter}
                            onChange={(e) => setDateFilter(e.target.value)}
                            className="pl-10 pr-8 py-2 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-700 focus:ring-2 focus:ring-green-500 outline-none appearance-none cursor-pointer hover:bg-gray-50 transition-colors w-full"
                        >
                            {["All Months", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"].map((filter) => (
                                <option key={filter} value={filter}>
                                    {filter}
                                </option>
                            ))}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
                    </div>

                    {/* Desktop Date Filter Buttons */}
                    <div className="hidden md:flex items-center gap-2 overflow-x-auto pb-2 custom-scrollbar">
                        {["All Months", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"].map((filter) => (
                            <button
                                key={filter}
                                onClick={() => setDateFilter(filter)}
                                className={`px-5 py-2 rounded-full text-sm font-semibold transition-all shrink-0 ${dateFilter === filter
                                    ? "bg-green-500 text-white shadow-[0_4px_12px_rgba(34,197,94,0.3)]"
                                    : "bg-white text-gray-600 hover:bg-gray-50 border border-gray-100"
                                    }`}
                            >
                                {filter}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* 1. Stats Cards */}
            <InvoiceStatsCards invoices={invoices} />

            {/* 2. Quick Actions */}
            <QuickActionsPanel
                onRaiseInvoice={navigateToCreate}
                onDownloadReport={() => alert("Report download feature coming soon!")}
                onSendReminders={() => alert("Reminders sent successfully!")}
            />

            {/* 3. Analytics (Charts) */}
            <InvoiceAnalytics invoices={invoices} />

            {/* 4. Bottom Section + Activity */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                <div className="xl:col-span-2">
                    <PendingInvoiceList invoices={invoices} />
                </div>
                <div className="xl:col-span-1">
                    <RecentInvoiceActivity invoices={invoices} />
                </div>
            </div>
        </div>
    );
};

export default InvoiceDashboard;
