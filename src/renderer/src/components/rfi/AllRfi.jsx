/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
import DataTable from "../ui/table";


import { useSelector } from "react-redux";
import { Loader2, Inbox, MessageSquare } from "lucide-react";
import GetRFIByID from "./GetRFIByID";
import Modal from "../ui/Modal";
import AddCommunication from "../communication/AddCommunication";


const AllRFI = ({ rfiData = [] }) => {
  const [rfis, setRFIs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isFollowUpOpen, setIsFollowUpOpen] = useState(false);
  const [prefilledData, setPrefilledData] = useState(null);

  const projects = useSelector((state) => state.projectInfo?.projectData || []);
  const fabricators = useSelector((state) => state.fabricatorInfo?.fabricatorData || []);

  console.log(rfiData);

  const userRole = sessionStorage.getItem("userRole");


  useEffect(() => {
    if (rfiData && rfiData.length > 0) {
      const normalized = rfiData.map((item) => ({
        ...item,
        createdAt: item.createdAt || item.date || null,
      }));
      setRFIs(normalized);
      setLoading(false);
    } else {
      setRFIs([]);
      setLoading(false);
    }
  }, [rfiData]);

  // const handleRowClick = (row) => {
  //   // setSelectedRfiID(row.id);
  // };

  // ✅ Define columns
  const columns = [
    { accessorKey: "subject", header: "Subject" },
    {
      accessorKey: "sender",
      header: "Sender",
      cell: ({ row }) => {
        const s = row.original.sender;
        return s
          ? `${s.firstName ?? ""} ${s.middleName ?? ""} ${s.lastName ?? ""}`.trim() ||
          s.username ||
          "—"
          : "—";
      },
    },
  ];



  columns.push(
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => (
        <span
          className={`px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-full border border-black ${row.original.status === true
            ? "bg-orange-100 text-black shadow-sm"
            : "bg-green-100 text-black shadow-sm"
            }`}
        >
          {row.original.status ? "PENDING" : "RESPONDED"}
        </span>
      ),
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
              subject: `Follow-up: ${item.subject || ""}`,
              notes: `Ref: RFI ${item.subject || ""}`
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
  );

  // ✅ Loading state
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-gray-700">
        <Loader2 className="w-6 h-6 animate-spin mb-2" />
        Loading RFIs...
      </div>
    );
  }

  // ✅ Empty state
  if (!loading && (!rfis || rfis.length === 0)) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-gray-700">
        <Inbox className="w-10 h-10 mb-3 text-gray-400" />
        <p className="text-lg font-medium">No RFIs Available</p>
        <p className="text-sm text-gray-400">
          {userRole === "CLIENT"
            ? "You haven’t sent any RFIs yet."
            : "No RFIs have been received yet."}
        </p>
      </div>
    );
  }

  // ✅ Render DataTable
  return (
    <div className="bg-white p-2 rounded-2xl shadow-md">
      <DataTable
        columns={columns}
        data={rfis}
        detailComponent={({ row }) => <GetRFIByID id={row.id} />}
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

export default AllRFI;
