/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
import { Loader2, AlertCircle, FileText, Link2 } from "lucide-react";
import Service from "../../api/Service";
import Button from "../fields/Button";
import { openFileSecurely } from "../../utils/openFileSecurely";
import AllEstimationTask from "./estimationTask/AllEstimationTask";



const truncateText = (text, max = 40) =>
  text.length > max ? text.substring(0, max) + "..." : text;

const GetEstimationByID = ({ id }) => {
  const [estimation, setEstimation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEstimationTaskOpen, setIsEstimationTaskOpen] = useState(false);

  useEffect(() => {
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

    fetchEstimation();
  }, [id]);

  const formatDateTime = (date) =>
    new Date(date).toLocaleString("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
    });

  const formatDate = (date) =>
    date
      ? new Date(date).toLocaleDateString("en-IN", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
      : "N/A";

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8 text-gray-500">
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
    files,
  } = estimation;

  const statusColor =
    status === "DRAFT"
      ? "bg-yellow-100 text-yellow-800"
      : status === "COMPLETED"
        ? "bg-green-100 text-green-800"
        : "bg-blue-100 text-blue-800";

  return (
    <div className="bg-gradient-to-br from-teal-50 to-teal-50 p-6 rounded-xl shadow-inner text-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-xl font-bold text-teal-800">
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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
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
                  <span className="text-xs text-gray-500">
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
          <InfoRow
            label="Estimate Date"
            value={formatDate(estimateDate)}
          />
          <InfoRow label="Start Date" value={formatDate(startDate)} />
          <InfoRow
            label="Created"
            value={formatDateTime(createdAt)}
          />
          <InfoRow
            label="Updated"
            value={formatDateTime(updatedAt)}
          />
          <InfoRow
            label="Final Hours"
            value={finalHours != null ? finalHours : "N/A"}
          />
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
      {Array.isArray(files) && files.length > 0 && (
        <div className="mt-6 pt-5 border-t border-teal-200">
          <h4 className="font-semibold text-teal-700 mb-2 flex items-center gap-1">
            <FileText className="w-4 h-4" /> Files
          </h4>
          <ul className="text-gray-700 space-y-1">
            {files.map((file) => (
              <li
                key={file.id}
                className="flex justify-between items-center bg-white px-3 py-2 rounded-md shadow-sm"
              >
                <span>{file.originalName}</span>
                <button
                  type="button"
                  className="text-teal-600 text-sm flex items-center gap-1 hover:underline cursor-pointer"
                  onClick={() => openFileSecurely("estimation", id, file.id)}
                >
                  <Link2 className="w-3 h-3" /> Open
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Action Buttons (placeholders for future edit/view actions) */}
      <div className="py-3 flex gap-3">
        <Button
          className="py-1 px-2 text-lg bg-red-200 text-red-700"
          onClick={() => setIsEstimationTaskOpen(true)}
        >
          Estimation Task
        </Button>
        <Button className="py-1 px-2 text-lg bg-blue-100 text-blue-700">
          View RFQ
        </Button>
        <Button className="py-1 px-2 text-lg bg-blue-100 text-blue-700">
          Add To Project
        </Button>
        <Button className="py-1 px-2 text-lg">Edit Estimation</Button>
      </div>
      {isEstimationTaskOpen && (
        <AllEstimationTask
          estimation={estimation}
          onClose={() => setIsEstimationTaskOpen(false)}
        />
      )}
    </div>
  );
};

// ✅ Reusable Info Row
const InfoRow = ({
  label,
  value,
}) => (
  <div className="flex justify-between gap-3">
    <span className="font-bold text-gray-600">{label}:</span>
    <span className="text-gray-900 text-right break-words">{value}</span>
  </div>
);

export default GetEstimationByID;
