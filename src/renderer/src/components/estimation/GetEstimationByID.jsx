import { useEffect, useMemo, useState } from "react";
import {
  Loader2,
  AlertCircle,
  MessageSquare,
  CalendarDays,
  Clock3,
  IndianRupee,
  BriefcaseBusiness,
  User2,
  FileText,
  Pencil,
  Plus,
  X,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

import Service from "../../api/Service";
import Button from "../fields/Button";

import AllEstimationTask from "./estimationTask/AllEstimationTask";
import LineItemGroup from "./estimationLineItem/LineItemGroup";
import InclusionExclusion from "./InclusionExclusion";
import EditInclusionExclusion from "./EditInclusionExclusion";
import EditEstimation from "./EditEstimation";
import EstimationResponseModal from "./EstimationResponseModal";

import RenderFiles from "../ui/RenderFiles";

const tabs = [
  "overview",
  "tasks",
  "hours",
  "inclusion",
  "responses",
];

const GetEstimationByID = ({ id, onRefresh, onClose }) => {
  const [estimation, setEstimation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [activeTab, setActiveTab] = useState("overview");

  const [showDescription, setShowDescription] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isEditingInclusion, setIsEditingInclusion] = useState(false);
  const [showResponseModal, setShowResponseModal] = useState(false);

  const userRole =
    sessionStorage.getItem("userRole")?.toLowerCase() || "";

  const canManage =
    userRole === "admin" || userRole === "estimation_head";

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

      setEstimation(response?.data);
    } catch (err) {
      console.error(err);
      setError("Failed to load estimation details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEstimation();
  }, [id]);

  const formatDate = (date) =>
    date
      ? new Date(date).toLocaleDateString("en-IN", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        })
      : "N/A";

  const formatDateTime = (date) =>
    date
      ? new Date(date).toLocaleString("en-IN", {
          dateStyle: "medium",
          timeStyle: "short",
        })
      : "N/A";

  const formatHours = (hours) => {
    if (hours == null || hours === "") return "N/A";

    const numHours =
      typeof hours === "string"
        ? parseFloat(hours)
        : hours;

    if (isNaN(numHours)) return "N/A";

    const h = Math.floor(numHours);
    const m = Math.round((numHours - h) * 60);

    return `${h}h ${m.toString().padStart(2, "0")}m`;
  };

  const statusStyles = useMemo(() => {
    switch (estimation?.status) {
      case "COMPLETED":
        return "bg-emerald-100 text-emerald-700 border-emerald-200";
      case "DRAFT":
        return "bg-amber-100 text-amber-700 border-amber-200";
      default:
        return "bg-blue-100 text-blue-700 border-blue-200";
    }
  }, [estimation]);

  if (loading) {
    return (
      <div className="fixed inset-0 z-[10001] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl px-8 py-6 shadow-2xl border border-slate-200 flex items-center gap-4">
          <Loader2 className="animate-spin text-slate-700" />
          <div>
            <h3 className="font-semibold text-slate-900">
              Loading Estimation
            </h3>
            <p className="text-sm text-slate-500">
              Please wait while we fetch the details.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !estimation) {
    return (
      <div className="fixed inset-0 z-[10001] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl p-8 shadow-2xl border border-slate-200 w-full max-w-md">
          <div className="flex items-start gap-4">
            <div className="bg-red-100 p-3 rounded-2xl">
              <AlertCircle className="text-red-600" />
            </div>

            <div className="flex-1">
              <h2 className="font-semibold text-slate-900">
                Unable to Load
              </h2>

              <p className="text-sm text-slate-500 mt-1">
                {error || "Estimation not found"}
              </p>

              {onClose && (
                <button
                  onClick={onClose}
                  className="mt-5 px-5 py-2 rounded-xl bg-slate-900 text-white hover:bg-slate-800 transition"
                >
                  Close
                </button>
              )}
            </div>
          </div>
        </div>
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
    files,
    responses: estimationResponses = [],
  } = estimation;

  return (
    <div className="fixed inset-0 z-[10001] bg-black/40 backdrop-blur-sm flex items-center justify-center p-3">
      <div className="w-full max-w-7xl h-[95vh] bg-slate-50 rounded-[32px] shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
        {/* HEADER */}
        <div className="bg-white border-b border-slate-200 px-8 py-6 shrink-0">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
            <div>
              <p className="text-sm text-slate-500 font-medium">
                Estimations / {estimationNumber}
              </p>

              <div className="flex items-center gap-3 mt-1 flex-wrap">
                <h1 className="text-3xl font-bold text-slate-900">
                  {projectName}
                </h1>

                <span
                  className={`px-3 py-1 rounded-full border text-xs font-semibold ${statusStyles}`}
                >
                  {status}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              <button
                onClick={() => setShowResponseModal(true)}
                className="px-5 py-2 bg-white text-black border-2 border-gray-800 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all hover:bg-gray-50 shadow-sm flex items-center gap-2"
              >
                <Plus size={14} />
                Add Response
              </button>

              {canManage && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="px-5 py-2 bg-white text-black border-2 border-gray-800 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all hover:bg-gray-50 shadow-sm flex items-center gap-2"
                >
                  <Pencil size={14} />
                  Edit
                </button>
              )}

              {onClose && (
                <button
                  onClick={onClose}
                  className="px-4 py-2 bg-red-100 text-black border-2 border-red-600 rounded-xl hover:bg-red-50 transition-all font-bold text-[12px] uppercase tracking-widest shadow-sm"
                >
                  Close
                </button>
              )}
            </div>
          </div>
        </div>

        {/* BODY */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* METRICS */}
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
            <MetricCard
              icon={<Clock3 size={18} />}
              label="Final Hours"
              value={formatHours(finalHours)}
            />

            <MetricCard
              icon={<CalendarDays size={18} />}
              label="Final Weeks"
              value={finalWeeks || "N/A"}
            />

            <MetricCard
              icon={<IndianRupee size={18} />}
              label="Final Price"
              value={
                finalPrice != null
                  ? `₹${finalPrice.toLocaleString()}`
                  : "N/A"
              }
            />

            <MetricCard
              icon={<Clock3 size={18} />}
              label="Agreated Hours"
              value={formatHours(totalAgreatedHours)}
            />
          </div>

          {/* DETAILS */}
          <div className="grid lg:grid-cols-2 gap-6">
            {/* LEFT */}
            <SectionCard title="Project Information">
              <InfoRow
                icon={<BriefcaseBusiness size={16} />}
                label="Fabricator"
                value={
                  fabricators?.fabName ||
                  fabricatorName ||
                  "N/A"
                }
              />

              <InfoRow
                icon={<FileText size={16} />}
                label="Tools"
                value={tools || "N/A"}
              />

              <InfoRow
                icon={<User2 size={16} />}
                label="Created By"
                value={
                  createdBy
                    ? `${createdBy.firstName} ${createdBy.lastName}`
                    : "N/A"
                }
              />

              {rfq && (
                <InfoRow
                  icon={<FileText size={16} />}
                  label="RFQ"
                  value={`${rfq.projectName || "RFQ"} • ${
                    rfq.projectNumber || "N/A"
                  }`}
                />
              )}
            </SectionCard>

            {/* RIGHT */}
            <SectionCard title="Timeline">
              <InfoRow
                label="Estimate Date"
                value={formatDate(estimateDate)}
              />

              <InfoRow
                label="Start Date"
                value={formatDate(startDate)}
              />

              <InfoRow
                label="Created"
                value={formatDateTime(createdAt)}
              />

              <InfoRow
                label="Updated"
                value={formatDateTime(updatedAt)}
              />
            </SectionCard>
          </div>

          {/* DESCRIPTION */}
          {description && (
            <SectionCard title="Description">
              <div
                className={`prose prose-sm max-w-none text-slate-700 transition-all ${
                  showDescription
                    ? ""
                    : "line-clamp-3"
                }`}
                dangerouslySetInnerHTML={{
                  __html: description,
                }}
              />

              <button
                onClick={() =>
                  setShowDescription(!showDescription)
                }
                className="mt-4 text-sm font-medium text-slate-700 hover:text-slate-900 flex items-center gap-2"
              >
                {showDescription ? (
                  <>
                    <ChevronUp size={16} />
                    Show Less
                  </>
                ) : (
                  <>
                    <ChevronDown size={16} />
                    Read More
                  </>
                )}
              </button>
            </SectionCard>
          )}

          {/* FILES */}
          <SectionCard title="Attachments">
            <RenderFiles
              files={files || []}
              table="estimation"
              parentId={id}
              formatDate={formatDate}
            />
          </SectionCard>

          {/* TABS */}
          <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden">
            <div className="border-b border-slate-200 px-4 pt-4">
              <div className="flex gap-2 overflow-x-auto pb-4">
                {tabs.map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`flex items-center gap-2.5 border-2 px-6 py-2.5 text-[12px] rounded-xl font-black uppercase tracking-widest transition-all whitespace-nowrap shadow-sm active:scale-95 ${
                      activeTab === tab
                        ? "bg-green-50 text-black border-[#6bbd45]"
                        : "text-black bg-white border-gray-800 hover:bg-gray-50"
                    }`}
                  >
                    {tab}
                    {tab === "responses" &&
                      ` (${estimationResponses.length})`}
                  </button>
                ))}
              </div>
            </div>

            <div className="p-6">
              {/* TASKS */}
              {activeTab === "tasks" && (
                <>
                  {canManage ? (
                    <AllEstimationTask
                      estimationId={estimation?.id || ""}
                      onRefresh={fetchEstimation}
                      estimations={
                        Array.isArray(estimation?.tasks)
                          ? estimation.tasks
                          : Array.isArray(
                              estimation?.estimationTasks
                            )
                          ? estimation.estimationTasks
                          : []
                      }
                    />
                  ) : (
                    <EmptyState text="You don't have permission to access tasks." />
                  )}
                </>
              )}

              {/* HOURS */}
              {activeTab === "hours" && (
                <LineItemGroup
                  estimationId={estimation?.id}
                />
              )}

              {/* INCLUSION */}
              {activeTab === "inclusion" && (
                <>
                  {isEditingInclusion ? (
                    <EditInclusionExclusion
                      estimationId={estimation?.id || ""}
                      onCancel={() =>
                        setIsEditingInclusion(false)
                      }
                      onSuccess={() => {
                        setIsEditingInclusion(false);
                        fetchEstimation();
                      }}
                    />
                  ) : (
                    <InclusionExclusion
                      estimationId={estimation?.id || ""}
                      onEdit={() =>
                        setIsEditingInclusion(true)
                      }
                    />
                  )}
                </>
              )}

              {/* RESPONSES */}
              {activeTab === "responses" && (
                <>
                  {estimationResponses.length === 0 ? (
                    <EmptyState text="No responses added yet." />
                  ) : (
                    <div className="space-y-5">
                      {estimationResponses.map(
                        (resp, index) => (
                          <div
                            key={resp.id}
                            className="bg-slate-50 border border-slate-200 rounded-3xl p-5"
                          >
                            <div className="flex items-start justify-between gap-4 mb-4">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-2xl bg-blue-100 flex items-center justify-center">
                                  <MessageSquare
                                    size={18}
                                    className="text-blue-700"
                                  />
                                </div>

                                <div>
                                  <h4 className="font-semibold text-slate-900">
                                    Response #{index + 1}
                                  </h4>

                                  <p className="text-xs text-slate-500">
                                    {formatDateTime(
                                      resp.createdAt
                                    )}
                                  </p>
                                </div>
                              </div>
                            </div>

                            {resp.message && (
                              <div
                                className="prose prose-sm max-w-none text-slate-700"
                                dangerouslySetInnerHTML={{
                                  __html: resp.message,
                                }}
                              />
                            )}

                            {resp.files?.length > 0 && (
                              <div className="mt-5">
                                <RenderFiles
                                  files={resp.files}
                                  table="estimationResponse"
                                  parentId={resp.id}
                                  formatDate={formatDate}
                                />
                              </div>
                            )}
                          </div>
                        )
                      )}
                    </div>
                  )}
                </>
              )}

              {/* OVERVIEW */}
              {activeTab === "overview" && (
                <div className="text-sm text-slate-500">
                  Overview information is displayed above.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* STICKY FOOTER */}
        {/* <div className="bg-white border-t border-slate-200 px-6 py-4 flex items-center justify-end gap-3 shrink-0">
          <button
            onClick={() => setShowResponseModal(true)}
            className="px-5 py-2 bg-white text-black border-2 border-gray-800 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all hover:bg-gray-50 shadow-sm flex items-center gap-2"
          >
            <Plus size={14} />
            Add Response
          </button>

          {onClose && (
            <button
              onClick={onClose}
              className="px-10 py-2 bg-white text-red-600 border-2 border-red-600 rounded-xl hover:bg-red-50 transition-all font-black text-[12px] uppercase tracking-widest shadow-sm"
            >
              Close
            </button>
          )}
        </div> */}
      </div>

      {/* MODALS */}
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

      {showResponseModal && (
        <EstimationResponseModal
          estimationId={id}
          onClose={() =>
            setShowResponseModal(false)
          }
          onSuccess={fetchEstimation}
        />
      )}
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/*                                  COMPONENTS                                */
/* -------------------------------------------------------------------------- */

const MetricCard = ({ icon, label, value }) => {
  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="w-11 h-11 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-700">
          {icon}
        </div>
      </div>

      <div className="mt-5">
        <p className="text-sm text-slate-500">
          {label}
        </p>

        <h3 className="mt-1 text-2xl font-bold text-slate-900">
          {value}
        </h3>
      </div>
    </div>
  );
};

const SectionCard = ({ title, children }) => {
  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
      <div className="mb-5">
        <h2 className="text-lg font-semibold text-slate-900">
          {title}
        </h2>
      </div>

      {children}
    </div>
  );
};

const InfoRow = ({
  label,
  value,
  icon,
}) => {
  return (
    <div className="flex items-start justify-between gap-4 py-4 border-b border-slate-100 last:border-none">
      <div className="flex items-center gap-2 min-w-[140px]">
        {icon && (
          <span className="text-slate-400">
            {icon}
          </span>
        )}

        <span className="text-sm font-medium text-slate-500">
          {label}
        </span>
      </div>

      <div className="text-sm font-semibold text-slate-900 text-right break-words">
        {value}
      </div>
    </div>
  );
};

const EmptyState = ({ text }) => {
  return (
    <div className="py-16 flex flex-col items-center justify-center text-center">
      <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
        <MessageSquare className="text-slate-500" />
      </div>

      <p className="text-slate-500 text-sm">
        {text}
      </p>
    </div>
  );
};

export default GetEstimationByID;