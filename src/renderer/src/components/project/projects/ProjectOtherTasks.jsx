import React from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { formatSeconds } from '../../../utils/timeUtils'

const STATUS_MAP = {
  completed: 'bg-green-100 text-green-700 border-green-200',
  complete: 'bg-green-100 text-green-700 border-green-200',
  validate_complete: 'bg-green-100 text-green-700 border-green-200',
  complete_other: 'bg-green-100 text-green-700 border-green-200',
  assigned: 'bg-blue-100 text-blue-700 border-blue-200',
  in_progress: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  rework: 'bg-orange-100 text-orange-700 border-orange-200'
}

const ProjectOtherTasks = ({
  otherTasksByBundle,
  expandedGroups,
  toggleGroup,
  setSelectedTaskId
}) => {
  if (!otherTasksByBundle || Object.keys(otherTasksByBundle).length === 0) return null

  const totalTaskCount = Object.values(otherTasksByBundle).reduce(
    (s, t) => s + t.length,
    0
  )

  return (
    <div className="mt-12">
      <div className="pb-3 border-b border-gray-200 flex items-center gap-2 mb-4">
        <h4 className="text-sm font-semibold uppercase tracking-normal text-black">
          Other Tasks &mdash; Logged Time
        </h4>
        <span className="ml-auto text-sm text-black font-semibold uppercase tracking-normal">
          {totalTaskCount} tasks
        </span>
      </div>

      <div className="divide-y divide-gray-100">
        {Object.entries(otherTasksByBundle).map(([bundleKey, tasks]) => {
          const bundleTotalSeconds = tasks.reduce(
            (sum, t) =>
              sum +
              (t.workingHourTask || []).reduce(
                (s, w) => s + (w.duration_seconds || 0),
                0
              ),
            0
          )

          const isExpanded = !!expandedGroups[bundleKey]

          return (
            <div key={bundleKey} className="border-b border-gray-100 last:border-b-0">
              <button
                type="button"
                onClick={() => toggleGroup(bundleKey)}
                className="w-full flex items-center gap-3 py-3 hover:bg-slate-50 transition-colors text-left px-2"
              >
                <span className="w-1.5 h-1.5 rounded-none bg-[#6bbd45] shrink-0" />
                <span className="flex-1 text-sm font-semibold uppercase tracking-normal text-black">
                  {bundleKey}
                </span>
                <span className="text-sm font-semibold text-black">
                  {tasks.length} task{tasks.length !== 1 ? 's' : ''}
                </span>
                <span className="text-sm font-semibold text-[#3a8a1a] min-w-[52px] text-right">
                  {formatSeconds(bundleTotalSeconds)}
                </span>
                <span className="shrink-0 text-black ml-1">
                  {isExpanded ? (
                    <ChevronUp className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                </span>
              </button>

              {isExpanded && (
                <div className="bg-slate-50/30 px-4 py-3 border-t border-gray-100">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="pb-2 text-xs font-semibold text-gray-500 uppercase tracking-normal w-1/4">
                          Assignee
                        </th>
                        <th className="pb-2 text-xs font-semibold text-gray-500 uppercase tracking-normal w-2/5">
                          Task Detail
                        </th>
                        <th className="pb-2 text-xs font-semibold text-gray-500 uppercase tracking-normal w-1/5">
                          Status
                        </th>
                        <th className="pb-2 text-xs font-semibold text-gray-500 uppercase tracking-normal text-right w-[15%]">
                          Duration
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {tasks.map((task, idx) => {
                        const assignee = task.user
                          ? `${task.user.firstName || ''} ${task.user.lastName || ''}`.trim()
                          : task.assignedTo
                            ? `${task.assignedTo.firstName || ''} ${task.assignedTo.lastName || ''}`.trim()
                            : 'Unassigned'

                        const taskSeconds = (task.workingHourTask || []).reduce(
                          (s, w) => s + (w.duration_seconds || 0),
                          0
                        )

                        const sc =
                          STATUS_MAP[(task.status || '').toLowerCase()] ||
                          'bg-gray-100 text-black border-gray-200'

                        return (
                          <tr
                            key={task.id || idx}
                            onClick={() => setSelectedTaskId(task.id)}
                            className="hover:bg-slate-100/80 transition-colors cursor-pointer group"
                          >
                            <td className="py-2.5 text-sm font-semibold text-black uppercase tracking-normal pr-4">
                              {assignee}
                            </td>
                            <td className="py-2.5 text-sm font-semibold text-black uppercase tracking-normal pr-4">
                              {task.name || task.title || `Task #${idx + 1}`}
                            </td>
                            <td className="py-2.5">
                              <span
                                className={`text-sm font-semibold px-2 py-0.5 rounded-none border uppercase tracking-normal inline-block ${sc}`}
                              >
                                {task.status || '—'}
                              </span>
                            </td>
                            <td className="py-2.5 text-sm font-semibold text-black text-right uppercase tracking-normal">
                              {taskSeconds > 0 ? formatSeconds(taskSeconds) : '—'}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default ProjectOtherTasks
