import React from "react";
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    Legend,
} from "recharts";
import { CreditCard, Banknote } from "lucide-react";


const InvoiceAnalytics = ({ invoices }) => {
    // 1. Process Data for Trends (Last 6 Months)
    const processTrendData = () => {
        const months = {};
        const today = new Date();

        // Initialize last 6 months
        for (let i = 5; i >= 0; i--) {
            const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
            const key = d.toLocaleString('default', { month: 'short' });
            months[key] = { raised: 0, received: 0, order: i };
        }

        invoices.forEach(inv => {
            if (!inv.invoiceDate) return;
            const d = new Date(inv.invoiceDate);
            // Only consider if within last 6 months roughly
            if ((today.getTime() - d.getTime()) > 180 * 24 * 60 * 60 * 1000) return;

            const key = d.toLocaleString('default', { month: 'short' });
            if (months[key]) {
                const amount = parseFloat(inv.totalInvoiceValue) || 0;
                months[key].raised += amount;
                if (inv.paymentStatus === true || inv.paymentStatus === "Paid") {
                    months[key].received += amount;
                }
            }
        });

        return Object.entries(months)
            .sort((a, b) => b[1].order - a[1].order)
            .map(([name, data]) => ({ name, raised: data.raised, received: data.received }))
            .reverse();
    };

    const lineData = processTrendData();

    // 2. Status Breakdown
    const paidCount = invoices.filter((i) => i.paymentStatus === true || i.paymentStatus === "Paid").length;

    // Overdue Logic
    const overdueCount = invoices.filter(i => {
        const isPaid = i.paymentStatus === true || i.paymentStatus === "Paid";
        if (isPaid) return false;
        const date = i.dueDate || i.invoiceDate;
        const dueDate = date ? new Date(date) : new Date();
        return dueDate < new Date();
    }).length;

    const pendingCount = invoices.length - paidCount - overdueCount;

    const pieData = [
        { name: "Paid", value: paidCount, color: "#6bbd45" },
        { name: "Pending", value: Math.max(0, pendingCount), color: "#eab308" },
        { name: "Overdue", value: overdueCount, color: "#ef4444" },
    ].filter(d => d.value > 0);

    const paymentMethods = [
        { method: "Bank Transfer", count: 45, percentage: 60, icon: Banknote, color: "bg-blue-100 text-blue-600" },
        { method: "Card Payment", count: 20, percentage: 25, icon: CreditCard, color: "bg-purple-100 text-purple-600" },
    ];

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {/* 1. Trends Line Chart */}
            <div className="lg:col-span-2 bg-green-100 p-6 rounded-3xl border border-black shadow-sm">
                <div className="flex items-center justify-between mb-8">
                    <h3 className="text-sm font-black text-black uppercase tracking-widest">Invoices & Payments Trend</h3>
                    <select className="text-sm border-none bg-gray-50 rounded-lg px-3 py-1 focus:ring-1 focus:ring-green-500 text-gray-600 outline-hidden cursor-pointer">
                        <option>Last 6 Months</option>
                        <option>This Year</option>
                    </select>
                </div>
                <div className="h-[200px] sm:h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={lineData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                            <defs>
                                <linearGradient id="colorReceived" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#6bbd45" stopOpacity={0.2} />
                                    <stop offset="95%" stopColor="#6bbd45" stopOpacity={0} />
                                </linearGradient>
                                <linearGradient id="colorRaised" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#94a3b8" stopOpacity={0.2} />
                                    <stop offset="95%" stopColor="#94a3b8" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: "#9ca3af", fontSize: 12 }} dy={10} />
                            <YAxis axisLine={false} tickLine={false} tick={{ fill: "#9ca3af", fontSize: 12 }} />
                            <Tooltip
                                contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)" }}
                                cursor={{ stroke: "#e5e7eb", strokeWidth: 1 }}
                            />
                            <CartesianGrid vertical={false} stroke="#f3f4f6" />
                            <Area type="monotone" dataKey="raised" stroke="#94a3b8" strokeWidth={2} fillOpacity={1} fill="url(#colorRaised)" name="Invoices Raised" />
                            <Area type="monotone" dataKey="received" stroke="#6bbd45" strokeWidth={3} fillOpacity={1} fill="url(#colorReceived)" name="Payment Received" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* 2. Status Donut Chart & Payment Breakdown */}
            <div className="lg:col-span-1 space-y-6">
                {/* Status Breakdown */}
                <div className="bg-green-100 p-6 rounded-3xl border border-black shadow-sm flex flex-col h-[300px]">
                    <h3 className="text-sm font-black text-black uppercase tracking-widest mb-4">Invoice Status</h3>
                    <div className="flex-1 relative">
                        <ResponsiveContainer width="100%" height="100%">

                            <PieChart>
                                <Pie
                                    data={pieData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {pieData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip />
                                <Legend verticalAlign="bottom" height={36} iconType="circle" />
                                {/* Center Text */}
                                <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle">
                                    <tspan x="50%" dy="-0.5em" fontSize="20" fontWeight="bold" fill="#374151">
                                        {invoices.length || 17}
                                    </tspan>
                                    <tspan x="50%" dy="1.5em" fontSize="12" fill="#9ca3af">
                                        Total
                                    </tspan>
                                </text>
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Payment Method Breakdown (Mini List) */}
                <div className="bg-green-100 p-6 rounded-3xl border border-black shadow-sm">
                    <h3 className="text-sm font-black text-black uppercase tracking-widest mb-6">Payment Methods</h3>
                    <div className="space-y-4">
                        {paymentMethods.map((pm, i) => (
                            <div key={i} className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-lg ${pm.color}`}>
                                        <pm.icon size={16} />
                                    </div>
                                    <span className="text-sm font-medium text-gray-700">{pm.method}</span>
                                </div>
                                <div className="text-right">
                                    <span className="block text-sm  text-gray-800">{pm.percentage}%</span>
                                    <div className="w-16 h-1.5 bg-gray-100 rounded-full mt-1 overflow-hidden">
                                        <div className="h-full bg-green-500 rounded-full" style={{ width: `${pm.percentage}%` }}></div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default InvoiceAnalytics;
