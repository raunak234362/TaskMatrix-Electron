/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
import DataTable from "../../ui/table";


import Service from "../../../api/Service";
import { Loader2, Inbox } from "lucide-react";
import DesignDrawingDetails from "./DesignDrawingDetails";


const AllDesignDrawings = ({ projectId }) => {
  const [drawings, setDrawings] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchDrawings = async () => {
    try {
      setLoading(true);
      const response = await Service.GetDesignDrawingsByProjectId(projectId);
      setDrawings(response.data || []);
    } catch (error) {
      console.error("Error fetching design drawings:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (projectId) fetchDrawings();
  }, [projectId]);

  const columns = [
    {
      accessorKey: "stage",
      header: "Stage",
      cell: ({ row }) => (
        <span className="text-sm font-bold text-gray-600 tracking-tight uppercase">
          {row.original.stage || "—"}
        </span>
      )
    },
    {
      accessorKey: "description",
      header: "Description",
      cell: ({ row }) => (
        <p className="text-sm font-bold text-gray-700 truncate max-w-[400px]">
          {row.original.description || "No description"}
        </p>
      ),
    },
    {
      accessorKey: "createdAt",
      header: "Created On",
      cell: ({ row }) => (
        <span className="text-sm font-bold text-gray-600">
          {new Date(row.original.createdAt).toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          })}
        </span>
      ),
    },
  ];

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-gray-400">
        <Loader2 className="w-8 h-8 animate-spin mb-4 opacity-20" />
        <p className="text-sm font-black uppercase tracking-widest opacity-40">Loading Documents...</p>
      </div>
    );
  }

  if (!loading && drawings.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-gray-400">
        <Inbox className="w-12 h-12 mb-4 opacity-10" />
        <p className="text-sm font-black uppercase tracking-widest opacity-40">No Documents available</p>
      </div>
    );
  }

  return (
    <div className="bg-[#fcfdfc] min-h-[400px] p-2 animate-in fade-in duration-700">
      <div className="flex justify-between items-center mb-6 px-1">
        {/* <h2 className="text-lg font-black text-gray-900 tracking-tight uppercase">Documents <span className="text-primary/40 ml-2"></span></h2> */}
      </div>

      <DataTable
        columns={columns}
        data={drawings}
        detailComponent={({ row }) => (
          <DesignDrawingDetails id={row.id} onUpdate={fetchDrawings} />
        )}
        disablePagination={true}
      />
    </div>
  );
};

export default AllDesignDrawings;
