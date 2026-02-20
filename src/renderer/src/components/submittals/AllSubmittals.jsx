/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
import DataTable from "../ui/table";

import { useSelector } from "react-redux";
import { Loader2, Inbox, MessageSquare } from "lucide-react";
import Service from "../../api/Service";
import GetSubmittalByID from "./GetSubmittalByID";
import Modal from "../ui/Modal";
import AddCommunication from "../communication/AddCommunication";


const AllSubmittals = ({ submittalData }) => {
  const [submittals, setSubmittals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isFollowUpOpen, setIsFollowUpOpen] = useState(false);
  const [prefilledData, setPrefilledData] = useState(null);

  const projects = useSelector((state) => state.projectInfo?.projectData || []);
  const fabricators = useSelector((state) => state.fabricatorInfo?.fabricatorData || []);

  console.log(submittalData);

  const userRole = sessionStorage.getItem("userRole");

  const fetchSubmittals = async () => {
    try {
      setLoading(true);
      let result;

      if (userRole === "CLIENT") result = await Service.SubmittalSent();
      else result = await Service.SubmittalRecieved();

      const data = Array.isArray(result?.data) ? result.data : [];

      const normalized = data.map((item) => ({
        ...item,
        milestone: item.mileStoneBelongsTo || item.milestone || null,
        recipient: item.recepients || null,
        sender: item.sender || null,
        createdAt: item.createdAt || item.date || null,
        statusLabel:
          item.isAproovedByAdmin === true
            ? "APPROVED"
            : item.isAproovedByAdmin === false
              ? "REJECTED"
              : "PENDING",
      }));

      setSubmittals(normalized);
    } catch {
      setSubmittals([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (submittalData && submittalData.length > 0) {
      setSubmittals(submittalData);
      setLoading(false);
    } else {
      fetchSubmittals();
    }

  }, []);

  const columns = [
    { accessorKey: "subject", header: "Subject" },

    {
      accessorKey: "sender",
      header: "Sender",
      cell: ({ row }) => {
        const s = row.original.sender;
        return s ? `${s.firstName ?? ""} ${s.lastName ?? ""}`.trim() : "—";
      },
    },

    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const isSubmitted = row.original.status === true
        return (
          <span
            className={`px-2 py-1 rounded-full text-xs font-medium ${isSubmitted
              ? "bg-amber-100 text-amber-700"
              : "bg-green-100 text-green-700"
              }`}
          >
            {!isSubmitted ? "Submitted to EOR" : "Pending"}
          </span>
        )
      },
    },

    {
      accessorKey: "createdAt",
      header: "Created",
      cell: ({ row }) =>
        new Date(row.original.date).toLocaleString(),
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
              notes: `Ref: Submittal ${item.subject || ""}`
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
    },
  ];

  if (loading) {
    return (
      <div className="flex flex-col items-center gap-2 py-12 text-gray-700">
        <Loader2 className="animate-spin w-6 h-6" /> Loading Submittals...
      </div>
    );
  }

  if (!submittals.length) {
    return (
      <div className="flex flex-col items-center gap-2 py-16 text-gray-700">
        <Inbox className="w-10 h-10 text-gray-400" />
        <p>No Submittals Found</p>
      </div>
    );
  }

  return (
    <div className="bg-white p-2 rounded-xl shadow-md">
      <DataTable
        columns={columns}
        data={submittals}
        detailComponent={({ row }) => <GetSubmittalByID id={row.id} />}
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

export default AllSubmittals;
