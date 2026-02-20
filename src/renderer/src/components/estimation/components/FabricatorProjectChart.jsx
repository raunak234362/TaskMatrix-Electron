import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts'

const FabricatorProjectChart = ({ data, fabricators }) => {
  // Theme colors consistent with the website (Greens, Teals, Blues)
  // Green shades for the bar graph
  const colors = [
    '#6bbd45', // Primary Green
    '#7cc45a', // Lighter
    '#8ccd6f', // Even Lighter
    '#9dd584', // Much Lighter
    '#57a136', // Darker
    '#44842a', // Much Darker
    '#ade59b', // Pastel
    '#62af3f'  // Slightly darker primary
  ]

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-full">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg  text-gray-800">Fabricator Projects Overview</h3>
        {/* Optional time filter dropdown here if needed later */}
      </div>

      <div className="h-[350px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{
              top: 20,
              right: 30,
              left: 20,
              bottom: 5
            }}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
            <XAxis
              dataKey="name"
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#6b7280', fontSize: 12 }}
              dy={10}
            />
            <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} />
            <Tooltip
              cursor={{ fill: '#f9fafb' }}
              contentStyle={{
                backgroundColor: '#fff',
                borderRadius: '12px',
                border: 'none',
                boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                padding: '12px'
              }}
              labelStyle={{ color: '#374151', fontWeight: 600, marginBottom: '8px' }}
            />
            <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
            {fabricators.map((fab, index) => (
              <Bar
                key={fab}
                dataKey={fab}
                stackId="a" // Stack them to show total distribution
                fill={colors[index % colors.length]}
                radius={index === fabricators.length - 1 ? [4, 4, 0, 0] : [0, 0, 0, 0]} // Round top only
                barSize={30}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>

      {(!data || data.length === 0) && (
        <div className="flex flex-col items-center justify-center -mt-40 pointer-events-none">
          <p className="text-gray-400 text-sm">No data available for chart</p>
        </div>
      )}
    </div>
  )
}

export default FabricatorProjectChart
