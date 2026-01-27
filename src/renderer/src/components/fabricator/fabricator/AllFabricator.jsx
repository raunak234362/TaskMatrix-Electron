/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useMemo } from "react";
import { Search } from "lucide-react";
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
  ];

  // Loading and error states
  // if (loading) return <div className="p-8 text-center">Loading…</div>;
  // if (error) return <div className="p-8 text-red-600">{error}</div>;

  // Render DataTable
  return (
    <div className="bg-white p-2 sm:p-4 rounded-2xl shadow-sm">
      {/* Search Bar */}
      <div className="mb-4">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search fabricators by name..."
            className="pl-9 pr-3 py-2 w-full border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />
        </div>
        {searchQuery && (
          <p className="text-xs text-gray-500 mt-2">
            Showing {filteredFabricators.length} of {fabricators?.length || 0} fabricators
          </p>
        )}
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
        pageSizeOptions={[5, 10, 25]}
      />
    </div>
  );
};

export default AllFabricator;
