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
            color: "green",
            type: "double"
        },
        {
            label: "TOTAL POC",
            value: stats.totalEngineers, // Mapping workforce to POC as per image context or placeholder
            icon: HardHat,
            color: "green",
            type: "simple"
        }
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {cards.map((card, index) => (
                <div key={index} className="bg-green-50 p-5 rounded-2xl border border-black flex items-center justify-between shadow-sm group hover:shadow-md transition-all">
                    <div className={`w-14 h-14 rounded-2xl bg-${card.color}-50 text-${card.color}-600 flex items-center justify-center shrink-0 transition-transform group-hover:scale-105`}>
                        <card.icon size={24} strokeWidth={2} />
                    </div>
                    <div className="flex justify-between items-center w-full">

                        {/* LEFT → LABEL */}
                        <div>
                            {card.type === "simple" ? (
                                <p className="px-2 text-xl text-black font-semibold uppercase">
                                    {card.label}
                                </p>
                            ) : (
                                <>
                                    <p className="px-2 text-xl text-black font-semibold uppercase">
                                        {card.topLabel}
                                    </p>
                                    <p className="px-2 text-lg text-black uppercase">
                                        {card.bottomLabel}
                                    </p>
                                </>
                            )}
                        </div>

                        {/* RIGHT → NUMBER */}
                        {card.type === "simple" && (
                            <h3 className="text-2xl text-black">
                                {card.value}
                            </h3>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
};

export default CDSnapshotCards;
