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
            {cards.map((card, index) => (
                <div key={index} className="bg-green-50 py-3 px-5 rounded-2xl border border-black flex items-center justify-between shadow-sm group hover:shadow-md transition-all">
                    <div className={`w-11 h-11 rounded-2xl bg-${card.color}-50 text-${card.color}-600 flex items-center justify-center shrink-0 transition-transform group-hover:scale-105`}>
                        <card.icon size={20} strokeWidth={2} />
                    </div>
                    <div className="flex justify-between items-center w-full">
                        {/* LEFT → LABEL */}
                        <div>
                            <p className="px-2 text-base font-semibold text-black uppercase tracking-normal">
                                {card.label}
                            </p>
                        </div>

                        {/* RIGHT → NUMBER */}
                        <h3 className="text-2xl font-semibold text-black">
                            {card.value}
                        </h3>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default CDSnapshotCards;
