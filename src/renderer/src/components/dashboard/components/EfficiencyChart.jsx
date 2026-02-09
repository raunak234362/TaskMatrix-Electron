/* eslint-disable react/prop-types */
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts'
import { Zap } from 'lucide-react'

const CustomTooltip = ({ active, payload, label }) => {
  const formatHours = (decimalHours) => {
    const totalMinutes = Math.round(parseFloat(decimalHours) * 60)
    const hours = Math.floor(totalMinutes / 60)
    const minutes = totalMinutes % 60
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
  }

  if (active && payload && payload.length) {
    const data = payload[0].payload
    return (
      <div className="bg-white/95 backdrop-blur-md p-4 rounded-2xl shadow-xl border border-slate-100 min-w-[180px]">
        <p className=" text-slate-900 mb-3 border-b border-slate-100 pb-2">{label}</p>
        <div className="space-y-2">
          <div className="flex justify-between items-center gap-4">
            <span className="text-xs font-medium text-slate-500">Efficiency</span>
            <span className="text-sm  text-emerald-600">{data.efficiency}%</span>
          </div>
          <div className="flex justify-between items-center gap-4">
            <span className="text-xs font-medium text-slate-500">Allocated</span>
            <span className="text-sm  text-indigo-600">{formatHours(data.allocated)}</span>
          </div>
          <div className="flex justify-between items-center gap-4">
            <span className="text-xs font-medium text-slate-500">Worked</span>
            <span className="text-sm  text-amber-600">{formatHours(data.worked)}</span>
          </div>
        </div>
      </div>
    )
  }
  return null
}

const EfficiencyChart = ({ data }) => {
  return (
    <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col h-full group">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h3 className="font-extrabold text-slate-800 text-lg tracking-tight">Efficiency Trend</h3>
          <p className="text-xs font-medium text-slate-400 mt-0.5">Allocated vs Worked Hours</p>
        </div>
        <div className="p-3 bg-emerald-50 rounded-2xl text-emerald-600 group-hover:scale-110 transition-transform duration-500">
          <Zap size={20} fill="currentColor" className="opacity-20" />
        </div>
      </div>

      <div className="flex-1 w-full min-h-[280px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            margin={{
              top: 10,
              right: 10,
              left: -20,
              bottom: 0
            }}
          >
            <defs>
              <linearGradient id="colorEfficiency" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis
              dataKey="month"
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 600 }}
              dy={15}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 600 }}
              domain={[0, 'auto']}
              tickFormatter={(val) => `${val}%`}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#e2e8f0', strokeWidth: 2 }} />
            <Area
              type="monotone"
              dataKey="efficiency"
              stroke="#10b981"
              strokeWidth={4}
              fillOpacity={1}
              fill="url(#colorEfficiency)"
              animationDuration={2000}
              animationEasing="ease-in-out"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

export default EfficiencyChart
