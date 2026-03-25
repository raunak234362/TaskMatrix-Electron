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
          <div className="font-semibold text-black">
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
      }
    ],
    [formatToHoursMinutes]
  );

  return (
    <div className="bg-white rounded-[2.5rem] border border-black/5 shadow-soft overflow-hidden mb-8 sm:mb-12">
      <div className="px-4 sm:px-8 py-4 sm:py-6 border-b border-black/5 bg-gray-50/30">
        <h3 className="text-2xl text-black uppercase tracking-tight">
          Team Members Performance
        </h3>

      </div>
      <div className="p-4 sm:p-6 overflow-x-auto custom-scrollbar">
        <DataTable
          columns={columns}
          data={tableData}
          onRowClick={(row) => onMemberClick(row.id)}
          showColumnToggle={false}
        />
      </div>
    </div>
  );
};

export default TeamMembersTable;
