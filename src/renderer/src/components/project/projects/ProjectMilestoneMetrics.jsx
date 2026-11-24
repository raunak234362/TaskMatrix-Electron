import React, { useEffect, useMemo, useState } from "react";
import { CalendarCheck, Pencil } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { setMilestonesForProject } from "../../../store/milestoneSlice";
import { formatDate } from "../../../utils/dateUtils";
import Service from "../../../api/Service";
import UpdateCompletionPer from "../mileStone/UpdateCompletionPer";
import GetMilestoneByID from "../mileStone/GetMilestoneByID";

const ProjectMilestoneMetrics = ({
  projectId,
  projectName,
  onUpdate,
  milestones: milestonesProp,
  submittalData: submittalDataProp,
}) => {
  const userRole = sessionStorage.getItem("userRole")?.toLowerCase() || "";
  const dispatch = useDispatch();
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [selectedMilestoneId, setSelectedMilestoneId] = useState(null);
  const [selectedMilestoneToView, setSelectedMilestoneToView] = useState(null);
  const [submittalList, setSubmittalList] = useState(submittalDataProp || []);

  const milestonesByProject = useSelector(
    (state) => state.milestoneInfo?.milestonesByProject || {},
  );
  const milestones = milestonesProp || milestonesByProject[projectId] || [];

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

  useEffect(() => {
    if (!milestonesByProject[projectId]) {
      fetchMileStone();
    }
  }, [projectId, milestonesByProject, dispatch]);

  useEffect(() => {
    if (submittalDataProp && submittalDataProp.length > 0) {
      setSubmittalList(submittalDataProp);
      return;
    }
    if (projectId) {
      Service.GetSubmittalByProjectId(projectId)
        .then((res) => {
          const list = Array.isArray(res) ? res : (res?.data || []);
          setSubmittalList(list);
        })
        .catch((err) => console.error("Error fetching submittals for milestone metrics:", err));
    }
  }, [projectId, submittalDataProp]);

  useEffect(() => {
    const handleRefresh = () => {
      fetchMileStone();
    };
    window.addEventListener("milestone-updated", handleRefresh);
    window.addEventListener("dashboard-refresh", handleRefresh);
    return () => {
      window.removeEventListener("milestone-updated", handleRefresh);
      window.removeEventListener("dashboard-refresh", handleRefresh);
    };
  }, [projectId]);

  const isSubmittalCompletedForMilestone = (milestoneId) => {
    const mId = String(milestoneId);
    return (submittalList || []).some((sub) => {
      if (sub.isAproovedByAdmin === false) return false;
      let matches = false;
      if (String(sub.mileStoneId || sub.milestoneId || sub.milestone?.id) === mId) matches = true;
      if (Array.isArray(sub.mileStoneIds) && sub.mileStoneIds.some((link) => {
        const linkId = typeof link === "string" ? link : (link?.id || link?.mileStoneId || link?.milestoneId);
        return String(linkId) === mId;
      })) matches = true;
      if (Array.isArray(sub.mileStones) && sub.mileStones.some((m) => String(m.id || m._id) === mId)) matches = true;
      if (sub.mileStoneBelongsTo && String(sub.mileStoneBelongsTo.id || sub.mileStoneBelongsTo._id) === mId) matches = true;

      if (!matches) return false;

      const subStatus = String(sub.wbtStatus || sub.status || "").toUpperCase().replace(/\s+/g, "_");
      return [
        "RELEASE_FOR_FABRICATION",
        "BFA_RECEIVED",
        "SUBMITTED_TO_EOR",
        "WAITING_FOR_BFA",
        "BFA_SENT",
        "COMPLETED",
        "COMPLETE",
        "CLOSED"
      ].includes(subStatus);
    });
  };

  const milestoneStats = useMemo(() => {
    return milestones.map((ms) => {
      const msTasks = ms.Tasks || ms.tasks || [];
      const validTasks = msTasks.filter((t) => {
        const s = String(t.status || "").trim().toUpperCase().replace(/\s+/g, "_");
        return s !== "WRONG_ALLOCATION" && s !== "ABSENT" && s !== "LEAVE";
      });
      const totalTasks = validTasks.length;
      let taskProgress = 0;
      if (totalTasks > 0) {
        const completedStatuses = [
          "COMPLETE",
          "VALIDATE_COMPLETE",
          "COMPLETE_OTHER",
          "USER_FAULT",
          "COMPLETED",
          "VALIDATE_COMPLETED",
        ];
        const completedCount = validTasks.filter((t) => {
          const s = String(t.status || "").trim().toUpperCase().replace(/\s+/g, "_");
          return completedStatuses.includes(s) || completedStatuses.includes(String(t.status || "").trim().toUpperCase());
        }).length;
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

      const rawStatus = (ms.status || "").toUpperCase();
      const isCompleteStatus = ["COMPLETED", "COMPLETE", "APPROVED"].includes(rawStatus);
      const isSubmissionCompleted = isCompleteStatus || isSubmittalCompletedForMilestone(ms.id || ms._id);

      // Rule: Until submittal is done, percentage counts between 0-80% (20% is reserved for submission).
      // Once submission is completed, it reaches 100%.
      let finalProgress = 0;
      if (isSubmissionCompleted) {
        finalProgress = 100;
      } else {
        if (totalTasks > 0) {
          const rawProgress = manualProgress > 0 ? manualProgress : taskProgress;
          finalProgress = Math.round((rawProgress * 80) / 100);
        } else if (manualProgress > 0) {
          finalProgress = manualProgress > 80 ? 80 : manualProgress;
        } else {
          finalProgress = 0;
        }
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

          <h4 className="text-sm font-semibold uppercase tracking-normal text-black">
            Project Progress &mdash; Milestones
          </h4>
        </div>
        {groupedMilestones.length > 0 ? (
          <div className="space-y-8">
            {groupedMilestones.map(([stage, mStats]) => (
              <div key={stage} className="space-y-4">
                <h5 className="text-sm font-semibold text-black uppercase tracking-normal pb-2">
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
                          <h5 className="font-semibold text-black text-sm mb-1 line-clamp-1">
                            {ms.subject} | {ms?.subSubject}
                          </h5>
                          <div className="flex justify-between items-center text-sm text-black font-semibold mb-2">
                            <span className="uppercase tracking-normal">Status:</span>
                            <span
                              className={`px-2 py-0.5 rounded-none text-sm uppercase font-semibold tracking-normal ${ms.status === "APPROVED" ||
                                ms.status === "COMPLETED"
                                ? " text-green-700"
                                : " text-yellow-700"
                                }`}
                            >
                              {ms.status || "PENDING"}
                            </span>
                          </div>
                          <div className="flex justify-between items-center text-sm text-black font-semibold mb-2">
                            <span className="uppercase tracking-normal">Completion Percentage:</span>
                            <div className="flex items-center">
                              <span
                                className={`px-2 py-0.5 rounded-none text-sm uppercase font-semibold tracking-normal ${ms.status === "APPROVED" ||
                                  ms.status === "COMPLETED"
                                  ? " text-green-700"
                                  : " text-green-950"
                                  }`}
                              >
                                {ms.progress}%
                              </span>
                              {userRole !== "client" &&
                                userRole !== "client_admin" && userRole !== "staff" && userRole !== "connection_designer_admin" && userRole !== "connection_designer_engineer" && (
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
                            <span className="text-black uppercase text-sm font-semibold tracking-normal">
                              Submittal Date
                            </span>
                            <span className="font-semibold text-black text-sm">
                              {formatDate(ms.approvalDate)}
                            </span>
                          </div>

                          {userRole !== "client" && userRole !== "client_admin" && ms.isConnectionDesign && (
                            <div className="flex justify-between items-center text-sm">
                              <span className="text-black uppercase text-sm font-semibold tracking-normal">
                                CD Submittal Date
                              </span>
                              <span className="font-semibold text-black text-sm">
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
