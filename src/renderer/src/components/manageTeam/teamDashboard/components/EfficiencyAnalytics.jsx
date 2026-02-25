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

const customStyles = {
  control: (base) => ({
    ...base,
    backgroundColor: "#f3f4f6",
    borderColor: "transparent",
    borderRadius: "0.5rem",
    minHeight: "32px",
    boxShadow: "none",
    "&:hover": { backgroundColor: "#e5e7eb" },
    cursor: "pointer",
  }),
  valueContainer: (base) => ({ ...base, padding: "0 8px" }),
  placeholder: (base) => ({
    ...base,
    color: "#374151",
    fontSize: "0.75rem",
    fontWeight: 500,
  }),
  indicatorSeparator: () => ({ display: "none" }),
  dropdownIndicator: () => ({ display: "none" }),
  menu: (base) => ({
    ...base,
    zIndex: 50,
    borderRadius: "0.75rem",
    overflow: "hidden",
    boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06)",
  }),
  option: (base, state) => ({
    ...base,
    backgroundColor: state.isSelected ? "#f0fdf4" : state.isFocused ? "#f9fafb" : "white",
    color: state.isSelected ? "#000000" : "#374151",
    fontSize: "0.875rem",
    fontWeight: state.isSelected ? 900 : 500,
    cursor: "pointer",
    ":active": { backgroundColor: "#f0fdf4" },
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
    <div className="bg-white p-8 rounded-[2.5rem] border border-black/5 shadow-soft mb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-6">
        <div>
          <h3 className="text-2xl font-black text-black uppercase tracking-tight">
            Efficiency Analytics
          </h3>
          <p className="text-black/60 text-base font-bold tracking-wide">
            Comparative performance trends across selected teams
          </p>
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
          <div className="flex bg-gray-100/50 p-1.5 rounded-2xl border border-black/5">
            {["1D", "1W", "1M", "1Y", "ALL"].map((tf) => (
              <button
                key={tf}
                onClick={() => onTimeFilterChange(tf)}
                className={`px-4 py-1.5 text-xs font-black rounded-xl transition-all ${timeFilter === tf
                  ? "bg-white text-black shadow-medium border border-black/5"
                  : "text-black/40 hover:text-black"
                  }`}
              >
                {tf}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3 bg-white border border-black/5 rounded-2xl px-4 py-2 shadow-sm">
            <div className="relative group">
              <input
                type="date"
                value={dateRange.start}
                onChange={(e) =>
                  onDateRangeChange({ ...dateRange, start: e.target.value })
                }
                className="pl-2 pr-1 py-1 text-xs font-bold border-none bg-transparent text-black focus:ring-0 outline-none w-[110px]"
              />
            </div>
            <span className="text-black/20 font-black">-</span>
            <div className="relative group">
              <input
                type="date"
                value={dateRange.end}
                onChange={(e) =>
                  onDateRangeChange({ ...dateRange, end: e.target.value })
                }
                className="pl-2 pr-1 py-1 text-xs font-bold border-none bg-transparent text-black focus:ring-0 outline-none w-[110px]"
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
              tick={{ fill: "#000000", fontSize: 10, fontWeight: 700 }}
              dy={10}
              minTickGap={30}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#000000", fontSize: 10, fontWeight: 700 }}
              domain={[0, 140]}
              ticks={[0, 35, 70, 105, 140]}
              tickFormatter={(value) => `${value}`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#fff",
                borderRadius: "1rem",
                border: "1px solid rgba(0,0,0,0.05)",
                boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)",
                padding: "12px 16px",
              }}
              formatter={(value, name) => {
                const teamName = teams.find((t) => t.id === name)?.name || name;
                return [`${value}%`, teamName];
              }}
              labelStyle={{
                color: "#000",
                marginBottom: "6px",
                fontWeight: 900,
                fontSize: "10px",
                textTransform: "uppercase",
                letterSpacing: "0.1em"
              }}
              itemStyle={{ fontSize: "11px", fontWeight: 700, padding: 0, color: "#000" }}
            />
            <Legend
              iconType="circle"
              wrapperStyle={{ paddingTop: "30px", fontSize: "10px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.05em" }}
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
                  strokeWidth={3}
                  fillOpacity={1}
                  fill={`url(#colorEff-${teamId})`}
                  activeDot={{ r: 6, strokeWidth: 0, fill: color }}
                />
              );
            })}
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Check if no data */}
      {(!data || data.length === 0) && (
        <div className="flex flex-col items-center justify-center p-12 text-black/40 bg-gray-50/50 rounded-3xl mt-6 border border-dashed border-black/10">
          <p className="text-xs font-black uppercase tracking-widest">No efficiency data available.</p>
        </div>
      )}
    </div>
  );
};

export default EfficiencyAnalytics;
