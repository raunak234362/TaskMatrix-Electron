import { useState, useMemo, useEffect } from "react";
import { Search, X } from "lucide-react";
import DataTable from "../../ui/table";
import GetFabricatorByID from "./GetFabricatorByID";
import Service from "../../../api/Service";

const AllFabricator = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState({
    fabStage: "All Stages",
    wbtContact: "All WBT Contacts",
  });

  const [fabricators, setFabricators] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [loading, setLoading] = useState(true);
  const [allFabricators, setAllFabricators] = useState([]);
  const [wbtContacts, setWbtContacts] = useState([
    { id: "All WBT Contacts", name: "All WBT Contacts" }
  ]);

  // Fetch all fabricators once on mount for filter dropdowns
  useEffect(() => {
    const fetchAll = async () => {
      try {
        const response = await Service.GetAllFabricators(1, 10);
        const data = response.data || [];
        setAllFabricators(data);
      } catch (err) {
        console.error("Failed to fetch fabricators for filters:", err);
      }
    };
    fetchAll();
  }, []);

  // Fetch employees for WBT Contact filter using FetchManagementUser
  useEffect(() => {
    const fetchWbtContacts = async () => {
      try {
        const res = await Service.FetchManagementUser();
        let users = [];
        if (res) {
          if (Array.isArray(res)) {
            users = res;
          } else if (res.data) {
            if (Array.isArray(res.data)) {
              users = res.data;
            } else if (res.data.users && Array.isArray(res.data.users)) {
              users = res.data.users;
            } else if (res.data.employees && Array.isArray(res.data.employees)) {
              users = res.data.employees;
            } else if (Array.isArray(res.data.data)) {
              users = res.data.data;
            }
          }
        }
        
        const map = new Map();
        users.forEach((emp) => {
          const id = emp.id || emp._id;
          const name = `${emp.firstName || ""} ${emp.lastName || ""}`.trim();
          if (id && name) {
            map.set(id, name);
          }
        });
        
        setWbtContacts([
          { id: "All WBT Contacts", name: "All WBT Contacts" },
          ...Array.from(map.entries()).map(([id, name]) => ({ id, name }))
        ]);
      } catch (err) {
        console.error("Failed to fetch WBT contacts:", err);
      }
    };
    fetchWbtContacts();
  }, []);

  // Fetch paginated fabricators for the table
  useEffect(() => {
    const fetchPaginated = async () => {
      try {
        setLoading(true);
        const response = await Service.GetAllFabricators(
          currentPage,
          10,
          searchQuery,
          filters.fabStage,
          filters.wbtContact
        );
        if (response && response.success) {
          setFabricators(response.data || []);
          setTotalPages(response.meta?.totalPages || 1);
          setTotalItems(response.meta?.total || 0);
        } else {
          setFabricators([]);
          setTotalPages(1);
          setTotalItems(0);
        }
      } catch (err) {
        console.error("Failed to fetch paginated fabricators:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchPaginated();
  }, [currentPage, searchQuery, filters]);

  // Stage options: All Stages, PRODUCTION, RFQ
  const stages = ["All Stages", "PRODUCTION", "RFQ"];

  // Handle row click
  const handleRowClick = (row) => {
    const fabricatorUniqueId = (row).id ?? (row).fabId ?? "";
    console.debug("Selected fabricator:", fabricatorUniqueId);
  };

  // Define columns for DataTable
  const columns = useMemo(() => [
    { accessorKey: "fabName", header: "Fabricator Name" },
    {
      accessorKey: "createdAt",
      header: "Working Since",
      cell: ({ row }) => {
        const date = row.original.createdAt ? new Date(row.original.createdAt) : null;
        const formattedDate = date
          ? `${(date.getMonth() + 1).toString().padStart(2, "0")}/${date
            .getDate()
            .toString()
            .padStart(2, "0")}/${date.getFullYear()}`
          : "N/A";
        return (
          <div className="text-black uppercase">
            {formattedDate}
          </div>
        );
      },
    },
    {
      id: "location",
      header: "Location",
      cell: ({ row }) => {
        const country = row.original.country || row.original.branches?.[0]?.country || "N/A";
        return (
          <div className="text-black uppercase">
            {country}
          </div>
        );
      },
    },
  ], []);

  return (
    <div className="bg-[#fcfdfc] min-h-[500px]">
      {/* Search Bar & Filters - Premium Style */}
      <div className="mb-8 px-2">
        <div className="flex flex-wrap items-center gap-4">
          <div className="relative group grow max-w-xl min-w-[280px]">
            <div className="absolute -inset-1 bg-linear-to-r from-green-100 to-emerald-100 rounded-xl blur-sm opacity-25 group-hover:opacity-40 transition-duration-1000"></div>
            <div className="relative bg-white border border-gray-200 rounded-xl px-3 flex items-center shadow-sm hover:border-green-200 transition-colors h-11">
              <Search className="w-5 h-5 text-gray-400 shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Search fabricators by name..."
                className="flex-1 px-3 py-1 bg-transparent text-gray-800 placeholder-gray-400 focus:outline-none font-medium text-sm"
              />
              {searchQuery && (
                <button
                  onClick={() => {
                    setSearchQuery("");
                    setCurrentPage(1);
                  }}
                  className="p-1 text-gray-300 hover:text-gray-500 transition-colors shrink-0"
                >
                  <X size={16} />
                </button>
              )}
            </div>
          </div>

          {/* Stage Filter */}
          <div className="w-full sm:w-auto min-w-[200px]">
            <select
              className="w-full h-11 text-sm font-semibold text-gray-700 bg-white border border-gray-200 rounded-xl px-4 cursor-pointer focus:outline-none focus:border-green-500 focus:ring-4 focus:ring-green-500/5 transition-all shadow-sm"
              value={filters.fabStage}
              onChange={(e) => {
                setFilters(prev => ({ ...prev, fabStage: e.target.value }));
                setCurrentPage(1);
              }}
            >
              {stages.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          {/* WBT Contact Filter */}
          <div className="w-full sm:w-auto min-w-[220px]">
            <select
              className="w-full h-11 text-sm font-semibold text-gray-700 bg-white border border-gray-200 rounded-xl px-4 cursor-pointer focus:outline-none focus:border-green-500 focus:ring-4 focus:ring-green-500/5 transition-all shadow-sm"
              value={filters.wbtContact}
              onChange={(e) => {
                setFilters(prev => ({ ...prev, wbtContact: e.target.value }));
                setCurrentPage(1);
              }}
            >
              {wbtContacts.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          {/* Clear All */}
          {(filters.fabStage !== "All Stages" || filters.wbtContact !== "All WBT Contacts" || searchQuery) && (
            <button
              onClick={() => {
                setFilters({ fabStage: "All Stages", wbtContact: "All WBT Contacts" });
                setSearchQuery("");
                setCurrentPage(1);
              }}
              className="h-11 px-4 text-xs font-bold text-rose-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all flex items-center gap-2 shrink-0"
            >
              <X size={14} />
              Clear Filters
            </button>
          )}
        </div>
      </div>

      <DataTable
        columns={columns}
        data={fabricators}
        onRowClick={handleRowClick}
        detailComponent={({ row, close }) => {
          const fabricatorUniqueId =
            (row).id ?? (row).fabId ?? "";
          return <GetFabricatorByID id={fabricatorUniqueId} onClose={close} />;
        }}
        manualPagination={true}
        pageCount={totalPages}
        pageIndex={currentPage - 1}
        onPageChange={(index) => setCurrentPage(index + 1)}
        pageSizeOptions={[10,15,20,25]}
      />
    </div>
  );
};

export default AllFabricator;
