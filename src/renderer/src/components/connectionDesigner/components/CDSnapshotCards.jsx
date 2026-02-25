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
            topLabel: `${stats.totalCountries} COUNTRIES`,
            bottomLabel: `${stats.totalStates} OPERATIONAL STATES`,
            icon: Globe,
            color: "blue",
            type: "double"
        },
        {
            label: "TOTAL POC",
            value: stats.totalEngineers, // Mapping workforce to POC as per image context or placeholder
            icon: HardHat,
            color: "indigo",
            type: "simple"
        }
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {cards.map((card, index) => (
                <div key={index} className="bg-white p-5 rounded-[2rem] border border-gray-100 flex items-center justify-between shadow-sm group hover:shadow-md transition-all">
                    <div className={`w-14 h-14 rounded-2xl bg-${card.color}-50 text-${card.color}-600 flex items-center justify-center shrink-0 transition-transform group-hover:scale-105`}>
                        <card.icon size={24} strokeWidth={2} />
                    </div>

                    <div className="text-right">
                        {card.type === "simple" ? (
                            <>
                                <h3 className="text-2xl font-black text-gray-900 leading-none mb-1">{card.value}</h3>
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{card.label}</p>
                            </>
                        ) : (
                            <>
                                <h3 className="text-lg font-black text-gray-900 leading-none mb-1 uppercase">{card.topLabel}</h3>
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{card.bottomLabel}</p>
                            </>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
};

export default CDSnapshotCards;
