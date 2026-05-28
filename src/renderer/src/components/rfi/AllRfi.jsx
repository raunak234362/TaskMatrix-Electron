/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
import DataTable from "../ui/table";


import { useSelector } from "react-redux";
import { Loader2, Inbox, MessageSquare } from "lucide-react";
import GetRFIByID from "./GetRFIByID";
import Modal from "../ui/Modal";
import AddCommunication from "../communication/AddCommunication";
import Service from "../../api/Service";


const AllRFI = ({ rfiData = [], onUpdate }) => {
  const [rfis, setRFIs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isFollowUpOpen, setIsFollowUpOpen] = useState(false);
  const [prefilledData, setPrefilledData] = useState(null);

  const projects = useSelector((state) => state.projectInfo?.projectData || []);
  const fabricators = useSelector((state) => state.fabricatorInfo?.fabricatorData || []);

  console.log(rfiData);

  const userRole = sessionStorage.getItem("userRole");


  useEffect(() => {
    const fetchRFIs = async () => {
      try {
        setLoading(true);
        let res;
        if (userRole === "CLIENT") {
          res = await Service.RfiSent();
        } else {
          res = await Service.RfiRecieved();
        }
        let rfiArray = [];
        if (res) {
          if (Array.isArray(res)) {
            rfiArray = res;
          } else if (res["show rfi"]) {
            rfiArray = res["show rfi"];
          } else if (res.data) {
            rfiArray = res.data;
          } else if (typeof res === "object") {
            const firstArray = Object.values(res).find(Array.isArray);
            if (firstArray) rfiArray = firstArray;
          }
        }
        const normalized = rfiArray.map((item) => ({
          ...item,
          createdAt: item.createdAt || item.date || null,
        }));
        setRFIs(normalized);
      } catch (error) {
        console.error("Error fetching RFIs:", error);
      } finally {
        setLoading(false);
      }
    };

    if (!rfiData || rfiData.length === 0) {
      fetchRFIs();
    } else {
      let rfiArray = [];
      if (Array.isArray(rfiData)) {
        rfiArray = rfiData;
      } else if (rfiData && rfiData["show rfi"]) {
        rfiArray = rfiData["show rfi"];
      } else if (rfiData && rfiData.data) {
        rfiArray = rfiData.data;
      } else if (rfiData && typeof rfiData === "object") {
        const firstArray = Object.values(rfiData).find(Array.isArray);
        if (firstArray) rfiArray = firstArray;
      }

      if (rfiArray.length > 0) {
        const normalized = rfiArray.map((item) => ({
          ...item,
          createdAt: item.createdAt || item.date || null,
        }));
        setRFIs(normalized);
      } else {
        setRFIs([]);
      }
      setLoading(false);
    }
  }, [rfiData, userRole]);

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
    {
      accessorKey: "multipleRecipients",
      header: "To",
      cell: ({ row }) => {
        const recipients = row.original.multipleRecipients;
        if (!recipients || recipients.length === 0) return "—";
        return (
          <div className="flex flex-col gap-1">
            {recipients.map((r, i) => (
              <span key={i} className="text-xs font-medium text-gray-700">
                {`${r.firstName ?? ""} ${r.lastName ?? ""}`.trim() || r.email || "—"}
              </span>
            ))}
          </div>
        );
      },
    },
  ];



  const getStatusInfo = (item) => {
    const responses = item.rfiresponse || [];
    if (responses.length > 0) {
      const sorted = [...responses].sort(
        (a, b) => new Date(b.createdAt || b.date || 0) - new Date(a.createdAt || a.date || 0)
      );
      const latest = sorted[0];
      const rfiStatus = latest.wbtStatus || latest.status;
      if (rfiStatus) {
        const statusStr = rfiStatus.toUpperCase();
        switch (statusStr) {
          case "OPEN":
            return { label: "OPEN", className: "bg-blue-100 text-black shadow-sm" };
          case "PARTIAL":
            return { label: "PARTIAL", className: "bg-orange-100 text-black shadow-sm" };
          case "COMPLETE":
            return { label: "COMPLETE", className: "bg-green-100 text-black shadow-sm" };
          default:
            return { label: statusStr, className: "bg-gray-100 text-black shadow-sm" };
        }
      }
    }

    // Fallback if no responses exist
    if (item.status === true || item.status === "OPEN" || item.status === "PENDING") {
      return { label: "PENDING", className: "bg-green-100 text-black shadow-sm" };
    } else {
      return { label: "ANSWERED", className: "bg-orange-100 text-black shadow-sm" };
    }
  };

  columns.push(
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const statusInfo = getStatusInfo(row.original);
        return (
          <span
            className={`px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-full border border-black ${statusInfo.className}`}
          >
            {statusInfo.label}
          </span>
        );
      },
    },
    {
      accessorKey: "createdAt",
      header: "Created At",
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
        detailComponent={({ row }) => <GetRFIByID id={row.id} onUpdate={onUpdate} />}
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
