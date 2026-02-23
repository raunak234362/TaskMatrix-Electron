/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState, useMemo } from "react";
import {
  Loader2,
  AlertCircle,
  FileText,
  Settings,
  FolderOpenDot,
  Users,
  Clock,
  ClipboardList,
  X
} from "lucide-react";
import Service from "../../api/Service";
import Button from "../fields/Button";
import AllMileStone from "./mileStone/AllMileStone";
import AllDocument from "./projectDocument/AllDocument";

import WBS from "./wbs/WBS";

import AllRFI from "../rfi/AllRfi";
import AddRFI from "../rfi/AddRFI";
import AllSubmittals from "../submittals/AllSubmittals";
import AllNotes from "./notes/AllNotes";
import EditProject from "./EditProject";
import AddSubmittal from "../submittals/AddSubmittals";
import RenderFiles from "../ui/RenderFiles";
import AllCO from "../co/AllCO";
import AddCO from "../co/AddCO";
import CoTable from "../co/CoTable";
import ProjectAnalyticsDashboard from "./ProjectAnalyticsDashboard";

const GetProjectById = ({ id, onClose }) => {
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("details");
  const [rfiView, setRfiView] = useState("list");
  const [submittalView, setSubmittalView] = useState("list");
  const [editModel, setEditModel] = useState(null);
  const [changeOrderView, setChangeOrderView] = useState("list");
  const [selectedCoId, setSelectedCoId] = useState(null);
  const userRole = sessionStorage.getItem("userRole")?.toLowerCase() || "";
  const rfiData = useMemo(() => {
    return project?.rfi || [];
  }, [project]);

  const changeOrderData = useMemo(() => {
    return project?.changeOrders || [];
  }, [project]);
  const fetchProject = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await Service.GetProjectById(id);
      setProject(response?.data || null);
    } catch (err) {
      setError("Failed to load project details");
      console.error("Error fetching project:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleEditModel = (project) => {
    console.log(project);
    setEditModel(project);
  };

  const submittalData = useMemo(() => {
    return project?.submittals || [];
  }, [project]);

  // const FetchWBSbyProjectId = async () => {
  //   try {
  //     setLoading(true);
  //     setError(null);
  //     const response = await Service.GetWBSByProjectId(id);
  //   //   setProject(response?.data || null);
  //   console.log(response);

  //   } catch (err) {
  //     setError("Failed to load WBS details");
  //     console.error("Error fetching project:", err);
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  useEffect(() => {
    if (id) fetchProject();
  }, [id]);

  const handleCoSuccess = (createdCO) => {
    const coId = createdCO?.id || createdCO?._id;
    if (coId) {
      setSelectedCoId(coId);
      setChangeOrderView("table");
      fetchProject(); // Refresh project to get updated CO list
    }
  };

  const formatDate = (date) =>
    date
      ? new Date(date).toLocaleString("en-IN", {
        dateStyle: "medium",
        timeStyle: "short",
      })
      : "—";

  if (loading)
    return (
      <div className="flex items-center justify-center py-8 text-gray-700">
        <Loader2 className="w-5 h-5 animate-spin mr-2" />
        Loading project details...
      </div>
    );

  if (error || !project)
    return (
      <div className="flex items-center justify-center py-8 text-red-600">
        <AlertCircle className="w-5 h-5 mr-2" />
        {error || "Project not found"}
      </div>
    );

  return (
    <>
      <div className="w-full relative laptop:fit">
        <div className="sticky top-0 bg-white z-50 pb-2">
          {/* Header */}
          <div className="flex justify-between items-center pr-4">
            <div className="flex items-center gap-4">
             
              <div>
                <h2 className="text-xl md:text-2xl font-black text-black uppercase tracking-tight">
                  {project.name}
                </h2>
                <p className="text-black/40 text-[10px] font-black uppercase tracking-widest">
                  Project Serial No: {project.serialNo}
                </p>
              </div>
              <div
                className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest border border-black ${project.status === "ACTIVE"
                  ? "bg-green-100 text-black"
                  : "bg-red-100 text-black"
                  }`}
              >
                {project.status}
              </div>
            </div>
            <div className="flex items-center gap-2">
               {onClose && (
                <button
                  onClick={onClose}
                  className="p-1 hover:bg-red-100 bg-red-100 border border-red-600 px-2 rounded-lg transition-colors text-red-600 hover:text-red-700"
                  title="Close"
                >
                  Close
                </button>
              )}
            </div>
          </div>
          {/* Tabs */}
          <div className="mb-4">
            {/* Mobile Dropdown */}
            <div className="block md:hidden mb-2">
              <select
                value={activeTab}
                onChange={(e) => setActiveTab(e.target.value)}
                className="w-full p-2 rounded-md bg-primary text-white  focus:outline-none focus:ring-2 focus:ring-[#6bbd45]"
              >
                {[
                  { key: "details", label: "Details" },
                  { key: "files", label: "Files" },
                  { key: "wbs", label: "WBS" },
                  { key: "milestones", label: "Milestones" },
                  { key: "team", label: "Team" },
                  { key: "timeline", label: "Timeline" },
                  { key: "notes", label: "Notes" },
                  { key: "rfi", label: "RFI" },
                  { key: "CDrfi", label: "CD RFI" },
                  { key: "submittals", label: "Submittals" },
                  { key: "CDsubmittals", label: "CD Submittals" },
                  { key: "changeOrder", label: "Change Order" },
                  { key: "analytics", label: "Analytics" },
                ]
                  .filter(
                    (tab) =>
                      !(
                        userRole === "staff" &&
                        ["wbs", "rfi", "submittals", "changeOrder"].includes(tab.key)
                      )
                  )
                  .map((tab) => (
                    <option key={tab.key} value={tab.key}>
                      {tab.label}
                    </option>
                  ))}
              </select>
            </div>

            {/* Desktop Tabs */}
            <div className="hidden md:flex gap-2 overflow-x-auto">
              {[
                { key: "details", label: "Details", icon: FileText },
                { key: "analytics", label: "Analytics", icon: ClipboardList },
                { key: "files", label: "Files", icon: FolderOpenDot },
                { key: "wbs", label: "WBS", icon: ClipboardList },
                { key: "milestones", label: "Milestones", icon: Clock },
                { key: "notes", label: "Notes", icon: FileText },
                { key: "rfi", label: "RFI", icon: FileText },
                { key: "CDrfi", label: "CD RFI", icon: FileText },
                { key: "submittals", label: "Submittals", icon: FileText },
                { key: "CDsubmittals", label: "CD Submittals", icon: FileText },
                {
                  key: "changeOrder",
                  label: "Change Order",
                  icon: Settings,
                },
              ]
                .filter(
                  (tab) =>
                    !(
                      userRole === "staff" &&
                      ["wbs", "changeOrder", "milestones", "analytics", "CDrfi", "CDsubmittals"].includes(tab.key)
                    )
                )
                .map(({ key, label, icon: TabIcon }) => (
                  <button
                    key={key}
                    onClick={() => setActiveTab(key)}
                    className={`flex items-center gap-2 border border-black px-4 py-2 text-[13px] rounded-lg font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === key
                      ? "bg-green-100 text-black shadow-sm"
                      : "text-black bg-gray-100 hover:bg-green-100/50"
                      }`}
                  >
                    <TabIcon className="w-4 h-4" />
                    {label}
                  </button>
                ))}
            </div>
          </div>

        </div>

        {/* Tab Content */}
        <div className="pt-4 p-2">
          {/* ✅ Details */}
          {activeTab === "details" && (
            <div className="grid max-sm:grid-cols-1 md:grid-cols-2 gap-6 text-sm">
              <div className="md:col-span-2 mt-6">
                <h4 className="font-black text-black uppercase tracking-widest mb-3 flex items-center gap-2 text-md">
                  <FolderOpenDot className="w-5 h-5" />
                  Project Scope
                </h4>
                <div
                  className="text-black bg-green-100 p-4 rounded-xl border border-black shadow-sm prose prose-sm max-w-none font-medium"
                  dangerouslySetInnerHTML={{
                    __html: project.description || "No description available."
                  }}
                />
              </div>
              <div className="space-y-3">
                {userRole !== 'staff' || userRole !== 'project_manager' || userRole !== 'department_manager' && (
                  <InfoRow
                    label="Estimated Hours"
                    value={project.estimatedHours || 0}
                  />
                )}
                <InfoRow
                  label="Department"
                  value={project.department?.name || "—"}
                />
                <InfoRow label="Team" value={project.team?.name || "—"} />
                <InfoRow
                  label="Manager"
                  value={
                    project.manager
                      ? `${project.manager.firstName} ${project.manager.lastName} (${project.manager.username})`
                      : "—"
                  }
                />
                <InfoRow
                  label="Fabricator"
                  value={project.fabricator?.fabName || "—"}
                />
                <InfoRow label="Tools" value={project.tools || "—"} />
              </div>

              <div className="space-y-3">
                <InfoRow label="Stage" value={project.stage || "—"} />
                <InfoRow
                  label="Start Date"
                  value={formatDate(project.startDate)}
                />
                <InfoRow
                  label="Approval Date"
                  value={formatDate(project.approvalDate)}
                />
                <InfoRow
                  label="Fabrication Date"
                  value={formatDate(project.fabricationDate)}
                />
                <InfoRow label="End Date" value={formatDate(project.endDate)} />
                {/* <InfoRow label="RFQ ID" value={project.rfqId || "—"} /> */}
              </div>

              <div className="p-4 bg-green-200 rounded-xl border border-black text-sm">
                <h4 className="text-md font-black text-black uppercase tracking-widest mb-4 flex items-center gap-2">
                  <Settings className="w-5 h-5" /> Connection Design Scope
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <ScopeTag
                    label="Connection Design"
                    active={project.connectionDesign}
                  />
                  <ScopeTag label="Misc Design" active={project.miscDesign} />
                  <ScopeTag
                    label="Customer Design"
                    active={project.customerDesign}
                  />
                </div>
              </div>
              <div className="p-4 bg-green-200 rounded-xl border border-black text-sm">
                <h4 className="text-md font-black text-black uppercase tracking-widest mb-4 flex items-center gap-2">
                  <Settings className="w-5 h-5" /> Detailing Scope
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <ScopeTag
                    label="Detailing Main"
                    active={project.detailingMain}
                  />
                  <ScopeTag
                    label="Detailing Misc"
                    active={project.detailingMisc}
                  />
                </div>
              </div>

              {/* Footer Buttons */}
              <div className="pt-2 flex flex-wrap gap-3">
                <Button
                  className="py-1 px-3 text-sm bg-green-100 text-black border border-black font-black uppercase tracking-widest hover:bg-green-200 transition-all"
                  onClick={() => handleEditModel(project)}
                >
                  Edit Project
                </Button>
              </div>
            </div>
          )}

          {/* ✅ Files */}
          {activeTab === "files" && (
            <div className="space-y-4">
              <AllDocument projectId={id} />
              <RenderFiles
                files={project.files || []}
                table="project"
                parentId={id}
                formatDate={formatDate}
              />
              <AllDocument />
            </div>
          )}
          {activeTab === "milestones" && (
            <AllMileStone project={project} onUpdate={fetchProject} />
          )}

          {/* ✅ Team */}
          {activeTab === "team" && (
            <div className="text-gray-700 text-sm">
              <h4 className="font-black text-black mb-2 flex items-center gap-1 uppercase tracking-widest">
                <Users className="w-4 h-4" /> Assigned Team
              </h4>
              <p className="font-medium">Team: {project.team?.name || "No team assigned."}</p>
              <p>
                Manager:{" "}
                {project.manager
                  ? `${project.manager.firstName} ${project.manager.lastName} (${project.manager.username})`
                  : "Not assigned."}
              </p>
            </div>
          )}

          {/* ✅ Timeline */}
          {activeTab === "timeline" && (
            <div className="text-gray-700 italic text-center py-10">
              <Clock className="w-6 h-6 mx-auto mb-2 text-gray-400" />
              Timeline view will be integrated soon.
            </div>
          )}

          {/* ✅ Notes */}
          {activeTab === "notes" && <AllNotes projectId={id} />}
          {activeTab === "wbs" && userRole !== "staff" && (
            <div className="text-gray-700 italic text-center">
              {/* <FolderOpenDot className="w-6 h-6 mx-auto mb-2 text-gray-400" /> */}
              <WBS id={id} stage={project.stage || ""} />
            </div>
          )}
          {activeTab === "rfi" && (
            <div className="space-y-4">
              {/* Sub-tabs for RFI */}
              <div className="flex justify-start mb-4">
                <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                  <button
                    onClick={() => setRfiView("list")}
                    className={`
                      whitespace-nowrap py-3 px-6 border border-black font-black text-xs uppercase tracking-widest rounded-lg transition-all
                      ${rfiView === "list"
                        ? "bg-green-100 text-black"
                        : "bg-gray-50 text-black hover:bg-green-50"
                      }
                    `}
                  >
                    All RFIs
                  </button>
                  {!["client", "staff", "estimator"].includes(userRole) && (
                    <button
                      onClick={() => setRfiView("add")}
                      className={`
                        whitespace-nowrap py-3 px-6 border border-black font-black text-xs uppercase tracking-widest rounded-lg transition-all
                        ${rfiView === "add"
                          ? "bg-green-100 text-black"
                          : "bg-gray-50 text-black hover:bg-green-50"
                        }
                    `}
                    >
                      Create RFI
                    </button>
                  )}
                </nav>
              </div>

              {/* RFI Content */}
              {rfiView === "list" ? (
                <AllRFI rfiData={rfiData} />
              ) : (
                <AddRFI
                  project={project}
                  onSuccess={() => {
                    fetchProject();
                    setRfiView("list");
                  }}
                />
              )}
            </div>
          )}
          {activeTab === "submittals" && (
            <div className="space-y-4">
              {/* Sub-tabs for RFI */}
              <div className="flex justify-start mb-4">
                <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                  <button
                    onClick={() => setSubmittalView("list")}
                    className={`
                      whitespace-nowrap py-3 px-6 border border-black font-black text-xs uppercase tracking-widest rounded-lg transition-all
                      ${submittalView === "list"
                        ? "bg-green-100 text-black"
                        : "bg-gray-50 text-black hover:bg-green-50"
                      }
                    `}
                  >
                    All Submittals
                  </button>
                  {!["client", "staff", "estimator"].includes(userRole) && (
                    <button
                      onClick={() => setSubmittalView("add")}
                      className={`
                        whitespace-nowrap py-3 px-6 border border-black font-black text-xs uppercase tracking-widest rounded-lg transition-all
                        ${submittalView === "add"
                          ? "bg-green-100 text-black"
                          : "bg-gray-50 text-black hover:bg-green-50"
                        }
                    `}
                    >
                      Create Submittal
                    </button>
                  )}
                </nav>
              </div>

              {/* Submittal Content */}
              {submittalView === "list" ? (
                <AllSubmittals submittalData={submittalData} />
              ) : (
                <AddSubmittal
                  project={project}
                  onSuccess={() => {
                    fetchProject();
                    setSubmittalView("list");
                  }}
                />
              )}
            </div>
          )}
          {activeTab === "CDrfi" && userRole !== "staff" && (
            <div className="space-y-4">
              {/* Sub-tabs for RFI */}
              <div className="flex justify-start mb-4">
                <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                  <button
                    onClick={() => setRfiView("list")}
                    className={`
                      whitespace-nowrap py-3 px-6 border border-black font-black text-xs uppercase tracking-widest rounded-lg transition-all
                      ${rfiView === "list"
                        ? "bg-green-100 text-black"
                        : "bg-gray-50 text-black hover:bg-green-50"
                      }
                    `}
                  >
                    All RFIs
                  </button>
                  {!["client", "staff", "estimator"].includes(userRole) && (
                    <button
                      onClick={() => setRfiView("add")}
                      className={`
                        whitespace-nowrap py-3 px-6 border border-black font-black text-xs uppercase tracking-widest rounded-lg transition-all
                        ${rfiView === "add"
                          ? "bg-green-100 text-black"
                          : "bg-gray-50 text-black hover:bg-green-50"
                        }
                    `}
                    >
                      Create RFI
                    </button>
                  )}
                </nav>
              </div>

              {/* RFI Content */}
              {rfiView === "list" ? (
                <AllRFI rfiData={rfiData} />
              ) : (
                <AddRFI
                  project={project}
                  onSuccess={() => {
                    fetchProject();
                    setRfiView("list");
                  }}
                />
              )}
            </div>
          )}
          {activeTab === "CDsubmittals" && userRole !== "staff" && (
            <div className="space-y-4">
              {/* Sub-tabs for RFI */}
              <div className="flex justify-start mb-4">
                <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                  <button
                    onClick={() => setSubmittalView("list")}
                    className={`
                      whitespace-nowrap py-3 px-6 border border-black font-black text-xs uppercase tracking-widest rounded-lg transition-all
                      ${submittalView === "list"
                        ? "bg-green-100 text-black"
                        : "bg-gray-50 text-black hover:bg-green-50"
                      }
                    `}
                  >
                    All Submittals
                  </button>
                  {!["client", "staff", "estimator"].includes(userRole) && (
                    <button
                      onClick={() => setSubmittalView("add")}
                      className={`
                        whitespace-nowrap py-3 px-6 border border-black font-black text-xs uppercase tracking-widest rounded-lg transition-all
                        ${submittalView === "add"
                          ? "bg-green-100 text-black"
                          : "bg-gray-50 text-black hover:bg-green-50"
                        }
                    `}
                    >
                      Create Submittal
                    </button>
                  )}
                </nav>
              </div>

              {/* Submittal Content */}
              {submittalView === "list" ? (
                <AllSubmittals submittalData={submittalData} />
              ) : (
                <AddSubmittal
                  project={project}
                  onSuccess={() => {
                    fetchProject();
                    setSubmittalView("list");
                  }}
                />
              )}
            </div>
          )}
          {activeTab === "changeOrder" && userRole !== "staff" && (
            <div className="space-y-4">
              {/* Sub-tabs for RFI */}
              <div className="flex justify-start mb-4">
                <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                  <button
                    onClick={() => setChangeOrderView("list")}
                    className={`
                      whitespace-nowrap py-3 px-6 border border-black font-black text-xs uppercase tracking-widest rounded-lg transition-all
                      ${changeOrderView === "list"
                        ? "bg-green-100 text-black"
                        : "bg-gray-50 text-black hover:bg-green-50"
                      }
                    `}
                  >
                    All Change Order
                  </button>
                  {!["client", "staff", "estimator"].includes(userRole) && (
                    <button
                      onClick={() => setChangeOrderView("add")}
                      className={`
                        whitespace-nowrap py-3 px-6 border border-black font-black text-xs uppercase tracking-widest rounded-lg transition-all
                        ${changeOrderView === "add"
                          ? "bg-green-100 text-black"
                          : "bg-gray-50 text-black hover:bg-green-50"
                        }
                    `}
                    >
                      Raise Change Order
                    </button>
                  )}
                </nav>
              </div>

              {/* Change Order Content */}
              {changeOrderView === "list" ? (
                <AllCO changeOrderData={changeOrderData} />
              ) : changeOrderView === "add" ? (
                <AddCO project={project} onSuccess={handleCoSuccess} />
              ) : (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h4 className="text-lg font-semibold text-black">
                      Change Order Table
                    </h4>
                    <button
                      onClick={() => setChangeOrderView("list")}
                      className="text-sm text-black hover:text-black font-medium"
                    >
                      &larr; Back to List
                    </button>
                  </div>
                  {selectedCoId && <CoTable coId={selectedCoId} />}
                </div>
              )}
            </div>
          )}
          {activeTab === "analytics" && (
            <ProjectAnalyticsDashboard projectId={id} />
          )}
        </div>
      </div >
      {editModel && (
        <EditProject
          projectId={id}
          onCancel={() => setEditModel(null)}
          onSuccess={() => {
            setEditModel(null);
            fetchProject();
          }}
        />
      )
      }
    </>
  );
};

// ✅ InfoRow Component
const InfoRow = ({
  label,
  value,
}) => (
  <div className="flex justify-between md:text-md text-sm pb-1">
    <span className="font-black text-black/50 uppercase tracking-widest text-[10px]">{label}:</span>
    <span className="text-black font-black uppercase tracking-tight">{value}</span>
  </div>
);

// ✅ ScopeTag Component
const ScopeTag = ({ label, active }) => (
  <span
    className={`px-4 py-1.5 text-xs font-black uppercase tracking-widest rounded-full border border-black ${active
      ? "bg-green-100 text-black shadow-sm"
      : "bg-gray-100 text-black/50"
      }`}
  >
    {label}
  </span>
);

export default GetProjectById;
