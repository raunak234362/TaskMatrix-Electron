/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useMemo, useEffect } from "react";
import { Search } from "lucide-react";
import { toast } from "react-toastify";
import DataTable from "../../ui/table";
import GetEmployeeByID from "./GetEmployeeByID";

import { useSelector } from "react-redux";
const AllEmployee = () => {
  const staffData = useSelector((state) => state.userInfo.staffData);
  const [employees, setEmployees] = useState(staffData || []);
  const [searchTerm, setSearchTerm] = useState("");
  const [employeeID, setEmployeeID] = useState(null);
  const [loading] = useState(false);
  const [error] = useState(null);

  useEffect(() => {
    if (staffData) {
      setEmployees(staffData);
    }
  }, [staffData]);

  const filteredEmployees = useMemo(() => {
    if (!searchTerm) return employees;
    const lowerSearch = searchTerm.toLowerCase();
    return (employees || []).filter((emp) => {
      const fullName = [emp.firstName, emp.middleName, emp.lastName]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return (
        emp.username?.toLowerCase().includes(lowerSearch) ||
        emp.email?.toLowerCase().includes(lowerSearch) ||
        emp.designation?.toLowerCase().includes(lowerSearch) ||
        emp.phone?.toLowerCase().includes(lowerSearch) ||
        fullName.includes(lowerSearch)
      );
    });
  }, [employees, searchTerm]);

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
    <div className="bg-white p-4 rounded-3xl border border-gray-100 shadow-sm transition-all duration-300">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
        <div className="relative flex-1 max-w-md w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors" size={18} />
          <input
            type="text"
            placeholder="Search employees by name, email, designation..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium text-sm"
          />
        </div>
      </div>
      <DataTable
        columns={columns}
        data={filteredEmployees}
        onRowClick={handleRowClick}
        detailComponent={({ row }) => <GetEmployeeByID id={row.id} />}
        onDelete={handleDelete}
      />
    </div>
  );
};

export default AllEmployee;
