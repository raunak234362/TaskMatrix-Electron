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
import DataTable from "../ui/table";

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
  const [responseTypeFilter, setResponseTypeFilter] = useState("ALL");
  const [selectedResponse, setSelectedResponse] = useState(null);

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

  const filteredResponses = useMemo(() => {
    const resps = estimation?.responses || [];
    if (responseTypeFilter === "ALL") return resps;
    return resps.filter(
      (resp) => (resp.type || "DETAILING").toUpperCase() === responseTypeFilter
    );
  }, [estimation?.responses, responseTypeFilter]);

  const responseColumns = useMemo(
    () => [
      {
        accessorKey: "type",
        header: "Type",
        cell: ({ row }) => {
          const type = row.original.type || "DETAILING";
          return (
            <span
              className={`px-2 py-0.5 text-xs font-semibold border rounded-none uppercase ${
                type.toUpperCase() === "DETAILING"
                  ? "bg-blue-50 text-blue-700 border-blue-200"
                  : "bg-purple-50 text-purple-700 border-purple-200"
              }`}
            >
              {type}
            </span>
          );
        },
      },
      {
        accessorKey: "message",
        header: "Message",
        cell: ({ row }) => {
          const htmlContent = row.original.message || "";
          const plainText = htmlContent
            .replace(/<[^>]+>/g, "")
            .replace(/&nbsp;/g, " ");
          return (
            <p className="truncate max-w-[250px] text-black text-sm" title={plainText}>
              {plainText}
            </p>
          );
        },
      },
      {
        accessorKey: "createdAt",
        header: "Created",
        cell: ({ row }) => (
          <span className="text-black text-sm">
            {new Date(row.original.createdAt).toLocaleString("en-IN")}
          </span>
        ),
      },
    ],
    []
  );

  if (loading) {
    return (
      <div className="fixed inset-0 z-[10001] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
        <div className="bg-white rounded-none px-8 py-6 shadow-2xl border border-slate-200 flex items-center gap-4">
          <Loader2 className="animate-spin text-black" />
          <div>
            <h3 className="text-sm font-semibold text-black">
              Loading Estimation
            </h3>
            <p className="text-sm text-black">
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
        <div className="bg-white rounded-none p-8 shadow-2xl border border-slate-200 w-full max-w-md">
          <div className="flex items-start gap-4">
            <div className="bg-red-100 p-3 rounded-none">
              <AlertCircle className="text-red-600" />
            </div>

            <div className="flex-1">
              <h2 className="text-sm font-semibold text-black">
                Unable to Load
              </h2>

              <p className="text-sm text-black mt-1">
                {error || "Estimation not found"}
              </p>

              {onClose && (
                <button
                  onClick={onClose}
                  className="mt-5 px-6 py-1.5 bg-red-50 text-black border-2 border-red-700/80 rounded-none hover:bg-red-100 transition-all font-bold text-sm uppercase tracking-tight shadow-sm"
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
      <div className="w-full max-w-[95vw] h-[95vh] bg-slate-50 rounded-none shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
        {/* HEADER */}
        <div className="bg-white border-b border-slate-200 px-8 py-6 shrink-0">
          <div className="flex items-center justify-between gap-5">
            <div className="min-w-0">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-3xl font-bold text-black truncate">
                  {projectName}
                </h1>

                <span
                  className={`px-3 py-1 border text-xs font-semibold rounded-none shrink-0 ${statusStyles}`}
                >
                  {status}
                </span>
              </div>

              <p className="text-sm text-black font-medium mt-1 truncate">
                {estimationNumber}
              </p>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <button
                onClick={() => setShowResponseModal(true)}
                className="px-6 py-1.5 bg-green-50 text-black border-2 border-green-700/80 rounded-none hover:bg-green-100 transition-all font-bold text-sm uppercase tracking-tight shadow-sm flex items-center gap-2"
              >
                <Plus size={14} />
                Add Response
              </button>

              {canManage && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="px-6 py-1.5 bg-green-50 text-black border-2 border-green-700/80 rounded-none hover:bg-green-100 transition-all font-bold text-sm uppercase tracking-tight shadow-sm flex items-center gap-2"
                >
                  <Pencil size={14} />
                  Edit
                </button>
              )}

              {onClose && (
                <button
                  onClick={onClose}
                  className="px-6 py-1.5 bg-red-50 text-black border-2 border-red-700/80 rounded-none hover:bg-red-100 transition-all font-bold text-sm uppercase tracking-tight shadow-sm"
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
              label="Aggregated Hours"
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
                className={`prose prose-sm max-w-none text-black transition-all ${
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
                className="mt-4 text-sm font-semibold text-black hover:text-black flex items-center gap-2"
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
          <div className="bg-white border border-slate-200 rounded-none overflow-hidden">
            <div className="border-b border-slate-200 px-4 pt-4">
              <div className="flex gap-2 overflow-x-auto pb-4">
                {tabs.map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`flex items-center gap-2.5 border-2 px-6 py-2.5 text-sm rounded-none font-bold uppercase tracking-tight transition-all whitespace-nowrap shadow-sm active:scale-95 ${
                      activeTab === tab
                        ? "bg-green-50 text-black border-green-700/80"
                        : "text-black bg-white border-gray-300 hover:bg-gray-50"
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
                  {/* Filter Toggle Buttons */}
                  <div className="flex justify-end mb-4">
                    <div className="inline-flex border border-black rounded-none p-0.5 bg-white">
                      {["ALL", "DETAILING", "MTO"].map((filterType) => (
                        <button
                          key={filterType}
                          onClick={() => setResponseTypeFilter(filterType)}
                          className={`px-5 py-1.5 text-xs font-bold uppercase tracking-tight transition-all rounded-none border ${
                            responseTypeFilter === filterType
                              ? "bg-green-50 text-black border-green-700/80"
                              : "bg-white text-black border-transparent hover:bg-slate-50"
                          }`}
                        >
                          {filterType}
                        </button>
                      ))}
                    </div>
                  </div>

                  {filteredResponses.length === 0 ? (
                    <EmptyState text="No responses match this filter." />
                  ) : (
                    <div className="bg-white border border-slate-200 rounded-none">
                      <DataTable
                        columns={responseColumns}
                        data={filteredResponses}
                        onRowClick={(row) => setSelectedResponse(row)}
                      />
                    </div>
                  )}
                </>
              )}

              {/* OVERVIEW */}
              {activeTab === "overview" && (
                <div className="text-sm text-black">
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

      {selectedResponse && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-none shadow-2xl border border-gray-200 overflow-hidden animate-in fade-in zoom-in duration-200 w-full max-w-4xl flex flex-col max-h-[90vh]">
            {/* Header */}
            <header className="flex items-center justify-between p-6 border-b border-gray-200 bg-white shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-1.5 h-6 bg-[#6bbd45] rounded-none" />
                <h1 className="text-sm font-semibold text-black uppercase tracking-normal">Response Details</h1>
              </div>
              <button
                onClick={() => setSelectedResponse(null)}
                className="px-6 py-1.5 bg-red-50 text-black border-2 border-red-700/80 rounded-none hover:bg-red-100 transition-all font-semibold text-sm uppercase tracking-normal shadow-sm cursor-pointer"
              >
                Close
              </button>
            </header>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-gray-50/50">
              <div className="bg-white p-6 rounded-none border border-gray-200 space-y-6 shadow-sm">
                {/* Metadata Box at the Top */}
                <div className="bg-[#ebf5ea]/80 border border-[#6bbd45]/20 p-4 rounded-none">
                  <div className="flex flex-col sm:flex-row gap-4 sm:gap-16 text-sm">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-black uppercase tracking-normal shrink-0">
                        Type:
                      </span>
                      <span className="text-black font-semibold uppercase whitespace-nowrap">
                        {selectedResponse.type || "DETAILING"}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-black uppercase tracking-normal shrink-0">
                        Created At:
                      </span>
                      <span className="text-black font-semibold uppercase whitespace-nowrap">
                        {new Date(selectedResponse.createdAt).toLocaleString("en-IN")}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Response Message */}
                <div className="pt-2">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-1.5 h-6 bg-[#6bbd45] rounded-none" />
                    <h2 className="text-sm font-semibold text-black tracking-normal uppercase">Response Message</h2>
                  </div>
                  <div
                    className="text-sm text-black font-normal prose prose-sm max-w-none bg-white p-4 border border-gray-200 rounded-none mt-4"
                    dangerouslySetInnerHTML={{ __html: selectedResponse.message || "No description provided" }}
                  />
                </div>

                {/* Attachments Section */}
                {selectedResponse.files?.length > 0 && (
                  <div className="pt-6 border-t border-gray-200 space-y-4">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-1.5 h-6 bg-[#6bbd45] rounded-none" />
                      <h2 className="text-sm font-semibold text-black tracking-normal uppercase">Attachments</h2>
                    </div>
                    <RenderFiles
                      files={selectedResponse.files}
                      table="estimationResponse"
                      parentId={selectedResponse.id}
                      hideHeader={true}
                      hideSectionTitle={true}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/*                                  COMPONENTS                                */
/* -------------------------------------------------------------------------- */

const MetricCard = ({ icon, label, value }) => {
  return (
    <div className="bg-white py-8 px-6 rounded-none border border-slate-200 border-l-[6px] border-l-green-600 flex items-center justify-between shadow-sm">
      <div className="flex items-center gap-3">
        
        <span className="text-lg font-bold text-black uppercase tracking-tight">
          {label}
        </span>
      </div>
      <span className="text-xl font-bold text-black">
        {value}
      </span>
    </div>
  );
};

const SectionCard = ({ title, children }) => {
  return (
    <div className="bg-white border border-slate-200 rounded-none p-6 shadow-sm">
      <div className="mb-5 border-l-[4px] border-l-green-600 pl-3">
        <h2 className="text-lg font-bold text-black uppercase tracking-wider">
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
          <span className="text-black">
            {icon}
          </span>
        )}

        <span className="text-sm font-medium text-black">
          {label}
        </span>
      </div>

      <div className="text-sm font-semibold text-black text-right break-words">
        {value}
      </div>
    </div>
  );
};

const EmptyState = ({ text }) => {
  return (
    <div className="py-16 flex flex-col items-center justify-center text-center">
      <div className="w-16 h-16 rounded-none bg-slate-100 flex items-center justify-center mb-4">
        <MessageSquare className="text-black" />
      </div>

      <p className="text-black text-sm">
        {text}
      </p>
    </div>
  );
};

export default GetEstimationByID;