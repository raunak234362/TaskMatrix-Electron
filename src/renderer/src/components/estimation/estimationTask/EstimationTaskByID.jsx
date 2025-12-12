/* eslint-disable react/prop-types */
import React, { useEffect, useState } from "react";
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
} from "lucide-react";

const EstimationTaskByID = ({ id, onClose, refresh }) => {
    const [task, setTask] = useState(null);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);
    const [summary, setSummary] = useState(null);
const workingID= task?.workinghours[0]?.id
    const fetchTask = async () => {
        if (!id) return;
        try {
            setLoading(true);
            const response = await Service.GetEstimationTaskById(id);
            const summary = await Service.SummaryEstimationTaskById(id);
            console.log(summary);
            
            setSummary(summary.data);
            setTask(response.data);
        } catch (error) {
            console.error("Error fetching task:", error);
            toast.error("Failed to fetch estimation task");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTask();
    }, [id]);

    const toIST = (dateString) => {
        if (!dateString) return "—";
        const date = new Date(dateString);
        return new Intl.DateTimeFormat("en-IN", {
            timeZone: "Asia/Kolkata",
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        }).format(date);
    };

    const handleAction = async (action) => {
        if (!task?.id) return;
        try {
            setProcessing(true);
            let response;
            switch (action) {
                case "start":
                    response = await Service.StartEstimationTaskById(task.id);
                    toast.success("Estimation task started");
                    break;
                case "pause":
                    const data = {whId:workingID}
                    response = await Service.PauseEstimationTaskById(task.id,data);
                    toast.info("Estimation task paused");
                    break;
                case "resume":
                    response = await Service.ResumeEstimationTaskById(task.id);
                    toast.success("Estimation task resumed");
                    break;
                case "end":
                    response = await Service.EndEstimationTaskById(task.id);
                    toast.success("Estimation task ended");
                    break;
                default:
                    return;
            }
            await fetchTask();
            if (refresh) refresh();
        } catch (error) {
            console.error(error);
            toast.error("Action failed. Try again.");
        } finally {
            setProcessing(false);
        }
    };

    if (loading) {
        return (
            <div className="fixed inset-0 bg-black/60 flex justify-center items-center z-50">
                <div className="bg-white p-4 rounded-lg flex flex-col items-center">
                    <Loader2 className="animate-spin w-6 h-6 text-teal-600" />
                    <p className="mt-2 text-gray-600 text-sm">Loading Task...</p>
                </div>
            </div>
        );
    }

    if (!task) {
        return (
            <div className="fixed inset-0 bg-black/60 flex justify-center items-center z-50">
                <div className="bg-white p-6 rounded-lg text-center">
                    <p className="text-gray-600">No task found or deleted.</p>
                    <button
                        onClick={onClose}
                        className="mt-4 px-4 py-2 bg-teal-600 text-white rounded-md"
                    >
                        Close
                    </button>
                </div>
            </div>
        );
    }

    const assignedToName =
        task.assignedTo?.firstName || task.assignedTo?.username || "—";
    const filesToDisplay =
        task.files?.length > 0 ? task.files : task.estimation?.files || [];

    // Conditional status color
    const getStatusColor = (status) => {
        const colors = {
            ASSIGNED: "bg-yellow-100 text-yellow-700 border-yellow-400",
            IN_PROGRESS: "bg-green-100 text-green-700 border-green-400",
            PAUSED: "bg-red-100 text-red-700 border-red-400",
            COMPLETED: "bg-blue-100 text-blue-700 border-blue-400",
        };
        return colors[status] || "bg-gray-100 text-gray-600 border-gray-300";
    };

    return (
        <div className="fixed inset-0 bg-black/60 flex justify-center items-center z-50">
            <div className="bg-white w-full max-w-3xl max-h-[90vh] overflow-y-auto p-6 rounded-xl relative shadow-xl">
                <div className="flex justify-between items-center mb-5 border-b pb-3">
                    <h2 className="text-2xl font-semibold text-gray-800">
                        Estimation Task Details
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-gray-500 hover:text-gray-700 font-medium"
                    >
                        ✕
                    </button>
                </div>

                <div className="space-y-4">
                    {/* Basic Info */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-gray-800">
                        <div>
                            <p className="text-sm text-gray-500">Project Name</p>
                            <p className="font-medium">{task.estimation?.projectName || "—"}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Estimation No.</p>
                            <p className="font-medium">{task.estimation?.estimationNumber || "—"}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Assigned To</p>
                            <p className="font-medium flex items-center gap-2">
                                <User size={15} className="text-teal-500" /> {assignedToName}
                            </p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Status</p>
                            <span
                                className={`inline-block px-3 py-1 rounded-full border text-xs font-semibold ${getStatusColor(
                                    task.status
                                )}`}
                            >
                                {task.status}
                            </span>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Start Date</p>
                            <p className="font-medium flex items-center gap-2">
                                <Calendar size={15} className="text-teal-500" />{" "}
                                {toIST(task.startDate)}
                            </p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">End Date</p>
                            <p className="font-medium flex items-center gap-2">
                                <Calendar size={15} className="text-teal-500" />{" "}
                                {toIST(task.endDate)}
                            </p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Created On</p>
                            <p className="font-medium">{toIST(task.createdAt)}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Updated On</p>
                            <p className="font-medium">{toIST(task.updatedAt)}</p>
                        </div>
                    </div>

                    {/* Notes */}
                    {task.notes && (
                        <div>
                            <p className="text-sm text-gray-500">Notes</p>
                            <p className="text-gray-800 bg-gray-50 p-3 rounded border mt-1 whitespace-pre-wrap">
                                {task.notes}
                            </p>
                        </div>
                    )}

                    {/* Attachments */}
                    {filesToDisplay.length > 0 && (
                        <div>
                            <p className="text-sm text-gray-500 mb-1">Attachments</p>
                            <div className="flex flex-wrap gap-2">
                                {filesToDisplay.map((file, index) => (
                                    <a
                                        key={index}
                                        href={file.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-1 text-blue-600 bg-blue-50 hover:bg-blue-100 transition px-3 py-1 rounded text-sm"
                                    >
                                        <FileText size={15} />
                                        {file.name || `File ${index + 1}`}
                                    </a>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex flex-wrap justify-center gap-4 mt-6 border-t pt-4">
                        {task.status === "ASSIGNED" && (
                            <button
                                onClick={() => handleAction("start")}
                                disabled={processing}
                                className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold px-4 py-2 rounded-lg transition"
                            >
                                <Play size={16} />
                                Start
                            </button>
                        )}

                        {task.status === "IN_PROGRESS" && (
                            <>
                                <button
                                    onClick={() => handleAction("pause")}
                                    disabled={processing}
                                    className="flex items-center gap-2 bg-yellow-600 hover:bg-yellow-700 text-white font-semibold px-4 py-2 rounded-lg transition"
                                >
                                    <Pause size={16} />
                                    Pause
                                </button>
                                <button
                                    onClick={() => handleAction("end")}
                                    disabled={processing}
                                    className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-semibold px-4 py-2 rounded-lg transition"
                                >
                                    <Square size={16} />
                                    End
                                </button>
                            </>
                        )}

                        {task.status === "BREAK" && (
                            <button
                                onClick={() => handleAction("resume")}
                                disabled={processing}
                                className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white font-semibold px-4 py-2 rounded-lg transition"
                            >
                                <Play size={16} />
                                Resume
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EstimationTaskByID;
