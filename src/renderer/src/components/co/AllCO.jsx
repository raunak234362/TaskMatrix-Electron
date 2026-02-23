/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
import DataTable from "../ui/table";


import { useSelector } from "react-redux";
import { Loader2, Inbox, MessageSquare } from "lucide-react";
import GetCOByID from "./GetCOByID";
import Modal from "../ui/Modal";
import AddCommunication from "../communication/AddCommunication";



const AllCO = ({ changeOrderData = [] }) => {
  const [changeOrders, setChangeOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isFollowUpOpen, setIsFollowUpOpen] = useState(false);
  const [prefilledData, setPrefilledData] = useState(null);

  const projects = useSelector((state) => state.projectInfo?.projectData || []);
  const fabricators = useSelector((state) => state.fabricatorInfo?.fabricatorData || []);

  console.log(changeOrderData);

  const userRole = sessionStorage.getItem("userRole");


  useEffect(() => {
    if (changeOrderData && changeOrderData.length > 0) {

      const normalized = changeOrderData.map((item) => ({
        ...item,
        createdAt: item.createdAt || item.date || null,
      }));
      setChangeOrders(normalized);
      setLoading(false);
    } else {
      setChangeOrders([]);
      setLoading(false);
    }
  }, [changeOrderData]);


  const columns = [
    {
      accessorKey: "changeOrderNumber",
      header: "CO Number",
    },
    {
      accessorKey: "remarks",
      header: "remarks",
    },
    {
      accessorKey: "senders",
      header: "sender",
      cell: ({ row }) => {
        const s = row.original.senders;
        return s
          ? `${s.firstName ?? ""} ${s.middleName ?? ""} ${s.lastName ?? ""}`.trim() ||
          s.username ||
          "—"
          : "—";
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.original.status;

        const map = {
          NOT_REPLIED: "bg-yellow-100 text-yellow-700",
          APPROVED: "bg-green-100 text-green-700",
          REJECTED: "bg-red-100 text-red-700",
        };

        const statusClass = status ? (map[status] ?? "") : "";

        return (
          <span className={`px-2 py-1 text-xs rounded-full ${statusClass}`}>
            {status ?? "—"}
          </span>
        );
      },
    },
    {
      accessorKey: "createdAt",
      header: "Created On",
      cell: ({ row }) =>
        row.original.createdAt
          ? new Date(row.original.createdAt).toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          })
          : "—",
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            const item = row.original;
            setPrefilledData({
              projectId: item.project?.id || item.project || "",
              fabricatorId: item.fabricator?.id || item.fabricator || "",
              clientId: item.client?.id || item.client || "",
              subject: `Follow-up: CO ${item.changeOrderNumber || ""}`,
              notes: `Ref: Change Order ${item.changeOrderNumber || ""}`
            });
            setIsFollowUpOpen(true);
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-green-700 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition-colors shadow-sm"
          title="Create Follow-up"
        >
          <MessageSquare className="w-3.5 h-3.5" />
          Follow-up
        </button>
      )
    }
  ];



  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-gray-700">
        <Loader2 className="w-6 h-6 animate-spin mb-2" />
        Loading Change Orders...
      </div>
    );
  }

  if (!changeOrders.length) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-gray-700">
        <Inbox className="w-10 h-10 mb-3 text-gray-400" />
        <p className="text-lg font-medium">No Change Orders Available</p>
        <p className="text-sm text-gray-400">
          {userRole === "CLIENT"
            ? "You haven’t created any Change Orders yet."
            : "No Change Orders have been received yet."}
        </p>
      </div>
    );
  }


  // ✅ Render DataTable
  return (
    <div className="bg-white p-2 rounded-2xl shadow-md">
      <DataTable
        columns={columns}
        data={changeOrders}
        detailComponent={({ row }) => (
          <GetCOByID id={row.id} projectId={row.project} />
        )}
      />

      {isFollowUpOpen && (
        <Modal
          isOpen={isFollowUpOpen}
          onClose={() => setIsFollowUpOpen(false)}
          title="New Communication Follow-up"
          size="lg"
        >
          <AddCommunication
            projects={projects}
            fabricators={fabricators}
            onClose={() => setIsFollowUpOpen(false)}
            initialValues={prefilledData}
          />
        </Modal>
      )}
    </div>
  );
};

export default AllCO;
