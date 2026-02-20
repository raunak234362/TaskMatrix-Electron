import React from "react";
import { motion } from "framer-motion";

const SalesSecondaryStats = ({ data, activeProjects, completedProjects }) => {
    const rfqMetrics = [
        { label: "In Pipeline", value: data.inPipelineRFQs || 0 },
        { label: "Quoted", value: data.quotedRFQs || 0 },
        { label: "Responded", value: data.respondedRFQs || 0 },
        { label: "Rejected", value: data.rejectedRFQs || 0 },
        { label: "Active Project", value: activeProjects || 0 },
        { label: "Completed", value: completedProjects || 0 },
    ];

    const conversionMetrics = [
        { label: "Project Conv.", value: `${data.projectConversionRate || 0}%` },
        { label: "Quote to Award", value: `${data.quoteToAwardRate || 0}%` },
        { label: "Response Rate", value: `${data.responseRate || 0}%` },
        { label: "Avg Bid Price", value: `$${(data.avgBidPrice || 0).toLocaleString()}` },
        { label: "Clients", value: data.totalClients || 0 },
        { label: "Avg Invoice Val", value: `$${(data.avgInvoiceValue || 0).toLocaleString()}` },
    ];

    const invoiceAnalytics = [
        { label: "Total Invoiced", value: `$${(data.totalInvoicedValue || 0).toLocaleString()}` },
        { label: "Collected", value: `$${(data.collectedInvoiceValue || 0).toLocaleString()}` },
        { label: "Collection Rate", value: `${data.collectionRate || 0}%` },
        { label: "Pending Invoices", value: data.invoiceAnalytics?.pendingInvoices || 0 },
        { label: "Paid Invoices", value: data.invoiceAnalytics?.paidInvoices || 0 },
        { label: "Overdue", value: data.invoiceAnalytics?.overdueInvoices || 0 },
    ];

    const Section = ({ title, items, delayOffset = 0 }) => (
        <div className="space-y-4">
            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] pl-2">{title}</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
                {items.map((item, index) => (
                    <motion.div
                        key={index}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: delayOffset + index * 0.05 }}
                        className="bg-green-50/60 py-5 px-4 rounded-2xl border border-gray-300 shadow-sm flex flex-col items-center justify-center text-center hover:bg-white hover:shadow-md hover:border-green-500 transition-all duration-300 group cursor-default"
                    >
                        <span className="text-2xl font-black text-green-700/90 mb-1 group-hover:scale-110 transition-transform">{item.value}</span>
                        <span className="text-gray-500 text-[10px] font-black tracking-wider uppercase">{item.label}</span>
                    </motion.div>
                ))}
            </div>
        </div>
    );

    return (
        <div className="space-y-12 pb-10">
            <Section title="Pipeline & Projects" items={rfqMetrics} delayOffset={0.2} />
            <Section title="Performance & Conversion" items={conversionMetrics} delayOffset={0.4} />
            <Section title="Invoice Analytics" items={invoiceAnalytics} delayOffset={0.6} />
        </div>
    );
};

export default SalesSecondaryStats;
