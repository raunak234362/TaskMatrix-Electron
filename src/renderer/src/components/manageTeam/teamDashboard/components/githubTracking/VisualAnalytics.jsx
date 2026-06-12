import React, { useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend
} from "recharts";
import { BarChart2, PieChart as PieChartIcon, TrendingUp } from "lucide-react";

const COLORS = ["#4f46e5", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];

const VisualAnalytics = ({ commits, teamMembers, repos, dateFilter }) => {
  const trendData = useMemo(() => {
    const dataMap = {};
    
    // Sort commits to find earliest and latest date
    if (commits.length === 0) return [];
    let start, end;
    if (commits.length > 0) {
      start = new Date(commits[commits.length - 1].commit.author.date);
      end = new Date(commits[0].commit.author.date);
    } else {
      start = new Date();
      end = new Date();
      start.setDate(start.getDate() - 7); // Default empty state 7 days
    }

    if (dateFilter) {
      if (dateFilter.type === "week" && dateFilter.weekStart && dateFilter.weekEnd) {
        start = new Date(dateFilter.weekStart);
        end = new Date(dateFilter.weekEnd);
      } else if (dateFilter.type === "month" && dateFilter.year && dateFilter.month !== undefined) {
        start = new Date(dateFilter.year, dateFilter.month, 1);
        end = new Date(dateFilter.year, dateFilter.month + 1, 0);
      } else if (dateFilter.type === "dateRange" && dateFilter.startDate && dateFilter.endDate) {
        start = new Date(dateFilter.startDate);
        end = new Date(dateFilter.endDate);
      }
    }
    
    // Pre-populate with 0s for every day in the range
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
      dataMap[dateStr] = 0;
    }

    commits.forEach(c => {
      const d = new Date(c.commit.author.date);
      const dateStr = d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
      // It's possible a commit falls exactly on the boundary, we just increment it.
      dataMap[dateStr] = (dataMap[dateStr] || 0) + 1;
    });

    return Object.entries(dataMap).map(([date, count]) => ({
      date,
      commits: count
    }));
  }, [commits, dateFilter]);

  const repoData = useMemo(() => {
    const dataMap = {};
    repos.forEach(r => dataMap[`${r.owner}/${r.name}`] = 0);

    commits.forEach(c => {
      if (dataMap[c.repoFullName] !== undefined) {
        dataMap[c.repoFullName] += 1;
      }
    });

    return Object.entries(dataMap)
      .map(([name, value]) => ({ name, value }))
      .filter(item => item.value > 0);
  }, [commits, repos]);

  const teamData = useMemo(() => {
    const dataMap = {};
    teamMembers.forEach(m => dataMap[m.name] = 0);

    commits.forEach(c => {
      if (dataMap[c.employeeName] !== undefined) {
        dataMap[c.employeeName] += 1;
      }
    });

    return Object.entries(dataMap).map(([name, count]) => ({
      name,
      commits: count
    }));
  }, [commits, teamMembers]);

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm h-full max-h-[600px] flex flex-col overflow-y-auto custom-scrollbar">
      <div className="flex items-center gap-2 mb-6 pb-4 border-b border-slate-100 shrink-0">
        <TrendingUp className="w-5 h-5 text-indigo-600" />
        <h3 className="text-lg font-bold text-slate-800">Visual Analytics</h3>
      </div>

      <div className="space-y-8">
        {/* Trend Chart */}
        <div>
          <h4 className="text-sm font-bold text-slate-600 mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4" /> Commit Trend
          </h4>
          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="date" tick={{fontSize: 12, fill: '#64748b'}} tickLine={false} axisLine={false} />
                <YAxis tick={{fontSize: 12, fill: '#64748b'}} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip 
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Line type="monotone" dataKey="commits" stroke="#4f46e5" strokeWidth={3} dot={{r: 4, strokeWidth: 2}} activeDot={{r: 6}} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Repo Contribution */}
          <div>
            <h4 className="text-sm font-bold text-slate-600 mb-4 flex items-center gap-2">
              <PieChartIcon className="w-4 h-4" /> Repo Contribution
            </h4>
            <div className="h-48 w-full">
              {repoData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={repoData}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={70}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {repoData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                    <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-sm text-slate-400">No data available</div>
              )}
            </div>
          </div>

          {/* Team Contribution */}
          <div>
            <h4 className="text-sm font-bold text-slate-600 mb-4 flex items-center gap-2">
              <BarChart2 className="w-4 h-4" /> Team Contribution
            </h4>
            <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={teamData} layout="vertical" margin={{ top: 0, right: 0, left: 20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                  <XAxis type="number" tick={{fontSize: 12, fill: '#64748b'}} tickLine={false} axisLine={false} allowDecimals={false} />
                  <YAxis dataKey="name" type="category" tick={{fontSize: 11, fill: '#475569'}} tickLine={false} axisLine={false} width={80} />
                  <Tooltip cursor={{fill: '#f1f5f9'}} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                  <Bar dataKey="commits" fill="#10b981" radius={[0, 4, 4, 0]} barSize={20} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VisualAnalytics;
