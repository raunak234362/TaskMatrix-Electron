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

const GetProjectById = ({ id }) => {
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
      <div className="w-full bg-white h-auto p-3 md:p-6 rounded-lg shadow-sm border border-gray-200 relative">
        {/* Header */}
        <div className="flex justify-between items-center border-b pb-3 mb-3">
          <div>
            <h2 className="text-xl md:text-2xl font-semibold text-green-700">
              {project.name}
            </h2>
            <p className="text-gray-700 text-sm">
              Project No: {project.projectNumber}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`px-3 py-1 rounded-full text-xs font-medium ${project.status === "ACTIVE"
                ? "bg-green-100 text-green-800"
                : "bg-red-100 text-red-700"
                }`}
            >
              {project.status}
            </span>
            {/* <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-gray-100 text-gray-700"
            >
              <X className="w-5 h-5" />
            </button> */}
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-4">
          {/* Mobile Dropdown */}
          <div className="block md:hidden mb-2">
            <select
              value={activeTab}
              onChange={(e) => setActiveTab(e.target.value)}
              className="w-full p-2 rounded-md bg-primary text-white font-bold focus:outline-none focus:ring-2 focus:ring-green-500"
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
                { key: "submittals", label: "Submittals" },
                { key: "changeOrder", label: "Change Order" },
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
              { key: "files", label: "Files", icon: FolderOpenDot },
              { key: "wbs", label: "WBS", icon: ClipboardList },
              { key: "milestones", label: "Milestones", icon: Clock },
              { key: "notes", label: "Notes", icon: FileText },
              { key: "rfi", label: "RFI", icon: FileText },
              { key: "submittals", label: "Submittals", icon: FileText },
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
            ["wbs", "rfi", "submittals", "changeOrder", "milestones"].includes(tab.key)
            )
            )
            .map(({key, label, icon: TabIcon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`flex items-center gap-2 bg-primary text-gray-800 px-4 py-2 text-md rounded-md font-medium transition-colors whitespace-nowrap ${activeTab === key
                ? "bg-green-600 text-white font-bold"
                : "text-gray-700 hover:text-green-700 font-semibold hover:bg-gray-50"
                }`}
            >
              <TabIcon className="w-4 h-4" />
              {label}
            </button>
              ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="p-2">
          {/* ✅ Details */}
          {activeTab === "details" && (
            <div className="grid max-sm:grid-cols-1 md:grid-cols-2 gap-6 text-sm">
              <div className="md:col-span-2 mt-6">
                <h4 className="font-semibold text-green-700 mb-2 flex items-center gap-1">
                  <FolderOpenDot className="w-4 h-4" />
                  Project Description
                </h4>
                <div
                  className="text-gray-700 bg-gray-50 p-3 rounded-lg border border-gray-200 shadow-sm prose prose-sm max-w-none"
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

              <div className="p-4 bg-gray-50 rounded-lg border text-sm">
                <h4 className="text-lg font-semibold text-green-700 mb-3 flex items-center gap-1">
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
              <div className="p-4 bg-gray-50 rounded-lg border text-sm">
                <h4 className="text-lg font-semibold text-green-700 mb-3 flex items-center gap-1">
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
              {/* <div className="pt-2 flex flex-wrap gap-3">
                <Button
                  className="py-1 px-3 text-sm bg-green-600 text-white"
                  onClick={() => handleEditModel(project)}
                >
                  Edit Project
                </Button>
              </div> */}
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
              <h4 className="font-semibold text-green-700 mb-2 flex items-center gap-1">
                <Users className="w-4 h-4" /> Assigned Team
              </h4>
              <p>Team: {project.team?.name || "No team assigned."}</p>
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
          {activeTab === "rfi" && userRole !== "staff" && (
            <div className="space-y-4">
              {/* Sub-tabs for RFI */}
              <div className="flex justify-start border-b border-gray-200 mb-4">
                <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                  <button
                    onClick={() => setRfiView("list")}
                    className={`
                      whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm
                      ${rfiView === "list"
                        ? "border-green-500 text-green-600"
                        : "border-transparent text-gray-700 hover:text-gray-700 hover:border-gray-300"
                      }
                    `}
                  >
                    All RFIs
                  </button>
                  {userRole !== "client" && (
                    <button
                      onClick={() => setRfiView("add")}
                      className={`
                        whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm
                        ${rfiView === "add"
                          ? "border-green-500 text-green-600"
                          : "border-transparent text-gray-700 hover:text-gray-700 hover:border-gray-300"
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
          {activeTab === "submittals" && userRole !== "staff" && (
            <div className="space-y-4">
              {/* Sub-tabs for RFI */}
              <div className="flex justify-start border-b border-gray-200 mb-4">
                <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                  <button
                    onClick={() => setSubmittalView("list")}
                    className={`
                      whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm
                      ${submittalView === "list"
                        ? "border-green-500 text-green-600"
                        : "border-transparent text-gray-700 hover:text-gray-700 hover:border-gray-300"
                      }
                    `}
                  >
                    All Submittals
                  </button>
                  {userRole !== "client" && (
                    <button
                      onClick={() => setSubmittalView("add")}
                      className={`
                        whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm
                        ${submittalView === "add"
                          ? "border-green-500 text-green-600"
                          : "border-transparent text-gray-700 hover:text-gray-700 hover:border-gray-300"
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
              <div className="flex justify-start border-b border-gray-200 mb-4">
                <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                  <button
                    onClick={() => setChangeOrderView("list")}
                    className={`
                      whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm
                      ${changeOrderView === "list"
                        ? "border-green-500 text-green-600"
                        : "border-transparent text-gray-700 hover:text-gray-700 hover:border-gray-300"
                      }
                    `}
                  >
                    All Change Order
                  </button>
                  {userRole !== "client" && (
                    <button
                      onClick={() => setChangeOrderView("add")}
                      className={`
                        whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm
                        ${changeOrderView === "add"
                          ? "border-green-500 text-green-600"
                          : "border-transparent text-gray-700 hover:text-gray-700 hover:border-gray-300"
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
                    <h4 className="text-lg font-semibold text-green-700">
                      Change Order Table
                    </h4>
                    <button
                      onClick={() => setChangeOrderView("list")}
                      className="text-sm text-green-600 hover:text-green-700 font-medium"
                    >
                      &larr; Back to List
                    </button>
                  </div>
                  {selectedCoId && <CoTable coId={selectedCoId} />}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      {editModel && (
        <EditProject
          projectId={id}
          onCancel={() => setEditModel(null)}
          onSuccess={() => {
            setEditModel(null);
            fetchProject();
          }}
        />
      )}
    </>
  );
};

// ✅ InfoRow Component
const InfoRow = ({
  label,
  value,
}) => (
  <div className="flex justify-between border-b border-gray-100 md:text-md text-sm pb-1">
    <span className="font-medium text-gray-700">{label}:</span>
    <span className="text-gray-700">{value}</span>
  </div>
);

// ✅ ScopeTag Component
const ScopeTag = ({ label, active }) => (
  <span
    className={`px-3 py-1 text-sm font-medium rounded-full ${active
      ? "bg-green-100 text-green-800 border border-green-300"
      : "bg-gray-100 text-gray-700 border border-gray-200"
      }`}
  >
    {label}
  </span>
);

export default GetProjectById;
