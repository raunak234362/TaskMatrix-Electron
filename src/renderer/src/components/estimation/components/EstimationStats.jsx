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
    <div className="bg-white p-6 rounded-3xl border border-black shadow-sm h-full">
      <h2 className="text-xl font-black text-black uppercase tracking-tight mb-8">Estimation Stats</h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {cards.map((card) => {
          return (
            <div
              key={card.label}
              className="flex items-center gap-5 p-5 rounded-2xl border border-black  shadow-sm transition-all hover:shadow-md"
            >
              <div className="p-3.5 rounded-xl bg-green-200 text-black shrink-0 shadow-sm">
                <card.icon size={22} className="stroke-[2.5]" />
              </div>

              <div className="flex flex-col">
                <span className="text-[10px] font-black text-black/40 uppercase tracking-widest leading-none mb-1.5">{card.label}</span>
                <span className="text-2xl font-black text-black tracking-tight">{card.value}</span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default EstimationStats
