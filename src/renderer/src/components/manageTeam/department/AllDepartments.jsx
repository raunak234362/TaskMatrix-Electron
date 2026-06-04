/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import { useSelector } from "react-redux";
import DataTable from "../../ui/table";
import GetDepartmentById from "./GetDepartmentById";

const AllDepartments = () => {
  const departments = useSelector(
    (state) => state.userInfo.departmentData
  );
  const [departmentID, setDepartmentID] = useState(null);
  const [loading] = useState(false);
  const [error] = useState(null);

  // console.log(departments);

  const handleRowClick = (row) => {
    setDepartmentID(row.id)
  }
  console.log(departmentID)
  if (loading) {
    return (
      <div className="flex items-center justify-center p-20 bg-white rounded-xl border border-black/10 shadow-sm">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-black/5 border-t-black"></div>
          <span className="text-black font-semibold uppercase tracking-widest text-xs">Loading departments...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-12 text-center bg-red-50 rounded-xl border border-red-100">
        <p className="text-red-600 font-bold">{error}</p>
      </div>
    );
  }

  const columns = [
    {
      accessorKey: "name",
      header: "Department Name",
      cell: ({ row }) => (
        <span className="font-semibold text-black uppercase tracking-tight text-sm">
          {row.original.name}
        </span>
      ),
    },
    {
      accessorKey: "managerIds",
      header: "Department Manager",
      cell: ({ row }) => {
        const managers = row.original.managerIds;
        let managerName = "No Manager Assigned";

        if (Array.isArray(managers)) {
          const first = managers[0];
          if (first && (first.firstName || first.lastName)) {
            managerName = `${first.firstName ?? ""} ${first.lastName ?? ""}`.trim();
          }
        } else if (managers && typeof managers === "object" && managers.firstName !== undefined) {
          const m = managers;
          managerName = `${m.firstName ?? ""} ${m.lastName ?? ""}`.trim();
        } else if (typeof managers === "string") {
          managerName = managers;
        }

        return (
          <span className="text-black font-semibold uppercase tracking-wide text-xs">
            {managerName || "No Manager Assigned"}
          </span>
        );
      },
    },
  ];

  return (
    <div className="w-full">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-black uppercase tracking-tight">All Departments</h2>
        <p className="text-black text-xs font-semibold tracking-wide mt-1">
          Manage and view all department structures in the system
        </p>
      </div>

      <div className="bg-white">
        <DataTable
          columns={columns}
          data={departments}
          onRowClick={handleRowClick}
          pageSizeOptions={[10, 20, 50]}
        />
      </div>

      {/* Modal View for Department Details */}
      {departmentID && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <GetDepartmentById
            id={departmentID}
            onClose={() => setDepartmentID(null)}
          />
        </div>
      )}
    </div>
  );
};

export default AllDepartments;
