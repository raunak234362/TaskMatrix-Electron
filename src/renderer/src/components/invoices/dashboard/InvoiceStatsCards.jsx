import React from "react";
import { DollarSign, FileText, AlertCircle, Clock } from "lucide-react";


const InvoiceStatsCards = ({ invoices }) => {
    // Calculate Stats
    const totalInvoices = invoices.length;
    const totalReceived = invoices
        .filter((inv) => inv.paymentStatus === "Paid" || inv.paymentStatus === true) // Assuming 'Paid' or true based on legacy
        .reduce((sum, inv) => sum + (parseFloat(inv.totalInvoiceValue) || 0), 0);

    const pendingInvoices = invoices.filter((inv) => !inv.paymentStatus || inv.paymentStatus === "Pending");
    const pendingAmount = pendingInvoices.reduce((sum, inv) => sum + (parseFloat(inv.totalInvoiceValue) || 0), 0);

    // Simple Overdue Logic pending and dueDate < now
    const overdueInvoices = pendingInvoices.filter((inv) => {
        if (!inv.dueDate) return false;
        return new Date(inv.dueDate) < new Date();
    });

    const overdueCount = overdueInvoices.length;
    const overdueAmount = overdueInvoices.reduce((sum, inv) => sum + (parseFloat(inv.totalInvoiceValue) || 0), 0);

    const stats = [
        {
            title: "Total Invoices Raised",
            value: totalInvoices,
            amount: null, // Just count? User asked for "Total invoice count and total value"
            subValue: new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(
                invoices.reduce((sum, inv) => sum + (parseFloat(inv.totalInvoiceValue) || 0), 0)
            ),
            icon,
            color: "bg-blue-50 text-blue-600",
            trend: "+12% from last month", // Mock trend for now
            trendUp: true,
        },
        {
            title: "Total Amount Received",
            value: new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(totalReceived),
            subValue: `${invoices.filter(i => i.paymentStatus).length} Paid Invoices`,
            icon,
            color: "bg-green-50 text-green-600",
            trend: "+8% from last month",
            trendUp: true,
        },
        {
            title: "Pending Amount",
            value: new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(pendingAmount),
            subValue: `${pendingInvoices.length} Pending Invoices`,
            icon,
            color: "bg-yellow-50 text-yellow-600",
            trend: "-2% from last month",
            trendUp: false,
        },
        {
            title: "Overdue Invoices",
            value: overdueCount,
            subValue: new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(overdueAmount),
            icon,
            color: "bg-red-50 text-red-600",
            trend: "+5% from last month",
            trendUp: false, // Increasing overdue is bad
        },
    ];

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
            {stats.map((stat, index) => (
                <div
                    key={index}
                    className="bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
                >
                    <div className="flex items-start justify-between mb-4">
                        <div className={`p-3 rounded-xl ${stat.color}`}>
                            <stat.icon size={22} />
                        </div>
                        {/* Trend Label (Mocked for UI) */}
                        <span
                            className={`text-xs font-medium px-2 py-1 rounded-full ${stat.title === "Overdue Invoices"
                                ? "bg-red-100 text-red-600"
                                : "bg-green-100 text-green-600"
                                }`}
                        >
                            {stat.trend}
                        </span>
                    </div>
                    <div>
                        <p className="text-sm font-medium text-gray-500 mb-1">{stat.title}</p>
                        <h3 className="text-2xl font-bold text-gray-800 mb-1">{stat.value}</h3>
                        <p className="text-xs text-gray-400">{stat.subValue}</p>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default InvoiceStatsCards;
