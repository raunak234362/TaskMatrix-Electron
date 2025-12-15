"use client"

/* eslint-disable react/prop-types */
import { useEffect, useState } from "react"
import Service from "../../../api/Service"
import { toast } from "react-toastify"
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
} from "lucide-react"
import CreateLineItemGroup from "../estimationLineItem/CreateLineItemGroup"

const EstimationTaskByID = ({ id, onClose, refresh }) => {
    const [task, setTask] = useState(null)
    const [loading, setLoading] = useState(true)
    const [processing, setProcessing] = useState(false)
    const [summary, setSummary] = useState(null)
    const [showWorkSummary, setShowWorkSummary] = useState(true)

    // 🔹 Fetch task and summary data
    const fetchTask = async () => {
        if (!id) return
        try {
            setLoading(true)
            const response = await Service.GetEstimationTaskById(id)
            const summaryRes = await Service.SummaryEstimationTaskById(id)

            setTask(response.data)
            setSummary(summaryRes.data)
        } catch (error) {
            console.error("Error fetching task:", error)
            toast.error("Failed to fetch estimation task")
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchTask()
    }, [id])

    // 🔹 Find active working hour (where ended_at is null)
    const getActiveWorkID = () => {
        if (!task?.workinghours?.length) return null
        const active = task.workinghours.find((wh) => wh.ended_at === null)
        return active?.id || null
    }

    const formatDecimalHours = (decimalHours) => {
        const num = Number(decimalHours)
        if (!num || isNaN(num)) return "0h 0m"
        const hours = Math.floor(num)
        const minutes = Math.round((num - hours) * 60)
        return `${hours}h ${minutes}m`
    }

    const activeWorkID = getActiveWorkID()
    console.log("active Work ID------", activeWorkID);

    const toIST = (dateString) => {
        if (!dateString) return "—"
        const date = new Date(dateString)
        return new Intl.DateTimeFormat("en-IN", {
            timeZone: "Asia/Kolkata",
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        }).format(date)
    }

    // 🔹 Handle Start / Pause / Resume / End
    const handleAction = async (action) => {
        if (!task?.id) return
        try {
            setProcessing(true)
            let response

            switch (action) {
                case "start":
                    response = await Service.StartEstimationTaskById(task.id)
                    toast.success("Estimation task started")
                    break

                case "pause":
                    if (!activeWorkID) {
                        toast.warning("No active work session found to pause")
                        return
                    }
                    response = await Service.PauseEstimationTaskById(task.id, {
                        whId: activeWorkID,
                    })
                    toast.info("Estimation task paused")
                    break

                case "resume":
                    response = await Service.ResumeEstimationTaskById(task.id)
                    toast.success("Estimation task resumed")
                    break

                case "end":
                    if (!activeWorkID) {
                        toast.warning("No active work session found to end")
                        return
                    }
                    response = await Service.EndEstimationTaskById(task.id, {
                        whId: activeWorkID,
                    })
                    toast.success("Estimation task ended")
                    break

                default:
                    return
            }

            await fetchTask()
            if (refresh) refresh()
        } catch (error) {
            console.error("Task action error:", error)
            toast.error("Action failed. Try again.")
        } finally {
            setProcessing(false)
        }
    }

    // 🌀 Loading State
    if (loading) {
        return (
            <div className="fixed inset-0 bg-black/60 flex justify-center items-center z-50">
                <div className="bg-white p-6 rounded-xl flex flex-col items-center shadow-2xl">
                    <Loader2 className="animate-spin w-10 h-10 text-teal-600" />
                    <p className="mt-3 text-gray-700 font-medium">Loading Task...</p>
                </div>
            </div>
        )
    }

    // ❌ No Task Found
    if (!task) {
        return (
            <div className="fixed inset-0 bg-black/60 flex justify-center items-center z-50">
                <div className="bg-white p-8 rounded-xl text-center shadow-2xl">
                    <p className="text-gray-700 text-lg mb-4">No task found or deleted.</p>
                    <button
                        onClick={onClose}
                        className="px-6 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-lg transition-colors duration-300"
                    >
                        Close
                    </button>
                </div>
            </div>
        )
    }

    const assignedToName = task.assignedTo?.firstName || task.assignedTo?.username || "—"
    const filesToDisplay = task.files?.length > 0 ? task.files : task.estimation?.files || []

    // Badge colors
    const getStatusBadge = (status) => {
        const colors = {
            ASSIGNED: "bg-pink-100 text-pink-600 border-pink-400",
            IN_PROGRESS: "bg-green-100 text-green-700 border-green-400",
            BREAK: "bg-red-100 text-red-700 border-red-400",
            COMPLETED: "bg-blue-100 text-blue-700 border-blue-400",
        }
        return colors[status] || "bg-gray-100 text-gray-600 border-gray-300"
    }

    const getStatusLabel = (status) => {
        const labels = {
            ASSIGNED: "Assigned",
            IN_PROGRESS: "In Progress",
            BREAK: "Break",
            COMPLETED: "Completed",
        }
        return labels[status] || status
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60">
            <div className="bg-white h-screen overflow-x-auto mx-5 rounded-xl shadow-2xl w-11/12 max-w-5xl">
                <div className="sticky top-0 z-10 flex items-center justify-between p-5 bg-white border-b-2 border-teal-100 shadow-md">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-teal-100 rounded-lg">
                            <FileText className="text-teal-700 w-6 h-6" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-teal-700">Estimation Task Details</h2>
                            <p className="text-sm text-gray-500">View and manage task status</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="px-6 py-2.5 text-white font-semibold transition-colors duration-300 rounded-lg bg-teal-600 hover:bg-teal-700"
                    >
                        Close
                    </button>
                </div>

                <div className="overflow-y-auto p-6">
                    <div className="space-y-6">
                        <div className="w-full p-6 rounded-lg shadow-xl bg-gradient-to-br from-teal-50 to-teal-100">
                            <h3 className="mb-4 text-xl font-bold text-teal-800 border-b border-teal-200 pb-2">Task Information</h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Project Name */}
                                <div className="flex items-start gap-3">
                                    <div className="p-2 bg-white rounded-lg">
                                        <Building2 className="text-teal-600 w-5 h-5" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-sm font-medium text-gray-600">Project Name</p>
                                        <p className="font-semibold text-gray-800 mt-1">{task.estimation?.projectName || "—"}</p>
                                    </div>
                                </div>

                                {/* Estimation Number */}
                                <div className="flex items-start gap-3">
                                    <div className="p-2 bg-white rounded-lg">
                                        <Hash className="text-teal-600 w-5 h-5" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-sm font-medium text-gray-600">Estimation No.</p>
                                        <p className="font-semibold text-gray-800 mt-1">{task.estimation?.estimationNumber || "—"}</p>
                                    </div>
                                </div>

                                {/* Assigned To */}
                                <div className="flex items-start gap-3">
                                    <div className="p-2 bg-white rounded-lg">
                                        <User className="text-teal-600 w-5 h-5" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-sm font-medium text-gray-600">Assigned To</p>
                                        <p className="font-semibold text-gray-800 mt-1">{assignedToName}</p>
                                    </div>
                                </div>

                                {/* Status */}
                                <div className="flex items-start gap-3">
                                    <div className="flex-1">
                                        <p className="text-sm font-medium text-gray-600 mb-2">Status</p>
                                        <span
                                            className={`inline-block px-4 py-1.5 rounded-full border-2 text-sm font-semibold ${getStatusBadge(
                                                task.status,
                                            )}`}
                                        >
                                            {getStatusLabel(task.status)}
                                        </span>
                                    </div>
                                </div>

                                {/* Start Date */}
                                <div className="flex items-start gap-3">
                                    <div className="p-2 bg-white rounded-lg">
                                        <Calendar className="text-teal-600 w-5 h-5" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-sm font-medium text-gray-600">Start Date</p>
                                        <p className="font-semibold text-gray-800 mt-1">{toIST(task.startDate)}</p>
                                    </div>
                                </div>

                                {/* End Date */}
                                <div className="flex items-start gap-3">
                                    <div className="p-2 bg-white rounded-lg">
                                        <Calendar className="text-teal-600 w-5 h-5" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-sm font-medium text-gray-600">End Date</p>
                                        <p className="font-semibold text-gray-800 mt-1">{toIST(task.endDate)}</p>
                                    </div>
                                </div>
                                <div className="w-full">
                                    <h3 className="text-xl font-bold text-blue-800 mb-3 flex items-center gap-2">
                                        <FileText className="w-6 h-6" />
                                        Notes
                                    </h3>
                                    <div className="p-4 rounded-lg text-gray-800 whitespace-pre-wrap">{task.notes}</div>
                                </div>
                            </div>

                            <div className="mt-6 pt-4 border-t border-teal-200">
                                <p className="text-sm font-semibold text-gray-700 mb-3">Task Actions</p>
                                <div className="flex flex-wrap gap-3">
                                    {task.status === "ASSIGNED" && (
                                        <button
                                            onClick={() => handleAction("start")}
                                            disabled={processing}
                                            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-semibold px-5 py-2.5 rounded-lg transition-colors duration-300 shadow-md"
                                        >
                                            <Play size={18} />
                                            Start Task
                                        </button>
                                    )}

                                    {task.status === "IN_PROGRESS" && (
                                        <>
                                            <button
                                                onClick={() => handleAction("pause")}
                                                disabled={processing}
                                                className="flex items-center gap-2 bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-400 text-white font-semibold px-5 py-2.5 rounded-lg transition-colors duration-300 shadow-md"
                                            >
                                                <Pause size={18} />
                                                Pause
                                            </button>
                                            <button
                                                onClick={() => handleAction("end")}
                                                disabled={processing}
                                                className="flex items-center gap-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white font-semibold px-5 py-2.5 rounded-lg transition-colors duration-300 shadow-md"
                                            >
                                                <Square size={18} />
                                                End Task
                                            </button>
                                        </>
                                    )}

                                    {task.status === "BREAK" && (
                                        <button
                                            onClick={() => handleAction("resume")}
                                            disabled={processing}
                                            className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 disabled:bg-gray-400 text-white font-semibold px-5 py-2.5 rounded-lg transition-colors duration-300 shadow-md"
                                        >
                                            <Play size={18} />
                                            Resume Task
                                        </button>
                                    )}

                                    {processing && (
                                        <div className="flex items-center gap-2 text-gray-600">
                                            <Loader2 className="animate-spin w-5 h-5" />
                                            <span className="text-sm">Processing...</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {summary && (
                            <div className="w-full p-6 rounded-lg shadow-xl bg-gradient-to-br from-blue-50 to-blue-100">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-xl font-bold text-blue-800 flex items-center gap-2">
                                        <Clock4 className="w-6 h-6" />
                                        Work Summary
                                    </h3>
                                    <button
                                        onClick={() => setShowWorkSummary(!showWorkSummary)}
                                        className="text-blue-600 hover:text-blue-800 transition-colors"
                                    >
                                        {showWorkSummary ? <ChevronUp /> : <ChevronDown />}
                                    </button>
                                </div>

                                {showWorkSummary && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="bg-white p-4 rounded-lg">
                                            <p className="text-sm text-gray-600 mb-1">Total Duration</p>
                                            <p className="text-2xl font-bold text-blue-700">{formatDecimalHours(summary?.totalHours)}</p>
                                        </div>
                                        <div className="bg-white p-4 rounded-lg">
                                            <p className="text-sm text-gray-600 mb-1">Total Sessions</p>
                                            <p className="text-2xl font-bold text-blue-700">{task?.workinghours?.length || 0}</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                    <CreateLineItemGroup estimationId={task?.estimationId} />
                </div>
            </div>
        </div>
    )
}

export default EstimationTaskByID
