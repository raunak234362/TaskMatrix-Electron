import React from "react";
import { DollarSign, FileText, Target, Trophy } from "lucide-react";
import { motion } from "framer-motion";

const SalesStatsCards = ({ data }) => {
    const cards = [
        {
            title: "Total RFQs Received",
            value: data.totalRFQs || 0,
            icon: FileText,
            change: "+12%"
        },
        {
            title: "Projects Awarded",
            value: data.awardedRFQs || 0,
            icon: Trophy,
            change: "+8%"
        },
        {
            title: "Win Rate",
            value: `${data.winRate || 0}%`,
            icon: Target,
            change: "+2.3%"
        },
        {
            title: "Total Sales Value",
            value: `$${(data.totalBidPrice || 0).toLocaleString()}`,
            icon: DollarSign,
            change: "+15%"
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
                        className="bg-white p-7 rounded-[2.5rem] border border-gray-100 shadow-[0_4px_25px_-5px_rgba(0,0,0,0.03)] hover:shadow-[0_10px_35px_-8px_rgba(0,0,0,0.06)] transition-all duration-500 group relative overflow-hidden"
                    >
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <p className="text-[13px] font-black text-gray-400/80 uppercase tracking-[0.15em] mb-2">{card.title}</p>
                                <h3 className="text-4xl font-black text-gray-900 tracking-tighter leading-none">{card.value}</h3>
                            </div>
                            <div className="p-3.5 bg-gray-50/50 text-gray-400 rounded-[1.25rem] border border-gray-100 group-hover:bg-green-600 group-hover:text-white group-hover:border-green-600 group-hover:shadow-[0_8px_15px_-4px_rgba(22,163,74,0.3)] transition-all duration-500">
                                <Icon size={24} strokeWidth={2.5} />
                            </div>
                        </div>

                        <div className="flex items-center gap-3 mt-auto">
                            <div className="bg-green-100/40 text-green-700 px-3 py-1.5 rounded-xl text-[10px] font-black tracking-tight flex items-center gap-1.5 border border-green-100/50">
                                {card.change} <span className="text-[9px] opacity-70">from last period</span>
                            </div>
                            <span className="text-[9px] font-black text-gray-300 uppercase tracking-[0.2em]">From last period</span>
                        </div>
                    </motion.div>
                );
            })}
        </div>
    );
};

export default SalesStatsCards;
