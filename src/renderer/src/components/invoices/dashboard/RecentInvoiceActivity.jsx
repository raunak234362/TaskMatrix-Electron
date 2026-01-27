import React from "react";
import { CheckCircle, Clock, FilePlus } from "lucide-react";


const RecentInvoiceActivity = ({ invoices }) => {
    // Derive activity from invoices
    const activities = React.useMemo(() => {
        return [...invoices]
            .sort((a, b) => {
                const dateA = new Date(a.updatedAt || a.createdAt || a.invoiceDate).getTime();
                const dateB = new Date(b.updatedAt || b.createdAt || b.invoiceDate).getTime();
                return dateB - dateA;
            })
            .slice(0, 5) // Show top 5 recent activities
            .map(inv => {
                const isPaid = inv.paymentStatus === true || inv.paymentStatus === "Paid";
                const amount = parseFloat(inv.totalInvoiceValue);
                const formattedAmount = isNaN(amount) ? "" : new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount);
                const date = new Date(inv.updatedAt || inv.createdAt || inv.invoiceDate);

                // Determine type based on status logic
                let type = "raised";
                let message = `Invoice #${inv.invoiceNumber} raised for ${inv.customerName}`;
                let icon = FilePlus;
                let color = "bg-blue-100 text-blue-600";

                if (isPaid) {
                    type = 'received';
                    message = `Payment received for Invoice #${inv.invoiceNumber}`;
                    icon = CheckCircle;
                    color = "bg-green-100 text-green-600";
                } else if (inv.dueDate && new Date(inv.dueDate) < new Date()) {
                    type = 'overdue';
                    message = `Invoice #${inv.invoiceNumber} is overdue`;
                    icon = Clock;
                    color = "bg-red-100 text-red-600";
                }

                // Format "Time Ago"
                const diffInHours = Math.floor((new Date().getTime() - date.getTime()) / (1000 * 60 * 60));
                let timeStr = "";
                if (diffInHours < 24) timeStr = `${Math.max(1, diffInHours)} hours ago`;
                else timeStr = `${Math.floor(diffInHours / 24)} days ago`;

                return {
                    type,
                    message,
                    time: timeStr,
                    amount: formattedAmount,
                    icon,
                    color
                };
            });
    }, [invoices]);

    return (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-full">
            <h3 className="text-lg font-bold text-gray-800 mb-6">Recent Activity</h3>
            <div className="space-y-6">
                {activities.length === 0 ? (
                    <p className="text-gray-400 text-sm text-center py-8">No recent activity</p>
                ) : (
                    activities.map((activity, index) => (
                        <div key={index} className="flex gap-4">
                            <div className="shrink-0 relative">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${activity.color} z-10 relative`}>
                                    <activity.icon size={18} />
                                </div>
                                {index !== activities.length - 1 && (
                                    <div className="absolute top-10 left-1/2 -translate-x-1/2 w-0.5 h-8 bg-gray-100 z-0"></div>
                                )}
                            </div>
                            <div className="flex-1">
                                <p className="text-sm font-medium text-gray-800">{activity.message}</p>
                                <div className="flex items-center justify-between mt-1">
                                    <span className="text-xs text-gray-400">{activity.time}</span>
                                    {activity.amount && (
                                        <span className="text-xs font-bold text-gray-700">{activity.amount}</span>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default RecentInvoiceActivity;
