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
                <h4 className="text-xs font-black text-black mb-6 flex items-center gap-3 uppercase tracking-widest">
                    <CalendarCheck size={20} className="text-[#6bbd45]" strokeWidth={3} />
                    Project Progress
                </h4>
                {milestoneStats.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {milestoneStats.map((ms, index) => (
                            <div
                                key={ms.id || index}
                                className="p-6 bg-white border-2 border-slate-50 rounded-2xl shadow-sm hover:shadow-md transition-all flex flex-col justify-between group"
                            >
                                <div>
                                    <div className="flex justify-between items-start mb-4">
                                        <h5 className="font-black text-black text-lg uppercase tracking-tight leading-tight max-w-[70%]">
                                            {ms.subject}
                                        </h5>
                                        <span
                                            className={`px-3 py-1 rounded-lg text-[10px] uppercase font-black tracking-widest ${ms.status === "APPROVED" || ms.status === "COMPLETED"
                                                ? "bg-emerald-50 text-emerald-600 border border-emerald-100"
                                                : "bg-amber-50 text-amber-600 border border-amber-100"
                                                }`}
                                        >
                                            {ms.status || "PENDING"}
                                        </span>
                                    </div>

                                    <div className="space-y-3 mb-6">
                                        <div className="flex justify-between items-center">
                                            <span className="text-[10px] font-black uppercase tracking-widest text-black/40">Status:</span>
                                            <span className="text-[11px] font-black uppercase text-amber-500 tracking-widest">{ms.status || "ACTIVE"}</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-[10px] font-black uppercase tracking-widest text-black/40">Stage:</span>
                                            <span className="text-[11px] font-black uppercase text-black tracking-widest">{ms.stage || "IFA"}</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-[10px] font-black uppercase tracking-widest text-black/40">Completion Percentage :</span>
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm font-black text-black">{ms.completionPercentage || ms.taskPercentage || ms.percentage || 0}%</span>
                                                <button
                                                    onClick={() => {
                                                        setSelectedMilestoneId(ms.id || ms._id);
                                                        setIsUpdateModalOpen(true);
                                                    }}
                                                    className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-slate-50 rounded"
                                                >
                                                    <svg
                                                        xmlns="http://www.w3.org/2000/svg"
                                                        width="14"
                                                        height="14"
                                                        viewBox="0 0 24 24"
                                                        fill="none"
                                                        stroke="currentColor"
                                                        strokeWidth="3"
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        className="text-black/40 hover:text-black"
                                                    >
                                                        <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                                                        <path d="m15 5 4 4" />
                                                    </svg>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="w-full bg-slate-100 rounded-full h-3 relative overflow-hidden">
                                        <div
                                            className={`absolute top-0 left-0 h-full rounded-full transition-all duration-700 ease-out shadow-[0_0_10px_rgba(107,189,69,0.2)] ${(ms.taskPercentage || ms.percentage) >= 100 ? 'bg-[#6bbd45]' : 'bg-[#6bbd45]'
                                                }`}
                                            style={{
                                                width: `${ms.taskPercentage || ms.percentage}%`,
                                            }}
                                        ></div>
                                    </div>

                                    <div className="pt-4 border-t border-slate-50 flex justify-between items-center">
                                        <span className="text-[10px] font-black text-black/40 uppercase tracking-widest">
                                            Approval Date
                                        </span>
                                        <span className="font-black text-black text-[11px] tracking-tight">
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
