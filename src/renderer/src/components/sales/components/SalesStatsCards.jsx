import React from "react";
import { DollarSign, FileText, Target, Trophy } from "lucide-react";
import { motion } from "framer-motion";

const SalesStatsCards = ({ data }) => {
    const cards = [
        {
            title: "Total RFQs",
            value: data.totalRFQs || 0,
            icon: FileText,
            bgColor: "bg-green-50/60",
            iconBg: "bg-green-100",
            textColor: "text-green-700"
        },
        {
            title: "In Pipeline",
            value: data.inPipelineRFQs || 0,
            icon: Target,
            bgColor: "bg-blue-50/60",
            iconBg: "bg-blue-100",
            textColor: "text-blue-700"
        },
        {
            title: "Win Rate",
            value: `${data.winRate || 0}%`,
            icon: Trophy,
            bgColor: "bg-indigo-50/60",
            iconBg: "bg-indigo-100",
            textColor: "text-indigo-700"
        },
        {
            title: "Pipeline Value",
            value: `$${(data.totalBidPrice || 0).toLocaleString()}`,
            icon: DollarSign,
            bgColor: "bg-amber-50/60",
            iconBg: "bg-amber-100",
            textColor: "text-amber-700"
        },
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {cards.map((card, index) => {
                const Icon = card.icon;
                return (
                    <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className={`${card.bgColor} p-6 rounded-2xl border border-gray-300 shadow-sm hover:shadow-md transition-all cursor-pointer hover:-translate-y-1 group relative overflow-hidden`}
                    >
                        <div className="flex justify-between items-start relative z-10">
                            <div>
                                <p className="text-gray-500 text-[10px] font-black uppercase tracking-widest mb-1">{card.title}</p>
                                <h3 className={`text-3xl font-black ${card.textColor} tracking-tighter`}>{card.value}</h3>
                            </div>
                            <div className={`p-3 rounded-xl ${card.iconBg} border border-gray-200 shadow-sm transition-transform group-hover:scale-110`}>
                                <Icon size={24} className={card.textColor} strokeWidth={2.5} />
                            </div>
                        </div>
                    </motion.div>
                );
            })}
        </div>
    );
};

export default SalesStatsCards;
