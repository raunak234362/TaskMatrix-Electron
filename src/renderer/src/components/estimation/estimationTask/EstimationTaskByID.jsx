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
  Clock,
  ChevronDown,
  ChevronUp,
  Building2,
  Hash,
  FolderOpen,
  Timer,
  UsersRound,
  X,
} from "lucide-react";
import CreateLineItemGroup from "../estimationLineItem/CreateLineItemGroup";
import LineItemGroup from "../estimationLineItem/LineItemGroup";

const EstimationTaskByID = ({ id, onClose, refresh }) => {
  const [task, setTask] = useState(null);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
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
      toast.error("Failed to load task details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTask();
  }, [id]);

  const activeWorkSession = task?.workinghours?.find((wh) => wh.ended_at === null);
  const activeWorkID = activeWorkSession?.id || null;

  const formatHours = (decimal) => {
    const num = Number(decimal);
    if (isNaN(num)) return "0h 0m";
    const h = Math.floor(num);
    const m = Math.round((num - h) * 60);
    return `${h}h ${m}m`;
  };

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
      let res;
      switch (action) {
        case "start":
          res = await Service.StartEstimationTaskById(task.id);
          toast.success("Task started successfully");
          break;
        case "pause":
          if (!activeWorkID) return toast.warning("No active session");
          res = await Service.PauseEstimationTaskById(task.id, { whId: activeWorkID });
          toast.info("Task paused");
          break;
        case "resume":
          res = await Service.ResumeEstimationTaskById(task.id);
          toast.success("Task resumed");
          break;
        case "end":
          if (!activeWorkID) return toast.warning("No active session");
          res = await Service.EndEstimationTaskById(task.id, { whId: activeWorkID });
          toast.success("Task completed 🎉");
          break;
      }
      await fetchTask();
      refresh?.();
    } catch (err) {
      toast.error("Action failed. Try again.");
    } finally {
      setProcessing(false);
    }
  };

  const getStatusConfig = (status) => {
    const map = {
      ASSIGNED: { label: "Assigned", color: "bg-purple-100 text-purple-700 border-purple-200" },
      IN_PROGRESS: { label: "In Progress", color: "bg-emerald-100 text-emerald-700 border-emerald-200" },
      BREAK: { label: "On Break", color: "bg-amber-100 text-amber-700 border-amber-200" },
      COMPLETED: { label: "Completed", color: "bg-blue-100 text-blue-700 border-blue-200" },
    };
    return map[status] || { label: status, color: "bg-gray-100 text-gray-700 border-gray-300" };
  };

  const status = getStatusConfig(task?.status);

  // Loading State
  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white rounded-2xl shadow-2xl p-12 flex flex-col items-center gap-4">
          <Loader2 className="w-14 h-14 animate-spin text-emerald-600" />
          <p className="text-lg font-medium text-gray-700">Loading task details...</p>
        </div>
      </div>
    );
  }

  // Not Found State
  if (!task) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white rounded-2xl shadow-2xl p-10 text-center max-w-md">
          <div className="w-20 h-20 bg-gray-100 rounded-full mx-auto mb-6 flex items-center justify-center">
            <FileText className="w-10 h-10 text-gray-400" />
          </div>
          <h3 className="text-2xl font-bold text-gray-800">Task Not Found</h3>
          <p className="text-gray-600 mt-3">This task may have been deleted or is no longer accessible.</p>
          <button
            onClick={onClose}
            className="mt-8 px-8 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl transition"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-7xl h-[95vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-6 py-5 md:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-emerald-50 rounded-xl">
                <FileText className="w-7 h-7 text-emerald-600" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Estimation Task</h2>
                <p className="text-sm text-gray-500">Task ID: #{task.id}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2.5 hover:bg-gray-100 rounded-lg transition"
              aria-label="Close"
            >
              <X className="w-6 h-6 text-gray-600" />
            </button>
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto px-6 py-8 md:px-8 space-y-8">
          {/* Task Information Card */}
          <section className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6 md:p-8">
            <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-3">
              <FileText className="w-6 h-6 text-emerald-600" />
              Task Details
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              <InfoItem icon={<Building2 size={20} />} label="Project" value={task.estimation?.projectName || "—"} />
              <InfoItem icon={<Hash size={20} />} label="Estimation No." value={task.estimation?.estimationNumber || "—"} />
              <InfoItem icon={<User size={20} />} label="Assigned To" value={task.assignedTo?.firstName || task.assignedTo?.username || "—"} />
              <InfoItem icon={<Calendar size={20} />} label="Start Date" value={toIST(task.startDate)} />
              <InfoItem icon={<Calendar size={20} />} label="End Date" value={toIST(task.endDate)} />
              <div className="flex items-center gap-3">
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="w-5 h-5 bg-gray-400 rounded-full"></div>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Status</p>
                  <div className="flex items-center gap-3 mt-2">
                    <span className={`px-4 py-1.5 rounded-full text-sm font-semibold border ${status.color}`}>
                      {status.label}
                    </span>
                    {task.status === "IN_PROGRESS" && activeWorkID && (
                      <span className="flex items-center gap-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-full">
                        <Timer size={14} className="animate-pulse" />
                        Running
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Notes */}
            {task.notes && (
              <div className="mt-8 p-5 bg-gray-50 rounded-xl border border-gray-200">
                <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-gray-600" />
                  Notes
                </h4>
                <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">{task.notes}</p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="mt-8 pt-6 border-t border-gray-200">
              <h4 className="text-lg font-semibold text-gray-800 mb-4">Task Controls</h4>
              <div className="flex flex-wrap items-center gap-3">
                {task.status === "ASSIGNED" && (
                  <ActionButton onClick={() => handleAction("start")} disabled={processing} color="emerald">
                    <Play size={18} /> Start Task
                  </ActionButton>
                )}

                {task.status === "IN_PROGRESS" && (
                  <>
                    <ActionButton onClick={() => handleAction("pause")} disabled={processing || !activeWorkID} color="amber">
                      <Pause size={18} /> Pause
                    </ActionButton>
                    <ActionButton onClick={() => handleAction("end")} disabled={processing || !activeWorkID} color="red">
                      <Square size={18} /> Complete Task
                    </ActionButton>
                  </>
                )}

                {task.status === "BREAK" && (
                  <ActionButton onClick={() => handleAction("resume")} disabled={processing} color="emerald">
                    <Play size={18} /> Resume Task
                  </ActionButton>
                )}

                {processing && (
                  <span className="flex items-center gap-2 text-gray-600 text-sm">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Processing...
                  </span>
                )}
              </div>
            </div>
          </section>

          {/* Work Summary */}
          {summary && (
            <section className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6 md:p-8">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900 flex items-center gap-3">
                  <Timer className="w-6 h-6 text-indigo-600" />
                  Work Summary
                </h3>
                <button
                  onClick={() => setShowWorkSummary(!showWorkSummary)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition"
                >
                  {showWorkSummary ? <ChevronUp size={22} /> : <ChevronDown size={22} />}
                </button>
              </div>

              {showWorkSummary && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <SummaryCard
                    icon={<Clock className="w-8 h-8" />}
                    label="Total Time Spent"
                    value={formatHours(summary?.totalHours)}
                  />
                  <SummaryCard
                    icon={<UsersRound className="w-8 h-8" />}
                    label="Sessions"
                    value={task?.workinghours?.length || 0}
                  />
                  <SummaryCard
                    icon={<Timer className="w-8 h-8" />}
                    label="Current Status"
                    value={status.label}
                    valueClass={status.color.replace("border", "text").split(" ")[1]}
                  />
                </div>
              )}
            </section>
          )}

          {/* Line Item Groups */}
          <section className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6 md:p-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900 flex items-center gap-3">
                <FolderOpen className="w-6 h-6 text-emerald-600" />
                Line Item Groups
              </h3>
            </div>

            <div className="space-y-6">
              <CreateLineItemGroup
                estimationId={task?.estimationId}
                onGroupCreated={() => setRefreshGroups((p) => p + 1)}
              />
              <LineItemGroup estimationId={task?.estimationId} refreshTrigger={refreshGroups} />
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

// Reusable Components
const InfoItem = ({ icon, label, value }) => (
  <div className="flex items-start gap-4">
    <div className="p-3 bg-gray-50 rounded-lg flex-shrink-0">{icon}</div>
    <div>
      <p className="text-sm font-medium text-gray-600">{label}</p>
      <p className="font-semibold text-gray-900 mt-1">{value}</p>
    </div>
  </div>
);

const ActionButton = ({ children, onClick, disabled, color = "emerald" }) => {
  const colors = {
    emerald: "bg-emerald-600 hover:bg-emerald-700 text-white",
    amber: "bg-amber-600 hover:bg-amber-700 text-white",
    red: "bg-red-600 hover:bg-red-700 text-white",
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center gap-2.5 px-6 py-3 font-medium rounded-xl shadow-sm transition-all ${colors[color]} disabled:opacity-50 disabled:cursor-not-allowed`}
    >
      {children}
    </button>
  );
};

const SummaryCard = ({ icon, label, value, valueClass = "text-gray-900" }) => (
  <div className="bg-gray-50/70 rounded-xl p-6 text-center border border-gray-200">
    <div className="w-14 h-14 mx-auto mb-4 bg-white rounded-full flex items-center justify-center shadow-sm text-indigo-600">
      {icon}
    </div>
    <p className="text-sm text-gray-600">{label}</p>
    <p className={`text-2xl font-bold mt-2 ${valueClass}`}>{value}</p>
  </div>
);

export default EstimationTaskByID;