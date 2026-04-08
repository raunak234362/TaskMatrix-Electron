import { useMemo, useState } from "react";
import DataTable from "../../../ui/table";
import { motion } from "framer-motion";
import { Search, Download } from "lucide-react";

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


  const handleDownloadCSV = () => {
    const headers = ["S.NO", "NAME", "ROLE", "ASSIGNED HOURS", "WORKED HOURS", "STATUS"];
    const rows = filteredData.map((member, index) => [
      index + 1,
      member.name || "N/A",
      member.role || "N/A",
      formatToHoursMinutes(Number(member.assignedHours)),
      formatToHoursMinutes(Number(member.workedHours)),
      member.isAbsent ? "ABSENT" : "ACTIVE"
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const timestamp = new Date().toISOString().split('T')[0];
    const fileName = `team_performance_${activeFilter}_${timestamp}.csv`;

    link.setAttribute("href", url);
    link.setAttribute("download", fileName);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

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
    <div className="bg-white rounded-lg border border-black/5 shadow-soft overflow-hidden mb-8 sm:mb-12">
      <div className="px-4 sm:px-8 py-5 sm:py-6 border-b border-black/5 bg-gray-50/30 flex flex-col lg:flex-row lg:items-center justify-between gap-4 sm:gap-6">
        <div className="flex-shrink-0">
          <h3 className="text-lg sm:text-xl lg:text-lg xl:text-2xl text-black uppercase tracking-tight font-bold">
            Team Members Performance
          </h3>
        </div>

        <div className="grid grid-cols-2 gap-2 w-full lg:w-[450px] flex-shrink-0">
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
                w-full px-3 py-2 rounded-xl text-[10px] sm:text-[10px] font-bold uppercase tracking-widest flex items-center justify-between gap-2 transition-all border
                ${activeFilter === tab.id
                  ? "bg-primary/50 text-black border-black shadow-lg scale-[1.02]"
                  : "bg-primary/10 text-black border-black/10 hover:border-black/30 hover:text-black"
                }
              `}
            >
              <span className="whitespace-nowrap">{tab.label}</span>
              <span className={`
                flex-shrink-0 px-1.5 py-0.5 rounded-md text-[10px] font-bold
                ${activeFilter === tab.id
                  ? "bg-white/20 text-black"
                  : "bg-gray-100 text-black/60"
                }
              `}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Search & Actions */}
        <div className="flex items-center gap-3 w-full lg:w-auto lg:min-w-[300px]">
          {/* Search Bar */}
          <div className="relative flex-1 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-black transition-colors" />
            <input
              type="text"
              placeholder="Search by name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 sm:py-3 bg-white border border-black/10 rounded-lg text-[10px] sm:text-xs font-bold focus:outline-none focus:border-black/30 transition-all placeholder:text-gray-400 shadow-sm"
            />
          </div>

          {/* Download Button */}
          <button
            onClick={handleDownloadCSV}
            title="Download CSV"
            className="p-2.5 sm:p-3 bg-primary/10 border border-black/60 rounded-full hover:border-black/30 hover:bg-black group transition-all duration-300 shadow-sm flex-shrink-0"
          >
            <Download className="w-4 h-4 text-black group-hover:text-white transition-colors" />
          </button>
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
