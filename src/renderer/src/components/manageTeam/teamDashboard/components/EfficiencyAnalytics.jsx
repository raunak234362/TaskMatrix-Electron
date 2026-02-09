import React from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import Select from "react-select";


// We actually need standard behavior but just styled control?
// The user likely wants a button that opens the menu.
// Let's stick to standard Select but styled very minimally to look like the "Compare Teams +" button in the image.
const customStyles = {
  control: (base) => ({
    ...base,
    backgroundColor: "#f3f4f6", // gray-100
    borderColor: "transparent",
    borderRadius: "0.5rem",
    minHeight: "32px",
    boxShadow: "none",
    "&:hover": {
      backgroundColor: "#e5e7eb", // gray-200
    },
    cursor: "pointer",
  }),
  valueContainer: (base) => ({
    ...base,
    padding: "0 8px",
  }),
  placeholder: (base) => ({
    ...base,
    color: "#374151", // gray-700
    fontSize: "0.75rem",
    fontWeight: 500,
  }),
  indicatorSeparator: () => ({ display: "none" }),
  dropdownIndicator: () => ({ display: "none" }), // Hide the arrow
  menu: (base) => ({
    ...base,
    zIndex: 50,
    borderRadius: "0.75rem",
    overflow: "hidden",
    boxShadow:
      "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
  }),
  option: (base, state) => ({
    ...base,
    backgroundColor: state.isSelected
      ? "#f0fdf4"
      : state.isFocused
        ? "#f9fafb"
        : "white",
    color: state.isSelected ? "#15803d" : "#374151",
    fontSize: "0.875rem",
    cursor: "pointer",
    ":active": {
      backgroundColor: "#f0fdf4",
    },
  }),
};

const EfficiencyAnalytics = ({
  data,
  teams,
  selectedTeams,
  onTeamSelectionChange,
  timeFilter,
  onTimeFilterChange,
  dateRange,
  onDateRangeChange,
}) => {
  const teamOptions = teams.map((t) => ({ value: t.id, label: t.name }));

  const handleTeamChange = (selectedOptions) => {
    onTeamSelectionChange(
      selectedOptions ? selectedOptions.map((o) => o.value) : []
    );
  };

  const selectedTeamOptions = teamOptions.filter((opt) =>
    selectedTeams.includes(opt.value)
  );

  // Colors aligned with the "Premium" look (Purples, Blues) as seen in the screenshot usually
  const colors = [
    "#8b5cf6", // violet-500 (Primary)
    "#3b82f6", // blue-500
    "#10b981", // emerald-500
    "#f59e0b", // amber-500
    "#ec4899", // pink-500
  ];

  return (
    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm mb-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
        <div>
          <h3 className="text-lg  text-gray-800">
            Efficiency Analytics
          </h3>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="w-40 z-20">
            <Select
              isMulti
              options={teamOptions}
              value={selectedTeamOptions}
              onChange={handleTeamChange}
              placeholder="Compare Teams +"
              className="text-sm"
              styles={customStyles}
              components={{
                DropdownIndicator: () => null,
                IndicatorSeparator: () => null,
              }}
            />
          </div>
          <div className="flex bg-gray-100 p-1 rounded-lg">
            {["1D", "1W", "1M", "1Y", "ALL"].map((tf) => (
              <button
                key={tf}
                onClick={() => onTimeFilterChange(tf)}
                className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${timeFilter === tf
                  ? "bg-white text-gray-800 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
                  }`}
              >
                {tf}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <div className="relative group">
              <input
                type="date"
                value={dateRange.start}
                onChange={(e) =>
                  onDateRangeChange({ ...dateRange, start: e.target.value })
                }
                className="pl-2 pr-1 py-1 text-xs border border-gray-200 rounded-lg text-gray-600 focus:ring-1 focus:ring-green-500 outline-none hover:border-gray-300 transition-colors bg-white w-[110px]"
              />
            </div>
            <span className="text-gray-400">-</span>
            <div className="relative group">
              <input
                type="date"
                value={dateRange.end}
                onChange={(e) =>
                  onDateRangeChange({ ...dateRange, end: e.target.value })
                }
                className="pl-2 pr-1 py-1 text-xs border border-gray-200 rounded-lg text-gray-600 focus:ring-1 focus:ring-green-500 outline-none hover:border-gray-300 transition-colors bg-white w-[110px]"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="h-[350px] w-full mt-4">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
          >
            <defs>
              {selectedTeams.map((teamId, index) => (
                <linearGradient
                  key={teamId}
                  id={`colorEff-${teamId}`}
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop
                    offset="5%"
                    stopColor={colors[index % colors.length]}
                    stopOpacity={0.3}
                  />
                  <stop
                    offset="95%"
                    stopColor={colors[index % colors.length]}
                    stopOpacity={0}
                  />
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              stroke="#f3f4f6"
            />
            <XAxis
              dataKey="date"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#6b7280", fontSize: 11 }}
              dy={10}
              minTickGap={30}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#6b7280", fontSize: 11 }}
              domain={[0, 140]}
              ticks={[0, 35, 70, 105, 140]}
              tickFormatter={(value) => `${value}`}
              label={{
                value: "Efficiency %",
                angle: -90,
                position: "insideLeft",
                style: { fill: "#9ca3af", fontSize: 12 },
              }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#fff",
                borderRadius: "8px",
                border: "1px solid #e5e7eb",
                boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                padding: "8px 12px",
              }}
              formatter={(value, name) => {
                const teamName = teams.find((t) => t.id === name)?.name || name;
                return [`${value}%`, teamName];
              }}
              labelStyle={{
                color: "#374151",
                marginBottom: "4px",
                fontWeight: 600,
                fontSize: "12px",
              }}
              itemStyle={{ fontSize: "12px", padding: 0 }}
            />
            <Legend
              iconType="circle"
              wrapperStyle={{ paddingTop: "20px", fontSize: "12px" }}
              formatter={(value) =>
                teams.find((t) => t.id === value)?.name || value
              }
            />

            {selectedTeams.map((teamId, index) => {
              // const team = teams.find(t => t.id === teamId);
              const color = colors[index % colors.length];
              return (
                <Area
                  key={teamId}
                  type="monotone"
                  dataKey={teamId}
                  name={teamId} // Use ID as name for mapping in Legend/Tooltip
                  stroke={color}
                  strokeWidth={2}
                  fillOpacity={1}
                  fill={`url(#colorEff-${teamId})`}
                  activeDot={{ r: 5, strokeWidth: 0 }}
                />
              );
            })}
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Check if no data */}
      {(!data || data.length === 0) && (
        <div className="flex flex-col items-center justify-center p-8 text-gray-400 bg-gray-50 rounded-xl mt-4">
          <p>No efficiency data available.</p>
        </div>
      )}
    </div>
  );
};

export default EfficiencyAnalytics;
