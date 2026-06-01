import { useState, useEffect } from "react";
import Service from "../../api/Service";
import MeasDashboard from "./MeasDashboard";
import {
  Loader2,
  PieChart,
  Activity,
  Play,
  TrendingUp,
  AlertTriangle,
  ListTodo,
  Target,
} from "lucide-react";
import { toast } from "react-toastify";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const TeamsAnalytics = ({ projectId, managerId, tasks = [] }) => {
  const [subTab, setSubTab] = useState("team");
  const [view, setView] = useState("by employee");
  const [managerBias, setManagerBias] = useState(null);
  const [loadingBias, setLoadingBias] = useState(false);

  const [adminAnalytics, setAdminAnalytics] = useState(null);
  const [adminTrendline, setAdminTrendline] = useState(null);

  const [measResult, setMeasResult] = useState(null);
  const [measLoading, setMeasLoading] = useState(false);

  const fetchManagerBias = async () => {
    if (!projectId || !managerId) return;
    try {
      setLoadingBias(true);
      const res = await Service.GetManagerBias({ managerId, projectId });
      setManagerBias(res?.data || res);

      // Fetch admin analytics
      const analyticsRes = await Service.GetAdminAnalyticsForManagerDashboard({
        projectId,
        managerId,
      });
      setAdminAnalytics(analyticsRes?.data || analyticsRes);

      const trendlineRes = await Service.GetAdminMEASAnalyticsTrendline({
        projectId,
        managerId,
      });
      setAdminTrendline(trendlineRes?.data || trendlineRes);

      console.log("Admin Analytics:", analyticsRes);
      console.log("Admin Trendline:", trendlineRes);
    } catch (err) {
      console.error("Error fetching analytics data:", err);
    } finally {
      setLoadingBias(false);
    }
  };

  const runMeasManually = async () => {
    try {
      setMeasLoading(true);
      toast.info("Running Meas Manually...");
      const res = await Service.RunMeasManually({ managerId, projectId });

      if (res?.data) {
        setMeasResult({
          type: "manual",
          score: res.data.score,
          calculatedAt: res.data.calculatedAt,
        });
        toast.success("Meas manual run initiated successfully");
      } else {
        // Handle case where data is directly in res
        setMeasResult({
          type: "manual",
          score: res?.score,
          calculatedAt: res?.calculatedAt,
        });
        toast.success("Meas manual run initiated successfully");
      }
    } catch (err) {
      toast.error("Failed to run Meas manually");
      console.error("Error running meas manually:", err);
    } finally {
      setMeasLoading(false);
    }
  };

  const runMeasMonthly = async () => {
    try {
      setMeasLoading(true);
      toast.info("Running Meas Monthly...");
      const res = await Service.RunMeasMonthly({ managerId, projectId });
      const data = res?.data || res;
      setMeasResult({
        type: "monthly",
        message: data?.message,
        processed: data?.processed,
        validProjects: data?.validProjects,
      });
      toast.success("Meas monthly run initiated successfully");
    } catch (err) {
      toast.error("Failed to run Meas monthly");
      console.error("Error running meas monthly:", err);
    } finally {
      setMeasLoading(false);
    }
  };

  useEffect(() => {
    fetchManagerBias();
  }, [projectId]);

  return (
    <div className="space-y-0 animate-in fade-in duration-500">

      {/* Sub-tab & View Switchers */}
      <div className="flex justify-between items-center mb-6 pr-[36px]">
        {/* Left: Sub-tab Switcher */}
        <div className="flex gap-2">
          {["team", "manager"].map((t) => (
            <button
              key={t}
              onClick={() => setSubTab(t)}
              className={`px-5 py-2 rounded-none font-normal text-sm uppercase tracking-tight border-2 transition-all cursor-pointer ${subTab === t
                ? "bg-green-50 text-black border-green-700/80 hover:bg-green-100 shadow-sm"
                : "bg-white text-black border-gray-300 hover:bg-slate-50 shadow-sm"
                }`}
            >
              {t === "team" ? " Team Analytics" : " Manager Analytics"}
            </button>
          ))}
        </div>

        {/* Right: View Switcher (Only for Team Analytics) */}
        {subTab === "team" && (
          <div className="flex gap-2.5">
            {["by employee", "by task"].map((tab) => (
              <button
                key={tab}
                onClick={() => setView(tab)}
                className={`px-6 py-1.5 rounded-none font-normal text-sm uppercase tracking-tight border-2 transition-all cursor-pointer ${
                  view === tab
                    ? "bg-green-50 text-black border-green-700/80 hover:bg-green-100 shadow-sm"
                    : "bg-white text-black border-gray-300 hover:bg-slate-50 shadow-sm"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ─── TEAM ANALYTICS TAB ─── */}
      {subTab === "team" && (
        <div className="animate-in fade-in duration-300">
          <MeasDashboard projectId={projectId} tasks={tasks} view={view} setView={setView} />
        </div>
      )}

      {/* ─── MANAGER ANALYTICS TAB ─── */}
      {subTab === "manager" && (
        <div className="space-y-8 animate-in fade-in duration-300">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-8 rounded-none border border-black shadow-sm">
              <div className="flex items-center gap-4 mb-8">
                <div className="p-4 bg-blue-50 rounded-none border border-black">
                  <PieChart className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <span className="text-sm font-black text-black/40 uppercase tracking-[0.2em] block mb-1">
                    Project Score
                  </span>
                  <h3 className="text-xl font-black text-black uppercase tracking-tight">
                    Manager Bias
                  </h3>
                </div>
              </div>

              {loadingBias ? (
                <div className="flex flex-col items-center justify-center py-12 gap-3">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                  <span className="text-sm font-bold text-black/40 uppercase tracking-widest">
                    Fetching Analysis...
                  </span>
                </div>
              ) : managerBias ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-50 p-6 rounded-none border border-black">
                      <span className="text-sm font-black text-black/40 uppercase tracking-widest block mb-2">
                        Bias Value
                      </span>
                      <span className="text-3xl font-black text-black">
                        {managerBias.bias || "0.00"}
                      </span>
                    </div>
                    <div className="bg-gray-50 p-6 rounded-none border border-black">
                      <span className="text-sm font-black text-black/40 uppercase tracking-widest block mb-2">
                        Status
                      </span>
                      <span
                        className={`text-sm font-black uppercase tracking-widest px-3 py-1 rounded-none border ${managerBias.interpretation === "BALANCED"
                          ? "bg-green-100 text-green-700 border-green-700/80"
                          : "bg-yellow-100 text-yellow-700 border-yellow-700/80"
                          }`}
                      >
                        {managerBias.interpretation || "N/A"}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 bg-gray-50 rounded-none border border-dashed border-black/20">
                  <p className="text-black/40 font-bold text-sm tracking-tight uppercase">
                    No bias data available
                  </p>
                </div>
              )}
            </div>

            {/* Meas Section */}
            <div className="bg-white p-8 rounded-none border border-black shadow-sm">
              <div className="flex items-center gap-4 mb-8">
                <div className="p-4 bg-green-50 rounded-none border border-black">
                  <Activity className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <span className="text-sm font-black text-black/40 uppercase tracking-[0.2em] block mb-1">
                    Performance Engine
                  </span>
                  <h3 className="text-xl font-black text-black uppercase tracking-tight">
                    Meas Analytics
                  </h3>
                </div>
              </div>

              <div className="space-y-4">
                {measResult ? (
                  <div className="animate-in slide-in-from-bottom-2 fade-in duration-300">
                    <div className="p-5 bg-linear-to-br from-green-50 to-emerald-100/50 rounded-none border border-black mb-6 text-center shadow-sm">
                      {measResult.type === "manual" ? (
                        <>
                          <span className="text-sm font-black text-green-800/60 uppercase tracking-widest block mb-1">
                            Calculated Score
                          </span>
                          <span className="text-4xl font-black text-green-700">
                            {measResult.score !== undefined
                              ? Number(measResult.score).toFixed(2)
                              : "0.00"}
                          </span>
                          <span className="text-sm font-black text-green-800/40 uppercase tracking-widest block mt-2">
                            {measResult.calculatedAt
                              ? `Calculated On: ${new Date(measResult.calculatedAt).toLocaleString()}`
                              : "Recently Calculated"}
                          </span>
                        </>
                      ) : (
                        <>
                          <span className="text-sm font-black text-green-800/60 uppercase tracking-widest block mb-1">
                            Monthly Analytics
                          </span>
                          <span className="text-base font-black text-green-700 block my-2 px-2 leading-tight">
                            {measResult.message}
                          </span>
                          <span className="text-sm font-black text-green-800/40 uppercase tracking-widest block mt-2">
                            Processed {measResult.processed || 0} of{" "}
                            {measResult.validProjects || 0} valid projects
                          </span>
                        </>
                      )}
                    </div>
                    <button
                      onClick={() => setMeasResult(null)}
                      className="w-full py-2 bg-white text-black border-2 border-black/80 hover:bg-slate-50 rounded-none text-sm font-bold uppercase tracking-tight shadow-sm transition-all cursor-pointer"
                    >
                      Clear Result
                    </button>
                  </div>
                ) : (
                  <>
                    <button
                      onClick={runMeasManually}
                      disabled={measLoading}
                      className="w-full flex items-center justify-center gap-3 px-6 py-2.5 bg-green-50 text-black border-2 border-green-700/80 hover:bg-green-100 rounded-none font-bold text-sm uppercase tracking-tight shadow-sm transition-all cursor-pointer group disabled:opacity-50"
                    >
                      {measLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Play className="w-4 h-4 fill-black group-hover:scale-110 transition-transform" />
                      )}
                      Run Meas Manually
                    </button>
                    <button
                      onClick={runMeasMonthly}
                      disabled={measLoading}
                      className="w-full flex items-center justify-center gap-3 px-6 py-2.5 bg-white text-black border-2 border-black/80 hover:bg-slate-50 rounded-none font-bold text-sm uppercase tracking-tight shadow-sm transition-all cursor-pointer group disabled:opacity-50"
                    >
                      {measLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Activity className="w-4 h-4" />
                      )}
                      Run Meas Monthly
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Admin Analytics Overview */}
          {adminAnalytics && (
            <div className="bg-white p-8 rounded-none border border-black shadow-sm mt-8 animate-in slide-in-from-bottom-2 fade-in duration-500">
              <div className="flex items-center gap-4 mb-8">
                <div className="p-3 bg-purple-50 rounded-none border border-black">
                  <Target className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <span className="text-sm font-black text-black/40 uppercase tracking-[0.2em] block mb-1">
                    Executive Overview
                  </span>
                  <h3 className="text-xl font-black text-black uppercase tracking-tight">
                    Manager Performance Analytics
                  </h3>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
                {/* MEAS Score Card */}
                <div className="bg-gray-50 p-6 rounded-none border border-black flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] font-black text-black/40 uppercase tracking-widest mb-1 flex items-center justify-between">
                      MEAS Score
                      <TrendingUp className="w-3 h-3 text-black/40" />
                    </span>
                    <span className="text-5xl font-black text-black block my-4">
                      {adminAnalytics.measScore?.score !== undefined
                        ? Number(adminAnalytics.measScore.score).toFixed(1)
                        : "N/A"}
                    </span>
                  </div>
                  <div className="bg-white p-3 rounded-none border border-black flex items-center gap-2">
                    <span className="text-xs font-bold text-gray-700">
                      {adminAnalytics.measInsight || "No insight available."}
                    </span>
                  </div>
                </div>

                {/* Bias Analytics */}
                <div className="bg-gray-50 p-6 rounded-none border border-black flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] font-black text-black/40 uppercase tracking-widest mb-1 flex items-center justify-between">
                      Bias Score
                      <Activity className="w-3 h-3 text-black/40" />
                    </span>
                    <span className="text-4xl font-black text-black block my-4">
                      {adminAnalytics.biasScore !== undefined
                        ? Number(adminAnalytics.biasScore).toFixed(3)
                        : "N/A"}
                    </span>
                    <span
                      className={`inline-block text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-none border mb-4 ${adminAnalytics.biasInterpretation === "BALANCED"
                        ? "bg-green-100 text-green-700 border-green-700/80"
                        : "bg-yellow-100 text-yellow-700 border-yellow-700/80"
                        }`}
                    >
                      {adminAnalytics.biasInterpretation || "UNKNOWN"}
                    </span>
                  </div>
                  <p className="text-xs font-bold text-gray-600 leading-snug">
                    {adminAnalytics.biasInsight || "Pending analysis."}
                  </p>
                </div>

                {/* Allocation Metrics */}
                <div className="bg-gray-50 p-6 rounded-none border border-black flex flex-col justify-between">
                  <span className="text-[10px] font-black text-black/40 uppercase tracking-widest mb-4 flex items-center justify-between">
                    Resource Allocation
                    <AlertTriangle className="w-3 h-3 text-black/40" />
                  </span>
                  <div className="space-y-4">
                    <div className="bg-red-50/50 p-4 rounded-none border border-black">
                      <span className="text-[9px] font-black text-red-800/60 uppercase tracking-widest block mb-1">
                        Overrun
                      </span>
                      <span className="text-2xl font-black text-red-600">
                        {adminAnalytics.overrunPercent !== undefined
                          ? `${Number(adminAnalytics.overrunPercent).toFixed(1)}%`
                          : "0%"}
                      </span>
                    </div>
                    <div className="bg-blue-50/50 p-4 rounded-none border border-black">
                      <span className="text-[9px] font-black text-blue-800/60 uppercase tracking-widest block mb-1">
                        Underutilized
                      </span>
                      <span className="text-2xl font-black text-blue-600">
                        {adminAnalytics.underutilizedPercent !== undefined
                          ? `${Number(adminAnalytics.underutilizedPercent).toFixed(1)}%`
                          : "0%"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Task Summary */}
                <div className="bg-gray-50 p-6 rounded-none border border-black flex flex-col">
                  <span className="text-[10px] font-black text-black/40 uppercase tracking-widest mb-4 flex items-center justify-between">
                    Task Breakdown
                    <ListTodo className="w-3 h-3 text-black/40" />
                  </span>
                  <div className="flex-1 space-y-2 h-[15vh] overflow-auto pr-2 custom-scrollbar">
                    {adminAnalytics.taskSummary &&
                      adminAnalytics.taskSummary.length > 0 ? (
                      adminAnalytics.taskSummary.map((ts, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-3 bg-white rounded-none border border-black"
                        >
                          <span className="text-xs font-bold text-gray-700 uppercase">
                            {ts.status?.replace("_", " ")}
                          </span>
                          <span className="text-sm font-black text-black bg-gray-100 px-2 py-0.5 rounded-none border border-black">
                            {ts._count?.id || 0}
                          </span>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-6 text-gray-400 font-bold text-xs uppercase">
                        No tasks found
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Trendline Section */}
              {adminTrendline && adminTrendline.length > 0 && (
                <div className="bg-gray-50 p-6 rounded-none border border-black">
                  <span className="text-[10px] font-black text-black/40 uppercase tracking-widest block mb-6">
                    MEAS Score Trend (6 Months)
                  </span>
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={adminTrendline}
                        margin={{ top: 5, right: 20, left: -20, bottom: 5 }}
                      >
                        <CartesianGrid
                          strokeDasharray="3 3"
                          vertical={false}
                          stroke="#e5e7eb"
                        />
                        <XAxis
                          dataKey="period"
                          axisLine={false}
                          tickLine={false}
                          tick={{ fontSize: 10, fontWeight: 700, fill: "#9ca3af" }}
                          dy={10}
                        />
                        <YAxis
                          axisLine={false}
                          tickLine={false}
                          tick={{ fontSize: 10, fontWeight: 700, fill: "#9ca3af" }}
                          domain={[0, 100]}
                        />
                        <Tooltip
                          contentStyle={{
                            borderRadius: "0px",
                            border: "1px solid #000000",
                            boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                            fontSize: "12px",
                            fontWeight: "bold",
                            textTransform: "uppercase",
                          }}
                          itemStyle={{ color: "#111827", fontWeight: 900 }}
                        />
                        <Line
                          type="monotone"
                          dataKey="score"
                          stroke="#8b5cf6"
                          strokeWidth={3}
                          dot={{
                            r: 4,
                            fill: "#8b5cf6",
                            strokeWidth: 2,
                            stroke: "#fff",
                          }}
                          activeDot={{ r: 6, fill: "#8b5cf6", strokeWidth: 0 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Manager Bias Section */}
          <div className="bg-gray-50 p-6 rounded-none border border-black mt-4 mb-6">
            <div className="flex items-center gap-2 mb-4">
              <h4 className="text-[12px] font-black text-black">
                Score Range for Meas Analytics:
              </h4>
              <span className="bg-gray-200 text-gray-700 text-[10px] px-2 py-0.5 rounded-none border border-black font-mono">
                0 &rarr; 100
              </span>
            </div>
            <div className="overflow-x-auto rounded-none border border-black bg-white mb-6">
              <table className="w-full text-sm text-left">
                <thead className="text-[10px] text-gray-500 bg-gray-50 uppercase font-black tracking-widest border-b border-black">
                  <tr>
                    <th
                      scope="col"
                      className="px-4 py-3 border-r border-black"
                    >
                      Score
                    </th>
                    <th scope="col" className="px-4 py-3 text-center">
                      Meaning
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-black/10">
                    <td className="px-4 py-3 font-bold text-gray-800 border-r border-black/10">
                      100
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-600">
                      Perfect estimation accuracy
                    </td>
                  </tr>
                  <tr className="border-b border-black/10 bg-gray-50/50">
                    <td className="px-4 py-3 font-bold text-gray-800 border-r border-black/10">
                      &gt; 80
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-600">
                      Good, reliable estimation
                    </td>
                  </tr>
                  <tr className="border-b border-black/10">
                    <td className="px-4 py-3 font-bold text-gray-800 border-r border-black/10">
                      &lt; 60
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-600">
                      Poor estimation accuracy
                    </td>
                  </tr>
                  <tr className="bg-white">
                    <td className="px-4 py-3 font-bold text-gray-800 border-r border-black/10">
                      &lt; 40
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-600">
                      Requires immediate oversight
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <h4 className="text-[14px] font-black text-black flex items-center gap-2 mb-3">
              <span className="text-red-500 text-lg">🎯</span> MEAS Reveals:
            </h4>
            <ul className="space-y-2 text-sm text-gray-700 pl-4 list-disc marker:text-gray-400">
              <li>
                Managers who <span className="font-bold">under-allocate</span> to
                artificially increase team &quot;efficiency&quot;
              </li>
              <li>
                Managers who <span className="font-bold">over-allocate</span>{" "}
                (padding work, slowing throughput)
              </li>
              <li>
                Managers who are{" "}
                <span className="font-bold">accurate and consistent</span>
              </li>
              <li>
                Projects with <span className="font-bold">high risk</span> due to
                poor planning
              </li>
              <li>
                Employees suffering from{" "}
                <span className="font-bold">unrealistic deadlines</span>
              </li>
            </ul>
          </div>

          <div className="bg-gray-50 p-6 rounded-none border border-black mt-4">
            <h4 className="text-[12px] font-black text-black uppercase tracking-widest mb-4">
              Interpretation Table for Manager Bias
            </h4>
            <div className="overflow-x-auto rounded-none border border-black bg-white">
              <table className="w-full text-sm text-left">
                <thead className="text-[10px] text-gray-500 bg-gray-50 uppercase font-black tracking-widest">
                  <tr>
                    <th
                      scope="col"
                      className="px-4 py-3 border-b border-black/10"
                    >
                      Bias Value
                    </th>
                    <th
                      scope="col"
                      className="px-4 py-3 border-b border-black/10"
                    >
                      Meaning
                    </th>
                    <th
                      scope="col"
                      className="px-4 py-3 border-b border-black/10"
                    >
                      Behavior
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-gray-100">
                    <td className="px-4 py-3 font-bold text-gray-800 whitespace-nowrap">
                      &gt; +0.20 (+20%)
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-600">
                      Manager consistently under-estimates
                    </td>
                    <td className="px-4 py-3 font-bold text-red-600 whitespace-nowrap">
                      ❌ Unrealistic deadlines — BAD
                    </td>
                  </tr>
                  <tr className="border-b border-gray-100 bg-gray-50/50">
                    <td className="px-4 py-3 font-bold text-gray-800 whitespace-nowrap">
                      &lt; -0.20 (-20%)
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-600">
                      Manager consistently over-estimates
                    </td>
                    <td className="px-4 py-3 font-bold text-amber-600 whitespace-nowrap flex items-center gap-1">
                      <span className="text-[10px]">⚠️</span> Inefficient planning —
                      padding
                    </td>
                  </tr>
                  <tr className="bg-white">
                    <td className="px-4 py-3 font-bold text-gray-800 whitespace-nowrap">
                      -0.20 &rarr; +0.20
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-600">
                      Healthy, balanced estimation
                    </td>
                    <td className="px-4 py-3 font-bold text-green-600 whitespace-nowrap">
                      ✅ GOOD
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

    </div>
  );
};

export default TeamsAnalytics;
