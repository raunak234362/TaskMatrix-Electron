import { useState, useMemo } from "react";
import { toast } from "react-toastify";
import { Search, Filter } from "lucide-react";
import DataTable from "../../ui/table";
import GetEmployeeByID from "./GetEmployeeByID";
import { useSelector } from "react-redux";

const AllEmployee = () => {
  const isTrue = (val) => val === true || val === "true" || val === 1;
  const staffData = useSelector((state) => state.userInfo.staffData);
  const [employees, setEmployees] = useState(staffData);
  const [employeeID, setEmployeeID] = useState(null);
  const [loading] = useState(false);
  const [error] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRole, setSelectedRole] = useState("All");
  const [selectedDesignation, setSelectedDesignation] = useState("All");
  const [selectedStatus, setSelectedStatus] = useState("All");

  const roles = useMemo(() => {
    const r = new Set((employees || []).map((emp) => emp.role).filter(Boolean));
    return ["All", ...Array.from(r).sort()];
  }, [employees]);

  const designations = useMemo(() => {
    const d = new Set((employees || []).map((emp) => emp.designation).filter(Boolean));
    return ["All", ...Array.from(d).sort()];
  }, [employees]);

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

  // Filter by username, full name, email, designation, or role
  const filteredEmployees = useMemo(() => {
    let list = employees || [];

    // Role filter
    if (selectedRole !== "All") {
      list = list.filter((emp) => emp.role === selectedRole);
    }

    // Designation filter
    if (selectedDesignation !== "All") {
      list = list.filter((emp) => emp.designation === selectedDesignation);
    }

    // Status filter
    if (selectedStatus !== "All") {
      const targetActive = selectedStatus === "Active";
      list = list.filter((emp) => {
        const isActive = isTrue(emp.isActive);
        return isActive === targetActive;
      });
    }

    if (!searchTerm.trim()) return list;

    const q = searchTerm.toLowerCase();
    return list.filter((emp) => {
      const fullName = [emp?.firstName, emp?.middleName, emp?.lastName]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return (
        emp?.username?.toLowerCase().includes(q) ||
        fullName.includes(q) ||
        emp?.email?.toLowerCase().includes(q) ||
        emp?.designation?.toLowerCase().includes(q) ||
        emp?.role?.toLowerCase().includes(q)
      );
    });
  }, [employees, searchTerm, selectedRole, selectedDesignation]);

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
    {
      accessorKey: "role",
      header: "Role",
      cell: ({ row }) => (
        <span className="font-bold text-black/60 uppercase tracking-tighter">
          {row.original.role || "—"}
        </span>
      ),
    },
    { accessorKey: "designation", header: "Designation" },
    {
      accessorKey: "isActive",
      header: "Status",
      cell: ({ row }) => {
        const active = isTrue(row.original.isActive);
        return (
          <span className={`px-3 py-1 rounded-none text-[10px] font-black uppercase tracking-[0.1em] border ${
            active 
              ? "bg-green-50 text-green-700 border-green-200" 
              : "bg-red-50 text-red-700 border-red-200"
          }`}>
            {active ? "Active" : "Inactive"}
          </span>
        );
      }
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center p-20 bg-white rounded-none border border-black shadow-soft">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-black/5 border-t-black"></div>
          <span className="text-black font-black uppercase tracking-widest text-xs">Loading employees...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-12 text-center bg-red-50 rounded-none border border-red-100">
        <p className="text-red-600 font-bold">{error}</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-none shadow-soft border border-black/10 overflow-hidden mt-6">

      {/* Search and Filters */}
      <div className="px-8 pt-6 pb-2 flex flex-wrap items-center gap-6">
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
            className="w-full pl-11 pr-10 py-2.5 bg-gray-50 border border-black rounded-none text-sm font-medium text-black placeholder:text-black/30 focus:outline-none focus:border-green-300 transition-all"
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

        <div className="flex items-center gap-4">
          {/* Role Filter */}
          <div className="flex items-center gap-2">
            <Filter size={14} className="text-black/30" />
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="bg-transparent text-xs font-black uppercase tracking-widest text-black/60 focus:outline-none cursor-pointer hover:text-black transition-colors"
            >
              <option value="All">All Roles</option>
              {roles.filter(r => r !== "All").map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>

          {/* Designation Filter */}
          <div className="flex items-center gap-2 border-l border-black/10 pl-4">
            <select
              value={selectedDesignation}
              onChange={(e) => setSelectedDesignation(e.target.value)}
              className="bg-transparent text-xs font-black uppercase tracking-widest text-black/60 focus:outline-none cursor-pointer hover:text-black transition-colors"
            >
              <option value="All">All Designations</option>
              {designations.filter(d => d !== "All").map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-2 border-l border-black/10 pl-4">
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="bg-transparent text-xs font-black uppercase tracking-widest text-black/60 focus:outline-none cursor-pointer hover:text-black transition-colors"
            >
              <option value="All">All Status</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>
        </div>

        {(searchTerm || selectedRole !== "All" || selectedDesignation !== "All" || selectedStatus !== "All") && (
          <span className="ml-auto text-xs font-bold text-black/40 uppercase tracking-widest whitespace-nowrap">
            {filteredEmployees.length} result{filteredEmployees.length !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      <div className="p-8">
        <DataTable
          columns={columns}
          data={filteredEmployees}
          onRowClick={handleRowClick}
          detailComponent={({ row, close }) => <GetEmployeeByID id={row.id} onClose={close} />}
          onDelete={handleDelete}
          pageSizeOptions={[25]}
        />
      </div>
    </div>
  );
};

export default AllEmployee;
