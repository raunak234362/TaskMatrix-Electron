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
    { accessorKey: "stage", header: "Stage" },
    {
      accessorKey: "description",
      header: "Description",
      cell: ({ row }) => (
        <p className="truncate max-w-[300px]">{row.original.description}</p>
      ),
    },
    {
      accessorKey: "createdAt",
      header: "Created On",
      cell: ({ row }) =>
        new Date(row.original.createdAt).toLocaleDateString("en-IN", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        }),
    },
  ];

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-gray-700">
        <Loader2 className="w-6 h-6 animate-spin mb-2" />
        Loading Design Drawings...
      </div>
    );
  }

  if (!loading && drawings.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-gray-700">
        <Inbox className="w-10 h-10 mb-3 text-gray-400" />
        <p className="text-lg font-medium">No Design Drawings Available</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="p-4 border-b border-gray-50 bg-gray-50/50">
        <h3 className=" text-gray-800">Design Drawings</h3>
      </div>
      <div className="p-0 overflow-x-auto">
        <DataTable
          columns={columns}
          data={drawings}
          detailComponent={({ row }) => (
            <DesignDrawingDetails id={row.id} onUpdate={fetchDrawings} />
          )}
          pageSizeOptions={[5, 10, 25]}
        />
      </div>
    </div>
  );
};

export default AllDesignDrawings;
