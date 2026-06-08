import { CopyPlus, Trophy, Clock } from 'lucide-react'

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
    <div className="w-full h-full">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
        {cards.map((card) => {
          return (
            <div
              key={card.label}
              className="flex items-center justify-between p-6 rounded-lg border border-black shadow-sm transition-all hover:shadow-md bg-white"
            >
              <div className="flex items-center gap-5">
                <div className="p-3.5 rounded-lg bg-gray-100 text-green-500 shrink-0 shadow-sm">
                  <card.icon size={32} className="stroke-[1.5]" />
                </div>
                <span className="text-lg font-semibold text-black uppercase tracking-normal leading-tight">{card.label}</span>
              </div>
              <span className="text-3xl font-semibold text-black tracking-tight">{card.value}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default EstimationStats
