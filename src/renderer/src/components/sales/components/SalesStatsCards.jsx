import React from "react";
import { DollarSign, FileText, Target, Trophy } from "lucide-react";
import { motion } from "framer-motion";

const SalesStatsCards = ({ stats }) => {
    // Unified Green Theme Palette
    // Primary: green-600 (#16a34a)
    // Light: green-50 (#f0fdf4)
    // Accents: green-100, green-200

    const cards = [
        {
            title: "Total RFQs Received",
            value: stats.totalRfqs,
            change: "+12% from last period",
            icon: FileText,
            // Keeping distinct icons but unifying color feel
        },
        {
            title: "Projects Awarded",
            value: stats.projectsAwarded,
            change: "+8% from last period",
            icon: Trophy,
        },
        {
            title: "Win Rate",
            value: `${stats.winRate}%`,
            change: "+2.3% from last period",
            icon: Target,
        },
        {
            title: "Total Sales Value",
            value: `$${stats.totalSalesValue.toLocaleString()}`,
            change: "+15% from last period",
            icon: DollarSign,
        },
    ];

    const formatValue = (val) => val;

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
                        className="bg-white p-6 rounded-[2rem] border border-green-100/50 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(22,163,74,0.1)] transition-all duration-300 relative overflow-hidden group"
                    >
                        {/* Decorative Background Blob */}
                        <div className="absolute -right-6 -top-6 w-24 h-24 bg-green-50 rounded-full opacity-50 group-hover:scale-110 transition-transform duration-500" />

                        <div className="flex justify-between items-start mb-6 relative z-10">
                            <div>
                                <p className="text-gray-500 text-sm font-semibold mb-2 tracking-wide">{card.title}</p>
                                <h3 className="text-3xl font-extrabold text-gray-800 tracking-tight">{formatValue(card.value)}</h3>
                            </div>
                            <div className="p-3.5 rounded-2xl bg-green-50 text-green-600 shadow-sm group-hover:bg-green-600 group-hover:text-white transition-colors duration-300">
                                <Icon size={24} />
                            </div>
                        </div>

                        <div className="flex items-center gap-2 relative z-10">
                            <div className="flex items-center gap-1 bg-green-100/80 px-2.5 py-1 rounded-full">
                                <span className="text-green-700 text-xs font-bold">
                                    {card.change.split(' ')[0]}
                                </span>
                            </div>
                            <span className="text-gray-400 text-xs font-medium">from last period</span>
                        </div>
                    </motion.div>
                );
            })}
        </div>
    );
};

export default SalesStatsCards;
