import React, { useMemo } from "react";
import DataTable from "../../../ui/table";


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
            className="font-medium text-gray-700 cursor-pointer hover:text-green-600 transition-colors"
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
          <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-700">
            {row.original.role}
          </span>
        ),
      },
      {
        header: "Assigned Hours",
        accessorKey: "assignedHours",
        cell: ({ row }) => (
          <span className="text-sm text-gray-700">
            {formatToHoursMinutes(Number(row.original.assignedHours))}
          </span>
        ),
      },
      {
        header: "Worked Hours",
        accessorKey: "workedHours",
        cell: ({ row }) => (
          <span className="text-sm text-gray-700">
            {formatToHoursMinutes(Number(row.original.workedHours))}
          </span>
        ),
      },
      {
        header: "Tasks (C/T)",
        accessorKey: "tasks",
        cell: ({ row }) => (
          <div className="flex flex-col gap-1 w-32">
            <div className="text-sm text-gray-700 flex justify-between">
              <span>
                {row.original.completedTasks}/{row.original.totalTasks}
              </span>
              <span className="text-xs text-gray-400">
                {row.original.totalTasks > 0
                  ? Math.round(
                    (row.original.completedTasks / row.original.totalTasks) *
                    100
                  )
                  : 0}
                %
              </span>
            </div>
            <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-green-500 rounded-full transition-all duration-500"
                style={{
                  width: `${row.original.totalTasks > 0
                    ? (row.original.completedTasks /
                      row.original.totalTasks) *
                    100
                    : 0
                    }%`,
                }}
              ></div>
            </div>
          </div>
        ),
      },
      {
        header: "Efficiency",
        accessorKey: "efficiency",
        cell: ({ row }) => (
          <span
            className={`px-3 py-1 inline-flex text-xs leading-5  rounded-full ${getEfficiencyColorClass(
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
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-8">
      <div className="p-6 border-b border-gray-50">
        <h3 className="text-lg  text-gray-700">
          Team Members Performance
        </h3>
        <p className="text-sm text-gray-700">
          Individual metrics for team members
        </p>
      </div>
      <div className="p-4">
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
