/* eslint-disable react/prop-types */

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart
} from 'recharts'
import { TrendingUp } from 'lucide-react'

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-4 rounded-xl shadow-lg border border-gray-100">
        <p className="font-semibold text-gray-800 mb-1">{label}</p>
        <p className="text-sm font-medium text-emerald-600">Efficiency: {payload[0].value}%</p>
        <p className="text-xs text-gray-500 mt-1">{payload[0].payload.completed} tasks completed</p>
      </div>
    )
  }
  return null
}

const EfficiencyChart = ({ data }) => {
  // Data expected format: [{ month: 'Jan', efficiency: 85, completed: 12 }, ...]

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col h-full">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="font-bold text-gray-800 text-lg">Efficiency Trend</h3>
          <p className="text-sm text-gray-500">Task completion rate over time</p>
        </div>
        <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600">
          <TrendingUp size={20} />
        </div>
      </div>

      <div className="flex-1 w-full min-h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            margin={{
              top: 10,
              right: 10,
              left: -10,
              bottom: 0
            }}
          >
            <defs>
              <linearGradient id="colorEfficiency" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
            <XAxis
              dataKey="month"
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#9ca3af', fontSize: 12 }}
              dy={10}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#9ca3af', fontSize: 12 }}
              domain={[0, 100]}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="efficiency"
              stroke="#10b981"
              strokeWidth={3}
              fillOpacity={1}
              fill="url(#colorEfficiency)"
              animationDuration={1500}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

export default EfficiencyChart
