/* eslint-disable react/prop-types */
import { useEffect, useState, Suspense, lazy, useMemo } from 'react'
import Service from '../../api/Service'
import { useSelector } from 'react-redux'
import { format, subMonths, isSameMonth, startOfMonth, endOfMonth } from 'date-fns'
import { Loader2, Calendar, LayoutDashboard, Clock, CheckCircle2, Briefcase, TrendingUp } from 'lucide-react'

// Lazy load components
const UserStatsWidget = lazy(() => import('./components/UserStatsWidget'))
const CurrentTaskWidget = lazy(() => import('./components/CurrentTaskWidget'))
const UpcomingDeadlinesWidget = lazy(() => import('./components/UpcomingDeadlinesWidget'))
const PersonalNotesWidget = lazy(() => import('./components/PersonalNotesWidget'))
const EfficiencyChart = lazy(() => import('./components/EfficiencyChart'))
const GetTaskByID = lazy(() => import('../task/GetTaskByID'))

const DashboardSkeleton = () => (
  <div className="animate-pulse space-y-8 p-6 bg-white min-h-screen">
    <div className="flex justify-between items-center">
      <div className="h-10 w-1/3 bg-gray-100 rounded-lg"></div>
      <div className="h-10 w-24 bg-gray-100 rounded-lg"></div>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="h-32 bg-gray-100 rounded-2xl"></div>
      ))}
    </div>
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
      <div className="xl:col-span-2 space-y-8">
        <div className="h-64 bg-gray-100 rounded-2xl"></div>
        <div className="h-96 bg-gray-100 rounded-2xl"></div>
      </div>
      <div className="h-full bg-gray-100 rounded-2xl"></div>
    </div>
  </div>
)

