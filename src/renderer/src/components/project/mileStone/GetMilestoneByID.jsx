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
import { truncateWords } from "../../../utils/stringUtils";

const GetMilestoneByID = ({ row, close, onUpdate }) => {
  const dispatch = useDispatch();
  const [milestone, setMilestone] = useState(null);
  const [expandedVersionId, setExpandedVersionId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isUpdateProgressModalOpen, setIsUpdateProgressModalOpen] =
    useState(false);
  const [showResponseModal, setShowResponseModal] = useState(false);
  const [selectedResponse, setSelectedResponse] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showTasksModal, setShowTasksModal] = useState(false);

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
        const plainText = truncateWords(row.original.description, 30);
        return (
          <p className="truncate max-w-[260px] text-xs sm:text-sm">
            {plainText}
          </p>
        );
      },
    },
    {
      accessorKey: "user",
      header: "By",
      cell: ({ row }) => {
        const user = row.original.user;
        const name = user
          ? `${user.firstName || ""} ${user.lastName || ""}`.trim()
          : null;
        return (
          <div className="flex items-center gap-1.5">
            <User className="w-3 h-3 text-gray-400 shrink-0" />
            <span className="text-xs font-semibold text-gray-700 truncate max-w-[120px]">
              {name || user?.username || "—"}
            </span>
          </div>
        );
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const s = row.original.status;
        const cls =
          s === "ON_TIME" ? "bg-emerald-50 text-emerald-700 border-emerald-200"
            : s === "DELAYED" ? "bg-red-50 text-red-700 border-red-200"
              : s === "NOT_STARTED" ? "bg-gray-50 text-gray-600 border-gray-200"
                : s === "CLARIFICATION_REQUIRED" ? "bg-yellow-50 text-yellow-700 border-yellow-200"
                  : s === "APPROVED" ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                    : s === "REJECTED" ? "bg-red-50 text-red-700 border-red-200"
                      : "bg-gray-50 text-gray-600 border-gray-200";
        return (
          <span className={`px-2 py-0.5 rounded-full text-[10px] uppercase font-bold tracking-tight border ${cls}`}>
            {s?.replace(/_/g, " ") || "—"}
          </span>
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

  // Responses are nested inside versions — flatten + sort newest first
  const allResponses = (milestone.versions || [])
    .flatMap((v) => v.responses || [])
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  return (
    <div
      className="fixed inset-0 bg-black/40 backdrop-blur-sm flex justify-center items-center z-50 p-4 animate-in fade-in duration-200"
      onClick={close}
    >
      <div
        className="bg-white w-full max-w-[95vw] max-h-[92vh] overflow-hidden rounded-3xl shadow-2xl border border-gray-100 flex flex-col animate-in fade-in zoom-in duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Section */}
        <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-center bg-green-50 sticky top-0 z-50 shrink-0">
          <div className="flex items-center gap-4">
            <div>
              <h2 className="text-2xl text-black font-semibold tracking-tight">
                {milestone.subject}
              </h2>
              <div className="flex items-center gap-2 mt-1">
                <span className="px-6 py-0.5 bg-green-200 font-bold text-green-700 text-[15px] uppercase rounded-md tracking-wider">
                  {milestone.stage || "—"}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {userRole !== "CLIENT" && userRole !== "CLIENT_ADMIN" && (
              <>
                <button
                  onClick={() => setIsUpdateProgressModalOpen(true)}
                  className="px-6 py-1.5 bg-green-50 text-black border-2 border-green-700/80 rounded-lg hover:bg-green-100 transition-all font-bold text-sm uppercase tracking-tight shadow-sm"
                >
                  Update Progress
                </button>
                <button
                  onClick={() => setIsEditModalOpen(true)}
                  className="px-6 py-1.5 bg-green-50 text-black border-2 border-green-700/80 rounded-lg hover:bg-green-100 transition-all font-bold text-sm uppercase tracking-tight shadow-sm"
                >
                  Edit
                </button>
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

        <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
          {/* Info Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <InfoCard
              label="Approval Date"
              value={formatDate(milestone.approvalDate)}
            />
            <InfoCard
              label="CD Approval Date"
              value={formatDate(milestone.CDApprovalDate)}
            />
            <InfoCard
              label="Created At"
              value={formatDate(milestone.date)}
            />
            <InfoCard
              label="Status"
              value={milestone.status || "—"}
            />
            <InfoCard
              label="Project"
              value={milestone.project?.name || "—"}
            />
            <InfoCard
              label="Types"
              value={milestone.types || "—"}
            />
            <InfoCard
              label="Sub Subject"
              value={milestone.subSubject || "—"}
            />
            
            {/* Progress Card */}
            <div
              className="p-5 border border-gray-200 border-l-[6px] border-l-green-600 bg-white flex flex-col justify-center h-full shadow-sm hover:shadow-md transition-all duration-200"
              style={{ minHeight: "100px" }}
            >
              <div className="flex flex-col gap-1 w-full">
                <span className="text-[13px] font-semibold text-black uppercase tracking-wider">
                  Progress
                </span>
                <div className="mt-1 w-full">
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
                        <div className="flex justify-between text-xs font-bold text-black">
                          <span>{finalProgress}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                          <div
                            className="bg-green-600 h-2 rounded-full transition-all duration-500"
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
          </div>

          {/* Collapsible Version History */}
          {milestone?.versions?.length > 0 && (
            <section className="space-y-4">
              <div className="flex items-center gap-2 border-l-4 border-l-green-600 pl-3 border-b border-b-gray-100 pb-2">
                <h3 className="text-lg font-semibold text-black uppercase tracking-wider">
                  Version History
                </h3>
              </div>
              <div className="space-y-3">
                {[...milestone.versions]
                  .sort((a, b) => b.versionNumber - a.versionNumber)
                  .map((v) => {
                    const isCurrent =
                      String(v.id) === String(milestone.currentVersionId);
                    const isExpanded =
                      String(expandedVersionId) === String(v.id);

                    return (
                      <div
                        key={v.id}
                        className={`rounded-xl border ${
                          isCurrent
                            ? "bg-green-50/50 border-green-600/50"
                            : "bg-white border-gray-200"
                        }`}
                      >
                        {/* Version Header */}
                        <div
                          className="flex items-center justify-between px-4 py-3 cursor-pointer"
                          onClick={() => setExpandedVersionId(isExpanded ? null : v.id)}
                        >
                          <div className="flex items-center gap-3">
                            <span
                              className={`text-xs font-bold px-3 py-1 rounded-md ${
                                isCurrent
                                  ? "bg-green-600 text-white"
                                  : "bg-gray-200 text-black"
                              }`}
                            >
                              V{v.versionNumber} {isCurrent && "· CURRENT"}
                            </span>

                            <span className="text-xs text-black font-semibold flex items-center gap-1">
                              <Clock className="w-3 h-3 text-black" />
                              {formatDateTime(v.createdAt)}
                            </span>
                          </div>

                          <span className="text-black text-lg">
                            {isExpanded ? "▲" : "▼"}
                          </span>
                        </div>

                        {/* Dropdown Content */}
                        {isExpanded && (
                          <div className="px-4 pb-4 pt-2 border-t bg-white">
                            {v.description && (
                              <div className="space-y-2">
                                <p className="text-xs font-bold text-black uppercase">
                                  Description
                                </p>
                                <div
                                  className="text-sm text-black prose prose-sm max-w-none font-medium"
                                  dangerouslySetInnerHTML={{
                                    __html: v.description,
                                  }}
                                />
                                <div className="grid grid-cols-2 gap-4 pt-2">
                                  <div>
                                    <p className="text-[10px] font-bold text-black uppercase tracking-wider">
                                      Approval Date
                                    </p>
                                    <p className="text-sm text-black font-semibold">
                                      {formatDate(v.approvalDate)}
                                    </p>
                                  </div>
                                  <div>
                                    <p className="text-[10px] font-bold text-black uppercase tracking-wider">
                                      CD Approval Date
                                    </p>
                                    <p className="text-sm text-black font-semibold">
                                      {formatDate(v.CDApprovalDate)}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
              </div>
            </section>
          )}

          {milestone.reason && (
            <div className="bg-red-50/50 rounded-2xl p-6 border border-red-100 shadow-sm">
              <h3 className="text-sm font-bold text-red-700 mb-2 flex items-center gap-2 uppercase tracking-widest">
                Reason of Delay
              </h3>
              <p className="text-sm text-red-700 font-medium">
                {milestone.reason}
              </p>
            </div>
          )}

          {/* Associated Tasks */}
          {milestone.Tasks && milestone.Tasks.length > 0 && (
            <section className="space-y-4">
              <div className="flex items-center gap-2 border-l-4 border-l-green-600 pl-3 border-b border-b-gray-100 pb-2">
                <h3 className="text-lg font-semibold text-black uppercase tracking-wider">
                  Associated Tasks
                </h3>
              </div>
              <button
                onClick={() => setShowTasksModal(true)}
                className="w-full flex items-center justify-between px-5 py-4 bg-white border border-gray-200 hover:border-green-600 hover:bg-green-50/30 transition-all shadow-sm group rounded-2xl"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-50 rounded-xl group-hover:bg-green-100 transition-colors">
                    <ClipboardList className="w-5 h-5 text-green-600" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-bold text-black uppercase tracking-tight">
                      Associated Tasks
                    </p>
                    <p className="text-xs text-black font-semibold mt-0.5">
                      Click to view all tasks
                    </p>
                  </div>
                </div>
                <span className="shrink-0 text-sm font-bold bg-green-50 border border-green-700/80 px-3 py-1 rounded-full text-black">
                  {milestone.Tasks.length} task{milestone.Tasks.length !== 1 ? "s" : ""}
                </span>
              </button>
            </section>
          )}

          {/* Responses Section */}
          <section className="space-y-4">
            <div className="flex items-center justify-between border-l-4 border-l-green-600 pl-3 border-b border-b-gray-100 pb-2">
              <h3 className="text-lg font-semibold text-black uppercase tracking-wider">
                Responses
              </h3>
              <button
                onClick={() => setShowResponseModal(true)}
                className="px-6 py-1.5 bg-green-50 text-black border-2 border-green-700/80 rounded-none hover:bg-green-100 transition-all font-bold text-sm uppercase tracking-tight shadow-sm cursor-pointer"
              >
                + Add Response
              </button>
            </div>

            <div className="bg-white rounded-none border border-gray-300 shadow-sm overflow-hidden">
              {allResponses.length > 0 ? (
                <DataTable
                  columns={responseColumns}
                  data={allResponses}
                  onRowClick={(row) => setSelectedResponse(row)}
                />
              ) : (
                <div className="p-8 text-center text-black font-semibold text-sm italic">
                  No responses yet.
                </div>
              )}
            </div>
          </section>
        </div>

        {/* Edit Modal */}
        {isEditModalOpen && (
          <div className="fixed inset-0 z-9999 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="w-full max-w-2xl max-h-[85vh] h-full bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in duration-200">
              <EditMileStone
                milestoneId={id.toString()}
                initialData={milestone}
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
          <div className="fixed inset-0 z-9999 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
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
            mileStoneVersionId={milestone.currentVersionId}
            onClose={() => setShowResponseModal(false)}
            onSuccess={fetchMilestone}
          />
        )}

        {/* Response Details Modal */}
        {selectedResponse && (
          <MilestoneResponseDetailsModal
            response={selectedResponse}
            milestoneId={milestone.id}
            onClose={() => setSelectedResponse(null)}
            onSuccess={fetchMilestone}
          />
        )}

        {/* Tasks Popup Modal */}
        {showTasksModal && (
          <div className="fixed inset-0 z-9999 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-150">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[85vh] flex flex-col overflow-hidden border border-gray-200 animate-in zoom-in duration-150">
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-50 rounded-xl">
                    <ClipboardList className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-black uppercase tracking-tight">
                      Associated Tasks
                    </h3>
                    <p className="text-[10px] text-gray-400 font-semibold tracking-widest uppercase mt-0.5">
                      {milestone.subject} · {milestone.Tasks.length} task{milestone.Tasks.length !== 1 ? "s" : ""}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowTasksModal(false)}
                  className="px-5 py-1.5 bg-red-50 text-black border border-red-300 rounded-lg hover:bg-red-100 transition-all font-black text-[10px] uppercase tracking-widest"
                >
                  Close
                </button>
              </div>

              {/* Task List */}
              <div className="overflow-y-auto flex-1 p-5 space-y-2 custom-scrollbar">
                {milestone.Tasks.map((task, index) => {
                  const statusColors = {
                    COMPLETE: "bg-emerald-50 text-emerald-700 border-emerald-200",
                    VALIDATE_COMPLETE: "bg-emerald-50 text-emerald-700 border-emerald-200",
                    COMPLETED: "bg-emerald-50 text-emerald-700 border-emerald-200",
                    IN_REVIEW: "bg-blue-50 text-blue-700 border-blue-200",
                    IN_PROGRESS: "bg-yellow-50 text-yellow-700 border-yellow-200",
                    ASSIGNED: "bg-purple-50 text-purple-700 border-purple-200",
                    REWORK: "bg-orange-50 text-orange-700 border-orange-200",
                    USER_FAULT: "bg-red-50 text-red-700 border-red-200",
                    COMPLETE_OTHER: "bg-teal-50 text-teal-700 border-teal-200",
                  };
                  const statusCls =
                    statusColors[task.status] ||
                    "bg-gray-50 text-gray-600 border-gray-200";

                  return (
                    <div
                      key={task.id}
                      className="flex items-center gap-4 px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl hover:border-[#6bbd45]/40 hover:bg-[#6bbd45]/5 transition-all group"
                    >
                      {/* Index */}
                      <span className="shrink-0 w-6 h-6 flex items-center justify-center text-[10px] font-black text-gray-400 bg-white border border-gray-200 rounded-lg">
                        {index + 1}
                      </span>

                      {/* Icon */}
                      <div className="shrink-0 w-8 h-8 rounded-xl bg-white border border-gray-200 flex items-center justify-center group-hover:border-[#6bbd45]/30 transition-colors">
                        <ClipboardList className="w-4 h-4 text-green-600" />
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-black text-black truncate">{task.name}</p>
                          {task.serialNo && (
                            <span className="text-[9px] font-black text-gray-400 bg-white border border-gray-200 px-1.5 py-0.5 rounded-md uppercase tracking-wider shrink-0">
                              {task.serialNo}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 mt-1 flex-wrap">
                          <div className="flex items-center gap-1">
                            <User className="w-3 h-3 text-gray-400" />
                            <span className="text-[10px] text-gray-500 font-semibold">
                              {task.user
                                ? `${task.user.firstName || ""} ${task.user.lastName || ""}`.trim()
                                : "Unassigned"}
                            </span>
                          </div>
                          {task.due_date && (
                            <div className="flex items-center gap-1">
                              <Calendar className="w-3 h-3 text-gray-400" />
                              <span className="text-[10px] text-gray-500 font-semibold">
                                {new Date(task.due_date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                              </span>
                            </div>
                          )}
                          {task.wbsType && (
                            <span className="text-[9px] font-black text-blue-600 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-full uppercase">
                              {task.wbsType}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Status */}
                      <span className={`shrink-0 text-[9px] font-black px-2.5 py-1 rounded-full border uppercase tracking-wider ${statusCls}`}>
                        {task.status?.replace(/_/g, " ")}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteModal && (
          <div className="fixed inset-0 z-9999 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
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

const InfoCard = ({ label, value }) => {
  const isLongValue = typeof value === "string" && value.length > 20;
  return (
    <div
      className="p-5 border border-gray-200 border-l-[6px] border-l-green-600 bg-white flex flex-col justify-center h-full shadow-sm hover:shadow-md transition-all duration-200"
      style={{ minHeight: "100px" }}
    >
      <div className="flex flex-col gap-1 w-full">
        <span className="text-[13px] font-semibold text-black uppercase tracking-wider">
          {label}
        </span>
        <span className={`font-semibold text-black mt-1 ${isLongValue ? "text-sm" : "text-lg"}`}>
          {value || "—"}
        </span>
      </div>
    </div>
  );
};

export default GetMilestoneByID;
