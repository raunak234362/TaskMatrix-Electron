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
  CheckCircle2,
  TrendingUp,
  Activity,
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
import ProjectMilestoneMetrics from "./mileStone/ProjectMilestoneMetrics";

const GetProjectById = ({ id, onClose }) => {
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [rfiView, setRfiView] = useState("list");
  const [submittalView, setSubmittalView] = useState("list");
  const [editModel, setEditModel] = useState(null);
  const [changeOrderView, setChangeOrderView] = useState("list");
  const [selectedCoId, setSelectedCoId] = useState(null);
  const [projectTasks, setProjectTasks] = useState([]);
  const userRole = sessionStorage.getItem("userRole")?.toLowerCase() || "";

  const fetchProjectTasks = async () => {
    try {
      const response = await Service.GetAllTask();
      if (response && response.data) {
        const allTasks = Array.isArray(response.data) ? response.data : [];
        setProjectTasks(allTasks.filter((t) => t.project_id === id));
      }
    } catch (error) {
      console.error("Error fetching project tasks:", error);
    }
  };

  const projectStats = useMemo(() => {
    if (!project) return { assigned: 0, completed: 0, overrun: 0, completedStr: "00:00", overrunStr: "00:00" };

    const assigned = Number(project.estimatedHours) || 0;
    const totalSeconds = projectTasks.reduce((sum, task) => {
      return sum + (task.workingHourTask || []).reduce((tSum, entry) => tSum + (entry.duration_seconds || 0), 0);
    }, 0);

    const completedHours = totalSeconds / 3600;
    const overrunHours = Math.max(0, completedHours - assigned);

    const formatSecondsToHHMM = (totalSecs) => {
      const h = Math.floor(totalSecs / 3600);
      const m = Math.floor((totalSecs % 3600) / 60);
      return `${h}:${m.toString().padStart(2, "0")}`;
    };

    return {
      assigned,
      completed: completedHours,
      overrun: overrunHours,
      completedStr: formatSecondsToHHMM(totalSeconds),
      overrunStr: formatSecondsToHHMM(Math.max(0, totalSeconds - (assigned * 3600)))
    };
  }, [project, projectTasks]);

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
      const [projRes] = await Promise.all([
        Service.GetProjectById(id),
        fetchProjectTasks()
      ]);
      setProject(projRes?.data || null);
    } catch (err) {
      setError("Failed to load project details");
      console.error("Error fetching project:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleEditModel = (project) => {
    setEditModel(project);
  };

  const submittalData = useMemo(() => {
    return project?.submittals || [];
  }, [project]);

  useEffect(() => {
    if (id) fetchProject();
  }, [id]);

  const handleCoSuccess = (createdCO) => {
    const coId = createdCO?.id || createdCO?._id;
    if (coId) {
      setSelectedCoId(coId);
      setChangeOrderView("table");
      fetchProject();
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
          <div className="flex justify-between items-start pr-4 pt-2">
            <div className="flex flex-col">
              <h2 className="text-2xl md:text-3xl font-black text-black uppercase tracking-tight leading-none">
                {project.name}
              </h2>
              <p className="text-black/60 text-[12px] font-bold uppercase tracking-widest mt-1">
                Project No: {project.projectCode || project.serialNo}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div
                className={`px-4 py-1.5 rounded-lg text-xs font-black uppercase tracking-widest border-2 transition-all ${project.status === "ACTIVE"
                  ? "bg-green-100 text-black"
                  : "bg-red-100 text-black "
                  }`}
              >
                {project.status}
              </div>
              {onClose && (
                <button
                  onClick={onClose}
                  className="px-6 py-2 bg-red-200 border-2 border-black text-black font-black uppercase tracking-widest rounded-lg hover:bg-red-100 transition-all text-xs shadow-sm hover:shadow-md active:scale-95"
                >
                  Close
                </button>
              )}
            </div>
          </div>
          {/* Tabs */}
          <div className="mb-4 mt-4">
            <div className="hidden md:flex gap-3 overflow-x-auto custom-scrollbar pb-3 pt-1">
              {[
                { key: "overview", label: "Overview", icon: ClipboardList },
                { key: "analytics", label: "Analytics", icon: TrendingUp },
                { key: "details", label: "Details", icon: FileText },
                { key: "files", label: "Files", icon: FolderOpenDot },
                { key: "wbs", label: "WBS", icon: ClipboardList },
                { key: "milestones", label: "Milestones", icon: Clock },
                { key: "notes", label: "Notes", icon: FileText },
                { key: "rfi", label: "RFI", icon: FileText },
                { key: "CDrfi", label: "CD RFI", icon: FileText },
                { key: "submittals", label: "Submittals", icon: FileText },
                { key: "CDsubmittals", label: "CD Submittals", icon: FileText },
                { key: "changeOrder", label: "Change Order", icon: Settings },
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
                    className={`flex items-center gap-2 border-1 px-5 py-2 text-[12px] rounded-lg font-black uppercase tracking-widest transition-all whitespace-nowrap shadow-sm hover:shadow-md active:scale-95 ${activeTab === key
                      ? "bg-green-50 text-black border-[#6bbd45]"
                      : "text-black bg-white border-black hover:border-black"
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
        <div className="pt-2 p-1">
          {/* Overview TabContent */}
          {activeTab === "overview" && (
            <div className="space-y-6 animate-in slide-in-from-top-2 duration-500">
              {/* Summary Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="flex flex-row items-center justify-between bg-white p-6 rounded-2xl border-1 border-black bg-blue-400 shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
                  <div className="flex items-center gap-3 mb-6 text-black">
                    <Clock size={20} strokeWidth={3} />
                    <span className="text-sm font-black uppercase tracking-widest opacity-60">Hours Assigned</span>
                  </div>
                  <h3 className="text-4xl text-black tracking-tighter">{projectStats.assigned}h</h3>
                  <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full -mr-16 -mt-16 group-hover:scale-110 transition-transform duration-500"></div>
                </div>

                <div className="flex flex-row items-center justify-between bg-white p-6 rounded-2xl border-1 border-black bg-emerald-400 shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
                  <div className="flex items-center gap-3 mb-6 text-emerald-500">
                    <CheckCircle2 size={20} strokeWidth={3} />
                    <span className="textsms font-black uppercase tracking-widest opacity-60">Hours Completed</span>
                  </div>
                  <h3 className="text-4xl  text-black tracking-tighter">{projectStats.completedStr}</h3>

                  <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full -mr-16 -mt-16 group-hover:scale-110 transition-transform duration-500"></div>
                </div>

                <div className={`flex flex-row items-center justify-between p-6 rounded-2xl border border-black bg-white relative overflow-hidden group hover:shadow-md transition-all ${projectStats.overrun > 0 ? "bg-white border-red-400" : "bg-white"}`}>
                  <div className={`flex items-center gap-3 mb-6 ${projectStats.overrun > 0 ? "text-red-500" : "text-slate-400"}`}>
                    <AlertCircle size={20} strokeWidth={3} />
                    <span className="text-sm font-black text-black uppercase tracking-widest opacity-60">Overrun / Delay</span>
                  </div>
                  <h3 className={`text-4xl tracking-tighter ${projectStats.overrun > 0 ? "text-red-600" : "text-black"}`}>
                    {projectStats.overrunStr}
                  </h3>
                  <div className={`absolute top-0 right-0 w-32 h-32 rounded-full -mr-16 -mt-16 group-hover:scale-110 transition-transform duration-500 ${projectStats.overrun > 0 ? "bg-red-500/5" : "bg-slate-500/5"}`}></div>
                </div>
              </div>

              {/* Progress and Milestones */}
              <div className="bg-white rounded-3xl border-1 border-slate-50 p-6">
                <ProjectMilestoneMetrics projectId={id} />
              </div>

              {/* Timeline Overview & Project Status */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-white p-8 rounded-2xl border-2 border-slate-50 shadow-sm hover:shadow-md transition-all">
                  <h4 className="text-[12px] font-black uppercase tracking-widest flex items-center gap-3 mb-8">
                    <Clock className="w-5 h-5 text-blue-500" strokeWidth={3} /> Timeline Overview
                  </h4>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center py-4 border-b border-slate-100">
                      <span className="text-[14px] font-black uppercase tracking-widest">Start Date</span>
                      <span className="text-[14px] font-black tracking-tight">{formatDate(project.startDate)}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-8 rounded-2xl border-2 border-slate-50 shadow-sm hover:shadow-md transition-all flex flex-col items-center justify-center text-center">
                  <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-lg border border-slate-100 mb-6 group">
                    <Activity className="w-8 h-8 text-[#6bbd45] group-hover:scale-110 transition-transform" strokeWidth={3} />
                  </div>
                  <h4 className="text-[10px] font-black text-black/40 uppercase tracking-widest mb-2">Project Status</h4>
                  <span className="text-xs font-black text-emerald-600 uppercase tracking-widest mb-6 px-6 py-2 bg-emerald-50 rounded-lg border border-emerald-100 shadow-sm">{project.status}</span>
                  <p className="text-[10px] font-extrabold text-black/40 uppercase tracking-widest flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#6bbd45] animate-pulse"></span>
                    Current Phase: <span className="text-black">{project.stage || "IFA"}</span>
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ✅ Details */}
          {activeTab === "details" && (
            <div className="grid max-sm:grid-cols-1 md:grid-cols-2 gap-6 text-sm">
              <div className="md:col-span-2 mt-6">
                <h4 className=" text-black uppercase tracking-widest mb-3 flex items-center gap-2 text-">
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
                {!["staff", "project_manager", "department_manager"].includes(userRole) && (
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

              {userRole === "admin" && (
                <div className="pt-2 flex flex-wrap gap-3">
                  <Button
                    className="py-1 px-3 text-sm bg-green-100 text-black border border-black font-black uppercase tracking-widest hover:bg-green-200 transition-all"
                    onClick={() => handleEditModel(project)}
                  >
                    Edit Project
                  </Button>
                </div>
              )}
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

          {/* ✅ Notes */}
          {activeTab === "notes" && <AllNotes projectId={id} />}
          {activeTab === "wbs" && userRole !== "staff" && (
            <div className="text-gray-700 italic text-center">
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
