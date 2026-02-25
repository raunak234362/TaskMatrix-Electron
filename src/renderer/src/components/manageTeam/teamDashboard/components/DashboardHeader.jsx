import { Search, Plus, FileText, Calendar } from "lucide-react";
import Button from "../../../fields/Button";
import DateFilter from "../../../common/DateFilter";

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
    <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6 mb-10">

      <div className="flex flex-wrap items-center gap-4">
        {/* Search */}
        <div className="relative group">
          <Search
            className="absolute left-4 top-1/2 -translate-y-1/2 text-black/40 group-focus-within:text-black transition-colors"
            size={20}
          />
          <input
            type="text"
            placeholder="Search teams..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-12 pr-6 py-3 bg-white border border-black/10 rounded-full text-sm font-bold text-black focus:outline-none focus:ring-4 focus:ring-green-500/10 transition-all w-full md:w-64 placeholder:text-black/30 placeholder:font-normal"
          />
        </div>

        {/* Date Filter */}
        <DateFilter
          dateFilter={dateFilter}
          setDateFilter={onDateFilterChange}
        />

        {/* Action Buttons */}
        <Button
          onClick={onAddTeam}
          className="flex items-center gap-2 px-6 py-3 bg-green-200 text-black border border-black rounded-full font-black text-xs uppercase tracking-wider hover:bg-[#6bbd45]/90 transition-all shadow-sm active:scale-95"
        >
          <Plus size={20} strokeWidth={3} />
          <span>Add Team</span>
        </Button>

        <Button
          onClick={onGenerateReport}
          className="flex items-center gap-2 px-6 py-3 bg-white border border-black/10 rounded-full text-black font-black text-xs uppercase tracking-wider hover:bg-gray-50 transition-all shadow-sm active:scale-95"
        >
          <FileText size={20} className="text-black/40" />
          <span>Report</span>
        </Button>

        <Button
          onClick={onDailyReport}
          className="flex items-center gap-2 px-6 py-3 bg-white border border-black/10 rounded-full text-black font-black text-xs uppercase tracking-wider hover:bg-gray-50 transition-all shadow-sm active:scale-95"
        >
          <Calendar size={20} className="text-black/40" />
          <span>Daily Report</span>
        </Button>
      </div>
    </div>
  );
};

export default DashboardHeader;
