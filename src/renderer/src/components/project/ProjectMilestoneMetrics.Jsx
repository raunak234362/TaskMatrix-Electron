import React, { useEffect, useMemo, useState } from "react";
import { CalendarCheck } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { setMilestonesForProject } from "../../store/milestoneSlice";
import { formatDate } from "../../utils/dateUtils";
import Service from "../../api/Service";
import UpdateCompletionPer from "./mileStone/UpdateCompletionPer";

const ProjectMilestoneMetrics = ({ projectId }) => {
  const dispatch = useDispatch();
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [selectedMilestoneId, setSelectedMilestoneId] = useState(null);

  const milestonesByProject = useSelector(
    (state) => state.milestoneInfo?.milestonesByProject || {},
  );
  const milestones = milestonesByProject[projectId] || [];

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
          "COMPLETION",
        ];
        const completedCount = msTasks.filter((t) =>
          completedStatuses.includes(t.status?.toUpperCase()),
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

      const finalProgress =
        ms.percentage !== undefined &&
          ms.percentage !== null &&
          ms.percentage !== ""
          ? Number(ms.percentage)
          : taskProgress;

      return {
        ...ms,
        progress: finalProgress,
        taskPercentage: taskProgress,
        timePercent: timeProgress,
      };
    });
  }, [milestones]);

  return (
    <div className="space-y-8 p-1">
      {/* Milestone Approvals Section */}
      <div>
        <h4 className="text-lg text-gray-800 mb-4 flex items-center gap-2 uppercase tracking-tight font-black">
          <CalendarCheck size={20} className="text-[#6bbd45]" />
          Project Progress
        </h4>
        {milestoneStats.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {milestoneStats.map((ms, index) => (
              <div
                key={ms.id || index}
                className={`p-4 bg-white border border-gray-200 rounded-xl shadow-sm flex flex-col justify-between transition-colors relative group`}
              >
                <div>
                  <h5 className="font-bold text-gray-800 mb-1 line-clamp-1 uppercase text-sm tracking-tight">
                    {ms.subject}
                  </h5>
                  <div className="flex justify-between items-center text-[10px] text-gray-500 mb-2 font-black uppercase tracking-widest">
                    <span>Status:</span>
                    <span
                      className={` ${ms.status === "APPROVED" || ms.status === "COMPLETED"
                          ? "text-green-700"
                          : "text-amber-600"
                        }`}
                    >
                      {ms.status || "PENDING"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-[10px] text-gray-500 mb-2 font-black uppercase tracking-widest">
                    <span>Stage:</span>
                    <span className="text-gray-900">
                      {ms.stage || "—"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-[10px] text-gray-500 mb-2 font-black uppercase tracking-widest">
                    <span>Completion:</span>
                    <div className="flex items-center gap-2">
                      <span className="text-[#6bbd45]">
                        {ms.completionPercentage || ms.taskPercentage || ms.percentage || 0}%
                      </span>
                      <button
                        onClick={() => {
                          setSelectedMilestoneId(ms.id || ms._id);
                          setIsUpdateModalOpen(true);
                        }}
                        className="p-1 hover:bg-slate-100 rounded-lg transition-colors text-slate-400 hover:text-[#6bbd45]"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="12"
                          height="12"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="3"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                          <path d="m15 5 4 4" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>

                <div className="mt-3">
                  <div className="w-full bg-slate-100 rounded-full h-1.5 relative overflow-hidden">
                    {/* Time Progress (elapsed expectation) */}
                    <div
                      className="absolute top-0 left-0 h-full bg-slate-300 transition-all duration-700"
                      style={{ width: `${ms.timePercent}%` }}
                    />
                    {/* Actual Completion (real progress) */}
                    <div
                      className="absolute top-0 left-0 h-full rounded-full bg-[#6bbd45] transition-all duration-700"
                      style={{
                        width: `${ms.completionPercentage || ms.taskPercentage || ms.percentage || 0}%`,
                      }}
                    />
                  </div>
                  <div className="flex justify-between items-center mt-2 pt-2 border-t border-slate-50">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                      Approval Date
                    </span>
                    <span className="text-[10px] font-bold text-slate-700">
                      {formatDate(ms.approvalDate)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-10 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 text-center text-slate-400 font-bold uppercase tracking-widest text-xs">
            No milestones found for this project
          </div>
        )}
      </div>

      {isUpdateModalOpen && selectedMilestoneId && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg h-auto bg-white rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200 border border-slate-200">
            <UpdateCompletionPer
              milestoneId={selectedMilestoneId}
              onClose={() => setIsUpdateModalOpen(false)}
              onSuccess={() => {
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
                fetchMileStone();
                setIsUpdateModalOpen(false);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectMilestoneMetrics;
