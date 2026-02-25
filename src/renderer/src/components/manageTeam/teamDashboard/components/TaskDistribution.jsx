import { useMemo, useState } from "react";
import {
  CheckCircle2,
  Circle,
  Layers,
  PenTool,
  HardHat,
  FileSearch,
  ChevronDown,
  User,
} from "lucide-react";

const TaskDistribution = ({ teamStats }) => {
  const [expandedIndex, setExpandedIndex] = useState(null);
  console.log(teamStats);

  const distributionData = useMemo(() => {
    const counts = teamStats.taskTypeCounts || {};
    const details = teamStats.taskTypeDetails || {};

    return [
      {
        label: "Modelling",
        value: counts.modelling || 0,
        tasks: details.modelling || [],
        icon: Layers,
        color: "text-green-700",
        bg: "bg-green-100",
      },
      {
        label: "Model Checking",
        value: counts.modeling_checking || 0,
        tasks: details.modeling_checking || [],
        icon: CheckCircle2,
        color: "text-emerald-600",
        bg: "bg-emerald-50",
      },
      {
        label: "Detailing",
        value: counts.detailing || 0,
        tasks: details.detailing || [],
        icon: PenTool,
        color: "text-teal-600",
        bg: "bg-teal-50",
      },
      {
        label: "Detail Checking",
        value: counts.detail_checking || 0,
        tasks: details.detail_checking || [],
        icon: FileSearch,
        color: "text-cyan-600",
        bg: "bg-cyan-50",
      },
      {
        label: "Erection",
        value: counts.erection || 0,
        tasks: details.erection || [],
        icon: HardHat,
        color: "text-green-800",
        bg: "bg-green-50",
      },
      {
        label: "Erection Checking",
        value: counts.erection_checking || 0,
        tasks: details.erection_checking || [],
        icon: Circle,
        color: "text-lime-600",
        bg: "bg-lime-50",
      },
    ];
  }, [teamStats.taskTypeCounts, teamStats.taskTypeDetails]);

  return (
    <div className="bg-white p-8 rounded-[2.5rem] border border-black/5 shadow-soft mb-12 h-full">
      <h3 className="text-2xl font-black text-black mb-8 flex items-center gap-3 uppercase tracking-tight">
        <Layers className="text-[#6bbd45]" size={24} strokeWidth={2.5} />
        Task Distribution
        <span className="text-[10px] font-black text-[#4b8a2e] ml-auto bg-green-50 px-3 py-1.5 rounded-full border border-[#6bbd45]/20 uppercase tracking-widest">
          Task Counts
        </span>
      </h3>

      <div className="space-y-3">
        {distributionData.map((item, index) => {
          const Icon = item.icon;
          return (
            <div
              key={index}
              className={`rounded-2xl border transition-all duration-300 ${expandedIndex === index ? "border-black/10 bg-gray-50/30 shadow-sm" : "border-transparent hover:border-black/5 hover:bg-gray-50/50"}`}
            >
              <div
                onClick={() =>
                  setExpandedIndex(expandedIndex === index ? null : index)
                }
                className={`flex items-center justify-between p-4 group cursor-pointer ${item.tasks.length === 0 ? "opacity-70 pointer-events-none" : ""}`}
              >
                <div className="flex items-center gap-4">
                  <div
                    className={`p-3 rounded-xl ${item.bg} ${item.color} shadow-sm group-hover:scale-105 transition-transform`}
                  >
                    <Icon size={20} strokeWidth={2.5} />
                  </div>
                  <span className="text-black/60 font-bold text-sm tracking-tight group-hover:text-black transition-colors">
                    {item.label}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-black font-black bg-white border border-black/10 px-5 py-2 rounded-xl text-sm shadow-sm group-hover:border-black/20 transition-all">
                    {item.value || 0}
                  </span>
                  {item.tasks.length > 0 && (
                    <ChevronDown
                      size={18}
                      className={`text-black/40 transition-transform duration-300 ${expandedIndex === index ? "rotate-180" : ""}`}
                    />
                  )}
                </div>
              </div>

              {/* Expandable Task List */}
              {expandedIndex === index && item.tasks.length > 0 && (
                <div className="px-5 pb-5 pt-1 animate-in slide-in-from-top-2 fade-in duration-200">
                  <div className="bg-white border border-black/5 rounded-xl shadow-inner max-h-[300px] overflow-y-auto custom-scrollbar p-3 space-y-2">
                    {item.tasks.map((task, tIdx) => (
                      <div
                        key={tIdx}
                        className="p-3 bg-gray-50 rounded-lg border border-black/5 hover:border-black/10 transition-colors"
                      >
                        <div className="flex justify-between items-start gap-4 mb-2">
                          <h4 className="text-xs font-black text-black leading-tight line-clamp-2">
                            {task.name || task.title || "Untitled Task"}
                          </h4>
                          <span
                            className={`px-2 py-1 text-[9px] font-black uppercase tracking-widest rounded-md shrink-0 border ${task.status === "COMPLETE"
                              ? "bg-green-100/50 text-green-700 border-green-200"
                              : task.status === "IN_PROGRESS"
                                ? "bg-blue-100/50 text-blue-700 border-blue-200"
                                : "bg-gray-100 text-gray-600 border-gray-200"
                              }`}
                          >
                            {task.status || "Pending"}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-black/60">
                          <User size={12} className="shrink-0" />
                          <span className="text-[10px] font-bold uppercase tracking-wider truncate">
                            {task.userName}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default TaskDistribution;
