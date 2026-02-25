import React from "react";
import { motion } from "framer-motion";

const SalesSecondaryStats = ({ data, activeProjects, totalProjects, completedProjects }) => {
    const items = [
        { label: "Total Projects", value: totalProjects || 0 },
        { label: "Active Projects", value: activeProjects || 0 },
        { label: "Completed", value: completedProjects || 0 },
        { label: "In Pipeline", value: data.inPipelineRFQs || 0 },
        { label: "Quoted", value: data.quotedRFQs || 0 },
        { label: "Conversion Rate", value: `${data.projectConversionRate || 0}%` },
        { label: "Total Clients", value: data.totalClients || 0 },
        { label: "Pending Invoices", value: data.invoiceAnalytics?.pendingInvoices || 0 },
    ];

    return (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
            {items.map((item, index) => (
                <motion.div
                    key={index}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2 + index * 0.05 }}
                    className="bg-white py-6 px-4 rounded-xl border border-gray-200 border-l-4 border-l-green-600 shadow-sm flex flex-col items-center justify-center text-center hover:shadow-md transition-all duration-500 group"
                >
                    <span className="text-xl font-black text-black mb-1">{item.value}</span>
                    <span className="text-black/40 text-[9px] font-black tracking-widest uppercase leading-none">{item.label}</span>
                </motion.div>
            ))}
        </div>
    );
};

export default SalesSecondaryStats;
