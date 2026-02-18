import React from "react";
import {
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

const CDLocationCharts = ({ stateData }) => {
  const COLORS = [
    "#10b981",
    "#3b82f6",
    "#f59e0b",
    "#8b5cf6",
    "#ec4899",
    "#14b8a6",
    "#6366f1",
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
      {/* Network Growth Trend (Main Visual) - Takes up 2/3 */}
      <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg  text-gray-800">
              Network Growth Velocity
            </h3>
            <p className="text-xs text-gray-400 mt-1">
              New Connection Designers onboarded over time
            </p>
          </div>
        </div>
      </div>

      {/* State-wise Presence (Secondary) - Takes up 1/3 */}
      <div className="lg:col-span-1 bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col relative">
        <h3 className="text-lg  text-gray-800 mb-6">
          State-wise Presence
        </h3>
        <div className="flex-1 min-h-[250px] relative">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={stateData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="count"
              >
                {stateData.map((_, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  borderRadius: "8px",
                  border: "none",
                  boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)",
                }}
              />
              <Legend
                verticalAlign="bottom"
                height={36}
                iconType="circle"
                formatter={(value, entry) => (
                  <span className="text-xs text-gray-600 ml-1">
                    {value} ({entry.payload.count})
                  </span>
                )}
              />
            </PieChart>
          </ResponsiveContainer>
          {/* Center Text */}
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none mb-8">
            <span className="text-2xl  text-gray-800">
              {stateData.reduce((a, b) => a + b.count, 0)}
            </span>
            <p className="text-xs text-gray-500">Total States</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CDLocationCharts;
