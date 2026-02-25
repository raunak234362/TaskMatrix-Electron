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
                        className="bg-white p-6 rounded-3xl border border-gray-200 border-l-4 border-l-green-600 shadow-sm hover:shadow-md transition-all duration-500 group relative overflow-hidden"
                    >
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <p className="text-[11px] font-black text-black/40 uppercase tracking-widest mb-2">{card.title}</p>
                                <h3 className="text-3xl font-black text-black tracking-tighter leading-none">{card.value}</h3>
                            </div>
                            <div className="p-3 bg-white border border-gray-100 rounded-2xl text-black shadow-sm group-hover:bg-green-600 group-hover:text-white transition-all duration-500">
                                <Icon size={20} />
                            </div>
                        </div>

                        <div className="flex items-center gap-3 mt-auto">
                            <div className="bg-white text-black border border-black/10 px-3 py-1.5 rounded-xl text-[10px] font-black tracking-tight flex items-center gap-1.5 shadow-sm">
                                <span className="text-green-600">{card.change}</span>
                                <span className="text-black/40 uppercase text-[9px]">Growth</span>
                            </div>
                        </div>
                    </motion.div>
                );
            })}
        </div>
    );
};

export default SalesStatsCards;
