/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useMemo } from "react";
import { Search, X } from "lucide-react";
import DataTable from "../../ui/table";

import GetFabricatorByID from "./GetFabricatorByID";

import { useSelector } from "react-redux";

const AllFabricator = () => {
  const [searchQuery, setSearchQuery] = useState("");

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

  // Filter fabricators based on search query
  const filteredFabricators = useMemo(() => {
    if (!searchQuery.trim()) return fabricators || [];

    const query = searchQuery.toLowerCase();
    return (fabricators || []).filter((fabricator) =>
      fabricator.fabName?.toLowerCase().includes(query)
    );
  }, [fabricators, searchQuery]);

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
      {/* Search Bar - Premium Style */}
      <div className="mb-8 px-2">
        <div className="relative group max-w-xl">
          <div className="absolute -inset-1 bg-linear-to-r from-green-100 to-emerald-100 rounded-xl blur-sm opacity-25 group-hover:opacity-40 transition-duration-1000"></div>
          <div className="relative bg-white border border-gray-100 rounded-xl p-1 flex items-center shadow-sm hover:border-green-200 transition-colors">
            <Search className="ml-3 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search fabricators by name..."
              className="flex-1 px-4 py-2 bg-transparent text-gray-800 placeholder-gray-400 focus:outline-none font-medium"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="p-1 px-3 text-gray-300 hover:text-gray-500 transition-colors"
              >
                <X size={16} />
              </button>
            )}
          </div>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={filteredFabricators}
        onRowClick={handleRowClick}
        detailComponent={({ row }) => {
          const fabricatorUniqueId =
            (row).id ?? (row).fabId ?? "";
          return <GetFabricatorByID id={fabricatorUniqueId} />;
        }}
        disablePagination={true}
      />
    </div>
  );
};

export default AllFabricator;
