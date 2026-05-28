import React from 'react';

const ProjectStatusTabs = ({ stats, statusFilter, setStatusFilter }) => {
  const tabsConfig = [
    {
      id: "All Statuses",
      label: "Total",
      count: stats.total,
      activeBg: "bg-indigo-200",
      activeBorder: "border-indigo-300",
      inactiveBg: "bg-indigo-100",
      inactiveBorder: "border-indigo-100",
      hoverBg: "hover:bg-indigo-100/50",
      textClass: "text-indigo-600",
      countTextClass: "text-indigo-700"
    },
    {
      id: "ACTIVE",
      label: "Active",
      count: stats.active,
      activeBg: "bg-blue-200",
      activeBorder: "border-blue-300",
      inactiveBg: "bg-blue-100",
      inactiveBorder: "border-blue-100",
      hoverBg: "hover:bg-blue-100/50",
      textClass: "text-blue-600",
      countTextClass: "text-blue-700"
    },
    {
      id: "COMPLETE",
      label: "Completed",
      count: stats.completed,
      activeBg: "bg-green-200",
      activeBorder: "border-green-300",
      inactiveBg: "bg-green-100",
      inactiveBorder: "border-green-100",
      hoverBg: "hover:bg-green-100/50",
      textClass: "text-green-600",
      countTextClass: "text-green-700"
    },
    {
      id: "ONHOLD",
      label: "On Hold",
      count: stats.onHold,
      activeBg: "bg-red-200",
      activeBorder: "border-red-300",
      inactiveBg: "bg-red-100",
      inactiveBorder: "border-red-100",
      hoverBg: "hover:bg-red-100/50",
      textClass: "text-red-900",
      countTextClass: "text-red-900"
    },
    {
      id: "INACTIVE",
      label: "In-Active",
      count: stats.inActive,
      activeBg: "bg-yellow-200",
      activeBorder: "border-yellow-300",
      inactiveBg: "bg-yellow-100",
      inactiveBorder: "border-yellow-100",
      hoverBg: "hover:bg-yellow-100/50",
      textClass: "text-yellow-600",
      countTextClass: "text-yellow-700"
    }
  ];

  return (
    <div className="flex flex-wrap items-center gap-2 md:gap-3">
      {tabsConfig.map((tab) => {
        const isActive = statusFilter === tab.id;
        return (
          <div
            key={tab.id}
            onClick={() => setStatusFilter(tab.id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border-2 cursor-pointer transition-all ${
              isActive 
                ? 'bg-green-800 border-green-200 text-white shadow-md scale-105' 
                : 'bg-green-700 border-white text-white hover:bg-green-800 shadow-sm'
            }`}
          >
            <span className="text-xs font-semibold uppercase tracking-wide">
              {tab.label} -
            </span>
            <span className="text-xs font-bold">
              {tab.count}
            </span>
          </div>
        );
      })}
    </div>
  );
};

export default ProjectStatusTabs;
