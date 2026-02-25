import { useState, useMemo } from "react";
import { toast } from "react-toastify";
import { Search } from "lucide-react";
import DataTable from "../../ui/table";
import GetEmployeeByID from "./GetEmployeeByID";
import { useSelector } from "react-redux";

const AllEmployee = () => {
  const staffData = useSelector((state) => state.userInfo.staffData);
  const [employees, setEmployees] = useState(staffData);
  const [employeeID, setEmployeeID] = useState(null);
  const [loading] = useState(false);
  const [error] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  const handleDelete = async (selectedRows) => {
    try {
      const ids = selectedRows.map((emp) => emp.id);
      setEmployees((prev) => prev.filter((emp) => !ids?.includes(emp.id)));
      toast.success(`${selectedRows.length} employee(s) deleted`);
    } catch (err) {
      console.log(err);
      toast.error("Failed to delete employees");
    }
  };

  const handleRowClick = (row) => {
    setEmployeeID(row.id);
  };

  // Filter by username, full name, email, or designation
  const filteredEmployees = useMemo(() => {
    if (!searchTerm.trim()) return employees;
    const q = searchTerm.toLowerCase();
    return (employees || []).filter((emp) => {
      const fullName = [emp?.firstName, emp?.middleName, emp?.lastName]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return (
        emp?.username?.toLowerCase().includes(q) ||
        fullName.includes(q) ||
        emp?.email?.toLowerCase().includes(q) ||
        emp?.designation?.toLowerCase().includes(q)
      );
    });
  }, [employees, searchTerm]);

  const columns = [
    { accessorKey: "username", header: "Username" },
    { accessorKey: "email", header: "Email" },
    {
      accessorFn: (r) =>
        [r?.firstName, r?.middleName, r?.lastName].filter(Boolean).join(" "),
      header: "Full Name",
      id: "fullName",
    },
    { accessorKey: "phone", header: "Phone" },
    { accessorKey: "designation", header: "Designation" },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center p-20 bg-white rounded-[2.5rem] border border-black/5 shadow-soft">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-black/5 border-t-black"></div>
          <span className="text-black font-black uppercase tracking-widest text-xs">Loading employees...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-12 text-center bg-red-50 rounded-[2.5rem] border border-red-100">
        <p className="text-red-600 font-bold">{error}</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-[2.5rem] shadow-soft border border-black/5 overflow-hidden mt-6">

      {/* Search Bar */}
      <div className="px-8 pt-6 pb-2 flex items-center gap-4">
        <div className="relative flex-1 max-w-sm group">
          <Search
            size={18}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-black/30 group-focus-within:text-black transition-colors"
          />
          <input
            type="text"
            placeholder="Search by username, name, email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-11 pr-10 py-2.5 bg-gray-50 border border-black/10 rounded-full text-sm font-medium text-black placeholder:text-black/30 focus:outline-none focus:ring-2 focus:ring-green-200 focus:border-green-300 transition-all"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-black/30 hover:text-black transition-colors text-xl leading-none"
            >
              ×
            </button>
          )}
        </div>
        {searchTerm && (
          <span className="text-xs font-bold text-black/40 uppercase tracking-widest whitespace-nowrap">
            {filteredEmployees.length} result{filteredEmployees.length !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      <div className="p-8">
        <DataTable
          columns={columns}
          data={filteredEmployees}
          onRowClick={handleRowClick}
          detailComponent={({ row }) => <GetEmployeeByID id={row.id} />}
          onDelete={handleDelete}
          pageSizeOptions={[5, 10, 25]}
        />
      </div>
    </div>
  );
};

export default AllEmployee;
