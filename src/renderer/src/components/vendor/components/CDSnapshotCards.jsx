import React from "react";
import { Users, Globe, HardHat, FileText } from "lucide-react";

}

const CDSnapshotCards = ({ stats }) => {
    const cards = [
        {
            label: "Total Connection Designers",
            value: stats.totalCDs,
            subText: "Active vs Inactive", // Placeholder for now
            icon,
            color: "green",
        },
        {
            label: "Geographic Coverage",
            value: `${stats.totalCountries} Countries`,
            subText: `${stats.totalStates} States`,
            icon,
            color: "blue",
        },
        {
            label: "Total Engineers",
            value: stats.totalEngineers,
            subText: "Avg engineers per CD", // Placeholder
            icon,
            color: "orange",
        },
        {
            label: "Active RFQs",
            value: stats.activeRFQs,
            subText: "Designers involved",
            icon,
            color: "purple",
        }
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
            {cards.map((card, index) => (
                <div key={index} className="bg-white p-4 sm:p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between relative overflow-hidden group">
                    <div className="min-w-0">
                        <p className="text-[10px] sm:text-xs font-semibold text-gray-400 mb-1 uppercase tracking-wider truncate">{card.label}</p>
                        <h3 className="text-xl sm:text-2xl  text-gray-800 truncate">{card.value}</h3>
                        {card.subText && (
                            <p className="text-[10px] sm:text-xs text-gray-400 mt-1 truncate">{card.subText}</p>
                        )}
                    </div>
                    <div className={`p-2.5 sm:p-3 rounded-xl sm:rounded-full bg-${card.color}-50 text-${card.color}-600 shrink-0`}>
                        <card.icon size={22} strokeWidth={2} />
                    </div>
                </div>
            ))}
        </div>
    );
};

export default CDSnapshotCards;
