import React, { useEffect, useState } from "react";
import {
  Loader2,
  Calendar,
  FileText,
  CheckCircle2,
  AlertCircle,
  Clock,
  ClipboardList,
  User,
  Tag,
  X,
  MessageSquare,
} from "lucide-react";
import Service from "../../../api/Service";
import { toast } from "react-toastify";
import { Button } from "../../ui/button";
import DataTable from "../../ui/table";
import MilestoneResponseModal from "./MilestoneResponseModal";
import MilestoneResponseDetailsModal from "./MilestoneResponseDetailsModal";




const GetMilestoneByID = ({ row, close }) => {
  const [milestone, setMilestone] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showResponseModal, setShowResponseModal] = useState(false);
  const [selectedResponse, setSelectedResponse] = useState(null);
  const id = row?.id;
  const userRole = sessionStorage.getItem("userRole")?.toUpperCase() || "";

  const fetchMilestone = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const response = await Service.GetMilestoneById(id.toString());
      setMilestone(response?.data || null);
    } catch (error) {
      console.error("Error fetching milestone:", error);
      toast.error("Failed to load milestone details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMilestone();
  }, [id]);

  const formatDate = (dateString) => {
    if (!dateString) return "—";
    return new Intl.DateTimeFormat("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(new Date(dateString));
  };

  const getStatusConfig = (status) => {
    const configs = {
      APPROVED: {
        label: "Approved",
        bg: "bg-emerald-100",
        text: "text-emerald-700",
        border: "border-emerald-300",
      },
      PENDING: {
        label: "Pending",
        bg: "bg-yellow-100",
        text: "text-yellow-700",
        border: "border-yellow-300",
      },
      REJECTED: {
        label: "Rejected",
        bg: "bg-red-100",
        text: "text-red-700",
        border: "border-red-300",
      },
    };
    return (
      configs[status?.toUpperCase() || ""] || {
        label: status || "Unknown",
        bg: "bg-gray-100",
        text: "text-gray-700",
        border: "border-gray-300",
      }
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex flex-col items-center">
          <Loader2 className="w-10 h-10 animate-spin text-green-600" />
          <p className="mt-4 text-sm font-medium text-gray-700">
            Loading milestone details...
          </p>
        </div>
      </div>
    );
  }

  if (!milestone) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
          <AlertCircle className="w-8 h-8 text-gray-400" />
        </div>
        <p className="text-lg font-semibold text-gray-700">
          Milestone Not Found
        </p>
        <p className="text-gray-700 mt-1">
          This milestone may have been removed.
        </p>
        <Button
          onClick={close}
          className="mt-6 px-6 py-2 bg-green-600 text-white hover:bg-green-700 transition"
        >
          Go Back
        </Button>
      </div>
    );
  }

  const statusConfig = getStatusConfig(milestone.status);

  const responseColumns = [
    {
      accessorKey: "userRole",
      header: "From",
      cell: ({ row }) => {
        const role = row.original.userRole?.toUpperCase() === "CLIENT" ? "Client" : "Team";
        return (
          <span className="font-bold text-gray-900 text-sm">
            {role}
          </span>
        );
      }
    },
    {
      accessorKey: "description",
      header: "Message",
      cell: ({ row }) => {
        const plainText =
          row.original.description?.replace(/<[^>]*>?/gm, "") || "No message";
        return (
          <div className="flex flex-col max-w-[200px]">
            <p className="truncate text-sm font-bold text-gray-700">{plainText}</p>
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
              {row.original.files?.length || 0} Attachments
            </span>
          </div>
        );
      },
    },
    {
      accessorKey: "createdAt",
      header: "Created",
      cell: ({ row }) => (
        <span className="text-gray-500 text-xs font-bold uppercase tracking-widest leading-none">
          {new Date(row.original.createdAt).toLocaleDateString("en-IN", {
            day: '2-digit',
            month: 'short'
          })}
          <br />
          <span className="text-[10px] opacity-60">
            {new Date(row.original.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </span>
      ),
    }
  ];

  return (
    <div className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100">
      {/* Header */}
      <div className="bg-linear-to-r from-green-600 to-green-500 px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
            <CheckCircle2 className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl  text-white leading-tight">
              {milestone.subject}
            </h2>
            <p className="text-green-50 text-xs font-medium">
              ID: #{milestone.id}
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={close}
          className="p-2 hover:bg-white/10 text-white"
        >
          <X className="w-6 h-6" />
        </Button>
      </div>

      <div className="p-6 space-y-8">
        {/* Info Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <InfoCard
            icon={<Calendar className="w-5 h-5" />}
            label="Target Date"
            value={formatDate(milestone.date)}
            color="text-green-600"
            bg="bg-green-50"
          />
          <InfoCard
            icon={<Calendar className="w-5 h-5" />}
            label="Approval Date"
            value={formatDate(milestone.approvalDate)}
            color="text-blue-600"
            bg="bg-blue-50"
          />
          <InfoCard
            icon={<Clock className="w-5 h-5" />}
            label="Created At"
            value={formatDate(milestone.createdAt)}
            color="text-purple-600"
            bg="bg-purple-50"
          />
          <div className="flex flex-col gap-1">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Status
            </span>
            <div
              className={`inline-flex items-center px-3 py-1 rounded-full text-xs  border-2 ${statusConfig.bg} ${statusConfig.text} ${statusConfig.border} w-fit mt-1`}
            >
              {statusConfig.label}
            </div>
          </div>
          <InfoCard
            icon={<Tag className="w-5 h-5" />}
            label="Project"
            value={milestone.project?.name || "—"}
            color="text-green-600"
            bg="bg-green-50"
          />
        </div>

        {/* Description */}
        <div className="bg-gray-50 rounded-xl p-5 border border-gray-100">
          <h3 className="text-sm  text-gray-700 mb-3 flex items-center gap-2">
            <FileText className="w-4 h-4 text-green-600" />
            Description
          </h3>
          <div
            className="text-gray-700 text-sm leading-relaxed prose prose-sm max-w-none"
            dangerouslySetInnerHTML={{
              __html:
                milestone.description ||
                "No description provided for this milestone.",
            }}
          />
        </div>

        {/* Tasks Section (Optional - if the API returns tasks) */}
        {milestone.tasks && milestone.tasks.length > 0 && (
          <div>
            <h3 className="text-sm  text-gray-700 mb-4 flex items-center gap-2">
              <ClipboardList className="w-4 h-4 text-green-600" />
              Associated Tasks ({milestone.tasks.length})
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {milestone.tasks.map((task) => (
                <div
                  key={task.id}
                  className="flex items-center justify-between p-4 bg-white border border-gray-100 rounded-xl hover:border-green-200 transition-colors shadow-sm"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-green-50 flex items-center justify-center">
                      <ClipboardList className="w-4 h-4 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-700">
                        {task.name}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <User className="w-3 h-3 text-gray-400" />
                        <span className="text-xs text-gray-700">
                          {task.user
                            ? `${task.user.firstName} ${task.user.lastName}`
                            : "Unassigned"}
                        </span>
                      </div>
                    </div>
                  </div>
                  <span className="text-[10px]  px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 uppercase">
                    {task.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Responses Section */}
        <div className="border-t border-gray-100 pt-8 mt-8">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-green-600" />
              Responses & Discussion
            </h3>

            {(userRole === "ADMIN" ||
              userRole === "DEPUTY_MANAGER" ||
              userRole === "OPERATION_EXECUTIVE" ||
              userRole === "USER") && (
                <Button
                  onClick={() => setShowResponseModal(true)}
                  className="bg-green-600 text-white hover:bg-green-700"
                >
                  + Add Response
                </Button>
              )}
          </div>

          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm">
            {milestone.responses?.length > 0 ? (
              <DataTable
                columns={responseColumns}
                data={milestone.responses}
                onRowClick={(row) => setSelectedResponse(row)}
              />
            ) : (
              <div className="p-8 text-center bg-gray-50/50">
                <p className="text-gray-500 text-sm">No responses yet. Start the conversation!</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      {showResponseModal && (
        <MilestoneResponseModal
          milestoneId={milestone.id}
          versionId={milestone.versionId}
          onClose={() => setShowResponseModal(false)}
          onSuccess={fetchMilestone}
        />
      )}

      {selectedResponse && (
        <MilestoneResponseDetailsModal
          response={selectedResponse}
          onClose={() => setSelectedResponse(null)}
          onSuccess={fetchMilestone}
        />
      )}
    </div>
  );
};

const InfoCard = ({
  icon,
  label,
  value,
  color,
  bg,
}) => (
  <div className="flex flex-col gap-1">
    <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
      {label}
    </span>
    <div className="flex items-center gap-2 mt-1">
      <div className={`p-1.5 ${bg} ${color} rounded-lg`}>{icon}</div>
      <span className="text-sm  text-gray-700">{value}</span>
    </div>
  </div>
);

export default GetMilestoneByID;
