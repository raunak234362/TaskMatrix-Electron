import { useEffect, useMemo, useState } from 'react'
import { CalendarDays } from 'lucide-react'
import Service from '../../../api/Service'
import TeamCalendar from '../../manageTeam/teamDashboard/components/TeamCalendar'
import WorkloadAlerts from './WorkloadAlerts'

const unwrap = (response) => response?.data ?? response
const isInactive = (value) => value !== undefined && value !== null && ![true, 'true', 1].includes(value)
const hasInactiveStatus = (value, seen = new Set()) => {
  if (!value || typeof value !== 'object' || seen.has(value)) return false
  seen.add(value)
  if (Object.hasOwn(value, 'isActive') && isInactive(value.isActive)) return true
  if (value.is_disabled === true || value.is_disabled === 1 || value.is_disabled === 'true') return true
  return Object.values(value).some((nested) => hasInactiveStatus(nested, seen))
}
const isActiveMember = (member) => !hasInactiveStatus(member)

const DashboardTeamCalendar = () => {
  const [teams, setTeams] = useState([])
  const [selectedTeamId, setSelectedTeamId] = useState('')
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const selectedTeam = useMemo(() => teams.find((team) => String(team.id) === String(selectedTeamId)), [teams, selectedTeamId])
  const workloadMembers = useMemo(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(today.getDate() + 1)

    return members.filter(isActiveMember).map((member) => {
      const tasks = (member.tasks || []).filter((task) => {
        const taskDate = task.start_date || task.startDate || task.date
        if (!taskDate) return false
        const date = new Date(taskDate)
        return date >= today && date < tomorrow
      })
      const assignedHours = tasks.reduce((total, task) => {
        const value = task.allocationLog?.allocatedHours || task.hours || task.duration
        if (!value) return total
        if (typeof value === 'number' || !String(value).includes(':')) {
          return total + (Number(value) || 0)
        }
        const parts = String(value).split(':').map(Number)
        const [hours = 0, minutes = 0, seconds = 0] = parts
        return total + hours + minutes / 60 + seconds / 3600
      }, 0)
      const user = member.member || {}
      return {
        ...member,
        name: `${user.firstName || member.firstName || ''} ${user.lastName || member.lastName || ''}`.trim() || member.username || 'Unknown',
        assignedHours,
        tasks,
      }
    })
  }, [members])

  useEffect(() => {
    let active = true
    Service.AllTeam().then((response) => {
      const result = unwrap(response)
      const list = Array.isArray(result) ? result : (result?.teams || [])
      const availableTeams = list.filter((team) => !team.isDeleted)
      if (active) {
        setTeams(availableTeams)
        setSelectedTeamId((current) => current || String(availableTeams[0]?.id || ''))
      }
    }).catch((error) => console.error('Failed to load dashboard teams', error))
      .finally(() => active && setLoading(false))
    return () => { active = false }
  }, [])

  useEffect(() => {
    if (!selectedTeamId) {
      setMembers([])
      return
    }
    let active = true
    setLoading(true)
    Promise.all([Service.GetTeamByID(selectedTeamId), Service.GetAllTask(), Service.FetchAllEmployee()])
      .then(([teamResponse, taskResponse, employeeResponse]) => {
        const team = unwrap(teamResponse)
        let tasks = unwrap(taskResponse) || []
        if (!Array.isArray(tasks)) tasks = Object.values(tasks)
        const employeeResult = unwrap(employeeResponse)
        const employees = Array.isArray(employeeResult) ? employeeResult : (employeeResult?.employees || employeeResult?.data || [])
        const employeesById = new Map()
        employees.forEach((employee) => {
          const ids = [employee.id, employee.userId, employee.user?.id].filter((id) => id != null)
          ids.forEach((id) => employeesById.set(String(id), employee))
        })
        const activeMembers = (team?.members || []).map((member) => {
          const id = member.userId || member.member?.id || member.id
          const employee = employeesById.get(String(id))
          if (!employee) return member
          const isActive = employee.isActive
          return {
            ...member,
            isActive,
            member: { ...(member.member || {}), ...employee, isActive },
          }
        }).filter(isActiveMember)
        const memberStats = activeMembers.map((member) => {
          const id = member.userId || member.member?.id || member.id
          return {
            ...member,
            id,
            tasks: tasks.filter((task) => String(task.user_id || task.user?.id || task.userId || task.assignedToId) === String(id)),
          }
        })
        if (active) setMembers(memberStats)
      })
      .catch((error) => console.error('Failed to load dashboard team calendar', error))
      .finally(() => active && setLoading(false))
    return () => { active = false }
  }, [selectedTeamId])

  return (
    <section className="rounded-2xl border border-green-200 bg-linear-to-br from-green-50/70 via-white to-white p-4 sm:p-6 shadow-sm">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="rounded-xl border border-green-100 bg-white p-2.5 text-green-700 shadow-sm"><CalendarDays size={21} /></span>
          <div>
            <h3 className="text-base font-bold uppercase tracking-wide text-slate-900">Team Calendar</h3>
            <p className="text-xs text-slate-500">View team assignments by date</p>
          </div>
        </div>
        <label className="flex items-center gap-2 text-xs font-semibold text-slate-600">
          Team
          <select value={selectedTeamId} onChange={(event) => setSelectedTeamId(event.target.value)} disabled={loading && teams.length === 0 || teams.length === 0} className="min-w-48 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100">
            {teams.length === 0 && <option value="">{loading ? 'Loading teams…' : 'No teams available'}</option>}
            {teams.map((team) => <option key={team.id} value={team.id}>{team.name}</option>)}
          </select>
        </label>
      </div>
      {loading ? (
        <div className="flex min-h-48 items-center justify-center rounded-xl border border-slate-100 bg-white text-sm text-slate-500">Loading team calendar…</div>
      ) : selectedTeam ? (
        <>
          <TeamCalendar members={members} selectedTeamName={selectedTeam.name} />
          <div className="mt-5 rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
            <div className="mb-4">
              <h4 className="text-sm font-bold uppercase tracking-wide text-slate-900">Team Workload</h4>
              <p className="mt-1 text-xs text-slate-500">Assignment status for today · {new Date().toLocaleDateString()}</p>
            </div>
            <WorkloadAlerts memberStats={workloadMembers} />
          </div>
        </>
      ) : (
        <div className="rounded-xl border border-dashed border-slate-200 bg-white p-8 text-center text-sm text-slate-500">No teams are available to display.</div>
      )}
    </section>
  )
}

export default DashboardTeamCalendar