const WBTDashboard = () => {
  const user = useSelector((state) => state.userInfo?.userDetail)
  const [loading, setLoading] = useState(true)
  const [tasks, setTasks] = useState([])
  const [projectNotes, setProjectNotes] = useState([])
  const [detailTaskId, setDetailTaskId] = useState(null)
  const [efficiencyData, setEfficiencyData] = useState([])

  const [userStats, setUserStats] = useState({
    totalTasks: 0,
    completedTasks: 0,
    pendingTasks: 0,
    allocatedHours: 0,
    workedHours: 0,
    projectsCount: 0,
    efficiency: 0
  })

  const parseDurationToHours = (duration) => {
    if (!duration) return 0
    // Handle formats like "10:30", "10h 30m", "10"
    const parts = duration.split(/[:\s]+/)
    let hours = 0
    let minutes = 0

    if (parts.length >= 1) {
      hours = parseFloat(parts[0].replace(/[^\d.]/g, '')) || 0
    }
    if (parts.length >= 2) {
      minutes = parseFloat(parts[1].replace(/[^\d.]/g, '')) || 0
    }

    return hours + minutes / 60
  }

  const calculateHours = (task) => {
    const allocated = parseDurationToHours(task.duration)
    const worked = (task.workingHourTask || []).reduce(
      (acc, wh) => acc + (Number(wh.duration_seconds) || 0),
      0
    ) / 3600
    return { allocated, worked }
  }

  const calculateEfficiencyTrend = (tasks) => {
    const months = []
    for (let i = 5; i >= 0; i--) {
      months.push(subMonths(new Date(), i))
    }

    return months.map((date) => {
      const monthTasks = tasks.filter((t) => {
        const taskDate = new Date(t.due_date || t.endDate || t.createdAt)
        return isSameMonth(taskDate, date)
      })

      let totalAllocated = 0
      let totalWorked = 0

      monthTasks.forEach((t) => {
        const { allocated, worked } = calculateHours(t)
        totalAllocated += allocated
        totalWorked += worked
      })

      // Efficiency = (Allocated / Worked) * 100
      // If worked is 0 but allocated > 0, efficiency is 0
      // If both are 0, efficiency is 100 (neutral)
      let efficiency = 0
      if (totalWorked > 0) {
        efficiency = Math.round((totalAllocated / totalWorked) * 100)
      } else if (totalAllocated > 0) {
        efficiency = 0
      }

      return {
        month: format(date, 'MMM'),
        efficiency: Math.min(efficiency, 150), // Cap at 150% for visualization
        allocated: totalAllocated,
        worked: totalWorked
      }
    })
  }

  const fetchData = async () => {
    setLoading(true)
    try {
      const userRole = sessionStorage.getItem('userRole')?.toLowerCase()
      const response = userRole === 'admin' ? await Service.GetAllTask() : await Service.GetMyTask()

      if (response?.data) {
        const fetchedTasks = Array.isArray(response.data)
          ? response.data
          : Object.values(response.data || {})

        setTasks(fetchedTasks)

        // Calculate Stats
        let totalAllocated = 0
        let totalWorked = 0
        const completed = fetchedTasks.filter((t) => t.status === 'COMPLETED').length
        const projectIds = new Set()

        fetchedTasks.forEach((t) => {
          const { allocated, worked } = calculateHours(t)
          totalAllocated += allocated
          totalWorked += worked
          if (t.project?.id) projectIds.add(t.project.id)
        })

        setUserStats({
          totalTasks: fetchedTasks.length,
          completedTasks: completed,
          pendingTasks: fetchedTasks.length - completed,
          allocatedHours: totalAllocated,
          workedHours: totalWorked,
          projectsCount: projectIds.size,
          efficiency: totalWorked > 0 ? Math.round((totalAllocated / totalWorked) * 100) : 100
        })

        // Fetch Notes for unique projects
        const notesPromises = Array.from(projectIds).map((id) => Service.GetProjectNotes(id))
        const allNotesResponses = await Promise.all(notesPromises)
        const flattenedNotes = allNotesResponses.flat().filter(Boolean)
        setProjectNotes(flattenedNotes)

        // Efficiency Trend
        setEfficiencyData(calculateEfficiencyTrend(fetchedTasks))
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const currentTask = useMemo(() => tasks.find((t) => t.status === 'IN_PROGRESS'), [tasks])

  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good Morning'
    if (hour < 18) return 'Good Afternoon'
    return 'Good Evening'
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] p-4 md:p-8 overflow-y-auto custom-scrollbar">
      <Suspense fallback={<DashboardSkeleton />}>
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-indigo-600 rounded-2xl shadow-lg shadow-indigo-200">
              <LayoutDashboard className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
                {getGreeting()}, {user?.firstName || 'User'}
              </h1>
              <p className="text-slate-500 font-medium mt-1 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                You have {userStats.pendingTasks} tasks pending.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 bg-white px-5 py-3 rounded-2xl shadow-sm border border-slate-200">
            <Calendar className="w-5 h-5 text-indigo-500" />
            <span className="text-slate-700 font-bold">
              {format(new Date(), 'EEEE, MMMM do')}
            </span>
          </div>
        </div>
        <div className='flex flex-col gap-5'>

          {/* Stats Overview */}
          <UserStatsWidget stats={userStats} loading={loading} />

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
            {/* Left Column */}
            <div className="xl:col-span-2 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Current Focus */}
                <div className="space-y-4">
                  <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2 px-1">
                    <Clock className="w-5 h-5 text-indigo-500" />
                    Current Focus
                  </h2>
                  <CurrentTaskWidget
                    task={currentTask}
                    onTaskUpdate={() => setDetailTaskId(currentTask?.id)}
                  />
                </div>

                {/* Efficiency Chart */}
                {/* <div className="space-y-4">
                <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2 px-1">
                  <TrendingUp className="w-5 h-5 text-emerald-500" />
                  Efficiency Trends
                </h2>
                <EfficiencyChart data={efficiencyData} />
              </div> */}
                {/* Upcoming Tasks */}
                <div className="space-y-4">
                  <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2 px-1">
                    <CheckCircle2 className="w-5 h-5 text-blue-500" />
                    Upcoming Deadlines
                  </h2>
                  <UpcomingDeadlinesWidget tasks={tasks} onTaskClick={(id) => setDetailTaskId(id)} />
                </div>
              </div>

            </div>

            {/* Right Column - Notes */}
            <div className="space-y-4 h-full">
              <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2 px-1">
                <Briefcase className="w-5 h-5 text-pink-500" />
                Notes & Updates
              </h2>
              <PersonalNotesWidget projectNotes={projectNotes} />
            </div>
          </div>
        </div>

        {/* Task Detail Modal */}
        {detailTaskId && (
          <GetTaskByID
            id={detailTaskId}
            onClose={() => setDetailTaskId(null)}
            refresh={fetchData}
          />
        )}
      </Suspense>
    </div>
  )
}

export default WBTDashboard
