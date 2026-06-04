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
    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8 sm:mb-10">

      <div className="flex flex-wrap items-center gap-3 sm:gap-4">
        {/* Search */}
        <div className="relative group">
          <Search
            className="absolute left-4 top-1/2 -translate-y-1/2 text-black/40 group-focus-within:text-black transition-colors"
            size={16}
          />
          <input
            type="text"
            placeholder="Search teams..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-12 pr-6 py-2 bg-white border-2 border-black/30 focus:border-black rounded-none text-xs font-bold text-black focus:outline-none focus:ring-4 focus:ring-green-500/10 transition-all w-full md:w-64 placeholder:text-black/30 placeholder:font-normal"
          />
        </div>

        {/* Date Filter */}
        <div className="flex items-center gap-2">
          <DateFilter
            dateFilter={dateFilter}
            setDateFilter={onDateFilterChange}
          />
          <button
            onClick={() => onDateFilterChange({ type: "specificDate", date: new Date().toISOString() })}
            className={`
              px-4 py-2 rounded-none text-xs font-bold uppercase tracking-widest transition-all border-2 cursor-pointer
              ${dateFilter?.type === "specificDate" && new Date(dateFilter.date).toDateString() === new Date().toDateString()
                ? "bg-green-50 text-black border-green-700/80"
                : "bg-white text-black/50 border-gray-200 hover:border-black hover:text-black"
              }
            `}
          >
            Today
          </button>
        </div>

        {/* Action Buttons */}
        {onAddTeam && (
          <Button
            onClick={onAddTeam}
            className="flex items-center gap-2 px-4 py-2 bg-green-50 text-black border-2 border-green-700/80 rounded-none font-bold text-xs uppercase tracking-wider hover:bg-green-100 transition-all shadow-sm cursor-pointer"
          >
            <Plus size={16} strokeWidth={3} />
            <span>Add Team</span>
          </Button>
        )}

        <Button
          onClick={onGenerateReport}
          className="flex items-center gap-2 px-4 py-2 bg-green-50 text-black border-2 border-green-700/80 rounded-none font-bold text-xs uppercase tracking-wider hover:bg-green-100 transition-all shadow-sm cursor-pointer"
        >
          <FileText size={16} className="text-black" />
          <span>Report</span>
        </Button>

        <Button
          onClick={onDailyReport}
          className="flex items-center gap-2 px-4 py-2 bg-green-50 text-black border-2 border-green-700/80 rounded-none font-bold text-xs uppercase tracking-wider hover:bg-green-100 transition-all shadow-sm cursor-pointer"
        >
          <Calendar size={16} className="text-black" />
          <span>Daily Report</span>
        </Button>
      </div>
    </div>
  );
};

export default DashboardHeader;
