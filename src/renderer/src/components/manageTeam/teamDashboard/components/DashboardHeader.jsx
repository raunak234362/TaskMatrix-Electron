import React from "react";
import { Search, Plus, FileText, Calendar, Filter } from "lucide-react";
import Button from "../../../fields/Button";


const DashboardHeader = ({
  onAddTeam,
  searchTerm,
  onSearchChange,
  dateFilter,
  onDateFilterChange,
  onGenerateReport,
  onDailyReport,
}) => {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
      <div>
        <h1 className="text-2xl  text-gray-700">
          Team Performance Dashboard
        </h1>
        <p className="text-gray-700 text-sm">
          Monitor and analyze team efficiency and task distribution
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            size={18}
          />
          <input
            type="text"
            placeholder="Search teams..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all w-full md:w-64"
          />
        </div>

        <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-3 py-2">
          <Filter size={16} className="text-gray-400" />
          <select
            value={dateFilter.type}
            onChange={(e) =>
              onDateFilterChange({ ...dateFilter, type: e.target.value })
            }
            className="text-sm text-gray-700 bg-transparent focus:outline-none cursor-pointer"
          >
            <option value="all">All Time</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="year">This Year</option>
          </select>
        </div>

        <Button
          onClick={onAddTeam}
          className="flex items-center gap-2 px-6 py-3 bg-green-500 text-white rounded-[1.25rem] font-semibold hover:bg-green-600 transition-all shadow-[0_8px_20px_-4px_rgba(34,197,94,0.4)] hover:shadow-[0_12px_24px_-4px_rgba(34,197,94,0.5)]"
        >
          <Plus size={20} />
          <span>Add Team</span>
        </Button>

        <Button
          onClick={onGenerateReport}
          className="flex items-center gap-2 px-6 py-3 bg-white border border-gray-100 rounded-[1.25rem] text-gray-600 font-semibold hover:bg-green-50 hover:text-green-700 hover:border-green-200 transition-all shadow-sm"
        >
          <FileText size={20} />
          <span>Report</span>
        </Button>

        <Button
          onClick={onDailyReport}
          className="flex items-center gap-2 px-6 py-3 bg-white border border-gray-100 rounded-[1.25rem] text-gray-600 font-semibold hover:bg-green-50 hover:text-green-700 hover:border-green-200 transition-all shadow-sm"
        >
          <Calendar size={20} />
          <span>Daily Report</span>
        </Button>
      </div>
    </div>
  );
};

export default DashboardHeader;
