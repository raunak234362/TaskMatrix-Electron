/* eslint-disable react/prop-types */
import React, { useEffect, useState } from "react";
import { Loader2, AlertCircle } from "lucide-react";
import Service from "../../api/Service";
import Button from "../fields/Button";
import AllEstimationTask from "./estimationTask/AllEstimationTask";
import LineItemGroup from "./estimationLineItem/LineItemGroup";
import EditEstimation from "./EditEstimation";

import RenderFiles from "../ui/RenderFiles";
import InclusionExclusion from "./InclusionExclusion";
import EditInclusionExclusion from "./EditInclusionExclusion";

const truncateText = (text, max = 40) =>
    text.length > max ? text.substring(0, max) + "..." : text;

const GetEstimationByID = ({
    id,
    onRefresh,
}) => {
    const [estimation, setEstimation] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isEstimationTaskOpen, setIsEstimationTaskOpen] = useState(false);
    const [isHoursOpen, setIsHoursOpen] = useState(false);
    const [isInclusionOpen, setIsInclusionOpen] = useState(false);
    const [isEditingInclusion, setIsEditingInclusion] = useState(false);
    const [isEditing, setIsEditing] = useState(false);

    const fetchEstimation = async () => {
        if (!id) {
            setError("Invalid Estimation ID");
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            setError(null);
            const response = await Service.GetEstimationById(id);
            setEstimation(response?.data || null);
        } catch (err) {
            console.error("Error fetching estimation:", err);
            setError("Failed to load estimation details");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchEstimation();
    }, [id]);

    const formatDateTime = (date) =>
        date
            ? new Date(date).toLocaleString("en-IN", {
                dateStyle: "medium",
                timeStyle: "short",
            })
            : "N/A";

    const formatDate = (date) =>
        date
            ? new Date(date).toLocaleDateString("en-IN", {
                year: "numeric",
                month: "short",
                day: "numeric",
            })
            : "N/A";

    const formatHours = (hours) => {
        if (hours == null || hours === "") return "N/A";
        const numHours = typeof hours === "string" ? parseFloat(hours) : hours;
        if (isNaN(numHours)) return "N/A";
        const h = Math.floor(numHours);
        const m = Math.round((numHours - h) * 60);
        return `${h}h ${m.toString().padStart(2, "0")}m`;
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-8 text-gray-700">
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                Loading estimation details...
            </div>
        );
    }

    if (error || !estimation) {
        return (
            <div className="flex items-center justify-center py-8 text-red-600">
                <AlertCircle className="w-5 h-5 mr-2" />
                {error || "Estimation not found"}
            </div>
        );
    }

  const {
    estimationNumber,
    projectName,
    status,
    description,
    tools,
    fabricatorName,
    fabricators,
    rfq,
    estimateDate,
    startDate,
    createdAt,
    updatedAt,
    finalHours,
    finalWeeks,
    finalPrice,
    createdBy,
    totalAgreatedHours,
    files
  } = estimation

    const statusColor =
        status === "DRAFT"
            ? "bg-yellow-100 text-yellow-800"
            : status === "COMPLETED"
                ? "bg-green-100 text-green-800"
                : "bg-blue-100 text-blue-800";

    return (
        <div className="bg-linear-to-br from-green-50 to-cyan-50 rounded-2xl p-8 border border-green-200">
            {/* Header */}
            <div className="flex items-center justify-between mb-5">
                <div>
                    <h3 className="text-xl font-bold text-green-800">
                        Estimation #{estimationNumber}
                    </h3>
                    <p className="text-gray-700 font-medium">Project: {projectName}</p>
                </div>
                <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${statusColor}`}
                >
                    {status}
                </span>
            </div>

            {/* Top Grid */}
            <div className="grid max-sm:grid-cols-1 md:grid-cols-2 gap-5">
                {/* Left Column */}
                <div className="space-y-3">
                    {/* Fabricator */}
                    {(fabricators?.fabName || fabricatorName) && (
                        <InfoRow
                            label="Fabricator"
                            value={fabricators?.fabName || fabricatorName || "N/A"}
                        />
                    )}

                    {/* RFQ */}
                    {rfq && (
                        <InfoRow
                            label="RFQ"
                            value={
                                <div className="flex flex-col text-right">
                                    <span className="font-semibold">
                                        {rfq.projectName || "RFQ Linked"}
                                    </span>
                                    <span className="text-xs text-gray-700">
                                        Project No: {rfq.projectNumber || "N/A"} · Bid:{" "}
                                        {rfq.bidPrice || "-"}
                                    </span>
                                </div>
                            }
                        />
                    )}

          {/* Tools */}
          {tools && <InfoRow label="Tools" value={tools} />}

                    {/* Description */}
                    {description && (
                        <InfoRow
                            label="Description"
                            value={<span>{truncateText(description, 60)}</span>}
                        />
                    )}

                    {/* Created By */}
                    {createdBy && (
                        <InfoRow
                            label="Created By"
                            value={
                                <span>
                                    {createdBy.firstName} {createdBy.lastName} (
                                    {createdBy.username || createdBy.email || "N/A"})
                                </span>
                            }
                        />
                    )}
                </div>

                {/* Right Column */}
                <div className="space-y-3">
                    <InfoRow label="Estimate Date" value={formatDate(estimateDate)} />
                    <InfoRow
                        label="Start Date"
                        value={startDate ? formatDate(startDate) : "N/A"}
                    />
                    <InfoRow label="Created" value={formatDateTime(createdAt)} />
                    <InfoRow label="Updated" value={formatDateTime(updatedAt)} />
                    <InfoRow
                        label="Total Agreed Hours"
                        value={formatHours(totalAgreatedHours)}
                    />
                    <InfoRow label="Final Hours" value={formatHours(finalHours)} />
                    <InfoRow
                        label="Final Weeks"
                        value={finalWeeks != null ? finalWeeks : "N/A"}
                    />
                    <InfoRow
                        label="Final Price"
                        value={
                            finalPrice != null ? `$${finalPrice.toLocaleString()}` : "N/A"
                        }
                    />
                </div>
            </div>

            {/* Files Section */}
            <RenderFiles
                files={files || []}
                table="estimation"
                parentId={id}
                formatDate={formatDate}
            />

            {/* Action Buttons (placeholders for future edit/view actions) */}
            <div className="py-3 flex gap-3">
                <Button
                    className="py-1 px-2 text-md rounded-xl"
                    onClick={() => setIsEstimationTaskOpen(!isEstimationTaskOpen)}
                >
                    Estimation Task
                </Button>
                <Button
                    className="py-1 px-2 text-md rounded-xl"
                    onClick={() => setIsHoursOpen(!isHoursOpen)}
                >
                    Estimated Hours/Weeks
                </Button>
                <Button
                    className="py-1 px-2 text-md rounded-xl"
                    onClick={() => setIsInclusionOpen(!isInclusionOpen)}
                >
                    Inclusion/Exclusion
                </Button>
                {/* <Button className="py-1 px-2 text-lg bg-blue-100 text-blue-700">
          Add To Project
        </Button> */}
                <Button
                    className="py-1 px-2 text-md rounded-xl"
                    onClick={() => setIsEditing(!isEditing)}
                >
                    Edit Estimation
                </Button>
            </div>
            {isEstimationTaskOpen && (
                <AllEstimationTask
                    estimationId={estimation?.id || ""}
                    onRefresh={fetchEstimation}
                    // Many APIs return tasks either nested under `tasks` or `estimationTasks`
                    // Fallback to an empty array to avoid runtime errors.
                    estimations={
                        Array.isArray(estimation?.tasks)
                            ? estimation.tasks
                            : Array.isArray(estimation?.estimationTasks)
                                ? estimation.estimationTasks
                                : []
                    }
                    onClose={() => setIsEstimationTaskOpen(false)}
                />
            )}
            {isHoursOpen && (
                <div className="mt-6 border-t pt-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-bold text-gray-700">
                            Estimated Hours/Weeks
                        </h3>
                        <button
                            onClick={() => setIsHoursOpen(false)}
                            className="text-gray-700 hover:text-gray-700 bg-gray-100 hover:bg-gray-200 px-3 py-1 rounded-md text-sm transition-colors"
                        >
                            Close
                        </button>
                    </div>
                    <LineItemGroup estimationId={estimation?.id} />
                </div>
            )}
            {isInclusionOpen && (
                <div className="mt-6 border-t pt-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-bold text-gray-700">
                            Inclusion/Exclusion
                        </h3>
                        <button
                            onClick={() => setIsInclusionOpen(false)}
                            className="text-gray-700 hover:text-gray-700 bg-gray-100 hover:bg-gray-200 px-3 py-1 rounded-md text-sm transition-colors"
                        >
                            Close
                        </button>
                    </div>
                    {isEditingInclusion ? (
                        <EditInclusionExclusion
                            estimationId={estimation?.id || ""}
                            onCancel={() => setIsEditingInclusion(false)}
                            onSuccess={() => {
                                setIsEditingInclusion(false);
                                fetchEstimation();
                            }}
                        />
                    ) : (
                        <InclusionExclusion
                            estimationId={estimation?.id || ""}
                            onEdit={() => setIsEditingInclusion(true)}
                        />
                    )}
                </div>
            )}
            {isEditing && (
                <EditEstimation
                    id={id}
                    onSuccess={() => {
                        setIsEditing(false);
                        fetchEstimation();
                        onRefresh?.();
                    }}
                    onCancel={() => setIsEditing(false)}
                />
            )}
        </div>
    );
};

// Reusable Info Row
const InfoRow = ({
    label,
    value,
}) => (
    <div className="flex justify-between gap-3">
        <span className="font-bold text-gray-700">{label}:</span>
        <span className="text-gray-700 text-right wrap-break-words">{value}</span>
    </div>
);

export default GetEstimationByID;
