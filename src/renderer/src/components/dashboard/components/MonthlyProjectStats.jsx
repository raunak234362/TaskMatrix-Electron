import { useMemo } from 'react'
import { Briefcase, Info, AlertCircle } from 'lucide-react'
import { motion } from 'framer-motion'

const MonthlyProjectStats = ({
  tasks,
  projects,
  selectedMonth,
  selectedYear,
  projectsByTeam,
  handleStatClick
}) => {
  const months = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December'
  ]

  const teamSequence = ['TEKLA', 'SDS/2', 'PEMB']

  const sortedTeams = useMemo(() => {
    if (!projectsByTeam) return []
    return Object.entries(projectsByTeam).sort(([, a], [, b]) => {
      const indexA = teamSequence.indexOf(a.teamName.toUpperCase())
      const indexB = teamSequence.indexOf(b.teamName.toUpperCase())

      if (indexA !== -1 && indexB !== -1) return indexA - indexB
      if (indexA !== -1) return -1
      if (indexB !== -1) return 1
      return a.teamName.localeCompare(b.teamName)
    })
  }, [projectsByTeam])

  const workloadData = useMemo(() => {
    if (selectedMonth === null || selectedYear === null) return { projects: [], count: 0 }

    const startOfMonth = new Date(selectedYear, selectedMonth, 1)
    const endOfMonth = new Date(selectedYear, selectedMonth + 1, 0, 23, 59, 59)

    const activeProjectIds = new Set()

    tasks.forEach((task) => {
      if (!task.start_date || !task.due_date || !task.project_id) return

      const taskStart = new Date(task.start_date)
      const taskEnd = new Date(task.due_date)

      // Overlap check: task starts before month end AND task ends after month start
      if (taskStart <= endOfMonth && taskEnd >= startOfMonth) {
        activeProjectIds.add(task.project_id)
      }
    })

    const activeProjects = projects.filter((p) => activeProjectIds.has(p.id))

    return {
      projects: activeProjects,
      count: activeProjects.length
    }
  }, [tasks, projects, selectedMonth, selectedYear])

  if (selectedMonth === null || selectedYear === null) {
    return (
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
        <div className="p-3 bg-blue-50 rounded-xl">
          <Info className="w-6 h-6 text-blue-500" />
        </div>
        <div>
          <h3 className="text-sm  text-gray-700">Monthly Workload Insight</h3>
          <p className="text-xs text-gray-700">
            Select a specific month to see projects with active tasks during that period.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Team Stats Table */}
      {sortedTeams.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
        >
          <div className="p-4 border-b border-gray-50 bg-gray-50/50">
            <h3 className="text-sm  text-gray-700 flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-green-600" />
              Team-wise Project Statistics
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="bg-white text-gray-400 text-[10px] uppercase tracking-wider  border-b border-gray-100">
                  <th className="px-6 py-4">Detailed Team</th>
                  {['IFA', 'IFC', 'CO#'].map((stage) => (
                    <th key={stage} className="px-4 py-4 text-center border-l border-gray-50">
                      {stage}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 ">
                {sortedTeams.map(([teamId, teamData]) => (
                  <tr key={teamId} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4 text-gray-700 ">{teamData.teamName}</td>
                    {['IFA', 'IFC', 'CO#'].map((stage) => (
                      <td key={stage} className="px-4 py-4 border-l border-gray-50">
                        <div className="flex items-center justify-center gap-3">
                          <button
                            onClick={() => handleStatClick(teamData.projects, stage, 'ACTIVE')}
                            className="flex flex-col items-center hover:scale-110 transition-transform"
                            title="Active"
                          >
                            <span className="text-blue-600 border-b-2 border-blue-100 px-1">
                              {teamData.stats[stage].active}
                            </span>
                            <span className="text-[8px] text-gray-400 mt-0.5">ACT</span>
                          </button>
                          <button
                            onClick={() => handleStatClick(teamData.projects, stage, 'ON_HOLD')}
                            className="flex flex-col items-center hover:scale-110 transition-transform"
                            title="On Hold"
                          >
                            <span className="text-orange-600 border-b-2 border-orange-100 px-1">
                              {teamData.stats[stage].onHold}
                            </span>
                            <span className="text-[8px] text-gray-400 mt-0.5">HLD</span>
                          </button>
                          <button
                            onClick={() => handleStatClick(teamData.projects, stage, 'COMPLETED')}
                            className="flex flex-col items-center hover:scale-110 transition-transform"
                            title="Completed"
                          >
                            <span className="text-green-600 border-b-2 border-green-100 px-1">
                              {teamData.stats[stage].completed}
                            </span>
                            <span className="text-[8px] text-gray-400 mt-0.5">FIN</span>
                          </button>
                          <button
                            onClick={() => handleStatClick(teamData.projects, stage, 'TOTAL')}
                            className="ml-2 px-2 py-0.5 bg-gray-100 rounded text-gray-600 hover:bg-gray-200"
                            title="Total"
                          >
                            {teamData.stats[stage].total}
                          </button>
                        </div>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}

      {/* Project Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-4"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-green-50 rounded-xl">
              <Briefcase className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <h3 className="text-base  text-gray-700">
                Workload for {months[selectedMonth]} {selectedYear}
              </h3>
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">
                Projects with active tasks
              </p>
            </div>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-2xl  text-green-600 leading-none">
              {workloadData.count}
            </span>
            <span className="text-[10px]  text-gray-400 uppercase">Active Projects</span>
          </div>
        </div>

        {workloadData.count > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {workloadData.projects.map((project) => (
              <div
                key={project.id}
                className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100 hover:border-green-200 hover:bg-green-50/30 transition-all group"
              >
                <div className="w-8 h-8 rounded-lg bg-white border border-gray-100 flex items-center justify-center text-[10px]  text-green-600 shadow-sm group-hover:scale-110 transition-transform">
                  {project.projectNumber.slice(-3)}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm  text-gray-700 truncate group-hover:text-green-700 transition-colors">
                    {project.name}
                  </h4>
                  <p className="text-[10px] font-medium text-gray-400 truncate">
                    {project.projectNumber}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex items-center gap-3 p-4 bg-orange-50 rounded-xl border border-orange-100">
            <AlertCircle className="w-5 h-5 text-orange-500" />
            <p className="text-sm font-medium text-orange-700">
              No projects have tasks assigned for this month.
            </p>
          </div>
        )}
      </motion.div>
    </div>
  )
}

export default MonthlyProjectStats
