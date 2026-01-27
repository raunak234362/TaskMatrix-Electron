import { useState } from 'react'
import { ChevronLeft, ChevronRight, Calendar  } from 'lucide-react'

const ProjectCalendar = ({ projects, tasks }) => {
  const [currentDate, setCurrentDate] = useState(new Date())

  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate()
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay()

  const monthName = currentDate.toLocaleString('default', { month: 'long' })
  const year = currentDate.getFullYear()

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))
  }

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))
  }

  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1)
  const padding = Array.from({ length: firstDayOfMonth }, () => null)

  const getProjectsForDay = (day) => {
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day)
    date.setHours(0, 0, 0, 0)

    const activeProjectIds = new Set()

    tasks.forEach((task) => {
      if (!task.start_date || !task.due_date || !task.project_id) return

      const taskStart = new Date(task.start_date)
      const taskEnd = new Date(task.due_date)
      taskStart.setHours(0, 0, 0, 0)
      taskEnd.setHours(0, 0, 0, 0)

      if (date >= taskStart && date <= taskEnd) {
        activeProjectIds.add(task.project_id)
      }
    })

    return projects.filter((project) => activeProjectIds.has(project.id))
  }

  return (
    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm mb-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-green-50 text-green-600 rounded-lg">
            <CalendarIcon size={20} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-700">Project Timeline Calendar</h3>
            <p className="text-xs text-gray-700">Visualizing active projects across the month</p>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-2 py-1">
          <button
            onClick={handlePrevMonth}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronLeft size={18} className="text-gray-700" />
          </button>
          <span className="text-xs font-bold text-gray-700 min-w-[100px] text-center">
            {monthName} {year}
          </span>
          <button
            onClick={handleNextMonth}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronRight size={18} className="text-gray-700" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-px bg-gray-100 border border-gray-100 rounded-xl overflow-hidden">
        {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map((day) => (
          <div
            key={day}
            className="bg-gray-50 py-2 text-center text-[10px] font-bold text-gray-400"
          >
            {day}
          </div>
        ))}
        {[...padding, ...days].map((day, idx) => {
          const dayProjects = day ? getProjectsForDay(day) : 
          return (
            <div
              key={idx}
              className={`bg-white min-h-[100px] p-2 transition-colors hover:bg-gray-50/50 ${
                day === null ? 'bg-gray-50/30' : ''
              }`}
            >
              {day && (
                <>
                  <span className="text-xs font-bold text-gray-400">{day}</span>
                  <div className="mt-1 space-y-1">
                    {dayProjects.slice(0, 3).map((project) => (
                      <div
                        key={project.id}
                        className="px-1.5 py-0.5 bg-green-50 text-green-600 text-[9px] font-bold rounded border border-green-100 truncate"
                        title={project.name}
                      >
                        {project.name}
                      </div>
                    ))}
                    {dayProjects.length > 3 && (
                      <div className="text-[8px] font-bold text-gray-400 pl-1">
                        +{dayProjects.length - 3} more
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default ProjectCalendar
