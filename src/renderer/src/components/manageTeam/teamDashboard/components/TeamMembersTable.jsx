import { useMemo } from "react";
import DataTable from "../../../ui/table";
import { motion } from "framer-motion";

const TeamMembersTable = ({
  tableData,
  onMemberClick,
  formatToHoursMinutes,
  getEfficiencyColorClass,
}) => {
  console.log(tableData);

  const columns = useMemo(
    () => [
      {
        header: "Name",
        accessorKey: "name",
        cell: ({ row }) => (
          <div
            className="font-semibold cursor-pointer hover:text-black transition-colors"
            onClick={() => onMemberClick(row.original.id)}
          >
            {row.original.name}
          </div>
        ),
      },
      {
        header: "Role",
        accessorKey: "role",
        cell: ({ row }) => (
          <span className="px-3 py-1 inline-flex text-xs leading-5 font-bold uppercase tracking-widest rounded-full bg-gray-100 text-black border border-black/5">
            {row.original.role}
          </span>
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
      },
      {
        header: "Tasks (C/T)",
        accessorKey: "tasks",
        cell: ({ row }) => (
          <div className="flex flex-col gap-1.5 w-32">
            <div className="text-xs font-bold text-black uppercase tracking-widest flex justify-between">
              <span>
                {row.original.completedTasks}/{row.original.totalTasks}
              </span>
              <span className="text-black/40">
                {row.original.totalTasks > 0
                  ? Math.round(
                    (row.original.completedTasks / row.original.totalTasks) * 100
                  )
                  : 0}
                %
              </span>
            </div>
            <div className="w-full h-2 bg-gray-100 rounded-full border border-black/5 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{
                  width: `${row.original.totalTasks > 0
                    ? (row.original.completedTasks / row.original.totalTasks) * 100
                    : 0
                    }%`,
                }}
                transition={{ duration: 1, ease: "easeOut" }}
                className="h-full bg-[#6bbd45] rounded-full"
              />
            </div>
          </div>
        ),
      },
      {
        header: "Efficiency",
        accessorKey: "efficiency",
        cell: ({ row }) => (
          <span
            className={`px-4 py-1.5 inline-flex text-xs font-bold uppercase tracking-tighter rounded-full border shadow-sm ${getEfficiencyColorClass(
              row.original.efficiency
            )}`}
          >
            {row.original.efficiency}%
          </span>
        ),
      },
    ],
    [onMemberClick, formatToHoursMinutes, getEfficiencyColorClass]
  );

  return (
    <div className="bg-white rounded-[2.5rem] border border-black/5 shadow-soft overflow-hidden mb-12">
      <div className="px-8 py-6 border-b border-black/5 bg-gray-50/30">
        <h3 className="text-2xl font-black text-black uppercase tracking-tight">
          Team Members Performance
        </h3>

      </div>
      <div className="p-6">
        <DataTable
          columns={columns}
          data={tableData}
          showColumnToggle={false}
        />
      </div>
    </div>
  );
};

export default TeamMembersTable;
