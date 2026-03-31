import { useMemo, useState } from "react";
import DataTable from "../../../ui/table";
import { motion } from "framer-motion";
import { Search } from "lucide-react";

const TeamMembersTable = ({
  tableData,
  onMemberClick,
  formatToHoursMinutes,
  getEfficiencyColorClass,
  activeFilter,
  onFilterChange,
  memberCounts,
}) => {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredData = useMemo(() => {
    if (!searchTerm.trim()) return tableData;
    return (tableData || []).filter((member) =>
      String(member.name || "").toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [tableData, searchTerm]);

  console.log(tableData);

  const columns = useMemo(
    () => [
      {
        header: "Name",
        accessorKey: "name",
        cell: ({ row }) => (
          <div className="font-semibold text-black">
            {row.original.name}
          </div>
        ),
      },
      {
        header: "Role",
        accessorKey: "role",
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 inline-flex text-xs leading-5 font-bold uppercase tracking-widest rounded-full bg-gray-100 text-black border border-black/5">
              {row.original.role}
            </span>
            {row.original.isAbsent && (
              <span className="px-3 py-1 inline-flex text-[10px] leading-5 font-black uppercase tracking-widest rounded-full bg-red-100 text-red-600 border border-red-200 shadow-sm animate-pulse">
                Absent
              </span>
            )}
          </div>
        ),
      },
      {
        header: "Assigned Hours",
        accessorKey: "assignedHours",
        cell: ({ row }) => (
          <span className="text-sm font-medium text-black">
            {formatToHoursMinutes(Number(row.original.assignedHours))}
          </span>
        ),
      },
      {
        header: "Worked Hours",
        accessorKey: "workedHours",
        cell: ({ row }) => (
          <span className="text-sm font-medium text-black">
            {formatToHoursMinutes(Number(row.original.workedHours))}
          </span>
        ),
      }
    ],
    [formatToHoursMinutes]
  );

  return (
    <div className="bg-white rounded-[2.5rem] border border-black/5 shadow-soft overflow-hidden mb-8 sm:mb-12">
      <div className="px-4 sm:px-8 py-4 sm:py-6 border-b border-black/5 bg-gray-50/30 flex flex-col xl:flex-row xl:items-center justify-between gap-6">
        <div className="flex flex-col gap-1">
          <h3 className="text-2xl text-black uppercase tracking-tight">
            Team Members Performance
          </h3>
          <p className="text-[10px] font-black text-black/40 uppercase tracking-widest">
            Detailed breakdown of member workload and efficiency
          </p>
        </div>

        {/* Filter Tabs */}
        <div className="flex flex-wrap items-center gap-2">
          {[
            { id: "all", label: "All Members", count: memberCounts?.all || 0, color: "gray" },
            { id: "not_assigned", label: "Not Assigned", count: memberCounts?.not_assigned || 0, color: "orange" },
            { id: "under_assigned", label: "Under 8h", count: memberCounts?.under_assigned || 0, color: "yellow" },
            { id: "absent", label: "Absent", count: memberCounts?.absent || 0, color: "red" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => onFilterChange(tab.id)}
              className={`
                px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2.5 transition-all border
                ${activeFilter === tab.id
                  ? "bg-black text-white border-black shadow-lg scale-105"
                  : "bg-white text-black/60 border-black/10 hover:border-black/30 hover:text-black"
                }
              `}
            >
              <span>{tab.label}</span>
              <span className={`
                px-1.5 py-0.5 rounded-md text-[9px] font-bold
                ${activeFilter === tab.id
                  ? "bg-white/20 text-white"
                  : "bg-gray-100 text-black/40"
                }
              `}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Search Bar */}
        <div className="relative w-full xl:w-64 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-black transition-colors" />
          <input
            type="text"
            placeholder="Search by name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-6 py-3 bg-white border border-black/10 rounded-full text-xs font-bold focus:outline-none focus:border-black/30 transition-all placeholder:text-gray-400 shadow-sm"
          />
        </div>
      </div>
      <div className="p-4 sm:p-6 overflow-x-auto custom-scrollbar">
        <DataTable
          columns={columns}
          data={filteredData}
          onRowClick={(row) => onMemberClick(row.id)}
          showColumnToggle={false}
        />
      </div>
    </div>
  );
};

export default TeamMembersTable;
