import React, { useMemo } from "react";
import { CheckCircle2, Circle, Layers, PenTool, HardHat, FileSearch } from "lucide-react";


const TaskDistribution = ({ teamStats }) => {
  const distributionData = useMemo(() => {
    const counts = teamStats?.taskTypeCounts || {};

    return [
      { label: "Modelling", value: counts.modelling || 0, icon: PenTool, color: "text-green-700", bg: "bg-green-100" },
      { label: "Model Checking", value: counts.modelChecking || 0, icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-50" },
      { label: "Detailing", value: counts.detailing || 0, icon: Layers, color: "text-teal-600", bg: "bg-teal-50" },
      { label: "Detail Checking", value: counts.detailChecking || 0, icon: FileSearch, color: "text-cyan-600", bg: "bg-cyan-50" },
      { label: "Erection", value: counts.erection || 0, icon: HardHat, color: "text-green-800", bg: "bg-green-50" },
      { label: "Erection Checking", value: counts.erectionChecking || 0, icon: Circle, color: "text-lime-600", bg: "bg-lime-50" },
    ];
  }, [teamStats?.taskTypeCounts]);

  return (
    <div className="bg-white p-6 rounded-[2rem] border border-green-50 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] mb-8 h-full">
      <h3 className="text-xl  text-gray-800 mb-6 flex items-center gap-2">
        <Layers className="text-green-600" size={24} />
        Task Distribution
        <span className="text-xs  text-green-700 ml-auto bg-green-50 px-3 py-1.5 rounded-lg border border-green-100">Task Counts</span>
      </h3>

      <div className="space-y-4">
        {distributionData.map((item, index) => {
          const Icon = item.icon;
          return (
            <div key={index} className="flex items-center justify-between p-3.5 hover:bg-green-50/30 rounded-2xl transition-colors group">
              <div className="flex items-center gap-4">
                <div className={`p-2.5 rounded-xl ${item.bg} ${item.color}`}>
                  <Icon size={20} />
                </div>
                <span className="text-gray-600  text-sm group-hover:text-gray-900">{item.label}</span>
              </div>
              <span className="text-gray-800 font-extrabold bg-gray-50 border border-gray-100 px-4 py-1.5 rounded-xl text-sm shadow-sm">
                {item.value || 0}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  );
};

export default TaskDistribution;
