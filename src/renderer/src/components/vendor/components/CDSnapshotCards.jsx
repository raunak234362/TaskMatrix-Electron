import React from "react";
import { Users, Globe, HardHat, FileText } from "lucide-react";

const CDSnapshotCards = ({ stats }) => {
    const cards = [
        {
            label: "Total Connection Designers",
            value: stats.totalCDs,
            subText: "Active Registry",
            icon: Users,
            color: "emerald",
        },
        {
            label: "Geographic Coverage",
            value: `${stats.totalCountries} Countries`,
            subText: `${stats.totalStates} States`,
            icon: Globe,
            color: "blue",
        },
        {
            label: "Total Engineers",
            value: stats.totalEngineers,
            subText: "Onboarded Professionals",
            icon: HardHat,
            color: "amber",
        },
        {
            label: "Active RFQs",
            value: stats.activeRFQs,
            subText: "Ongoing Quotations",
            icon: FileText,
            color: "purple",
        }
    ];

    const colorMap = {
        emerald: "bg-emerald-50 text-emerald-600",
        blue: "bg-blue-50 text-blue-600",
        amber: "bg-amber-50 text-amber-600",
        purple: "bg-purple-50 text-purple-600"
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {cards.map((card, index) => {
                const Icon = card.icon;
                return (
                    <div key={index} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between relative group hover:border-emerald-100 transition-all">
                        <div className="min-w-0">
                            <p className="text-[10px] font-bold text-gray-400 mb-1 uppercase tracking-widest truncate">{card.label}</p>
                            <h3 className="text-2xl font-bold text-gray-800 truncate">{card.value}</h3>
                            {card.subText && (
                                <p className="text-[10px] text-gray-400 mt-1 truncate font-medium">{card.subText}</p>
                            )}
                        </div>
                        <div className={`p-4 rounded-2xl ${colorMap[card.color]} shrink-0`}>
                            <Icon size={24} strokeWidth={2.5} />
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default CDSnapshotCards;
