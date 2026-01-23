import { Files, Activity, CheckCircle2, PauseCircle } from 'lucide-react'

const ProjectStats = ({ stats, onCardClick }) => {
  const projectCards = [
    {
      label: 'Total Projects',
      value: stats.totalProjects,
      icon: Files,
      color: 'indigo',
      clickable: false
    },
    {
      label: 'Active',
      value: stats.activeProjects,
      icon: Activity,
      color: 'green',
      status: 'ACTIVE',
      clickable: true
    },
    {
      label: 'Completed',
      value: stats.completedProjects,
      icon: CheckCircle2,
      color: 'blue',
      status: 'COMPLETED',
      clickable: true
    },
    {
      label: 'On Hold',
      value: stats.onHoldProjects,
      icon: PauseCircle,
      color: 'orange',
      status: 'ON_HOLD',
      clickable: true
    }
  ]

  const colorClasses = {
    indigo: {
      bg: 'bg-indigo-50',
      hoverBg: 'hover:bg-indigo-100',
      iconBg: 'bg-indigo-500',
      text: 'text-indigo-700'
    },
    green: {
      bg: 'bg-green-50',
      hoverBg: 'hover:bg-green-100',
      iconBg: 'bg-green-500',
      text: 'text-green-700'
    },
    blue: {
      bg: 'bg-blue-50',
      hoverBg: 'hover:bg-blue-100',
      iconBg: 'bg-blue-500',
      text: 'text-blue-700'
    },
    orange: {
      bg: 'bg-orange-50',
      hoverBg: 'hover:bg-orange-100',
      iconBg: 'bg-orange-500',
      text: 'text-orange-700'
    }
  }

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
      <h2 className="text-lg font-semibold text-gray-800 mb-6">Project Stats</h2>

      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-2 gap-10">
        {projectCards.map((card) => {
          const colors = colorClasses[card.color]
          const isClickable = card.clickable

          return (
            <div
              key={card.label}
              onClick={() => isClickable && card.status && onCardClick(card.status)}
              className={`
                flex items-center gap-4 p-4 rounded-xl border 
                ${colors.bg} ${isClickable ? colors.hoverBg + ' cursor-pointer' : ''} 
                ${isClickable ? 'transition-all duration-200 hover:shadow-md' : ''}
                border-gray-200
              `}
            >
              <div className={`p-3 rounded-lg ${colors.iconBg} text-white shrink-0`}>
                <card.icon size={24} />
              </div>

              <div className="flex flex-col">
                <span className="text-sm font-medium text-gray-600">{card.label}</span>
                <span className={`text-2xl font-bold mt-1 ${colors.text}`}>{card.value}</span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default ProjectStats
