import React from "react";
import { Users, Globe, HardHat, FileText } from "lucide-react";

const CDSnapshotCards = ({ stats }) => {
    const cards = [
        {
            label: "REGISTERED DESIGNERS",
            value: stats.totalCDs,
            icon: Users,
            color: "green",
            type: "simple"
        },
        {
            label: "COUNTRIES",
            value: stats.totalCountries,
            icon: Globe,
            color: "green",
            type: "simple"
        },
        {
            label: "OPERATIONAL STATES",
            value: stats.totalStates,
            icon: HardHat,
            color: "green",
            type: "simple"
        }
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {cards.map((card, index) => {
                const CardIcon = card.icon;
                return (
                    <div 
                        key={index} 
                        className="bg-white py-3 px-4 rounded-none border border-black border-l-[6px] border-l-green-600 flex items-center justify-between shadow-sm hover:bg-gray-50/50 transition-all"
                    >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                            <div className="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center text-black shrink-0 shadow-sm">
                                <CardIcon size={18} strokeWidth={2} />
                            </div>
                            <p className="text-sm font-bold text-black uppercase tracking-wider truncate">
                                {card.label}
                            </p>
                        </div>
                        <div className="flex items-baseline gap-1 shrink-0 ml-4">
                            <h3 className="text-xl sm:text-2xl font-bold text-black tracking-tight">
                                {card.value}
                            </h3>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default CDSnapshotCards;
