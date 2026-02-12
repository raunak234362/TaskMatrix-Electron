/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";

import { toast } from "react-toastify";
import DataTable from "../../ui/table";
import GetEmployeeByID from "./GetEmployeeByID";

import { useSelector } from "react-redux";
const AllEmployee = () => {
  const staffData = useSelector((state) => state.userInfo.staffData);
  const [employees, setEmployees] = useState(staffData);
  const [employeeID, setEmployeeID] = useState(null);
  const [loading] = useState(false);
  const [error] = useState(null);

  console.log(employees);
  const handleDelete = async (selectedRows) => {
    try {
      const ids = selectedRows.map((emp) => emp.id);
      // Example: await Service.DeleteEmployees(ids);
      console.log("Deleting employees:", ids);

      // Remove from UI
      setEmployees((prev) => prev.filter((emp) => !ids.includes(emp.id)));
      toast.success(`${selectedRows.length} employee(s) deleted`);
    } catch (err) {
      console.log(err);

      toast.error("Failed to delete employees");
    }
  };

  const handleRowClick = (row) => {
    setEmployeeID(row.id);
    // router.push(`/employees/${row.id}`);
  };
  console.log(employeeID);

  const columns = [
    { accessorKey: "username", header: "Username" },
    { accessorKey: "email", header: "Email" },
    {
      accessorFn: (r) =>
        [r.firstName, r.middleName, r.lastName].filter(Boolean).join(" "),
      header: "Full Name",
      id: "fullName",
    },
    {
      accessorKey: "phone",
      header: "Phone",
      cell: ({ row }) => (
        <span>
          {row.original.phone}
          {row.original.extension && (
            <span className="text-gray-700 text-xs ml-1">
              (Ext: {row.original.extension})
            </span>
          )}
        </span>
      ),
    },
    { accessorKey: "designation", header: "Designation" },
    // {
    //   accessorKey: "role",
    //   header: "Role",
    //   cell: ({ row }) => (
    //     <span className="px-2 py-1 rounded-full bg-green-100 text-green-800">
    //       {row.getValue("role")}
    //     </span>
    //   ),
    // },
  ];

  if (loading) return <div className="p-8 text-center">Loading…</div>;
  if (error) return <div className="p-8 text-red-600">{error}</div>;

  return (
    <div className="bg-white p-2 rounded-2xl">
      <DataTable
        columns={columns}
        data={employees}
        onRowClick={handleRowClick}
        detailComponent={({ row }) => <GetEmployeeByID id={row.id} />}
        onDelete={handleDelete}

      />
    </div>
  );
};

export default AllEmployee;
