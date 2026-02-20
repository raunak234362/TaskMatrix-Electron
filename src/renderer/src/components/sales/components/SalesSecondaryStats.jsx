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
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-5">
            {items.map((item, index) => (
                <motion.div
                    key={index}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2 + index * 0.05 }}
                    className="bg-white py-6 px-3 rounded-[2rem] border border-gray-100 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.02)] flex flex-col items-center justify-center text-center hover:shadow-[0_8px_30px_-8px_rgba(0,0,0,0.06)] transition-all duration-500 group cursor-default border-b-2 hover:border-b-green-500"
                >
                    <span className="text-2xl font-black text-gray-900 mb-1 group-hover:scale-110 transition-transform duration-500">{item.value}</span>
                    <span className="text-gray-400 text-[10px] font-black tracking-[0.2em] uppercase leading-tight">{item.label}</span>
                </motion.div>
            ))}
        </div>
    );
};

export default SalesSecondaryStats;
