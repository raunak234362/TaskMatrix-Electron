import { useEffect, useState } from "react";
import { Loader2, X } from "lucide-react";
import Service from "../../../api/Service";
import { allocToSec, calcWorkedSec, COMPLETION_LABEL, secToHms, statusMeta } from "./employeeTaskUtils";

const EmployeeTaskDrawer = ({ taskId, onClose }) => {
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!taskId) return;
    setLoading(true);
    Service.GetTaskById(taskId)
      .then((response) => setTask(response?.data || null))
      .catch((error) => console.error(error))
      .finally(() => setLoading(false));
  }, [taskId]);

  if (!task) {
    if (!loading) return null;
    return (
      <div className="fixed inset-0 z-[11500] flex" onClick={onClose}>
        <div
          className="ml-auto w-full max-w-lg h-full bg-white shadow-2xl border-l border-black/10 flex flex-col justify-center items-center animate-in slide-in-from-right duration-200"
          onClick={(event) => event.stopPropagation()}
        >
          <Loader2 className="w-8 h-8 animate-spin text-green-600" />
        </div>
      </div>
    );
  }

  const isOverrun =
    allocToSec(task.allocatedHours || task.allocationLog?.allocatedHours) >
    0 &&
    calcWorkedSec(task.workingHourTask) >
      allocToSec(task.allocatedHours || task.allocationLog?.allocatedHours);
  const assignedSec = allocToSec(task.allocatedHours || task.allocationLog?.allocatedHours);
  const workedSec = calcWorkedSec(task.workingHourTask);
  const meta = statusMeta(task.status);
  const sessions = task.workingHourTask || [];

  return (
    <div
      className="fixed inset-0 z-[11500] flex"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="ml-auto w-full max-w-lg h-full bg-white shadow-2xl border-l border-black/10 flex flex-col animate-in slide-in-from-right duration-200 overflow-hidden">
        <div className="flex items-start gap-4 p-5 border-b border-black/8 border-l-4 border-l-green-600">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className={`inline-block text-[10px] font-semibold px-2.5 py-0.5 rounded-full border ${meta?.color || ""}`}>
                {meta?.label || task.status}
              </span>
              {isOverrun && (
                <span className="inline-block text-[10px] font-semibold px-2.5 py-0.5 rounded-full bg-red-100 text-red-600 border border-red-200">
                  Overrun
                </span>
              )}
            </div>
            <h3 className="text-base font-bold text-black leading-snug">{task.name || "Untitled Task"}</h3>
            {task.description && task.description !== task.name && (
              <p className="text-xs text-black/50 mt-1 line-clamp-2">{task.description}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md hover:bg-gray-100 text-black/40 hover:text-black transition-colors cursor-pointer shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Assigned", value: secToHms(assignedSec), accent: "border-l-blue-500" },
              {
                label: "Worked",
                value: secToHms(workedSec),
                accent: isOverrun ? "border-l-red-500" : "border-l-green-600"
              }
            ].map(({ label, value, accent }) => (
              <div key={label} className={`bg-gray-50 rounded-lg p-4 border border-black/8 border-l-4 ${accent}`}>
                <p className="text-[10px] font-semibold text-black/40 uppercase tracking-wider mb-1">{label}</p>
                <p className={`text-sm font-bold ${isOverrun && label === "Worked" ? "text-red-600" : "text-black"}`}>
                  {value}
                </p>
              </div>
            ))}
          </div>

          <div className="border border-black/8 border-l-4 border-l-green-600 rounded-lg overflow-hidden">
            <div className="px-4 py-2 bg-gray-50 border-b border-black/5">
              <p className="text-[10px] font-semibold text-black/50 uppercase tracking-wider">Task Details</p>
            </div>
            <div className="divide-y divide-black/5">
              {[
                { label: "Project", value: task.project?.name || "—" },
                { label: "WBS Type", value: task.wbsType || "—" },
                { label: "Stage", value: task.Stage || "—" },
                { label: "Priority", value: task.priority != null ? `P${task.priority}` : "—" },
                {
                  label: "Completion",
                  value: COMPLETION_LABEL[task.LineItemCompletion] || task.LineItemCompletion || "—"
                },
                {
                  label: "Created",
                  value: task.created_on
                    ? new Date(task.created_on).toLocaleDateString("en-GB", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric"
                      })
                    : "—"
                },
                {
                  label: "Created By",
                  value: task.credatedByUser
                    ? `${task.credatedByUser.firstName || ""} ${task.credatedByUser.lastName || ""}`.trim()
                    : "—"
                },
                {
                  label: "Due Date",
                  value: task.due_date
                    ? new Date(task.due_date).toLocaleDateString("en-GB", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric"
                      })
                    : "—"
                },
                {
                  label: "Manager",
                  value: task.project?.manager
                    ? `${task.project.manager.firstName || ""} ${task.project.manager.lastName || ""}`.trim() || "—"
                    : "—"
                }
              ]
                .filter((row) => row.value && row.value !== "—")
                .map(({ label, value }) => (
                  <div key={label} className="flex justify-between items-center px-4 py-2.5">
                    <span className="text-[10px] font-semibold text-black/40 uppercase tracking-wider">{label}</span>
                    <span className="text-xs font-medium text-black text-right max-w-[55%] truncate" title={value}>
                      {value}
                    </span>
                  </div>
                ))}
            </div>
          </div>

          {sessions.length > 0 && (
            <div className="border border-black/8 border-l-4 border-l-green-600 rounded-lg overflow-hidden">
              <div className="px-4 py-2 bg-gray-50 border-b border-black/5 flex items-center justify-between">
                <p className="text-[10px] font-semibold text-black/50 uppercase tracking-wider">Work Sessions</p>
                <span className="text-[10px] font-semibold text-black/30">
                  {sessions.length} session{sessions.length !== 1 ? "s" : ""}
                </span>
              </div>
              <div className="divide-y divide-black/5 max-h-48 overflow-y-auto">
                {sessions.map((session, index) => (
                  <div key={session.id || index} className="flex items-center justify-between px-4 py-2.5 text-xs">
                    <div className="flex items-center gap-2 text-black/60">
                      <span className="w-5 h-5 rounded-full bg-green-50 border border-green-200 text-green-700 flex items-center justify-center text-[9px] font-bold shrink-0">
                        {index + 1}
                      </span>
                      <span>
                        {session.started_at
                          ? new Date(session.started_at).toLocaleString("en-GB", {
                              day: "2-digit",
                              month: "short",
                              hour: "2-digit",
                              minute: "2-digit"
                            })
                          : "—"}
                        {" → "}
                        {session.ended_at ? (
                          new Date(session.ended_at).toLocaleString("en-GB", {
                            day: "2-digit",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit"
                          })
                        ) : (
                          <span className="text-green-600 font-semibold">Active</span>
                        )}
                      </span>
                    </div>
                    <span className="font-semibold text-black shrink-0 ml-3">
                      {secToHms(Number(session.duration_seconds) || 0)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {task.taskcomment && task.taskcomment.length > 0 && (
            <div className="border border-black/8 border-l-4 border-l-green-600 rounded-lg overflow-hidden">
              <div className="px-4 py-2 bg-gray-50 border-b border-black/5 flex items-center justify-between">
                <p className="text-[10px] font-semibold text-black/50 uppercase tracking-wider">Comments</p>
                <span className="text-[10px] font-semibold text-black/30">
                  {task.taskcomment.length} comment{task.taskcomment.length !== 1 ? "s" : ""}
                </span>
              </div>
              <div className="divide-y divide-black/5 max-h-48 overflow-y-auto">
                {task.taskcomment.map((comment, index) => (
                  <div key={comment.id || index} className="px-4 py-3 text-xs flex flex-col gap-1.5">
                    <div className="flex justify-between items-start">
                      <span className="font-bold text-black">
                        {comment.user?.firstName || "User"} {comment.user?.lastName || ""}
                      </span>
                      <span className="text-[9px] text-black/40 font-semibold uppercase tracking-widest">
                        {comment.created_on || comment.createdAt
                          ? new Date(comment.created_on || comment.createdAt).toLocaleString("en-GB", {
                              day: "2-digit",
                              month: "short",
                              hour: "2-digit",
                              minute: "2-digit"
                            })
                          : ""}
                      </span>
                    </div>
                    <div
                      className="text-black/80 font-medium whitespace-pre-wrap text-[11px]"
                      dangerouslySetInnerHTML={{ __html: comment.data || comment.comment || "" }}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EmployeeTaskDrawer;
