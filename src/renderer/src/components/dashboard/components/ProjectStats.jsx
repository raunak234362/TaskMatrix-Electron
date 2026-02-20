import { useNavigate } from 'react-router-dom'
import { Files, Activity, CheckCircle2, PauseCircle } from 'lucide-react'

const ProjectStats = ({ stats, onCardClick }) => {
  const navigate = useNavigate()
console.log(stats);

  const projectCards = [
    {
      label: 'Total Projects',
      value: stats.totalProjects,
      icon: Files,
      color: 'indigo',
      clickable: true,
      action: () => navigate('/dashboard/projects')
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
      bg: 'bg-slate-50',
      hoverBg: 'hover:bg-slate-100',
      iconBg: 'bg-slate-600',
      text: 'text-slate-900'
    },
    green: {
      bg: 'bg-green-50/10',
      hoverBg: 'hover:bg-green-100/20',
      iconBg: 'bg-green-600',
      text: 'text-green-700'
    },
    blue: {
      bg: 'bg-blue-50',
      hoverBg: 'hover:bg-blue-100',
      iconBg: 'bg-blue-600',
      text: 'text-blue-900'
    },
    orange: {
      bg: 'bg-orange-50',
      hoverBg: 'hover:bg-orange-100',
      iconBg: 'bg-orange-600',
      text: 'text-orange-900'
    }
  }
  return (
    <div className="bg-white p-4 lg:p-6 rounded-3xl border border-gray-200  transition-all duration-500">
      <div className="flex items-center justify-between mb-6 px-1">
        <h2 className="text-base font-black text-primary uppercase tracking-[0.15em]">Project Overview</h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {projectCards.map((card) => {
          const colors = colorClasses[card.color]
          const isClickable = card.clickable

          return (
            <div
              key={card.label}
              onClick={() => {
                if (card.action) {
                  card.action()
                } else if (isClickable && card.status) {
                  onCardClick(card.status)
                }
              }}
              className={`
                flex items-center justify-between p-4 rounded-2xl border border-gray-200 transition-all duration-300
                ${isClickable
                  ? 'hover:bg-white/80 hover:border-primary/20 cursor-pointer hover:shadow-lg hover:-translate-y-0.5'
                  : 'bg-green-50/20'}
              `}
            >
              <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-xl ${colors.iconBg} text-white shadow-md shrink-0`}>
                  <card.icon size={20} />
                </div>
                <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">{card.label}</span>
              </div>

              <span className={`text-3xl font-black tracking-tight ${colors.text}`}>{card.value}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default ProjectStats
