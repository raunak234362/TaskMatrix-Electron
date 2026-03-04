import { useEffect, useState } from "react";
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
  Edit,
  Plus,
} from "lucide-react";
import Service from "../../../api/Service";
import { toast } from "react-toastify";
import { Button } from "../../ui/button";
import EditMileStone from "./EditMileStone";
import UpdateCompletionPer from "./UpdateCompletionPer";
import DataTable from "../../ui/table";
import MilestoneResponseModal from "./MilestoneResponseModal";
import MilestoneResponseDetailsModal from "./MilestoneResponseDetailsModal";
import { formatDateTime, formatDate as genericFormatDate } from "../../../utils/dateUtils";
import { useDispatch } from "react-redux";
import { setMilestonesForProject } from "../../../store/milestoneSlice";

const GetMilestoneByID = ({ row, close, onUpdate }) => {
  const dispatch = useDispatch();
  const [milestone, setMilestone] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isUpdateProgressModalOpen, setIsUpdateProgressModalOpen] =
    useState(false);
  const [showResponseModal, setShowResponseModal] = useState(false);
  const [selectedResponse, setSelectedResponse] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const id = row?.id;
  const userRole = sessionStorage.getItem("userRole");

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

  const refreshReduxStore = async (projId) => {
    if (!projId) return;
    try {
      const response = await Service.GetProjectMilestoneById(projId);
      if (response && response.data) {
        dispatch(
          setMilestonesForProject({
            projectId: projId,
            milestones: response.data,
          }),
        );
      }
    } catch (error) {
      console.error("Error refreshing milestones in Redux:", error);
    }
  };

  const handleSuccess = async () => {
    await fetchMilestone();
    const projId = milestone?.project_id || milestone?.project?.id || row?.project_id;
    if (projId) {
      await refreshReduxStore(projId);
    }
    if (onUpdate) onUpdate();
  };

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      await Service.DeleteMilestoneById(id.toString());
      toast.success("Milestone deleted successfully");
      const projId = milestone?.project_id || milestone?.project?.id || row?.project_id;
      if (projId) {
        await refreshReduxStore(projId);
      }
      if (onUpdate) onUpdate();
      close();
    } catch (error) {
      console.error("Delete failed:", error);
      toast.error("Failed to delete milestone");
    } finally {
      setIsDeleting(false);
      setShowDeleteModal(false);
    }
  };

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

  const responseColumns = [
    {
      accessorKey: "description",
      header: "Message",
      cell: ({ row }) => {
        const plainText =
          row.original.description?.replace(/<[^>]*>?/gm, "") || "";
        return (
          <p className="truncate max-w-[300px] text-xs sm:text-sm">
            {plainText}
          </p>
        );
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => (
        <span
          className={`px-2 py-0.5 rounded-full text-[10px] uppercase font-bold tracking-tight border ${row.original.status === "APPROVED"
            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
            : row.original.status === "REJECTED"
              ? "bg-red-50 text-red-700 border-red-200"
              : "bg-gray-50 text-gray-700 border-gray-200"
            }`}
        >
          {row.original.status}
        </span>
      ),
    },
    {
      accessorKey: "files",
      header: "Files",
      cell: ({ row }) => {
        const count = row.original.files?.length ?? 0;
        return count > 0 ? (
          <span className="text-black font-medium text-xs">
            {count} file(s)
          </span>
        ) : (
          <span className="text-gray-300">—</span>
        );
      },
    },
    {
      accessorKey: "createdAt",
      header: "Date",
      cell: ({ row }) => (
        <span className="text-gray-500 text-[10px] sm:text-xs">
          {formatDateTime(row.original.createdAt)}
        </span>
      ),
    },
  ];

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

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl h-auto border border-gray-200 overflow-hidden flex flex-col relative">

        {/* Header */}
        <div className=" px-6 py-4 border-b flex justify-between items-center bg-gray-50/30">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle2 className="w-6 h-6 text-green-700" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-black leading-tight">
                {milestone.subject}
              </h2>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {userRole !== "CLIENT" && userRole !== "CLIENT_ADMIN" && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsUpdateProgressModalOpen(true)}
                  className="text-black border border-black bg-white hover:bg-green-50 flex items-center gap-2 h-9"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Update Progress
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsEditModalOpen(true)}
                  className="text-black border border-black bg-white hover:bg-green-50 flex items-center gap-2 h-9"
                >
                  <Edit className="w-4 h-4" />
                  Edit
                </Button>
              </>
            )}
            <button
              onClick={close}
              className="px-6 py-1.5 bg-red-50 text-black border-2 border-red-700/80 rounded-lg hover:bg-red-100 transition-all font-bold text-sm uppercase tracking-tight shadow-sm"
            >
              Close
            </button>
          </div>
        </div>

        <div className="p-6 space-y-8">
          {/* Info Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
              value={formatDate(milestone.date)}
              color="text-purple-600"
              bg="bg-purple-50"
            />
            <div className="flex flex-col gap-1">
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Status
              </span>
              <div
                className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border-2 ${statusConfig.bg} ${statusConfig.text} ${statusConfig.border} w-fit mt-1`}
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
            <div className="flex flex-col gap-1 w-full col-span-1 md:col-span-2 lg:col-span-1">
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Progress
              </span>
              <div className="mt-2 w-full">
                {(() => {
                  const msTasks = milestone.Tasks || milestone.tasks || [];
                  const totalTasks = msTasks.length;
                  let taskProgress = 0;

                  if (totalTasks > 0) {
                    const completedStatuses = [
                      "COMPLETE",
                      "VALIDATE_COMPLETE",
                      "COMPLETE_OTHER",
                      "USER_FAULT",
                      "COMPLETED",
                    ];
                    const completedCount = msTasks.filter((t) =>
                      completedStatuses.includes(t.status),
                    ).length;
                    taskProgress = Math.round(
                      (completedCount / totalTasks) * 100,
                    );
                  }

                  const finalProgress =
                    milestone.percentage !== undefined &&
                      milestone.percentage !== null &&
                      milestone.percentage !== ""
                      ? Number(milestone.percentage)
                      : milestone.completionPercentage !== undefined &&
                        milestone.completionPercentage !== null
                        ? Number(milestone.completionPercentage)
                        : milestone.completeionPercentage !== undefined &&
                          milestone.completeionPercentage !== null
                          ? Number(milestone.completeionPercentage)
                          : taskProgress;

                  return (
                    <div className="flex flex-col gap-1">
                      <div className="flex justify-between text-xs font-bold text-gray-700">
                        <span>{finalProgress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
                        <div
                          className="bg-green-600 h-2.5 rounded-full transition-all duration-500"
                          style={{
                            width: `${Math.min(100, Math.max(0, finalProgress))}%`,
                          }}
                        ></div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left side: Description and tasks */}
            <div className="space-y-8">
              {/* Description */}
              <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100 shadow-sm">
                <h3 className="text-sm font-bold text-gray-700 mb-4 flex items-center gap-2 uppercase tracking-widest">
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

              {milestone.reason && (
                <div className="bg-red-50/50 rounded-2xl p-6 border border-red-100 shadow-sm">
                  <h3 className="text-sm font-bold text-gray-700 mb-2 flex items-center gap-2 uppercase tracking-widest">
                    Reason of Delay
                  </h3>
                  <p className="text-sm text-red-700 font-medium">
                    {milestone.reason}
                  </p>
                </div>
              )}

              {/* Tasks Section */}
              {milestone.tasks && milestone.tasks.length > 0 && (
                <div>
                  <h3 className="text-sm font-bold text-gray-700 mb-4 flex items-center gap-2 uppercase tracking-widest">
                    <ClipboardList className="w-4 h-4 text-green-600" />
                    Associated Tasks ({milestone.tasks.length})
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {milestone.tasks.map((task) => (
                      <div
                        key={task.id}
                        className="flex items-center justify-between p-4 bg-white border border-gray-100 rounded-2xl hover:border-green-200 transition-all shadow-sm group"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl bg-green-50 flex items-center justify-center group-hover:bg-green-100 transition-colors">
                            <ClipboardList className="w-4 h-4 text-green-600" />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-gray-700">
                              {task.name}
                            </p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <User className="w-3 h-3 text-gray-400" />
                              <span className="text-[10px] text-gray-500 font-medium">
                                {task.user
                                  ? `${task.user.firstName} ${task.user.lastName}`
                                  : "Unassigned"}
                              </span>
                            </div>
                          </div>
                        </div>
                        <span className="text-[9px] font-black  px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 uppercase tracking-tighter">
                          {task.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right side: Responses */}
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-bold text-gray-700 flex items-center gap-2 uppercase tracking-widest">
                  Responses
                </h3>
                <Button
                  onClick={() => setShowResponseModal(true)}
                  size="sm"
                  className="bg-green-600 text-white rounded-xl flex items-center gap-2 h-9 text-xs font-bold px-4"
                >
                  <Plus className="w-4 h-4" />
                  Add Response
                </Button>
              </div>

              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                {milestone.responses && milestone.responses.length > 0 ? (
                  <DataTable
                    columns={responseColumns}
                    data={milestone.responses}
                    onRowClick={(row) => setSelectedResponse(row)}
                  />
                ) : (
                  <div className="p-8 text-center text-gray-400 text-sm italic">
                    No responses yet.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Edit Modal */}
        {isEditModalOpen && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="w-full max-w-2xl h-[90vh] bg-white rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
              <EditMileStone
                milestoneId={id.toString()}
                mileStoneVersionId={milestone.currentVersionId}
                onClose={() => setIsEditModalOpen(false)}
                onSuccess={() => {
                  handleSuccess();
                  setIsEditModalOpen(false);
                }}
              />
            </div>
          </div>
        )}

        {/* Update Progress Modal */}
        {isUpdateProgressModalOpen && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="w-full max-w-lg h-auto bg-white rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
              <UpdateCompletionPer
                milestoneId={id.toString()}
                onClose={() => setIsUpdateProgressModalOpen(false)}
                onSuccess={() => {
                  handleSuccess();
                  setIsUpdateProgressModalOpen(false);
                }}
              />
            </div>
          </div>
        )}

        {/* Response Modal */}
        {showResponseModal && (
          <MilestoneResponseModal
            milestoneId={id.toString()}
            onClose={() => setShowResponseModal(false)}
            onSuccess={fetchMilestone}
          />
        )}

        {/* Response Details Modal */}
        {selectedResponse && (
          <MilestoneResponseDetailsModal
            response={selectedResponse}
            onClose={() => setSelectedResponse(null)}
            onSuccess={fetchMilestone}
          />
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteModal && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 animate-in fade-in zoom-in duration-200 text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-8 h-8 text-red-600" />
              </div>
              <h3 className="text-xl font-black text-black uppercase tracking-tight mb-2">
                Delete Milestone
              </h3>
              <p className="text-sm text-gray-500 mb-8">
                Are you sure you want to delete this milestone? This action cannot
                be undone.
              </p>
              <div className="flex gap-4">
                <Button
                  onClick={() => setShowDeleteModal(false)}
                  className="flex-1 bg-gray-100 text-gray-700 rounded-xl font-bold uppercase tracking-tight h-12"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleDelete}
                  disabled={isDeleting}
                  variant="destructive"
                  className="flex-1 rounded-xl font-bold uppercase tracking-tight h-12 shadow-md"
                >
                  {isDeleting ? "Deleting..." : "Delete"}
                </Button>
              </div>
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
    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
      {label}
    </span>
    <div className="flex items-center gap-2 mt-1">
      <div className={`p-2 ${bg} ${color} rounded-xl shadow-sm`}>{icon}</div>
      <span className="text-sm font-bold text-gray-800">{value}</span>
    </div>
  </div>
);

export default GetMilestoneByID;
