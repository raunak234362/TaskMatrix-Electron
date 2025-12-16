"use client";

import { useEffect, useState } from "react";
import Service from "../../../api/Service";
import { toast } from "react-toastify";
import {
  Pause,
  Play,
  Square,
  Loader2,
  Calendar,
  User,
  FileText,
  Clock4,
  ChevronDown,
  ChevronUp,
  Building2,
  Hash,
  FolderOpen,
  Plus,
  Timer,
  Users,
} from "lucide-react";
import CreateLineItemGroup from "../estimationLineItem/CreateLineItemGroup";
import LineItemGroup from "../estimationLineItem/LineItemGroup";

const EstimationTaskByID = ({ id, onClose, refresh }) => {
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [summary, setSummary] = useState(null);
  const [showWorkSummary, setShowWorkSummary] = useState(true);
  const [refreshGroups, setRefreshGroups] = useState(0);

  const fetchTask = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const [taskRes, summaryRes] = await Promise.all([
        Service.GetEstimationTaskById(id),
        Service.SummaryEstimationTaskById(id),
      ]);
      setTask(taskRes.data);
      setSummary(summaryRes.data);
    } catch (error) {
      console.error("Error fetching task:", error);
      toast.error("Failed to load estimation task");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTask();
  }, [id]);

  const getActiveWorkID = () => {
    return task?.workinghours?.find((wh) => wh.ended_at === null)?.id || null;
  };

  const formatDecimalHours = (decimalHours) => {
    const num = Number(decimalHours);
    if (isNaN(num)) return "0h 0m";
    const hours = Math.floor(num);
    const minutes = Math.round((num - hours) * 60);
    return `${hours}h ${minutes}m`;
  };

  const activeWorkID = getActiveWorkID();

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
      let response;
      switch (action) {
        case "start":
          response = await Service.StartEstimationTaskById(task.id);
          toast.success("Task started");
          break;
        case "pause":
          if (!activeWorkID) return toast.warning("No active session to pause");
          response = await Service.PauseEstimationTaskById(task.id, { whId: activeWorkID });
          toast.info("Task paused");
          break;
        case "resume":
          response = await Service.ResumeEstimationTaskById(task.id);
          toast.success("Task resumed");
          break;
        case "end":
          if (!activeWorkID) return toast.warning("No active session to end");
          response = await Service.EndEstimationTaskById(task.id, { whId: activeWorkID });
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

  const getStatusConfig = (status) => {
    const configs = {
      ASSIGNED: { label: "Assigned", bg: "bg-purple-100", text: "text-purple-700", border: "border-purple-300" },
      IN_PROGRESS: { label: "In Progress", bg: "bg-emerald-100", text: "text-emerald-700", border: "border-emerald-300" },
      BREAK: { label: "On Break", bg: "bg-orange-100", text: "text-orange-700", border: "border-orange-300" },
      COMPLETED: { label: "Completed", bg: "bg-blue-100", text: "text-blue-700", border: "border-blue-300" },
    };
    return configs[status] || { label: status, bg: "bg-gray-100", text: "text-gray-700", border: "border-gray-300" };
  };

  const statusConfig = getStatusConfig(task?.status);

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white rounded-2xl shadow-2xl p-10 flex flex-col items-center">
          <Loader2 className="w-12 h-12 animate-spin text-teal-600" />
          <p className="mt-4 text-lg font-medium text-gray-700">Loading task details...</p>
        </div>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white rounded-2xl shadow-2xl p-10 text-center max-w-md">
          <div className="w-16 h-16 bg-gray-200 rounded-full mx-auto mb-4 flex items-center justify-center">
            <File pilgrims className="w-10 h-10 text-gray-400" />
          </div>
          <p className="text-xl font-semibold text-gray-800">Task Not Found</p>
          <p className="text-gray-600 mt-2">This task may have been deleted or is inaccessible.</p>
          <button
            onClick={onClose}
            className="mt-6 px-8 py-3 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-xl transition"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full h-[95vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-8 py-5 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-teal-100 rounded-xl">
              <FileText className="w-7 h-7 text-teal-700" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Estimation Task Details</h2>
              <p className="text-sm text-gray-500">ID: #{task.id}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium rounded-xl transition"
          >
            Close
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
          {/* Task Info Card */}
          <div className="bg-gradient-to-br from-teal-50 to-cyan-50 rounded-2xl p-8 border border-teal-200">
            <h3 className="text-2xl font-bold text-teal-900 mb-6 flex items-center gap-3">
              <FileText className="w-7 h-7" />
              Task Information
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <InfoItem icon={<Building2 />} label="Project" value={task.estimation?.projectName || "—"} />
              <InfoItem icon={<Hash />} label="Estimation No." value={task.estimation?.estimationNumber || "—"} />
              <InfoItem icon={<User />} label="Assigned To" value={task.assignedTo?.firstName || task.assignedTo?.username || "—"} />
              <InfoItem icon={<Calendar />} label="Start Date" value={toIST(task.startDate)} />
              <InfoItem icon={<Calendar />} label="End Date" value={toIST(task.endDate)} />
              <div className="flex items-center gap-3">
                <div className="p-3 bg-white rounded-xl shadow-sm">
                  <div className="w-6 h-6 bg-gray-300 rounded-full"></div>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Status</p>
                  <span className={`inline-block mt-1 px-4 py-2 rounded-full font-semibold text-sm border-2 ${statusConfig.bg} ${statusConfig.text} ${statusConfig.border}`}>
                    {statusConfig.label}
                  </span>
                </div>
              </div>
            </div>

            {/* Notes */}
            {task.notes && (
              <div className="mt-8 p-6 bg-white/70 backdrop-blur rounded-xl border border-teal-100">
                <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-teal-600" />
                  Notes
                </h4>
                <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">{task.notes}</p>
              </div>
            )}

            {/* Actions */}
            <div className="mt-8 pt-6 border-t border-teal-200">
              <h4 className="text-lg font-semibold text-gray-800 mb-4">Task Controls</h4>
              <div className="flex flex-wrap items-center gap-4">
                {task.status === "ASSIGNED" && (
                  <ActionButton icon={<Play />} color="emerald" onClick={() => handleAction("start")} disabled={processing}>
                    Start Task
                  </ActionButton>
                )}
                {task.status === "IN_PROGRESS" && (
                  <>
                    <ActionButton icon={<Pause />} color="amber" onClick={() => handleAction("pause")} disabled={processing}>
                      Pause
                    </ActionButton>
                    <ActionButton icon={<Square />} color="red" onClick={() => handleAction("end")} disabled={processing}>
                      End Task
                    </ActionButton>
                  </>
                )}
                {task.status === "BREAK" && (
                  <ActionButton icon={<Play />} color="teal" onClick={() => handleAction("resume")} disabled={processing}>
                    Resume Task
                  </ActionButton>
                )}
                {processing && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Processing...</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Work Summary */}
          {summary && (
            <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl p-6 border border-indigo-200">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-indigo-900 flex items-center gap-3">
                  <Timer className="w-6 h-6" />
                  Work Summary
                </h3>
                <button onClick={() => setShowWorkSummary(!showWorkSummary)} className="text-indigo-600 hover:text-indigo-800">
                  {showWorkSummary ? <ChevronUp size={24} /> : <ChevronDown size={24} />}
                </button>
              </div>
              {showWorkSummary && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <SummaryCard icon={<Clock4 />} label="Total Time" value={formatDecimalHours(summary?.totalHours)} />
                  <SummaryCard icon={<Users />} label="Sessions" value={task?.workinghours?.length || 0} />
                  <SummaryCard icon={<Timer />} label="Status" value={statusConfig.label} color={statusConfig.text} />
                </div>
              )}
            </div>
          )}

          {/* Line Item Groups Section */}
          <div className="border-t pt-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                <FolderOpen className="w-7 h-7 text-teal-600" />
                Line Item Groups
              </h3>
            </div>
            <div className="flex flex-col gap-6">

            <CreateLineItemGroup estimationId={task?.estimationId} onGroupCreated={() => setRefreshGroups(prev => prev + 1)} />
            <LineItemGroup estimationId={task?.estimationId} refreshTrigger={refreshGroups} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Helper Components
const InfoItem = ({ icon, label, value }) => (
  <div className="flex items-start gap-4">
    <div className="p-3 bg-white rounded-xl shadow-sm flex-shrink-0">
      {icon && <div className="w-6 h-6 text-teal-600">{icon}</div>}
    </div>
    <div>
      <p className="text-sm font-medium text-gray-600">{label}</p>
      <p className="font-semibold text-gray-900 mt-1">{value}</p>
    </div>
  </div>
);

const ActionButton = ({ children, icon, color, onClick, disabled }) => {
  const colors = {
    emerald: "bg-emerald-600 hover:bg-emerald-700",
    amber: "bg-amber-600 hover:bg-amber-700",
    red: "bg-red-600 hover:bg-red-700",
    teal: "bg-teal-600 hover:bg-teal-700",
  };
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`flex items-center gap-2 px-6 py-3 ${colors[color]} text-white font-semibold rounded-xl shadow-md hover:shadow-lg transition-all disabled:opacity-60 disabled:cursor-not-allowed`}
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

    <p className="text-sm text-gray-600">{label}</p>
    <p className={`text-xl font-bold mt-2 ${color}`}>{value}</p>
    </div>
  </div>
);

export default EstimationTaskByID;