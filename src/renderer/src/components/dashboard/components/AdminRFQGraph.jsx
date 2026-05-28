import { useMemo } from 'react'
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts'

const AdminRFQGraph = ({ rfqs = [] }) => {

  const data = useMemo(() => {
    let pending = 0;
    let awarded = 0;
    let inReview = 0;
    let others = 0;

    rfqs.forEach(rfq => {
      const status = (rfq.wbtStatus || rfq.status || 'PENDING').toUpperCase();
      if (status === 'PENDING') pending++;
      else if (status === 'AWARDED') awarded++;
      else if (status === 'IN_REVIEW' || status === 'IN REVIEW') inReview++;
      else others++;
    });

    return [
      { name: 'Pending', value: pending, color: '#f59e0b' },
      { name: 'Awarded', value: awarded, color: '#10b981' },
      { name: 'In Review', value: inReview, color: '#3b82f6' },
      ...(others > 0 ? [{ name: 'Others', value: others, color: '#9ca3af' }] : [])
    ].filter(item => item.value > 0);
  }, [rfqs])

  return (
    <div className="flex flex-col items-center h-full">
      <div className="w-full mb-6">
        <h2 className="text-lg font-bold text-gray-800 uppercase tracking-widest flex items-center gap-2">
          RFQ Status Distribution
        </h2>
        <p className="text-sm text-gray-500 font-semibold uppercase tracking-wider mt-1">
          Pending, Awarded & In Review Overview
        </p>
      </div>

      <div className="h-[300px] w-full mt-auto">
        {data.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={5}
                dataKey="value"
                stroke="none"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-white p-3 rounded-xl shadow-xl border border-gray-100 flex items-center gap-3">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: data.color }}></div>
                        <span className="text-xs font-black uppercase tracking-wider text-gray-700">{data.name}:</span>
                        <span className="text-sm font-black text-gray-900">{data.value}</span>
                      </div>
                    )
                  }
                  return null;
                }}
              />
              <Legend
                wrapperStyle={{ paddingTop: '20px' }}
                formatter={(value, entry) => (
                  <span className="text-xs font-bold text-gray-600 uppercase tracking-wider ml-1">{value}</span>
                )}
              />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-gray-50/50 rounded-2xl border border-dashed border-gray-200">
            <span className="text-gray-400 font-bold uppercase tracking-widest text-sm">No RFQ Data Found</span>
          </div>
        )}
      </div>
    </div>
  )
}

export default AdminRFQGraph
