import { useNavigate } from 'react-router-dom'
import { Files, Activity, CheckCircle2, PauseCircle } from 'lucide-react'

const ProjectStats = ({ stats, onCardClick }) => {
  const navigate = useNavigate()

  const projectCards = [
    {
      label: 'Total Projects',
      value: stats.totalProjects,
      icon: Files,
      clickable: true,
      action: () => navigate('/dashboard/projects')
    },
    {
      label: 'Active',
      value: stats.activeProjects,
      icon: Activity,
      status: 'ACTIVE',
      clickable: true
    },
    {
      label: 'Completed',
      value: stats.completedProjects,
      icon: CheckCircle2,
      status: 'COMPLETED',
      clickable: true
    },
    {
      label: 'On Hold',
      value: stats.onHoldProjects,
      icon: PauseCircle,
      status: 'ON_HOLD',
      clickable: true
    }
  ]

  return (
    <div className="transition-all duration-500 h-full bg-green-50 p-5 rounded-lg border border-green-300 shadow-lg">
      <div className="flex items-center justify-between mb-5 px-1">
        <h2 className="text-xl font-semibold text-black uppercase tracking-normal flex items-center gap-2">
          
          Project Overview
        </h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {projectCards.map((card) => {
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
              className="flex items-center justify-between p-4 rounded-lg border border-black border-l-5 border-l-[#48b614] bg-white hover:bg-gray-50 transition-all duration-300 cursor-pointer group hover:shadow-md hover:-translate-y-0.5"
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="p-2.5 rounded-full bg-white border border-gray-100 text-black shadow-sm shrink-0 transition-all group-hover:bg-green-100">
                  <card.icon size={20} strokeWidth={2.5} />
                </div>
                <span className="text-sm font-bold text-black uppercase tracking-wide leading-none truncate">
                  {card.label}
                </span>
              </div>

              <span className="text-3xl font-bold tracking-tight text-black shrink-0 ml-2">
                {card.value}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default ProjectStats
