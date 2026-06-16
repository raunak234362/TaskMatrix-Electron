import { useState, useMemo } from "react";
import { Search, X, Filter } from "lucide-react";
import DataTable from "../../ui/table";

import GetFabricatorByID from "./GetFabricatorByID";

import { useSelector } from "react-redux";

const AllFabricator = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState({
    fabStage: "All Stages",
    wbtContact: "All WBT Contacts",
    poc: "All POCs",
  });

  // const [fabricators, setFabricators] = useState([]);
  const fabricators = useSelector(
    (state) => state.fabricatorInfo?.fabricatorData
  );

  // Fetch all fabricators on component mount
  // useEffect(() => {
  //   const fetchFabricators = async () => {
  //     try {
  //       setLoading(true);
  //       setError(null);
  //       const response = await Service.GetAllFabricators();
  //       console.log(response);
  //       const data = response.data || [];
  //       setFabricators(data);
  //     } catch (err) {
  //       console.error("Failed to fetch fabricators:", err);
  //       setError("Failed to load fabricators");
  //       toast.error("Failed to load fabricators");
  //     } finally {
  //       setLoading(false);
  //     }
  //   };

  //   fetchFabricators();
  // }, []);
  console.log(fabricators);

  // Derive Unique Filter Options
  const stages = useMemo(() => {
    const list = (fabricators || [])
      .map((f) => f.fabStage)
      .filter(Boolean);
    return ["All Stages", ...new Set(list)];
  }, [fabricators]);

  const wbtContacts = useMemo(() => {
    const list = (fabricators || [])
      .flatMap((f) => 
        Array.isArray(f.wbtFabricatorPointOfContact) 
          ? f.wbtFabricatorPointOfContact.map(c => typeof c === 'object' ? `${c.firstName} ${c.lastName}` : c)
          : []
      )
      .filter(Boolean);
    return ["All WBT Contacts", ...new Set(list)];
  }, [fabricators]);

  const pocs = useMemo(() => {
    const list = (fabricators || [])
      .flatMap((f) => 
        Array.isArray(f.pointOfContact) 
          ? f.pointOfContact.map(c => typeof c === 'object' ? `${c.firstName} ${c.lastName}` : c)
          : []
      )
      .filter(Boolean);
    return ["All POCs", ...new Set(list)];
  }, [fabricators]);

  // Filter fabricators based on search query and dropdowns
  const filteredFabricators = useMemo(() => {
    let result = fabricators || [];

    // Search Query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter((f) =>
        f.fabName?.toLowerCase().includes(query)
      );
    }

    // Stage Filter
    if (filters.fabStage !== "All Stages") {
      result = result.filter((f) => f.fabStage === filters.fabStage);
    }

    // WBT Contact Filter
    if (filters.wbtContact !== "All WBT Contacts") {
      result = result.filter((f) => {
        const contacts = Array.isArray(f.wbtFabricatorPointOfContact)
          ? f.wbtFabricatorPointOfContact.map(c => typeof c === 'object' ? `${c.firstName} ${c.lastName}` : c)
          : [];
        return contacts.includes(filters.wbtContact);
      });
    }

    // POC Filter
    if (filters.poc !== "All POCs") {
      result = result.filter((f) => {
        const contacts = Array.isArray(f.pointOfContact)
          ? f.pointOfContact.map(c => typeof c === 'object' ? `${c.firstName} ${c.lastName}` : c)
          : [];
        return contacts.includes(filters.poc);
      });
    }

    return result;
  }, [fabricators, searchQuery, filters]);

  // Handle row click (optional)
  const handleRowClick = (row) => {
    const fabricatorUniqueId = (row).id ?? (row).fabId ?? "";
    console.debug("Selected fabricator:", fabricatorUniqueId);
  };

  // Define columns for DataTable
  const columns = [
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
        const country = row.original.branches?.[0]?.country || "N/A";
        return (
          <div className="text-black uppercase">
            {country}
          </div>
        );
      },
    },
  ];

  // Loading and error states
  // if (loading) return <div className="p-8 text-center">Loading…</div>;
  // if (error) return <div className="p-8 text-red-600">{error}</div>;

  // Render DataTable
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
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search fabricators by name..."
                className="flex-1 px-3 py-1 bg-transparent text-gray-800 placeholder-gray-400 focus:outline-none font-medium text-sm"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
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
              onChange={(e) => setFilters(prev => ({ ...prev, fabStage: e.target.value }))}
            >
              {stages.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          {/* WBT Contact Filter */}
          <div className="w-full sm:w-auto min-w-[220px]">
            <select
              className="w-full h-11 text-sm font-semibold text-gray-700 bg-white border border-gray-200 rounded-xl px-4 cursor-pointer focus:outline-none focus:border-green-500 focus:ring-4 focus:ring-green-500/5 transition-all shadow-sm"
              value={filters.wbtContact}
              onChange={(e) => setFilters(prev => ({ ...prev, wbtContact: e.target.value }))}
            >
              {wbtContacts.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          {/* POC Filter */}
          <div className="w-full sm:w-auto min-w-[220px]">
            <select
              className="w-full h-11 text-sm font-semibold text-gray-700 bg-white border border-gray-200 rounded-xl px-4 cursor-pointer focus:outline-none focus:border-green-500 focus:ring-4 focus:ring-green-500/5 transition-all shadow-sm"
              value={filters.poc}
              onChange={(e) => setFilters(prev => ({ ...prev, poc: e.target.value }))}
            >
              {pocs.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>

          {/* Clear All */}
          {(filters.fabStage !== "All Stages" || filters.wbtContact !== "All WBT Contacts" || filters.poc !== "All POCs" || searchQuery) && (
            <button
              onClick={() => {
                setFilters({ fabStage: "All Stages", wbtContact: "All WBT Contacts", poc: "All POCs" });
                setSearchQuery("");
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
        data={filteredFabricators}
        onRowClick={handleRowClick}
        detailComponent={({ row, close }) => {
          const fabricatorUniqueId =
            (row).id ?? (row).fabId ?? "";
          return <GetFabricatorByID id={fabricatorUniqueId} onClose={close} />;
        }}
        disablePagination={true}
      />
    </div>
  );
};

export default AllFabricator;
