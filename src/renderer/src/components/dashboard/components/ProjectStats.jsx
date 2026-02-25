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
    <div className="p-0 transition-all duration-500 h-full border border-gray-200 bg-white p-4 rounded-lg">
      <div className="flex items-center justify-between mb-6 px-1">
        <h2 className="text-base font-black text-black uppercase tracking-[0.15em] flex items-center gap-2">
          <Files className="w-5 h-5 text-green-600" />
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
              className="flex items-center justify-between p-4 rounded-none border border-gray-200 border-l-4 border-l-green-600 bg-white hover:bg-gray-50 transition-all duration-300 cursor-pointer group hover:shadow-md hover:-translate-y-0.5"
            >
              <div className="flex items-center gap-4">
                <div className="p-2.5 rounded-none bg-white border border-gray-100 text-black shadow-sm shrink-0 transition-all group-hover:bg-green-600 group-hover:text-white">
                  <card.icon size={20} strokeWidth={3} />
                </div>
                <span className="text-[13px] font-black text-black uppercase tracking-widest leading-none">
                  {card.label}
                </span>
              </div>

              <span className="text-3xl font-black tracking-tight text-black">
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
