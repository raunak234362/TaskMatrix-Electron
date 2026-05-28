import React, { useEffect, useMemo, useState } from "react";
import { CalendarCheck, Pencil } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { setMilestonesForProject } from "../../store/milestoneSlice";
import { formatDate } from "../../utils/dateUtils";
import Service from "../../api/Service";
import UpdateCompletionPer from "./mileStone/UpdateCompletionPer";
import GetMilestoneByID from "./mileStone/GetMilestoneByID";

const ProjectMilestoneMetrics = ({
  projectId,
  projectName,
  onUpdate,
  milestones: milestonesProp,
}) => {
  const userRole = sessionStorage.getItem("userRole")?.toLowerCase() || "";
  const dispatch = useDispatch();
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [selectedMilestoneId, setSelectedMilestoneId] = useState(null);
  const [selectedMilestoneToView, setSelectedMilestoneToView] = useState(null);

  const milestonesByProject = useSelector(
    (state) => state.milestoneInfo?.milestonesByProject || {},
  );
  const milestones = milestonesProp || milestonesByProject[projectId] || [];

  useEffect(() => {
    const fetchMileStone = async () => {
      try {
        const response = await Service.GetProjectMilestoneById(projectId);
        if (response && response.data) {
          dispatch(
            setMilestonesForProject({
              projectId,
              milestones: response.data,
            }),
          );
        }
      } catch (error) {
        console.error("Error fetching milestones:", error);
      }
    };

    if (!milestonesByProject[projectId]) {
      fetchMileStone();
    }
  }, [projectId, milestonesByProject, dispatch]);

  const milestoneStats = useMemo(() => {
    return milestones.map((ms) => {
      const msTasks = ms.Tasks || ms.tasks || [];
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
        taskProgress = Math.round((completedCount / totalTasks) * 100);
      }

      // Time Progress calculation
      let timeProgress = 0;
      const start = new Date(ms.startDate || ms.StartDate);
      const approval = new Date(ms.approvalDate || ms.ApprovalDate);

      if (!isNaN(start.getTime()) && !isNaN(approval.getTime())) {
        const totalDuration = approval.getTime() - start.getTime();
        const elapsed = Date.now() - start.getTime();

        if (totalDuration > 0) {
          timeProgress = Math.min(
            100,
            Math.max(0, Math.round((elapsed / totalDuration) * 100)),
          );
        } else if (Date.now() > approval.getTime()) {
          timeProgress = 100;
        }
      }

      let manualProgress = 0;
      if (ms.completeionPercentage > 0) {
        manualProgress = Number(ms.completeionPercentage);
      } else if (ms.completionPercentage > 0) {
        manualProgress = Number(ms.completionPercentage);
      } else if (ms.percentage > 0) {
        manualProgress = Number(ms.percentage);
      }

      let finalProgress = manualProgress > 0 ? manualProgress : taskProgress;

      // Force 100% if status is COMPLETED
      if ((ms.status || "").toUpperCase() === "COMPLETED") {
        finalProgress = 100;
      }

      return {
        ...ms,
        progress: finalProgress,
        taskPercentage: taskProgress,
        timePercent: timeProgress,
      };
    });
  }, [milestones]);

  const groupedMilestones = useMemo(() => {
    const groups = {};
    milestoneStats.forEach((ms) => {
      const stage = ms.stage || "PENDING";
      if (!groups[stage]) {
        groups[stage] = [];
      }
      groups[stage].push(ms);
    });

    // Sort milestones within each group, oldest first (latest on the right)
    Object.keys(groups).forEach((stage) => {
      groups[stage].sort((a, b) => {
        const dateA = new Date(
          a.approvalDate || a.ApprovalDate || a.createdAt || a.date || 0,
        ).getTime();
        const dateB = new Date(
          b.approvalDate || b.ApprovalDate || b.createdAt || b.date || 0,
        ).getTime();
        return dateA - dateB; // Ascending order
      });
    });

    // Optional: Sort stages alphabetically, or just return entries
    return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b));
  }, [milestoneStats]);

  return (
    <div className="space-y-8">
      {/* Milestone Approvals Section */}
      <div>
        <div className="pb-3 border-b border-gray-200 flex items-center gap-2 mb-6">
          <CalendarCheck size={20} className="text-[#6bbd45]" />
          <h4 className="text-base font-bold uppercase tracking-wider text-black">
            Project Progress &mdash; Milestones
          </h4>
        </div>
        {groupedMilestones.length > 0 ? (
          <div className="space-y-8">
            {groupedMilestones.map(([stage, mStats]) => (
              <div key={stage} className="space-y-4">
                <h5 className="text-sm font-bold text-black uppercase tracking-wider pb-2 border-b border-gray-150">
                  {stage} Milestones
                </h5>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {mStats
                    .filter((ms) => {
                      if (
                        userRole === "connection_designer_engineer" ||
                        userRole === "connection_designer_admin"
                      ) {
                        return (
                          (ms.CDApprovalDate && ms.CDApprovalDate !== "") ||
                          (ms.subject || "").toLowerCase().includes("connection")
                        );
                      }
                      return true;
                    })
                    .map((ms, index) => (
                    <div
                      key={ms.id || index}
                      onClick={() => {
                        setSelectedMilestoneToView(ms);
                      }}
                      className={`p-4 bg-slate-50/40 border border-gray-200 rounded-none shadow-none flex flex-col justify-between transition-colors cursor-pointer hover:bg-slate-50`}
                    >
                      <div>
                        <h5 className="font-bold text-black text-base mb-1 line-clamp-1">
                          {ms.subject}
                        </h5>
                        <div className="flex justify-between items-center text-sm text-black font-semibold mb-2">
                          <span>Status:</span>
                          <span
                            className={`px-2 py-0.5 rounded-none text-md uppercase font-bold tracking-widest ${ms.status === "APPROVED" ||
                              ms.status === "COMPLETED"
                              ? " text-green-700"
                              : " text-yellow-700"
                              }`}
                          >
                            {ms.status || "PENDING"}
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-sm text-black font-semibold mb-2">
                          <span>Completion Percentage :</span>
                          <div className="flex items-center">
                            <span
                              className={`px-2 py-0.5 rounded-none text-md uppercase font-bold tracking-widest ${ms.status === "APPROVED" ||
                                ms.status === "COMPLETED"
                                ? " text-green-700"
                                : " text-green-950"
                                }`}
                            >
                              {ms.progress}%
                            </span>
                            {userRole !== "client" &&
                              userRole !== "client_admin" && userRole !== "connection_designer_admin" && userRole !== "connection_designer_engineer" && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedMilestoneId(ms.id || ms._id);
                                    setIsUpdateModalOpen(true);
                                  }}
                                  className="ml-2 text-black hover:text-blue-600"
                                >
                                  <Pencil size={14} />
                                </button>
                              )}
                          </div>
                        </div>
                      </div>
                      <div className="w-full bg-red-500 rounded-none h-2 relative overflow-hidden">
                        {/* Time Progress (background shadow layer) */}
                        <div
                          className="absolute top-0 left-0 h-2 bg-gray-400 opacity-40 transition-all duration-500"
                          style={{ width: `${ms.timePercent}%` }}
                        ></div>
                        {/* Task Completion (real progress) */}
                        <div
                          className="absolute top-0 left-0 h-2 rounded-none bg-teal-500 transition-all duration-500"
                          style={{
                            width: `${ms.progress || 0}%`,
                          }}
                        ></div>
                      </div>
                      <div className="border-t border-gray-100 pt-2 mt-2 space-y-2">
 
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-black uppercase text-sm font-bold">
                            Approval Date
                          </span>
                          <span className="font-bold text-black text-sm">
                            {formatDate(ms.approvalDate)}
                          </span>
                        </div>
 
                        {userRole !== "client" && userRole !== "client_admin" && (
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-black uppercase text-sm font-bold">
                              CD Approval Date
                            </span>
                            <span className="font-bold text-black text-sm">
                              {formatDate(ms.CDApprovalDate)}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-8 text-center text-gray-500 font-medium text-sm">
            No milestones found.
          </div>
        )}
      </div>
      {isUpdateModalOpen && selectedMilestoneId && (
        <div className="fixed inset-0 z-99999 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg h-auto bg-white rounded-none shadow-none overflow-hidden animate-in fade-in zoom-in duration-200">
            <UpdateCompletionPer
              milestoneId={selectedMilestoneId}
              onClose={() => setIsUpdateModalOpen(false)}
              onSuccess={() => {
                if (onUpdate) onUpdate();
                setIsUpdateModalOpen(false);
              }}
            />
          </div>
        </div>
      )}

      {selectedMilestoneToView && (
        <div className="fixed inset-0 z-99999 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="w-full max-w-5xl my-auto animate-in fade-in zoom-in duration-200">
            <GetMilestoneByID
              row={selectedMilestoneToView}
              close={() => {
                setSelectedMilestoneToView(null);
                if (onUpdate) onUpdate();
              }}
              onUpdate={onUpdate}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectMilestoneMetrics;
