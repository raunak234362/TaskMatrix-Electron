import { useEffect, useState } from "react";
import { Loader2, AlertCircle, FileText, Link2, ChevronDown, Calendar, Clock, User, Wrench, Hash, Layout } from "lucide-react";
import Service from "../../api/Service";
import Button from "../fields/Button";
import { openFileSecurely } from "../../utils/openFileSecurely";
import AllEstimationTask from "./estimationTask/AllEstimationTask";
import AddEstimation from "./AddEstimation";
import Modal from "../ui/Modal";
import LineItemGroup from "./estimationLineItem/LineItemGroup";

const truncateText = (text, max) =>
  text?.length > max ? text.substring(0, max) + "..." : text || "";

const GetEstimationByID = ({ id }) => {
  const [estimation, setEstimation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEstimationTaskOpen, setIsEstimationTaskOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isLineItemGroupOpen, setIsLineItemGroupOpen] = useState(false);

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
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      })
      : "N/A";

  const formatDate = (date) =>
    date
      ? new Date(date).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
      : "N/A";

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-gray-400">
        <Loader2 className="w-10 h-10 animate-spin mb-4 text-[#6bbd45]" />
        <p className="text-sm font-medium tracking-wider uppercase">Loading estimation details...</p>
      </div>
    );
  }

  if (error || !estimation) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-red-500">
        <AlertCircle className="w-10 h-10 mb-4" />
        <p className="text-sm font-bold tracking-wider uppercase">{error || "Estimation not found"}</p>
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

  const statusStyles = {
    DRAFT: "bg-amber-50 text-amber-600 border-amber-100",
    COMPLETED: "bg-emerald-50 text-emerald-600 border-emerald-100",
    PENDING: "bg-blue-50 text-blue-600 border-blue-100",
    APPROVED: "bg-indigo-50 text-indigo-600 border-indigo-100",
  };

  const currentStatusStyle = statusStyles[status] || "bg-gray-50 text-gray-600 border-gray-100";

  return (
    <div className="w-full font-sans antialiased text-gray-900">
      {/* Top Bar - Minimalist & Professional */}
      <div className="flex items-center justify-between px-6 py-3 bg-white border-b border-gray-100 shadow-sm sticky top-0 z-10">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 px-3 py-1 bg-gray-900 text-white rounded-md text-[10px] font-bold tracking-widest uppercase">
            <Hash className="w-3 h-3" />
            <span>{estimationNumber}</span>
          </div>
          <div className="h-4 w-px bg-gray-200"></div>
          <h2 className="text-sm font-bold text-gray-800 tracking-tight">{projectName}</h2>
        </div>
        <div className="flex items-center gap-6 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${status === 'DRAFT' ? 'bg-amber-400' : 'bg-emerald-400'}`}></div>
            <span>{status}</span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="w-3.5 h-3.5" />
            <span>{formatDate(estimateDate)}</span>
          </div>
          <button className="p-1 hover:bg-gray-100 rounded-full transition-colors">
            <ChevronDown className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="p-6 bg-gray-50/50 min-h-screen">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Hero Card */}
          <div className="bg-white border border-gray-200 rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300">
            <div className="p-8 md:p-10">
              <div className="flex flex-col md:flex-row justify-between items-start gap-6 mb-10">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-[10px] font-black text-[#6bbd45] uppercase tracking-[0.2em]">Estimation Details</span>
                    <div className="h-px w-12 bg-[#6bbd45]/30"></div>
                  </div>
                  <h1 className="text-4xl font-black text-gray-900 tracking-tighter mb-1">
                    Estimation <span className="text-[#6bbd45]">##{estimationNumber}</span>
                  </h1>
                  <p className="text-gray-500 font-medium flex items-center gap-2">
                    <Layout className="w-4 h-4" />
                    Project: <span className="text-gray-900 font-bold">{projectName}</span>
                  </p>
                </div>
                <div className={`px-4 py-1.5 rounded-xl border text-[11px] font-black uppercase tracking-widest shadow-sm ${currentStatusStyle}`}>
                  {status}
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
                {/* Left Column - Core Info */}
                <div className="space-y-8">
                  <div className="grid grid-cols-1 gap-6">
                    <RefinedInfoRow
                      icon={<User className="w-4 h-4" />}
                      label="Fabricator"
                      value={fabricators?.fabName || fabricatorName || "N/A"}
                    />
                    <RefinedInfoRow
                      icon={<FileText className="w-4 h-4" />}
                      label="RFQ Reference"
                      value={
                        <div className="flex flex-col items-end">
                          <span className="font-bold text-gray-900 leading-tight">
                            {rfq?.projectName || projectName}
                          </span>
                          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter mt-1">
                            ID: #{rfq?.projectNumber || "001"} · Bid: <span className="text-[#6bbd45]">${rfq?.bidPrice?.toLocaleString() || "20,000"}</span>
                          </span>
                        </div>
                      }
                    />
                    <RefinedInfoRow
                      icon={<Wrench className="w-4 h-4" />}
                      label="Tools & Software"
                      value={tools || "N/A"}
                    />
                    <RefinedInfoRow
                      icon={<Layout className="w-4 h-4" />}
                      label="Description"
                      value={
                        <div
                          dangerouslySetInnerHTML={{ __html: description || "N/A" }}
                          className="text-right text-gray-600 text-sm leading-relaxed max-w-xs ml-auto"
                        />
                      }
                    />
                    <RefinedInfoRow
                      icon={<User className="w-4 h-4" />}
                      label="Created By"
                      value={
                        <div className="flex items-center gap-2 justify-end">
                          <span className="font-bold text-gray-900">{createdBy?.firstName || "Raunak"} {createdBy?.lastName || "Srivastava"}</span>
                          <span className="text-[10px] px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded font-bold uppercase">{createdBy?.username || "ADMIN"}</span>
                        </div>
                      }
                    />
                  </div>
                </div>

                {/* Right Column - Metrics & Timeline */}
                <div className="bg-gray-50/50 rounded-2xl p-6 border border-gray-100 space-y-6">
                  <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4">Timeline & Metrics</h4>
                  <div className="grid grid-cols-1 gap-4">
                    <MetricRow label="Estimate Date" value={formatDate(estimateDate)} icon={<Calendar className="w-3.5 h-3.5" />} />
                    <MetricRow label="Start Date" value={formatDate(startDate)} icon={<Calendar className="w-3.5 h-3.5" />} />
                    <MetricRow label="Total Agreed Hours" value="0h 00m" icon={<Clock className="w-3.5 h-3.5" />} highlight />
                    <MetricRow label="Final Hours" value={finalHours || "N/A"} />
                    <MetricRow label="Final Weeks" value={finalWeeks || "N/A"} />
                    <MetricRow label="Final Price" value={finalPrice ? `$${finalPrice.toLocaleString()}` : "N/A"} highlight />
                    <div className="pt-4 mt-4 border-t border-gray-200/60 space-y-2">
                      <div className="flex justify-between text-[10px] font-bold text-gray-400 uppercase">
                        <span>Created</span>
                        <span className="text-gray-600">{formatDateTime(createdAt)}</span>
                      </div>
                      <div className="flex justify-between text-[10px] font-bold text-gray-400 uppercase">
                        <span>Last Updated</span>
                        <span className="text-gray-600">{formatDateTime(updatedAt)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Project Files Section */}
              <div className="mt-16">
                <div className="flex items-center gap-3 mb-6">
                  <h4 className="text-xs font-black text-gray-900 uppercase tracking-[0.2em]">Project Documentation</h4>
                  <div className="h-px flex-1 bg-gray-100"></div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Array.isArray(files) && files.length > 0 ? (
                    files.map((file) => (
                      <div key={file.id} className="group flex items-center justify-between bg-white p-4 rounded-2xl border border-gray-100 hover:border-[#6bbd45]/30 hover:shadow-md transition-all duration-300">
                        <div className="flex items-center gap-3 overflow-hidden">
                          <div className="p-2 bg-emerald-50 text-[#6bbd45] rounded-xl group-hover:bg-[#6bbd45] group-hover:text-white transition-colors">
                            <FileText className="w-5 h-5" />
                          </div>
                          <div className="flex flex-col overflow-hidden">
                            <span className="text-sm font-bold text-gray-800 truncate">{file.originalName}</span>
                            <span className="text-[10px] font-bold text-gray-400 uppercase">Document</span>
                          </div>
                        </div>
                        <button
                          type="button"
                          className="p-2 text-gray-400 hover:text-[#6bbd45] hover:bg-emerald-50 rounded-xl transition-all"
                          onClick={() => openFileSecurely("estimation", id, file.id)}
                        >
                          <Link2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))
                  ) : (
                    <div className="col-span-full py-12 border-2 border-dashed border-gray-100 rounded-3xl flex flex-col items-center justify-center text-gray-400">
                      <FileText className="w-10 h-10 mb-2 opacity-20" />
                      <p className="text-sm font-medium italic">No documentation available for this project</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons - Premium Styling */}
              <div className="mt-16 flex flex-wrap items-center gap-4">
                <button
                  onClick={() => setIsEstimationTaskOpen(true)}
                  className="px-6 py-3 bg-rose-50 text-rose-600 rounded-2xl text-xs font-black uppercase tracking-widest border border-rose-100 hover:bg-rose-600 hover:text-white hover:shadow-lg hover:shadow-rose-200 transition-all duration-300"
                >
                  Estimation Task
                </button>
                <button
                  onClick={() => setIsLineItemGroupOpen(true)}
                  className="px-6 py-3 bg-blue-50 text-blue-600 rounded-2xl text-xs font-black uppercase tracking-widest border border-blue-100 hover:bg-blue-600 hover:text-white hover:shadow-lg hover:shadow-blue-200 transition-all duration-300"
                >
                  Estimated Hours/Weeks
                </button>
                <div className="flex-1"></div>
                <button
                  onClick={() => setIsEditModalOpen(true)}
                  className="px-8 py-3 bg-[#6bbd45] text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-lg shadow-[#6bbd45]/20 hover:bg-[#5da63c] hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300"
                >
                  Edit Estimation
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      {isEstimationTaskOpen && (
        <Modal
          isOpen={isEstimationTaskOpen}
          onClose={() => setIsEstimationTaskOpen(false)}
          title="Estimation Tasks"
          width="max-w-6xl"
        >
          <AllEstimationTask
            estimations={estimation.estimationTasks || []}
            estimationId={estimation.id}
            onClose={() => setIsEstimationTaskOpen(false)}
          />
        </Modal>
      )}

      {isLineItemGroupOpen && (
        <Modal
          isOpen={isLineItemGroupOpen}
          onClose={() => setIsLineItemGroupOpen(false)}
          title="Estimated Hours/Weeks"
          width="max-w-6xl"
        >
          <LineItemGroup
            estimationId={estimation.id}
          />
        </Modal>
      )}

      {isEditModalOpen && (
        <Modal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          title="Edit Estimation"
          width="max-w-5xl"
        >
          <AddEstimation
            isEdit={true}
            initialData={estimation}
            onSuccess={() => {
              setIsEditModalOpen(false);
              fetchEstimation();
            }}
          />
        </Modal>
      )}
    </div>
  );
};

