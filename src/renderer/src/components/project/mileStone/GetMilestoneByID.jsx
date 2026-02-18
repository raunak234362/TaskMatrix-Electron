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
} from "lucide-react";
import Service from "../../../api/Service";
import { toast } from "react-toastify";
import { Button } from "../../ui/button";




const GetMilestoneByID = ({ row, close }) => {
  const [milestone, setMilestone] = useState(null);
  const [loading, setLoading] = useState(true);
  const id = row?.id;

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
        bg: "bg-[#6bbd45]/15",
        text: "text-[#6bbd45]",
        border: "border-[#6bbd45]",
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
          <Loader2 className="w-10 h-10 animate-spin text-[#6bbd45]" />
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
          className="mt-6 px-6 py-2 bg-[#6bbd45] text-white hover:bg-[#6bbd45]/90 transition"
        >
          Go Back
        </Button>
      </div>
    );
  }

  const statusConfig = getStatusConfig(milestone.status);

  return (
    <div className="bg-white rounded-xl overflow-hidden shadow-none border-none">
      {/* Header */}
      <div className="bg-[#6bbd45] px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
            <CheckCircle2 className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl  text-white leading-tight">
              {milestone.subject}
            </h2>
            <p className="text-white/80 text-xs font-medium">
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
            color="text-[#6bbd45]"
            bg="bg-[#6bbd45]/15"
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
            color="text-[#6bbd45]"
            bg="bg-[#6bbd45]/15"
          />
        </div>

        {/* Description */}
        <div className="bg-gray-50 rounded-xl p-5 border border-gray-100">
          <h3 className="text-sm  text-gray-700 mb-3 flex items-center gap-2">
            <FileText className="w-4 h-4 text-[#6bbd45]" />
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
              <ClipboardList className="w-4 h-4 text-[#6bbd45]" />
              Associated Tasks ({milestone.tasks.length})
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {milestone.tasks.map((task) => (
                <div
                  key={task.id}
                  className="flex items-center justify-between p-4 bg-white border border-gray-100 rounded-xl hover:border-green-200 transition-colors shadow-sm"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-[#6bbd45]/15 flex items-center justify-center">
                      <ClipboardList className="w-4 h-4 text-[#6bbd45]" />
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
      </div>
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
