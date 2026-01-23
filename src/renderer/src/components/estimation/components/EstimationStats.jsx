/* eslint-disable react/prop-types */
import React from "react";
import { CopyPlus, Trophy, Clock } from "lucide-react";

const EstimationStats = ({ stats }) => {
  const cards = [
    {
      label: 'Total Estimated Project',
      value: stats.totalEstimated,
      icon: CopyPlus,
      color: 'blue'
    },
    {
      label: 'Total Awarded Project',
      value: stats.totalAwarded,
      icon: Trophy,
      color: 'green'
    },
    {
      label: 'Total Number of hours Worked',
      value: stats.totalHours,
      icon: Clock,
      color: 'purple'
    }
  ]

  const colorClasses = {
    blue: {
      bg: 'bg-blue-50',
      iconBg: 'bg-blue-500',
      text: 'text-blue-700'
    },
    green: {
      bg: 'bg-green-50',
      iconBg: 'bg-green-500',
      text: 'text-green-700'
    },
    purple: {
      bg: 'bg-purple-50',
      iconBg: 'bg-purple-500',
      text: 'text-purple-700'
    }
  }

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-full">
      <h2 className="text-lg font-semibold text-gray-800 mb-6">Estimation Stats</h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {cards.map((card) => {
          const colors = colorClasses[card.color]

          return (
            <div
              key={card.label}
              className={`
                flex items-center gap-4 p-4 rounded-xl border 
                ${colors.bg} border-gray-200
              `}
            >
              <div className={`p-3 rounded-lg ${colors.iconBg} text-white shrink-0`}>
                <card.icon size={24} />
              </div>

                            <div className="flex flex-col">
                                <span className="text-sm font-medium text-gray-600">
                                    {card.label}
                                </span>
                                <span className={`text-2xl font-bold mt-1 ${colors.text}`}>
                                    {card.value}
                                </span>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default EstimationStats
