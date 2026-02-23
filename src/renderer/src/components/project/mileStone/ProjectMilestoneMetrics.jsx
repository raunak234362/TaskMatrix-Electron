import React, { useEffect, useMemo, useState } from "react";
import { CalendarCheck } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { setMilestonesForProject } from "../../../store/milestoneSlice";
import { formatDate } from "../../../utils/dateUtils";
import Service from "../../../api/Service";
import UpdateCompletionPer from "./UpdateCompletionPer";

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
                    <CalendarCheck size={20} className="text-green-600" />
                    Project Progress
                </h4>
                {milestoneStats.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {milestoneStats.map((ms, index) => (
                            <div
                                key={ms.id || index}
                                className={`p-4 bg-white border-2 border-slate-100 rounded-xl shadow-none flex flex-col justify-between transition-colors relative`}
                            >
                                <div>
                                    <h5 className="font-black text-gray-800 mb-1 line-clamp-1 uppercase tracking-tight">
                                        {ms.subject}
                                    </h5>
                                    <div className="flex justify-between items-center text-sm text-gray-500 mb-2">
                                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Status:</span>
                                        <span
                                            className={`px-2 py-0.5 rounded-full text-xs uppercase font-bold tracking-widest ${ms.status === "APPROVED" || ms.status === "COMPLETED"
                                                ? " text-[#6bbd45]"
                                                : " text-amber-500"
                                                }`}
                                        >
                                            {ms.status || "PENDING"}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm text-gray-500 mb-2">
                                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Stage:</span>
                                        <span
                                            className={`px-2 py-0.5 rounded-full text-xs uppercase font-bold tracking-widest ${ms.status === "APPROVED" || ms.status === "COMPLETED"
                                                ? "bg-green-50 text-[#6bbd45]"
                                                : "bg-slate-50 text-slate-500"
                                                }`}
                                        >
                                            {ms.stage || "PENDING"}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm text-gray-500 mb-2">
                                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Completion Percentage :</span>
                                        <div className="flex items-center">
                                            <span
                                                className={`px-2 py-0.5 rounded-full text-md uppercase font-black tracking-widest text-[#6bbd45]`}
                                            >
                                                {ms.completionPercentage || ms.taskPercentage || ms.percentage || 0}%
                                            </span>
                                            <button
                                                onClick={() => {
                                                    setSelectedMilestoneId(ms.id || ms._id);
                                                    setIsUpdateModalOpen(true);
                                                }}
                                                className="ml-2 text-slate-300 hover:text-green-600 transition-colors"
                                            >
                                                <svg
                                                    xmlns="http://www.w3.org/2000/svg"
                                                    width="14"
                                                    height="14"
                                                    viewBox="0 0 24 24"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    strokeWidth="2"
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
                                <div className="w-full bg-slate-100 rounded-full h-2 relative overflow-hidden mt-2">
                                    {/* Time Progress (background shadow layer) */}
                                    <div
                                        className="absolute top-0 left-0 h-2 bg-slate-200 opacity-40 transition-all duration-500"
                                        style={{ width: `${ms.timePercent}%` }}
                                    ></div>
                                    {/* Task Completion (real progress) */}
                                    <div
                                        className={`absolute top-0 left-0 h-2 rounded-full transition-all duration-500 ${(ms.taskPercentage || ms.percentage) >= 100 ? 'bg-[#6bbd45]' : 'bg-teal-500'
                                            }`}
                                        style={{
                                            width: `${ms.taskPercentage || ms.percentage}%`,
                                        }}
                                    ></div>
                                </div>
                                <div className="border-t border-slate-50 pt-2 mt-2">
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-slate-400 uppercase text-[10px] font-black tracking-widest">
                                            Approval Date
                                        </span>
                                        <span className="font-black text-gray-700 text-xs tracking-tight">
                                            {formatDate(ms.approvalDate)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="p-10 bg-slate-50/50 rounded-2xl border-2 border-dashed border-slate-100 text-center flex flex-col items-center justify-center">
                        <div className="p-3 bg-white rounded-xl shadow-sm mb-3">
                            <CalendarCheck className="w-6 h-6 text-slate-300" />
                        </div>
                        <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">No milestones found.</p>
                    </div>
                )}
            </div>
            {isUpdateModalOpen && selectedMilestoneId && (
                <div className="fixed inset-0 z-99999 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="w-full max-w-lg h-auto bg-white rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
                        <UpdateCompletionPer
                            milestoneId={selectedMilestoneId}
                            onClose={() => setIsUpdateModalOpen(false)}
                            onSuccess={() => {
                                const fetchMileStone = async () => {
                                    try {
                                        const response =
                                            await Service.GetProjectMilestoneById(projectId);
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
