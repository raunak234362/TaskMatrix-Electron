/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
import DataTable from "../ui/table";

import { useSelector } from "react-redux";
import { Loader2, Inbox, MessageSquare, ClipboardList, AlertCircle } from "lucide-react";
import Service from "../../api/Service";
import GetSubmittalByID from "./GetSubmittalByID";
import Modal from "../ui/Modal";
import AddCommunication from "../communication/AddCommunication";


const AllSubmittals = ({ submittalData, projectId }) => {
  const [submittals, setSubmittals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isFollowUpOpen, setIsFollowUpOpen] = useState(false);
  const [prefilledData, setPrefilledData] = useState(null);
  const [upcomingSubmittals, setUpcomingSubmittals] = useState([]);

  const projects = useSelector((state) => state.projectInfo?.projectData || []);
  const fabricators = useSelector((state) => state.fabricatorInfo?.fabricatorData || []);

  console.log(submittalData);

  const userRole = sessionStorage.getItem("userRole");

  const fetchSubmittals = async () => {
    try {
      setLoading(true);
      let result;

      if (projectId) {
        result = await Service.SubmittalSentByProjectId(projectId);
      } else if (userRole === "CLIENT") result = await Service.SubmittalSent();
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

      // Fetch upcoming submittals (milestones pending submittal)
      if (projectId) {
        try {
          const upcomingRes = await Service.GetPendingSubmittal();
          const upcomingData = Array.isArray(upcomingRes) ? upcomingRes : upcomingRes?.data || [];
          const projectUpcoming = upcomingData.filter(m =>
            String(m.projectId || m.project?.id) === String(projectId)
          );
          setUpcomingSubmittals(projectUpcoming);
        } catch (err) {
          console.error("Error fetching upcoming submittals:", err);
        }
      }
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
  }, [projectId, submittalData]);

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

    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const isPending = row.original.status === false;
        return (
          <span
            className={`text-[10px] font-black uppercase tracking-widest`}
          >
            {isPending ? "Pending" : "Submitted to EOR"}
          </span>
        );
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
      <div className="space-y-6">
        <div className="flex flex-col items-center gap-2 py-8 text-gray-700 bg-gray-50 rounded-xl border border-dashed border-gray-200">
          <Inbox className="w-10 h-10 text-gray-400" />
          <p className="font-medium">No Submittals Created Yet</p>
        </div>

        {upcomingSubmittals.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-sm font-black text-green-700 uppercase tracking-widest flex items-center gap-2">
              <ClipboardList className="w-4 h-4" />
              Upcoming Submittals (Planned Milestones)
            </h3>
            <div className="grid grid-cols-1 gap-3">
              {upcomingSubmittals.map((milestone) => {
                const dueDate = milestone.approvalDate || milestone.date;
                const isOverdue = dueDate && new Date(dueDate) < new Date();

                return (
                  <div
                    key={milestone.id}
                    className="flex flex-col md:flex-row md:items-center justify-between p-4 bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all group"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`p-2 rounded-lg ${isOverdue ? 'bg-red-50 text-red-500' : 'bg-green-50 text-green-600'}`}>
                        <ClipboardList size={20} />
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-900 group-hover:text-green-700 transition-colors">
                          {milestone.name || milestone.subject || "Untitled Milestone"}
                        </h4>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 px-2 py-0.5 bg-gray-100 rounded-md">
                            {milestone.category}
                          </span>
                          {dueDate && (
                            <span className={`text-[10px] font-bold flex items-center gap-1 ${isOverdue ? 'text-red-500' : 'text-gray-500'}`}>
                              {isOverdue && <AlertCircle size={10} />}
                              Due: {new Date(dueDate).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-4 md:mt-0 flex items-center gap-3">
                       <span className="text-xs font-semibold text-gray-400 italic">
                        Not yet submitted
                       </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white p-2 rounded-xl shadow-md">
      <DataTable
        columns={columns}
        data={submittals}
        detailComponent={({ row, close }) => <GetSubmittalByID id={row.id} onClose={close} />}
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
