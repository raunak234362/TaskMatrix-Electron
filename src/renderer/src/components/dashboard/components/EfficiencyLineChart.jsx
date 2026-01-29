/* eslint-disable react/prop-types */
import { useState, useMemo } from 'react'
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer
} from 'recharts'
import {
    format,
    subDays,
    subWeeks,
    subMonths,
    subYears,
    isSameDay,
    isSameWeek,
    isSameMonth,
    isSameYear,
    eachDayOfInterval,
    eachWeekOfInterval,
    eachMonthOfInterval,
    eachYearOfInterval
} from 'date-fns'
import { TrendingUp } from 'lucide-react'

const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-white/95 backdrop-blur-md p-4 rounded-2xl shadow-xl border border-slate-100 min-w-[200px]">
                <p className="font-bold text-slate-900 mb-3 border-b border-slate-100 pb-2">{label}</p>
                <div className="space-y-2">
                    {payload.map((entry, index) => (
                        <div key={index} className="flex justify-between items-center gap-4">
                            <span className="text-xs font-medium text-slate-500">{entry.name}</span>
                            <span className="text-sm font-bold" style={{ color: entry.color }}>
                                {entry.name === 'Efficiency' ? `${entry.value}%` : entry.value.toFixed(1)}
                                {entry.name === 'Worked Hours' ? 'h' : ''}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        )
    }
    return null
}

const EfficiencyLineChart = ({ tasks }) => {
    const [filter, setFilter] = useState('month') // 'day', 'week', 'month', 'year'

    const parseDurationToHours = (duration) => {
        if (!duration) return 0
        const parts = duration.split(/[:\s]+/)
        let hours = 0
        let minutes = 0
        if (parts.length >= 1) hours = parseFloat(parts[0].replace(/[^\d.]/g, '')) || 0
        if (parts.length >= 2) minutes = parseFloat(parts[1].replace(/[^\d.]/g, '')) || 0
        return hours + minutes / 60
    }

    const calculateHours = (task) => {
        const allocated = parseDurationToHours(task.duration)
        const worked =
            (task.workingHourTask || []).reduce(
                (acc, wh) => acc + (Number(wh.duration_seconds) || 0),
                0
            ) / 3600
        return { allocated, worked }
    }

    const chartData = useMemo(() => {
        if (!tasks) return

        const now = new Date()
        let intervals = []
        let formatStr = 'MMM dd'
        let compareFn = isSameDay

        switch (filter) {
            case 'day':
                intervals = eachDayOfInterval({ start: subDays(now, 29), end: now })
                formatStr = 'MMM dd'
                compareFn = isSameDay
                break
            case 'week':
                intervals = eachWeekOfInterval({ start: subWeeks(now, 11), end: now })
                formatStr = 'MMM dd'
                compareFn = isSameWeek
                break
            case 'month':
                intervals = eachMonthOfInterval({ start: subMonths(now, 11), end: now })
                formatStr = 'MMM yyyy'
                compareFn = isSameMonth
                break
            case 'year':
                intervals = eachYearOfInterval({ start: subYears(now, 4), end: now })
                formatStr = 'yyyy'
                compareFn = isSameYear
                break
            default:
                intervals = eachMonthOfInterval({ start: subMonths(now, 5), end: now })
                formatStr = 'MMM'
                compareFn = isSameMonth
        }

        return intervals.map((date) => {
            const periodTasks = tasks.filter((t) => {
                const taskDate = new Date(t.due_date || t.endDate || t.createdAt)
                return compareFn(taskDate, date)
            })

            let totalAllocated = 0
            let totalWorked = 0
            const projects = new Set()

            periodTasks.forEach((t) => {
                const { allocated, worked } = calculateHours(t)
                totalAllocated += allocated
                totalWorked += worked
                if (t.project?.id) projects.add(t.project.id)
            })

            let efficiency = 0
            if (totalWorked > 0) {
                efficiency = Math.round((totalAllocated / totalWorked) * 100)
            } else if (totalAllocated > 0) {
                efficiency = 0
            } else {
                efficiency = 0 // Initial efficiency is zero
            }

            return {
                label: format(date, formatStr),
                Efficiency: Math.min(efficiency, 200), // Cap for visualization
                'Assigned Tasks': periodTasks.length,
                'Worked Hours': totalWorked,
                'Assigned Projects': projects.size
            }
        })
    }, [tasks, filter])

    const filters = [
        { id: 'day', label: 'Day' },
        { id: 'week', label: 'Week' },
        { id: 'month', label: 'Month' },
        { id: 'year', label: 'Year' }
    ]

    return (
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col h-[600px] group">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
                <div>
                    <h3 className="font-extrabold text-slate-800 text-lg tracking-tight flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-indigo-500" />
                        Performance Analytics
                    </h3>
                    <p className="text-xs font-medium text-slate-400 mt-0.5">
                        Tasks, Hours & Efficiency Trends
                    </p>
                </div>

                <div className="flex bg-slate-50 p-1 rounded-xl border border-slate-100">
                    {filters.map((f) => (
                        <button
                            key={f.id}
                            onClick={() => setFilter(f.id)}
                            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${filter === f.id
                                ? 'bg-white text-indigo-600 shadow-sm'
                                : 'text-slate-500 hover:text-slate-700'
                                }`}
                        >
                            {f.label}
                        </button>
                    ))}
                </div>
            </div>

            <div className="flex-1 w-full h-full">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis
                            dataKey="label"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 600 }}
                            dy={15}
                        />
                        <YAxis
                            yAxisId="left"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 600 }}
                        />
                        <YAxis
                            yAxisId="right"
                            orientation="right"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 600 }}
                            tickFormatter={(val) => `${val}%`}
                        />
                        <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#e2e8f0', strokeWidth: 2 }} />
                        <Legend
                            verticalAlign="top"
                            align="right"
                            iconType="circle"
                            content={({ payload }) => (
                                <div className="flex gap-4 justify-end mb-4">
                                    {payload.map((entry, index) => (
                                        <div key={index} className="flex items-center gap-1.5">
                                            <div
                                                className="w-2 h-2 rounded-full"
                                                style={{ backgroundColor: entry.color }}
                                            ></div>
                                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                                                {entry.value}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        />
                        <Line
                            yAxisId="right"
                            type="monotone"
                            dataKey="Efficiency"
                            stroke="#10b981"
                            strokeWidth={3}
                            dot={{ r: 4, fill: '#10b981', strokeWidth: 2, stroke: '#fff' }}
                            activeDot={{ r: 6, strokeWidth: 0 }}
                            animationDuration={1500}
                        />
                        <Line
                            yAxisId="left"
                            type="monotone"
                            dataKey="Assigned Tasks"
                            stroke="#6366f1"
                            strokeWidth={3}
                            dot={{ r: 4, fill: '#6366f1', strokeWidth: 2, stroke: '#fff' }}
                            activeDot={{ r: 6, strokeWidth: 0 }}
                            animationDuration={1500}
                        />
                        <Line
                            yAxisId="left"
                            type="monotone"
                            dataKey="Worked Hours"
                            stroke="#f59e0b"
                            strokeWidth={3}
                            dot={{ r: 4, fill: '#f59e0b', strokeWidth: 2, stroke: '#fff' }}
                            activeDot={{ r: 6, strokeWidth: 0 }}
                            animationDuration={1500}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </div>
    )
}

export default EfficiencyLineChart