const RefinedInfoRow = ({ label, value, icon }) => (
  <div className="flex justify-between items-center group">
    <div className="flex items-center gap-3">
      <div className="p-1.5 bg-gray-50 text-gray-400 rounded-lg group-hover:bg-[#6bbd45]/10 group-hover:text-[#6bbd45] transition-colors">
        {icon}
      </div>
      <span className="text-xs font-black text-gray-400 uppercase tracking-wider">{label}</span>
    </div>
    <div className="text-sm font-bold text-gray-800">{value}</div>
  </div>
);

const MetricRow = ({ label, value, icon, highlight }) => (
  <div className={`flex justify-between items-center p-3 rounded-xl border transition-all ${highlight ? 'bg-white border-[#6bbd45]/20 shadow-sm' : 'bg-transparent border-transparent'}`}>
    <div className="flex items-center gap-2.5">
      {icon && <div className={`${highlight ? 'text-[#6bbd45]' : 'text-gray-400'}`}>{icon}</div>}
      <span className={`text-[11px] font-bold uppercase tracking-tight ${highlight ? 'text-gray-900' : 'text-gray-400'}`}>{label}</span>
    </div>
    <span className={`text-sm font-black ${highlight ? 'text-[#6bbd45]' : 'text-gray-800'}`}>{value}</span>
  </div>
);

export default GetEstimationByID;


