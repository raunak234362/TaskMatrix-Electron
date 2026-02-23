/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
import { Loader2, AlertCircle, X, ListChecks } from "lucide-react";
import Service from "../../../api/Service";
import { Button } from "../../ui/button";
import DataTable from "../../ui/table";
import UpdateLineItem from "./UpdateLineItem";

// Helper function to convert decimal hours to hh:mm format
const formatDecimalHoursToTime = (decimalHours) => {
  if (!decimalHours || decimalHours === 0) return "00:00";
  const hours = Math.floor(decimalHours);
  const minutes = Math.round((decimalHours - hours) * 60);
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
};

const GetWBSLineItem = ({
  wbsId,
  onClose,
}) => {
  const [lineItems, setLineItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedLineItem, setSelectedLineItem] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const fetchLineItems = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await Service.GetWBSLineItem(wbsId);
      console.log("Line Items Response:", response);
      setLineItems(response?.data || response || []);
    } catch (err) {
      console.error("Error fetching line items:", err);
      setError("Failed to load line items");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (wbsId) {
      fetchLineItems();
    }
  }, [wbsId]);

  const handleRowClick = (item) => {
    setSelectedLineItem(item);
    setIsEditModalOpen(true);
  };

  const columns = [
    {
      accessorKey: "description",
      header: "Description",
      cell: ({ row }) => (
        <p className="text-sm font-semibold text-gray-700">
          {row.original.name ||
            row.original.wbsTemplate?.name ||
            row.original.description ||
            row.original.wbsTemplateKey ||
            "—"}
        </p>
      ),
      enableColumnFilter: true,
    },
    {
      accessorKey: "discipline",
      header: "Discipline",
      cell: ({ row }) => (
        <span className="text-xs font-medium text-gray-500 uppercase">
          {row.original.discipline || "—"}
        </span>
      ),
      enableSorting: true,
    },
    {
      id: "qtyNo",
      accessorFn: (row) => row.qtyNo ?? row.totalQtyNo ?? 0,
      header: "Qty",
      cell: ({ row }) => (
        <span className="text-sm  text-green-700 bg-green-50 px-2 py-1 rounded-md">
          {row.getValue("qtyNo")}
        </span>
      ),
      enableSorting: true,
    },
    {
      accessorKey: "execHr",
      header: "Exec Hr",
      cell: ({ row }) => (
        <span className="text-sm text-gray-700">
          {formatDecimalHoursToTime((row.original.execHr ?? row.original.totalExecHr ?? 0) / 60)} hrs
        </span>
      ),
      enableSorting: true,
    },
    {
      accessorKey: "checkHr",
      header: "Check Hr",
      cell: ({ row }) => (
        <span className="text-sm text-gray-700">
          {formatDecimalHoursToTime((row.original.checkHr ?? row.original.totalCheckHr ?? 0) / 60)}  hrs
        </span>
      ),
      enableSorting: true,
    },
  ];

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-4">
        <Loader2 className="w-8 h-8 text-green-600 animate-spin" />
        <p className="text-gray-600 font-medium">Loading line items...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-4 text-red-600">
        <AlertCircle className="w-8 h-8" />
        <p className="font-medium">{error}</p>
        <Button onClick={onClose} variant="outline">
          Close
        </Button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
        <div className="flex items-center gap-2">
          <ListChecks className="w-5 h-5 text-green-600" />
          <h3 className="text-lg  text-gray-700">WBS Line Items</h3>
          <span className="px-2 py-0.5 bg-gray-200 text-gray-700 text-[10px]  rounded-full">
            {lineItems.length} Items
          </span>
        </div>
        <Button
          onClick={onClose}
          variant="ghost"
          size="icon"
          className="text-gray-400 hover:text-gray-700"
        >
          <X className="w-5 h-5" />
        </Button>
      </div>
      <div className="p-6">
        {lineItems.length > 0 ? (
          <DataTable
            columns={columns}
            data={lineItems}
            onRowClick={handleRowClick}
            initialSorting={[
              { id: "qtyNo", desc: true },
              { id: "description", desc: false },
            ]}
          />
        ) : (
          <div className="py-12 text-center text-gray-500 italic">
            No line items found.
          </div>
        )}
      </div>

      <UpdateLineItem
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedLineItem(null);
        }}
        lineItem={selectedLineItem}
        onUpdate={fetchLineItems}
      />
    </div>
  );
};

export default GetWBSLineItem;
