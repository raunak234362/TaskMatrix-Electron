import { useEffect, useState, useMemo } from "react";
import Service from "../../api/Service";
import DataTable from "../ui/table";
import { Loader2, AlertCircle } from "lucide-react";
import Modal from "../ui/Modal";
import WireTransferDetails from "./WireTransferDetails";

const WireTransfers = () => {
  const [transfers, setTransfers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTransferId, setSelectedTransferId] = useState(null);

  useEffect(() => {
    const fetchTransfers = async () => {
      try {
        const res = await Service.GetAllWireTransfers();
        setTransfers(Array.isArray(res) ? res : res?.data || []);
      } catch (error) {
        console.error("Error fetching wire transfers:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchTransfers();
  }, []);

  const columns = [
    {
      accessorKey: "user",
      header: "Sender",
      cell: ({ row }) => {
        const user = row.original.user;
        return user ? `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.username : "—";
      }
    },
    {
      accessorKey: "subject",
      header: "Subject",
      cell: ({ row }) => row.getValue("subject") || "—"
    },
    {
      accessorKey: "date",
      header: "Date",
      cell: ({ row }) => {
        const date = row.getValue("date");
        return date ? new Date(date).toLocaleDateString() : "N/A";
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.getValue("status") || "PENDING";
        const isActive = status.toUpperCase() === "COMPLETED";
        return (
          <span
            className={`px-2 py-1 rounded-full text-xs font-medium ${
              isActive
                ? "bg-green-100 text-green-700"
                : "bg-yellow-100 text-yellow-700"
            }`}
          >
            {status}
          </span>
        );
      },
    }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-700">
        <Loader2 className="w-6 h-6 animate-spin mr-2" />
        Loading wire transfers...
      </div>
    );
  }

  return (
    <div className="bg-white p-4 rounded-2xl shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-700">All Wire Transfers</h2>
        <span className="text-xs text-gray-400 font-medium">
          {transfers.length} transfer{transfers.length !== 1 ? "s" : ""}
        </span>
      </div>

      <DataTable
        columns={columns}
        data={transfers}
        onRowClick={(row) => {
          setSelectedTransferId(row.id);
        }}
      />

      <Modal
        isOpen={!!selectedTransferId}
        onClose={() => setSelectedTransferId(null)}
        title="Wire Transfer Details"
      >
        {selectedTransferId && <WireTransferDetails id={selectedTransferId} />}
      </Modal>
    </div>
  );
};

export default WireTransfers;
