import React, { useEffect, useState } from "react";
import {
  Loader2,
  Calendar,
  User,
  FileText,
  Clock4,
  ChevronDown,
  ChevronUp,
  Building2,
  Hash,
  Timer,
  Users,
  Pause,
  Play,
  Square,
  ClipboardList,
  Clock,
} from "lucide-react";
import Service from "../../api/Service";
import { toast } from "react-toastify";
import { Button } from "../ui/button";
import EditTask from "./EditTask";
import { Edit } from "lucide-react";
import Comment from "./comments/Comment";



const FetchTaskByID = ({
  id,
  onClose,
  refresh,
}) => {
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [showWorkSummary, setShowWorkSummary] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [staffData, setStaffData] = useState([]);
  const [isEndModalOpen, setIsEndModalOpen] = useState(false);
  const [endComment, setEndComment] = useState("");
  const [completionPercentage, setCompletionPercentage] = useState("");
  const userRole = sessionStorage.getItem("userRole")?.toLowerCase() || "";
  const fetchTask = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const response = await Service.GetTaskById(id.toString());
      setTask(response?.data || null);
    } catch (error) {
      console.error("Error fetching task:", error);
      toast.error("Failed to load task details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTask();
    const fetchStaff = async () => {
      try {
        const data = await Service.FetchAllEmployee();
        setStaffData(data || []);
      } catch (err) {
        console.error("Failed to fetch staff", err);
      }
    };
    fetchStaff();
  }, [id]);

  const handleAddComment = async (data) => {
    try {
      const user_id = sessionStorage.getItem("userId");
      const payload = {
        task_id: task.id,
        user_id: Number(user_id),
        data: data.comment,
      };
      await Service.AddTaskComment(payload);
      toast.success("Comment added successfully");
      fetchTask();
    } catch (error) {
      console.error(error);
      toast.error("Failed to add comment");
    }
  };

  const handleAcknowledgeComment = async (commentId, data) => {
    try {
      const payload = {
        ...data,
      };
      await Service.AddTaskCommentAcknowledged(commentId, payload);
      toast.success("Comment acknowledged");
      fetchTask();
    } catch (error) {
      console.error(error);
      toast.error("Failed to acknowledge comment");
    }
  };

  const getActiveWorkID = () => {
    return (
      task?.workingHourTask?.find((wh) => wh.ended_at === null)?.id || null
    );
  };

  const activeWorkID = getActiveWorkID();

  const formatSecondsToHHMM = (totalSeconds) => {
    if (!totalSeconds || isNaN(totalSeconds)) return "00:00";
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(
      2,
      "0"
    )}`;
  };

  const totalDurationSeconds =
    task?.workingHourTask?.reduce(
      (acc, wh) => acc + (Number(wh.duration_seconds) || 0),
      0
    ) || 0;

  const toIST = (dateString) => {
    if (!dateString) return "—";
    return new Intl.DateTimeFormat("en-IN", {
      timeZone: "Asia/Kolkata",
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(dateString));
  };

  const handleAction = async (action) => {
    if (!task?.id) return;
    try {
      setProcessing(true);
      const taskId = task.id.toString();
      switch (action) {
        case "start":
          await Service.TaskStart(taskId);
          toast.success("Task started");
          break;
        case "pause":
          if (!activeWorkID) return toast.warning("No active session to pause");
          await Service.TaskPause(taskId, { whId: activeWorkID });
          toast.info("Task paused");
          break;
        case "resume":
          await Service.TaskResume(taskId);
          toast.success("Task resumed");
          break;
        case "end":
          if (!activeWorkID) return toast.warning("No active session to end");
          await Service.TaskEnd(taskId, { whId: activeWorkID });
          toast.success("Task completed");
          break;
      }
      await fetchTask();
      if (refresh) refresh();
    } catch (error) {
      toast.error("Action failed. Please try again.");
    } finally {
      setProcessing(false);
    }
  };

  const handleEndTask = async (e) => {
    if (e) e.preventDefault();
    if (!endComment.trim()) {
      toast.warning("Please provide a comment before ending the task");
      return;
    }
    if (!completionPercentage) {
      toast.warning("Please select the completion percentage");
      return;
    }
    if (!task?.id || !activeWorkID) return;

    try {
      setProcessing(true);
      const taskId = task.id.toString();

      // Step 1: Update Task Completion Percentage
      await Service.UpdateTaskById(taskId, {
        lineItemCompletion: completionPercentage
      });

      // Step 2: Format the completion range (e.g., 81-90%)
      const formattedRange = completionPercentage.replace("RANGE_", "").replace(/_/g, "-") + "%";

      // Step 3: Add the structured comment
      const user_id = sessionStorage.getItem("userId");
      const commentPayload = {
        task_id: task.id,
        user_id: Number(user_id),
        data: `
          <div style="margin-bottom: 12px; font-family: sans-serif;">
            <div style="display: inline-block; background-color: #ecfdf5; color: #065f46; border: 1px solid #10b981; padding: 4px 12px; border-radius: 9999px; font-weight: 700; font-size: 13px; margin-bottom: 8px;">
              WBS Item Completion: ${formattedRange}
            </div>
            <div style="color: #374151; line-height: 1.6; white-space: pre-wrap;">
              ${endComment.replace(/\n/g, '<br/>')}
            </div>
          </div>
        `,
      };
      await Service.AddTaskComment(commentPayload);

      // Step 3: End the task session
      await Service.TaskEnd(taskId, { whId: activeWorkID });

      toast.success("Task completed successfully");
      setIsEndModalOpen(false);
      setEndComment("");
      setCompletionPercentage("");
      await fetchTask();
      if (refresh) refresh();
    } catch (error) {
      console.error(error);
      toast.error("Failed to end task. Please try again.");
    } finally {
      setProcessing(false);
    }
  };

  const getStatusConfig = (status) => {
    const configs = {
      ASSIGNED: {
        label: "Assigned",
        bg: "bg-purple-100",
        text: "text-purple-700",
        border: "border-purple-300",
      },
      IN_PROGRESS: {
        label: "In Progress",
        bg: "bg-blue-100",
        text: "text-blue-700",
        border: "border-blue-300",
      },
      BREAK: {
        label: "On Break",
        bg: "bg-orange-100",
        text: "text-orange-700",
        border: "border-orange-300",
      },
      COMPLETED: {
        label: "Completed",
        bg: "bg-green-100",
        text: "text-green-700",
        border: "border-green-300",
      },
      PENDING: {
        label: "Pending",
        bg: "bg-yellow-100",
        text: "text-yellow-700",
        border: "border-yellow-300",
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

  const getPriorityLabel = (priority) => {
    switch (priority) {
      case 1:
        return { label: "Low", color: "text-green-600", bg: "bg-green-50" };
      case 2:
        return {
          label: "Medium",
          color: "text-orange-500",
          bg: "bg-orange-50",
        };
      case 3:
        return { label: "High", color: "text-red-500", bg: "bg-red-50" };
      case 4:
        return { label: "Critical", color: "text-gray-700", bg: "bg-gray-50" };
      default:
        return { label: "Normal", color: "text-gray-500", bg: "bg-gray-50" };
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white rounded-2xl shadow-2xl p-10 flex flex-col items-center">
          <Loader2 className="w-12 h-12 animate-spin text-green-600" />
          <p className="mt-4 text-lg font-medium text-gray-700">
            Loading task details...
          </p>
        </div>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white rounded-2xl shadow-2xl p-10 text-center w-full">
          <div className="w-16 h-16 bg-gray-200 rounded-full mx-auto mb-4 flex items-center justify-center">
            <FileText className="w-10 h-10 text-gray-400" />
          </div>
          <p className="text-xl font-semibold text-gray-700">Task Not Found</p>
          <p className="text-gray-700 mt-2">
            This task may have been deleted or is inaccessible.
          </p>
          <Button
            onClick={onClose}
            className="mt-6 px-8 py-3 font-semibold transition bg-red-600 hover:bg-red-700"
          >
            Close
          </Button>
        </div>
      </div>
    );
  }

  const statusConfig = getStatusConfig(task.status);
  const priority = getPriorityLabel(task.priority);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-[80%] h-[95vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-8 py-5 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-100 rounded-xl">
              <ClipboardList className="w-7 h-7 text-green-700" />
            </div>
            <div>
              <h2 className="text-2xl  text-gray-700">{task.name}</h2>
              {/* <p className="text-sm text-gray-700">ID: #{task.id}</p> */}
            </div>
          </div>
          <div className="flex items-center gap-3">
            {(userRole === "admin" ||
              userRole === "operation_executive" ||
              userRole === "project_manager" ||
              userRole === "department_manager" ||
              userRole === "deputy_manager") && (
                <Button
                  onClick={() => setIsEditing(true)}
                  variant="outline"
                  className="flex items-center gap-2 px-6 py-3 font-medium transition border-indigo-200 text-background hover:bg-indigo-50"
                >
                  <Edit className="w-4 h-4" /> Edit Task
                </Button>
              )}
            <Button
              onClick={onClose}
              variant="secondary"
              className="px-6 py-3 text-white font-medium transition bg-red-600 hover:bg-red-700"
            >
              Close
            </Button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-8 py-8 space-y-8">
          {isEditing ? (
            <EditTask
              id={task.id}
              onClose={() => setIsEditing(false)}
              refresh={() => {
                fetchTask();
                if (refresh) refresh();
              }}
            />
          ) : (
            <>
              {/* Task Info Card */}
              <div className="bg-green-50 rounded-2xl p-8 border border-green-200">
                <h3 className="text-2xl  text-green-900 mb-6 flex items-center gap-3">
                  <FileText className="w-7 h-7" />
                  Task Information
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  <InfoItem
                    icon={<Building2 />}
                    label="Project"
                    value={task.project?.name || "—"}
                  />
                  <InfoItem
                    icon={<Building2 />}
                    label="WBS Item"
                    value={task.projectBundle?.bundleKey.replace(/_/g, ' ') || '—'}
                  />
                  <InfoItem
                    icon={<Hash />}
                    label="Stage"
                    value={task.Stage || "—"}
                  />
                  <InfoItem
                    icon={<User />}
                    label="Assigned To"
                    value={
                      task.user
                        ? `${task.user.firstName} ${task.user.lastName}`
                        : "Unassigned"
                    }
                  />
                  <InfoItem
                    icon={<Calendar />}
                    label="Due Date"
                    value={toIST(task.due_date)}
                  />
                  <InfoItem
                    icon={<Clock />}
                    label="Assigned Hrs"
                    value={task.allocationLog?.allocatedHours}
                  />
                  <InfoItem
                    icon={<Clock />}
                    label="Assigned WBS Item Completion %"
                    value={task.LineItemCompletion ? task.LineItemCompletion.replace("RANGE_", "").replace(/_/g, "-") + "%" : "—"}
                  />

                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-white rounded-xl shadow-sm shrink-0">
                      <div
                        className={`w-6 h-6 rounded-full ${priority.color.replace(
                          "text",
                          "bg"
                        )}`}
                      ></div>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-700">
                        Priority
                      </p>
                      <p className={` mt-1 ${priority.color}`}>
                        {priority.label}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-white rounded-xl shadow-sm shrink-0">
                      <div className="w-6 h-6 bg-gray-300 rounded-full"></div>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-700">
                        Status
                      </p>
                      <span
                        className={`inline-block mt-1 px-4 py-2 rounded-full font-semibold text-sm border-2 ${statusConfig.bg} ${statusConfig.text} ${statusConfig.border}`}
                      >
                        {statusConfig.label.replace(/_/g, ' ') || '—'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Description */}
                {task.description && (
                  <div className="mt-8 p-6 bg-white/70 backdrop-blur rounded-xl border border-green-100">
                    <h4 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                      <FileText className="w-5 h-5 text-green-600" />
                      Description
                    </h4>
                    <div
                      className="text-gray-700 leading-relaxed prose prose-sm max-w-none"
                      dangerouslySetInnerHTML={{ __html: task.description }}
                    />
                  </div>
                )}

                {/* Actions */}
                <div className="mt-8 pt-6 border-t border-green-200">
                  <div className="flex flex-wrap items-center gap-4">
                    {(task.status === "ASSIGNED" || task.status === "REWORK") && (
                      <ActionButton
                        icon={<Play />}
                        color="emerald"
                        onClick={() => handleAction("start")}
                        disabled={processing}
                      >
                        Start Task
                      </ActionButton>
                    )}
                    {task.status === "IN_PROGRESS" && (
                      <>
                        <ActionButton
                          icon={<Pause />}
                          color="amber"
                          onClick={() => handleAction("pause")}
                          disabled={processing}
                        >
                          Pause
                        </ActionButton>
                        <ActionButton
                          icon={<Square />}
                          color="red"
                          onClick={() => {
                            setEndComment(`Achieved: \nCompleted: \nIssues: \nPending: `);
                            setIsEndModalOpen(true);
                          }}
                          disabled={processing}
                        >
                          End Task
                        </ActionButton>
                      </>
                    )}
                    {task.status === "BREAK" && (
                      <ActionButton
                        icon={<Play />}
                        color="green"
                        onClick={() => handleAction("resume")}
                        disabled={processing}
                      >
                        Resume Task
                      </ActionButton>
                    )}
                    {processing && (
                      <div className="flex items-center gap-2 text-gray-700">
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>Processing...</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Work Summary */}
              {task.workingHourTask && task.workingHourTask.length > 0 &&
                ["admin", "deputy_manager", "human_resource", "operation_executive", "staff", "project_manager", "department_manager"].includes(userRole) && (
                  <div className="bg-green-50 rounded-2xl p-6 border border-green-200">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-xl  text-indigo-900 flex items-center gap-3">
                        <Timer className="w-6 h-6" />
                        Work Summary
                      </h3>
                      <button
                        onClick={() => setShowWorkSummary(!showWorkSummary)}
                        className="text-indigo-600 hover:text-indigo-800"
                      >
                        {showWorkSummary ? (
                          <ChevronUp size={24} />
                        ) : (
                          <ChevronDown size={24} />
                        )}
                      </button>
                    </div>
                    {showWorkSummary && (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <SummaryCard
                          icon={<Clock4 />}
                          label="Total Time"
                          value={formatSecondsToHHMM(totalDurationSeconds)}
                        />
                        <SummaryCardSession
                          icon={<Users />}
                          label="Breaks"
                          value={task.workingHourTask.length}
                        />
                        <SummaryCardStatus
                          icon={<Timer />}
                          label="Current Status"
                          value={statusConfig.label}
                          color={statusConfig.text}
                        />
                      </div>
                    )}
                    {showWorkSummary && ["admin", "human_resource", "operation_executive"].includes(userRole) && (
                      <div className="mt-6 bg-white/50 rounded-xl border border-indigo-100 overflow-hidden">
                        <table className="w-full text-left text-sm">
                          <thead>
                            <tr className="bg-indigo-50/50 text-indigo-700  border-b border-indigo-100">
                              <th className="px-4 py-3">Activity</th>
                              <th className="px-4 py-3">Start Time</th>
                              <th className="px-4 py-3">End Time</th>
                              <th className="px-4 py-3 text-right">Duration</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-indigo-100">
                            {[...task.workingHourTask].reverse().map((session, idx) => (
                              <tr key={session.id || idx} className="hover:bg-indigo-50/30 transition-colors">
                                <td className="px-4 py-3 font-semibold text-indigo-900 capitalize">
                                  {session.type?.toLowerCase() || 'Work'}
                                </td>
                                <td className="px-4 py-3 text-gray-700">{toIST(session.started_at)}</td>
                                <td className="px-4 py-3 text-gray-700">
                                  {session.ended_at ? toIST(session.ended_at) : (
                                    <span className="text-emerald-600  animate-pulse flex items-center gap-1">
                                      <Play className="w-3 h-3 fill-current" /> Running...
                                    </span>
                                  )}
                                </td>
                                <td className="px-4 py-3 text-right font-mono  text-indigo-700">
                                  {session.duration_seconds
                                    ? formatSecondsToHHMM(session.duration_seconds)
                                    : '—'}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}

              {/* Comments Section */}
              <div className="bg-white rounded-2xl p-6 border border-gray-200 mt-6">
                <Comment
                  comments={task.taskcomment}
                  onAddComment={handleAddComment}
                  staffData={staffData}
                  onAcknowledge={handleAcknowledgeComment}
                />
              </div>
            </>
          )}
        </div>
      </div>

      {/* End Task Comment Modal */}
      {isEndModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 space-y-6">
            <div className="flex items-center gap-3 text-red-600">
              <Square className="w-6 h-6 fill-current" />
              <h3 className="text-xl ">End Task session</h3>
            </div>
            <p className="text-gray-600">
              Please provide a brief summary or feedback about the work done before ending the session.
            </p>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">WBS Item Completion (%) *</label>
                <select
                  value={completionPercentage}
                  onChange={(e) => setCompletionPercentage(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-red-500 focus:ring-2 focus:ring-red-200 transition-all outline-none text-gray-700 bg-white"
                >
                  <option value="" disabled>Select completion range</option>
                  {["0-10", "11-20", "21-30", "31-40", "41-50", "51-60", "61-70", "71-80", "81-90", "91-100"].map(range => (
                    <option key={range} value={range}>{range}%</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Completion Summary *</label>
                <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg text-xs text-blue-800 mb-2">
                  <strong>Please answer:</strong>
                  <ul className="list-disc ml-4 mt-1 space-y-1">
                    <li>What you achieved?</li>
                    <li>What are the things you completed?</li>
                    <li>What are the issues you phased during completion?</li>
                    <li>What are pending things left?</li>
                  </ul>
                </div>
                <textarea
                  value={endComment}
                  onChange={(e) => setEndComment(e.target.value)}
                  className="w-full h-40 px-4 py-3 rounded-xl border border-gray-200 focus:border-red-500 focus:ring-2 focus:ring-red-200 transition-all outline-none resize-none text-gray-700"
                  placeholder="Type your answers here..."
                />
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <Button
                onClick={() => {
                  setIsEndModalOpen(false);
                  setEndComment("");
                  setCompletionPercentage("");
                }}
                variant="outline"
                className="flex-1 py-3 text-red-600 font-semibold border-red-200"
              >
                Cancel
              </Button>
              <Button
                onClick={handleEndTask}
                disabled={processing || !endComment.trim() || !completionPercentage}
                className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold flex items-center justify-center gap-2"
              >
                {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Square className="w-4 h-4" />}
                Submit & End
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Helper Components
const InfoItem = ({ icon, label, value }) => (
  <div className="flex items-start gap-4">
    <div className="p-3 bg-white rounded-xl shadow-sm shrink-0">
      {icon && <div className="w-6 h-6 text-green-600">{icon}</div>}
    </div>
    <div>
      <p className="text-sm font-medium text-gray-700">{label}</p>
      <p className="font-semibold text-gray-700 mt-1">{value}</p>
    </div>
  </div>
);

const ActionButton = ({ children, icon, color, onClick, disabled }) => {
  const colors = {
    emerald: "bg-emerald-600 hover:bg-emerald-700",
    amber: "bg-amber-600 hover:bg-amber-700",
    red: "bg-red-600 hover:bg-red-700",
    green: "bg-green-600 hover:bg-green-700",
  };
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`flex items-center gap-2 px-6 py-3 ${colors[color]} text-white font-semibold rounded-md shadow-md hover:shadow-lg transition-all disabled:opacity-60 disabled:cursor-not-allowed`}
    >
      {icon}
      {children}
    </button>
  );
};

const SummaryCard = ({ icon, label, value, color = "text-indigo-700" }) => (
  <div className="bg-white/80 backdrop-blur flex flex-row gap-5 items-center justify-center p-2 rounded-xl border border-indigo-100 text-center">
    <div className="w-12 h-12 mx-auto mb-3 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600">
      {icon}
    </div>
    <div>
      <p className="text-sm text-gray-700">{label}</p>
      <p className={`text-xl  mt-2 ${color}`}>{value} hrs</p>
    </div>
  </div>
);
const SummaryCardSession = ({ icon, label, value, color = "text-indigo-700" }) => (
  <div className="bg-white/80 backdrop-blur flex flex-row gap-5 items-center justify-center p-2 rounded-xl border border-indigo-100 text-center">
    <div className="w-12 h-12 mx-auto mb-3 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600">
      {icon}
    </div>
    <div>
      <p className="text-sm text-gray-700">{label}</p>
      <p className={`text-xl  mt-2 ${color}`}>{value} </p>
    </div>
  </div>
);
const SummaryCardStatus = ({ icon, label, value, color = "text-indigo-700" }) => (
  <div className="bg-white/80 backdrop-blur flex flex-row gap-5 items-center justify-center p-2 rounded-xl border border-indigo-100 text-center">
    <div className="w-12 h-12 mx-auto mb-3 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600">
      {icon}
    </div>
    <div>
      <p className="text-sm text-gray-700">{label}</p>
      <p className={`text-xl  mt-2 ${color}`}>{value} </p>
    </div>
  </div>
);

export default FetchTaskByID;
