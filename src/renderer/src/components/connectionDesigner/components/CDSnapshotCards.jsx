import React from 'react'
import { Users, Globe, HardHat, FileText } from 'lucide-react'

const CDSnapshotCards = ({ stats }) => {
    const cards = [
        {
            title: 'PARTNER NETWORK',
            value: stats.totalCDs,
            label: 'REGISTERED DESIGNERS',
            icon: Users,
            color: 'green',
            bg: 'bg-green-50/30',
            iconBg: 'bg-green-100/50',
            textColor: 'text-green-700'
        },
        {
            title: 'GEOGRAPHIC REACH',
            value: `${stats.totalCountries} Countries`,
            label: `${stats.totalStates} OPERATIONAL STATES`,
            icon: Globe,
            color: 'blue',
            bg: 'bg-blue-50/30',
            iconBg: 'bg-blue-100/50',
            textColor: 'text-blue-700'
        },
        {
            title: 'ENGINEERING POOL',
            value: stats.totalEngineers,
            label: 'TOTAL SKILLED WORKFORCE',
            trend: `Avg ${stats.totalCDs > 0 ? (stats.totalEngineers / stats.totalCDs).toFixed(1) : 0}/Designer`,
            icon: HardHat,
            color: 'purple',
            bg: 'bg-purple-50/30',
            iconBg: 'bg-purple-100/50',
            textColor: 'text-purple-700'
        },
        {
            title: 'LIVE QUOTATIONS',
            value: stats.activeRFQs,
            label: 'ACTIVE ENGAGEMENTS',
            trend: 'Response rate 0%',
            icon: FileText,
            color: 'orange',
            bg: 'bg-orange-50/30',
            iconBg: 'bg-orange-100/50',
            textColor: 'text-orange-700'
        }
    ]

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
            {cards.map((card, index) => (
                <div
                    key={index}
                    className={`${card.bg} p-6 rounded-2xl border border-gray-100 shadow-sm relative overflow-hidden group hover:shadow-md transition-all duration-300 flex items-center min-h-[120px]`}
                >
                    <div className="flex items-center justify-between w-full relative z-10">
                        {/* Left: Numbers */}
                        <div className="flex flex-col">
                            <h3 className="text-3xl sm:text-4xl font-black text-gray-900 tracking-tighter leading-none">
                                {card.value}
                            </h3>
                        </div>

                        {/* Right: Text and Icon */}
                        <div className="flex items-center gap-4">
                            <div className="flex flex-col items-end text-right">
                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1">
                                    {card.title}
                                </span>
                                <p className="text-[11px] font-bold text-gray-600 uppercase tracking-widest leading-none">
                                    {card.label}
                                </p>
                                {card.trend && (
                                    <span className={`text-[9px] font-bold ${card.textColor} mt-2 px-2 py-0.5 rounded-full bg-white/50 border border-current/10 whitespace-nowrap`}>
                                        {card.trend}
                                    </span>
                                )}
                            </div>
                            <div className={`${card.iconBg} p-3 rounded-2xl text-gray-600 shadow-xs border border-white group-hover:bg-white group-hover:shadow-md group-hover:scale-110 transition-all duration-300 shrink-0`}>
                                <card.icon size={20} strokeWidth={2.5} />
                            </div>
                        </div>
                    </div>

                    {/* Subtle Background Pattern or Accent */}
                    <div className={`absolute -right-4 -bottom-4 w-24 h-24 ${card.iconBg} rounded-full opacity-20 group-hover:opacity-40 transition-opacity blur-2xl`}></div>
                </div>
            ))}
        </div>
    )
}

export default CDSnapshotCards
