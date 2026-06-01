import { useEffect, useState, useMemo } from "react";
import { formatSeconds } from "../../utils/timeUtils";
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
  X,
  FileSpreadsheet,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import Service from "../../api/Service";
import Button from "../fields/Button";
import AllMileStone from "./mileStone/AllMileStone";
import AllDocument from "./projectDocument/AllDocument";
import WBS from "./wbs/WBS";
import WbsBreakdownPanel from "./wbs/WbsBreakdownPanel";
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
import MilestoneProgress from "./MilestoneProgress";
import TeamsAnalytics from "./TeamsAnalytics";
import AllProjectNotes from "./notes/AllProjectNotes";
import AddAssistsModal from "./AddAssistsModal";
import ProjectMilestoneMetrics from "./ProjectMilestoneMetrics.jsx";
import ProjectProgress from "./ProjectProgress";
import CoordinationDrawings from "./coordinationDrawings/CoordinationDrawings";
import WorkProgressReport from "./WorkProgressReport";

const WBS_TYPE_ALIAS = {
  // Modelling
  "modeling": "modelling",
  "modelling": "modelling",
  // Modelling Checking
  "modeling_checking": "modelling_checking",
  "modelling_checking": "modelling_checking",
  "modeling checking": "modelling_checking",
  "modelling checking": "modelling_checking",
  "modeling-checking": "modelling_checking",
  "modelling-checking": "modelling_checking",
  "modelingchecking": "modelling_checking",
  "modellingchecking": "modelling_checking",
  // Detailing
  "detailing": "detailing",
  // Detailing Checking
  "detailing_checking": "detailing_checking",
  "detailing checking": "detailing_checking",
  "detailing-checking": "detailing_checking",
  "detailingchecking": "detailing_checking",
  // Erection
  "erection": "erection",
  "erection_plan": "erection",
  // Erection Checking
  "erection_checking": "erection_checking",
  "erection checking": "erection_checking",
  "erection-checking": "erection_checking",
  "erectionchecking": "erection_checking",
  // Others
  "others": "others",
  "other": "others",
};

const normaliseWbsType = (raw) => {
  if (!raw) return "others";
  // Collapse whitespace & lowercase
  const key = String(raw).toLowerCase().trim().replace(/\s+/g, " ");
  return WBS_TYPE_ALIAS[key] ?? "others";
};

const GetProjectById = ({ id, onClose }) => {
  const [project, setProject] = useState(null);
  const [milestones, setMilestones] = useState([]); // Added milestones state
  const [rfiData, setRfiData] = useState([]); // Added rfiData state
  const [submittalData, setSubmittalData] = useState([]); // Added submittalData state
  const [coordinationDrawings, setCoordinationDrawings] = useState([]); // Added coordinationDrawings state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");

  const [expandedGroups, setExpandedGroups] = useState({
    "Training and Practice": false,
    "Job Study": false,
    "Meeting": false,
    "Other Tasks": false,
  });

  const toggleGroup = (groupKey) => {
    setExpandedGroups((prev) => ({
      ...prev,
      [groupKey]: !prev[groupKey],
    }));
  };
  const [rfiView, setRfiView] = useState("list");
  const [submittalView, setSubmittalView] = useState("list");
  const [editModel, setEditModel] = useState(null);
  const [changeOrderView, setChangeOrderView] = useState("list");
  const [selectedCoId, setSelectedCoId] = useState(null);
  const [projectTasks, setProjectTasks] = useState([]);
  const [showAssistsModal, setShowAssistsModal] = useState(false);
  const userRole = sessionStorage.getItem("userRole")?.toLowerCase() || "";
  const currentUserId = sessionStorage.getItem("userId");

  // Check if current user is an assist for this project
  const isAssist = useMemo(() => {
    if (!project?.assists || !currentUserId) return false;
    return project.assists.some(assist => 
      String(assist.userId) === String(currentUserId) || 
      String(assist.user?.id) === String(currentUserId)
    );
  }, [project, currentUserId]);

  const canCreate = useMemo(() => {
    if (isAssist) return true;
    return !["client", "staff", "estimator"].includes(userRole);
  }, [isAssist, userRole]);

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
    if (!project)
      return {
        assigned: 0,
        completed: 0,
        overrun: 0,
        completedStr: "0:00",
        overrunStr: "0:00",
        totalSeconds: 0,
        ifaStr: "0:00",
        ifcStr: "0:00",
        coStr: "0:00"
      };

    const assigned = Number(project.estimatedHours) || 0;

    // Stage-wise aggregation
    const stageStats = projectTasks.reduce(
      (acc, task) => {
        if (normaliseWbsType(task.wbsType) === "others") {
          return acc;
        }
        const stage = (task.Stage || "").toUpperCase().trim();
        const taskSecs = (task.workingHourTask || []).reduce(
          (tSum, entry) => tSum + (entry.duration_seconds || 0),
          0
        );

        if (stage === "IFA" || stage === "RE-IFA") {
          acc.ifa.secs += taskSecs;
          acc.ifa.count += 1;
        } else if (stage === "IFC" || stage === "RIFC") {
          acc.ifc.secs += taskSecs;
          acc.ifc.count += 1;
        } else if (stage.startsWith("CO") || stage.includes("CHANGE ORDER")) {
          acc.co.secs += taskSecs;
          acc.co.count += 1;
        } else {
          acc.other.secs += taskSecs;
          acc.other.count += 1;
        }

        acc.totalSecs += taskSecs;
        return acc;
      },
      {
        ifa: { secs: 0, count: 0 },
        ifc: { secs: 0, count: 0 },
        co: { secs: 0, count: 0 },
        other: { secs: 0, count: 0 },
        totalSecs: 0
      }
    );

    const totalSeconds = stageStats.totalSecs;
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
      overrunStr: formatSecondsToHHMM(Math.max(0, totalSeconds - assigned * 3600)),
      totalSeconds,
      ifa: { 
        str: formatSecondsToHHMM(stageStats.ifa.secs), 
        count: stageStats.ifa.count,
        hours: stageStats.ifa.secs / 3600
      },
      ifc: { 
        str: formatSecondsToHHMM(stageStats.ifc.secs), 
        count: stageStats.ifc.count,
        hours: stageStats.ifc.secs / 3600
      },
      co: { str: formatSecondsToHHMM(stageStats.co.secs), count: stageStats.co.count }
    };
  }, [project, projectTasks]);

  // Group "others" wbsType tasks by categories: Training and Practice, Job Study, Meeting, and Other Tasks
  const otherTasksByBundle = useMemo(() => {
    const grouped = {
      "Training and Practice": [],
      "Job Study": [],
      "Meeting": [],
      "Other Tasks": []
    };

    projectTasks.forEach((task) => {
      if (normaliseWbsType(task.wbsType) !== "others") return;
      const name = String(task.name || task.title || task.wbsTemplate?.name || "").toLowerCase();
      
      if (name.includes("training") || name.includes("practice")) {
        grouped["Training and Practice"].push(task);
      } else if (name.includes("job study") || name.includes("jobstudy")) {
        grouped["Job Study"].push(task);
      } else if (name.includes("meeting")) {
        grouped["Meeting"].push(task);
      } else {
        grouped["Other Tasks"].push(task);
      }
    });

    // Remove empty groups to keep UI clean
    const cleanedGrouped = {};
    Object.entries(grouped).forEach(([key, list]) => {
      if (list.length > 0) {
        cleanedGrouped[key] = list;
      }
    });

    return cleanedGrouped;
  }, [projectTasks]);



  const wbsTasksByBundle = useMemo(() => {
    const grouped = {};
    projectTasks.forEach((task) => {
      const bundleKey =
        task.projectBundle?.bundleKey ||
        task.projectBundle?.bundle?.bundleKey ||
        task.bundleKey ||
        "Uncategorised";
      if (!grouped[bundleKey]) grouped[bundleKey] = {};

      const typeKey = normaliseWbsType(task.wbsType);

      if (!grouped[bundleKey][typeKey]) grouped[bundleKey][typeKey] = [];
      grouped[bundleKey][typeKey].push(task);
    });
    return grouped;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectTasks]);

  // Aggregate total logged seconds and allocated seconds for primary WBS categories across the entire project
  const wbsCategoryTotals = useMemo(() => {
    const totals = {
      modelling: { logged: 0, allocated: 0 },
      modelling_checking: { logged: 0, allocated: 0 },
      detailing: { logged: 0, allocated: 0 },
      detailing_checking: { logged: 0, allocated: 0 },
      erection: { logged: 0, allocated: 0 },
      erection_checking: { logged: 0, allocated: 0 },
    };

    const parseAllocSecsLocal = (str) => {
      if (!str || typeof str !== "string") return 0;
      const [h, m] = str.split(":").map(Number);
      return (h || 0) * 3600 + (m || 0) * 60;
    };

    projectTasks.forEach((task) => {
      const typeKey = normaliseWbsType(task.wbsType);
      if (totals[typeKey] !== undefined) {
        const taskSeconds = (task.workingHourTask || []).reduce((s, w) => s + (w.duration_seconds || 0), 0);
        totals[typeKey].logged += taskSeconds;

        const allocSeconds = parseAllocSecsLocal(task.allocationLog?.allocatedHours);
        totals[typeKey].allocated += allocSeconds;
      }
    });

    return totals;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectTasks]);

  // RFI data is now fetched directly via GetRFIByProjectId instead of using project.rfi

  const changeOrderData = useMemo(() => {
    return project?.changeOrders || [];
  }, [project]);

  const fetchProject = async () => {
    try {
      setLoading(true);
      setError(null);
      const [projRes, mileRes, rfiRes, subRes, coordRes] = await Promise.all([
        Service.GetProjectById(id),
        Service.GetProjectMilestoneById(id),
        Service.GetRFIByProjectId(id),
        Service.GetSubmittalByProjectId(id),
        Service.getCoordinationDrawingsByProjectId(id),
        fetchProjectTasks()
      ]);
      setProject(projRes?.data || null);
      setMilestones(mileRes?.data || []);
      let rfiArray = [];
      if (rfiRes) {
        if (Array.isArray(rfiRes)) {
          rfiArray = rfiRes;
        } else if (rfiRes["show rfi"]) {
          rfiArray = rfiRes["show rfi"];
        } else if (rfiRes.data) {
          rfiArray = rfiRes.data;
        } else if (typeof rfiRes === "object") {
          const firstArray = Object.values(rfiRes).find(Array.isArray);
          if (firstArray) rfiArray = firstArray;
        }
      }
      setRfiData(rfiArray);
      setSubmittalData(subRes?.data || (Array.isArray(subRes) ? subRes : []));
      setCoordinationDrawings(coordRes?.data || (Array.isArray(coordRes) ? coordRes : []));
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
      <div className="w-full relative bg-[#fcfdfc] min-h-[600px] flex flex-col gap-6 p-4">
        {/* Header */}
        <div className="sticky top-0 z-30 bg-[#fcfdfc] flex flex-col md:flex-row md:items-start justify-between gap-4 pb-4 border-b border-gray-100">
          <div>
            <h2 className="text-lg md:text-2xl font-semibold text-gray-900 tracking-tight uppercase">
              {project.name}
            </h2>
            <div className="flex flex-wrap items-center gap-2 mt-3">
              <span className="px-6 py-1.5 bg-gray-900 text-white border-2 border-gray-900 rounded-none font-bold text-sm uppercase tracking-tight shadow-sm inline-flex items-center justify-center">
                PROJECT NO: {project.projectCode || project.serialNo}
              </span>
              {project.stage && (
                <span className="px-6 py-1.5 bg-blue-50 text-blue-800 border-2 border-dashed border-blue-600/60 rounded-none font-bold text-sm uppercase tracking-tight inline-flex items-center justify-center">
                  STAGE: {project.stage}
                </span>
              )}
              <span className={`px-6 py-1.5 border-2 border-dashed rounded-none font-bold text-sm uppercase tracking-tight inline-flex items-center justify-center ${
                project.status === "ACTIVE"
                  ? "bg-green-50 text-green-800 border-green-600/60"
                  : "bg-red-50 text-red-800 border-red-600/60"
              }`}>
                STATUS: {project.status}
              </span>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 md:mt-1">
            {(userRole === "admin" || userRole === "operation_executive" || userRole === "dept_manager" || userRole === "deputy_manager" || userRole === "project_manager") && (
              <>
                <button
                  className="px-6 py-1.5 bg-green-50 text-black border-2 border-green-700/80 rounded-none hover:bg-green-100 transition-all font-bold text-sm uppercase tracking-tight shadow-sm inline-flex items-center justify-center cursor-pointer"
                  onClick={() => setShowAssistsModal(true)}
                >
                  Add Assists
                </button>
                <button
                  className="px-6 py-1.5 bg-green-50 text-black border-2 border-green-700/80 rounded-none hover:bg-green-100 transition-all font-bold text-sm uppercase tracking-tight shadow-sm inline-flex items-center justify-center cursor-pointer"
                  onClick={() => handleEditModel(project)}
                >
                  Edit
                </button>
              </>
            )}
            {onClose && (
              <button
                onClick={onClose}
                className="px-6 py-1.5 bg-red-50 text-black border-2 border-red-700/80 rounded-none hover:bg-red-100 transition-all font-bold text-sm uppercase tracking-tight shadow-sm inline-flex items-center justify-center cursor-pointer"
              >
                Close
              </button>
            )}
          </div>
        </div>

        {/* Main Content Layout with Sidebar */}
        <div className="flex flex-col md:flex-row gap-6 items-start">
          {/* Sidebar */}
          <div className="w-full md:w-64 shrink-0 flex flex-col gap-1 border-r border-gray-100 pr-4 sticky top-[120px] self-start">
            {[
              { key: "overview", label: "Overview", icon: ClipboardList },
              { key: "wpr", label: "WPR", icon: FileSpreadsheet },
              { key: "analytics", label: "Analytics", icon: TrendingUp },
              { key: "teamAnalytics", label: "Team Analytics", icon: Users },
              { key: "files", label: "Files", icon: FolderOpenDot },
              { key: "wbs", label: "WBS", icon: ClipboardList },
              { key: "milestones", label: "Milestones", icon: Clock },
              { key: "notes", label: "Notes", icon: FileText },
              { key: "projectNotes", label: "Project Notes", icon: FileText },
              { key: "rfi", label: "RFI", icon: FileText },
              { key: "submittals", label: "Submittals", icon: FileText },
              { key: "changeOrder", label: "Change Order", icon: Settings },
              { key: "coordinationDrawings", label: "Coordination Drawings", icon: FileText },
            ]
              .filter(
                (tab) => {
                  if (userRole === "staff" && !isAssist && ["wbs", "changeOrder", "milestones", "analytics", "teamAnalytics", "CDrfi", "CDsubmittals"].includes(tab.key)) {
                    return false;
                  }
                  if (tab.key === "projectNotes") {
                    return ["admin", "project_manager", "deputy_manager", "client", "client_admin", "operation_executive","connection_designer_engineer","connection_designer_admin", "dept_manager" ].includes(userRole);
                  }
                  return true;
                }
              )
              .map(({ key, label, icon: TabIcon }) => (
                <button
                  key={key}
                  onClick={() => setActiveTab(key)}
                  className={`flex items-center gap-3 w-full px-4 py-2.5 text-sm font-semibold tracking-normal rounded-none transition-all text-left cursor-pointer ${activeTab === key
                    ? "bg-green-50 text-green-700 font-bold border-l-4 border-green-600 pl-3"
                    : "text-black hover:bg-gray-50 hover:text-black border-l-4 border-transparent"
                    }`}
                >
                  <TabIcon className={`w-4 h-4 shrink-0 ${activeTab === key ? "text-green-600" : "text-black"}`} />
                  {label}
                </button>
              ))}
          </div>

          {/* Tab Content Area */}
          <div className="flex-1 min-w-0 bg-white">
            {/* Overview TabContent */}
            {activeTab === "overview" && (
              <div className="space-y-6 animate-in slide-in-from-top-2 duration-500">
                {/* Section 1: Hours Statistics */}
                <div className="space-y-4 mb-8">
                  {/* Row 1: Estimations */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex items-center justify-between bg-blue-50/40 p-4 rounded-none border border-black">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-none bg-blue-100/50 flex items-center justify-center text-blue-600 shrink-0">
                          <Clock size={18} />
                        </div>
                        <div>
                          <span className="text-sm font-bold text-black uppercase tracking-wider block">Estimated Hours</span>
                        </div>
                      </div>
                      <h3 className="text-sm font-bold text-black tracking-tight">{projectStats.assigned.toFixed(2)}H</h3>
                    </div>

                    <div className="flex items-center justify-between bg-blue-50/40 p-4 rounded-none border border-black">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-none bg-blue-100/50 flex items-center justify-center text-blue-600 shrink-0">
                          <CheckCircle2 size={18} />
                        </div>
                        <div>
                          <span className="text-sm font-bold text-black uppercase tracking-wider block">Estimated Hours for Approval</span>
                        </div>
                      </div>
                      <h3 className="text-sm font-bold text-black tracking-tight">{(projectStats.assigned * 0.8).toFixed(2)}H</h3>
                    </div>

                    <div className="flex items-center justify-between bg-blue-50/40 p-4 rounded-none border border-black">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-none bg-blue-100/50 flex items-center justify-center text-blue-600 shrink-0">
                          <CheckCircle2 size={18} />
                        </div>
                        <div>
                          <span className="text-sm font-bold text-black uppercase tracking-wider block">Estimated Hours for Fabrication</span>
                        </div>
                      </div>
                      <h3 className="text-sm font-bold text-black tracking-tight">{(projectStats.assigned * 0.2).toFixed(2)}H</h3>
                    </div>
                  </div>

                  {/* Row 2: Completion & Overrun */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center justify-between bg-green-50/40 p-4 rounded-none border border-black">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-none bg-green-100/50 flex items-center justify-center text-green-600 shrink-0">
                          <CheckCircle2 size={18} />
                        </div>
                        <div>
                          <span className="text-sm font-bold text-black uppercase tracking-wider block">Hours Completed</span>
                        </div>
                      </div>
                      <h3 className="text-sm font-bold text-black tracking-tight">{projectStats.completedStr}</h3>
                    </div>

                    <div className={`flex items-center justify-between p-4 rounded-none border border-black ${
                      projectStats.overrun > 0 
                        ? "bg-red-50/40" 
                        : "bg-gray-50/60"
                    }`}>
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-none flex items-center justify-center shrink-0 ${
                          projectStats.overrun > 0 
                            ? "bg-red-100/50 text-red-600" 
                            : "bg-gray-100/50 text-black"
                        }`}>
                          <AlertCircle size={18} />
                        </div>
                        <div>
                          <span className="text-sm font-bold text-black uppercase tracking-wider block">Overrun / Delay</span>
                          <span className="text-xs text-black font-semibold block mt-0.5">
                            {projectStats.overrun > 0 ? "PROJECT HAS OVERRUN ESTIMATE" : "PROJECT IS WITHIN ESTIMATES"}
                          </span>
                        </div>
                      </div>
                      <h3 className={`text-sm font-bold tracking-tight ${
                        projectStats.overrun > 0 ? "text-red-600" : "text-black"
                      }`}>{projectStats.overrunStr}</h3>
                    </div>
                  </div>
                </div>

                {/* Section 2: Counts */}
                <div className="mb-8">
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    <button
                      onClick={() => setActiveTab("rfi")}
                      className="w-full flex items-center justify-between bg-green-50/20 p-3 rounded-none border border-black hover:bg-green-50/40 transition-colors text-left cursor-pointer"
                    >
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <div className="w-8 h-8 rounded-none bg-green-100/40 flex items-center justify-center text-green-600 shrink-0">
                          <FileText size={16} />
                        </div>
                        <span className="text-sm font-bold text-black uppercase tracking-wider truncate">RFIs</span>
                      </div>
                      <span className="text-sm font-bold text-black pr-1">{rfiData.length}</span>
                    </button>

                    <button
                      onClick={() => setActiveTab("submittals")}
                      className="w-full flex items-center justify-between bg-green-50/20 p-3 rounded-none border border-black hover:bg-green-50/40 transition-colors text-left cursor-pointer"
                    >
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <div className="w-8 h-8 rounded-none bg-green-100/40 flex items-center justify-center text-green-600 shrink-0">
                          <FileText size={16} />
                        </div>
                        <span className="text-sm font-bold text-black uppercase tracking-wider truncate">Submittals</span>
                      </div>
                      <span className="text-sm font-bold text-black pr-1">{submittalData.length}</span>
                    </button>

                    <button
                      onClick={() => setActiveTab("changeOrder")}
                      className="w-full flex items-center justify-between bg-green-50/20 p-3 rounded-none border border-black hover:bg-green-50/40 transition-colors text-left cursor-pointer"
                    >
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <div className="w-8 h-8 rounded-none bg-green-100/40 flex items-center justify-center text-green-600 shrink-0">
                          <Settings size={16} />
                        </div>
                        <span className="text-sm font-bold text-black uppercase tracking-wider truncate">Change Orders</span>
                      </div>
                      <span className="text-sm font-bold text-black pr-1">{changeOrderData.length}</span>
                    </button>

                    <button
                      onClick={() => setActiveTab("milestones")}
                      className="w-full flex items-center justify-between bg-green-50/20 p-3 rounded-none border border-black hover:bg-green-50/40 transition-colors text-left cursor-pointer"
                    >
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <div className="w-8 h-8 rounded-none bg-green-100/40 flex items-center justify-center text-green-600 shrink-0">
                          <Clock size={16} />
                        </div>
                        <span className="text-sm font-bold text-black uppercase tracking-wider truncate">Milestones</span>
                      </div>
                      <span className="text-sm font-bold text-black pr-1">{milestones.length}</span>
                    </button>

                    <button
                      onClick={() => setActiveTab("files")}
                      className="w-full flex items-center justify-between bg-green-50/20 p-3 rounded-none border border-black hover:bg-green-50/40 transition-colors text-left cursor-pointer"
                    >
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <div className="w-8 h-8 rounded-none bg-green-100/40 flex items-center justify-center text-green-600 shrink-0">
                          <FolderOpenDot size={16} />
                        </div>
                        <span className="text-sm font-bold text-black uppercase tracking-wider truncate">Docs / Files</span>
                      </div>
                      <span className="text-sm font-bold text-black pr-1">
                        {project.files?.length || project.documents?.length || 0}
                      </span>
                    </button>
                  </div>
                </div>                {/* Section 3: Project Details & Scopes */}
                <div className="bg-[#f4faf0] p-6 rounded-none mt-8">
                  {/* Project Details Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8 text-base">
                    {/* Left Column */}
                    <div className="space-y-4">
                      <div className="flex justify-between items-center pb-2 border-b border-gray-200">
                        <span className="font-bold text-black uppercase tracking-wider">Department:</span>
                        <span className="font-bold text-black uppercase">{project.department?.name || "—"}</span>
                      </div>
                      <div className="flex justify-between items-center pb-2 border-b border-gray-200">
                        <span className="font-bold text-black uppercase tracking-wider">Team / Tools:</span>
                        <span className="font-bold text-black uppercase">{project.team?.name || "—"} / {project.tools || "—"}</span>
                      </div>
                      <div className="flex justify-between items-center pb-2 border-b border-gray-200">
                        <span className="font-bold text-black uppercase tracking-wider">WBT Manager:</span>
                        <span className="font-bold text-black uppercase">
                          {project.manager
                            ? `${project.manager.firstName} ${project.manager.lastName}`
                            : "—"}
                        </span>
                      </div>
                      {project.assists && project.assists.length > 0 && (
                        <div className="flex justify-between items-center pb-2 border-b border-gray-200">
                          <span className="font-bold text-black uppercase tracking-wider">Assists:</span>
                          <span className="font-bold text-black uppercase">
                            {project.assists.map(assist =>
                              `${assist.user?.firstName || ''} ${assist.user?.lastName || ''}`.trim()
                            ).join(", ")}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Right Column */}
                    <div className="space-y-4">
                      <div className="flex justify-between items-center pb-2 border-b border-gray-200">
                        <span className="font-bold text-black uppercase tracking-wider">Fabricator:</span>
                        <span className="font-bold text-black uppercase">{project.fabricator?.fabName || "—"}</span>
                      </div>
                      <div className="flex justify-between items-center pb-2 border-b border-gray-200">
                        <span className="font-bold text-black uppercase tracking-wider">Stage:</span>
                        <span className="font-bold text-black uppercase">{project.stage || "—"}</span>
                      </div>
                      <div className="flex justify-between items-center pb-2 border-b border-gray-200">
                        <span className="font-bold text-black uppercase tracking-wider">Start Date:</span>
                        <span className="font-bold text-black">{formatDate(project.startDate)}</span>
                      </div>
                      <div className="flex justify-between items-center pb-2 border-b border-gray-200">
                        <span className="font-bold text-black uppercase tracking-wider">Approval Date:</span>
                        <span className="font-bold text-black">{formatDate(project.approvalDate)}</span>
                      </div>
                      <div className="flex justify-between items-center pb-2 border-b border-gray-200">
                        <span className="font-bold text-black uppercase tracking-wider">Fabrication Date:</span>
                        <span className="font-bold text-black">{formatDate(project.fabricationDate)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Connection Design Scope */}
                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <h4 className="text-sm font-bold text-black uppercase tracking-wider mb-3">Connection Design Scope</h4>
                    <div className="flex flex-wrap gap-2">
                      {project.connectionDesign && (
                        <span className="px-3 py-1.5 bg-white border border-gray-200 text-black text-sm font-semibold rounded-none uppercase tracking-wider">
                          Main Design
                        </span>
                      )}
                      {project.miscDesign && (
                        <span className="px-3 py-1.5 bg-white border border-gray-200 text-black text-sm font-semibold rounded-none uppercase tracking-wider">
                          Misc Design
                        </span>
                      )}
                      {project.customerDesign && (
                        <span className="px-3 py-1.5 bg-white border border-gray-200 text-black text-sm font-semibold rounded-none uppercase tracking-wider">
                          Customer Design
                        </span>
                      )}
                      {!project.connectionDesign && !project.miscDesign && !project.customerDesign && (
                        <span className="text-sm italic text-black">No Connection Design scope defined.</span>
                      )}
                    </div>
                  </div>

                  {/* Detailing Scope */}
                  <div className="mt-6">
                    <h4 className="text-sm font-bold text-black uppercase tracking-wider mb-3">Detailing Scope</h4>
                    <div className="flex flex-wrap gap-2">
                      {project.detailingMain && (
                        <span className="px-3 py-1.5 bg-white border border-gray-200 text-black text-sm font-semibold rounded-none uppercase tracking-wider">
                          Detailing Main
                        </span>
                      )}
                      {project.detailingMisc && (
                        <span className="px-3 py-1.5 bg-white border border-gray-200 text-black text-sm font-semibold rounded-none uppercase tracking-wider">
                          Detailing Misc
                        </span>
                      )}
                      {!project.detailingMain && !project.detailingMisc && (
                        <span className="text-sm italic text-black">No Detailing scope defined.</span>
                      )}
                    </div>
                  </div>

                  {/* Project Scope Description */}
                  {project.description && (
                    <div className="mt-6 pt-6 border-t border-gray-200">
                      <h4 className="text-sm font-bold text-black uppercase tracking-wider mb-3">Project Scope</h4>
                      <div
                        className="text-black bg-white p-4 rounded-none border border-gray-200 prose prose-sm max-w-none font-medium"
                        dangerouslySetInnerHTML={{
                          __html: project.description
                        }}
                      />
                    </div>
                  )}
                </div>

                {/* Section 4: Reports, Milestones, Other Tasks & WBS */}
                <div className="space-y-12 mt-12">
                  {/* Project Progress Reports */}
                  <div className="bg-[#f4faf0] p-6 rounded-none mt-8">
                    <ProjectProgress projectId={id} />
                  </div>

                  {/* Progress and Milestones */}
                  <div>
                    <ProjectMilestoneMetrics milestones={milestones} projectId={id} onUpdate={fetchProject} />
                  </div>
                </div>

                {Object.keys(otherTasksByBundle).length > 0 && (
                  <div className="mt-12">
                    <div className="pb-3 border-b border-gray-200 flex items-center gap-2 mb-4">
                      <ClipboardList className="w-5 h-5 text-black" />
                      <h4 className="text-base font-bold uppercase tracking-wider text-black">
                        Other Tasks &mdash; Logged Time
                      </h4>
                      <span className="ml-auto text-sm text-black font-semibold uppercase tracking-widest">
                        {Object.values(otherTasksByBundle).reduce((s, t) => s + t.length, 0)} tasks
                      </span>
                    </div>

                    <div className="divide-y divide-gray-100">
                      {Object.entries(otherTasksByBundle).map(([bundleKey, tasks]) => {
                        const bundleTotalSeconds = tasks.reduce(
                          (sum, t) =>
                            sum +
                            (t.workingHourTask || []).reduce(
                              (s, w) => s + (w.duration_seconds || 0),
                              0,
                            ),
                          0,
                        );

                        const statusMap = {
                          completed: "bg-green-100 text-green-700 border-green-200",
                          complete: "bg-green-100 text-green-700 border-green-200",
                          validate_complete: "bg-green-100 text-green-700 border-green-200",
                          complete_other: "bg-green-100 text-green-700 border-green-200",
                          assigned: "bg-blue-100 text-blue-700 border-blue-200",
                          in_progress: "bg-yellow-100 text-yellow-700 border-yellow-200",
                          rework: "bg-orange-100 text-orange-700 border-orange-200",
                        };

                        const isExpanded = !!expandedGroups[bundleKey];

                        return (
                          <div key={bundleKey} className="border-b border-gray-100 last:border-b-0">
                            <button
                              type="button"
                              onClick={() => toggleGroup(bundleKey)}
                              className="w-full flex items-center gap-3 py-3 hover:bg-slate-50 transition-colors text-left px-2"
                            >
                              <span className="w-1.5 h-1.5 rounded-none bg-[#6bbd45] shrink-0" />
                              <span className="flex-1 text-sm font-bold uppercase tracking-wider text-black">
                                {bundleKey}
                              </span>
                              <span className="text-sm font-bold text-black">
                                {tasks.length} task{tasks.length !== 1 ? "s" : ""}
                              </span>
                              <span className="text-sm font-bold text-[#3a8a1a] min-w-[52px] text-right">
                                {formatSeconds(bundleTotalSeconds)}
                              </span>
                              <span className="shrink-0 text-black ml-1">
                                {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                              </span>
                            </button>

                            {isExpanded && (
                              <div className="divide-y divide-gray-50 bg-slate-50/30 px-2 py-1">
                                {tasks.map((task, idx) => {
                                  const assignee = task.user
                                    ? `${task.user.firstName || ""} ${task.user.lastName || ""}`.trim()
                                    : task.assignedTo
                                      ? `${task.assignedTo.firstName || ""} ${task.assignedTo.lastName || ""}`.trim()
                                      : "Unassigned";

                                  const initials = assignee
                                    .split(" ")
                                    .filter(Boolean)
                                    .map((n) => n[0])
                                    .slice(0, 2)
                                    .join("")
                                    .toUpperCase();

                                  const taskSeconds = (task.workingHourTask || []).reduce(
                                    (s, w) => s + (w.duration_seconds || 0),
                                    0,
                                  );

                                  const sc =
                                    statusMap[(task.status || "").toLowerCase()] ||
                                    "bg-gray-100 text-black border-gray-200";

                                  return (
                                    <div
                                      key={task.id || idx}
                                      className="flex items-center gap-3 py-2.5 transition-colors"
                                    >
                                      <div className="w-7 h-7 rounded-none bg-gradient-to-br from-slate-500 to-slate-600 flex items-center justify-center text-xs font-bold text-white shrink-0">
                                        {initials || "?"}
                                      </div>

                                      <div className="flex-1 min-w-0">
                                        <p className="text-sm font-bold text-black truncate leading-tight">
                                          {assignee}
                                        </p>
                                        <p className="text-xs text-black truncate leading-tight mt-0.5">
                                          {task.name || task.title || `Task #${idx + 1}`}
                                        </p>
                                      </div>

                                      <span
                                        className={`text-xs font-bold px-2 py-0.5 rounded-none border uppercase tracking-wide shrink-0 ${sc}`}
                                      >
                                        {task.status || "—"}
                                      </span>

                                      <div className="flex items-center gap-1 shrink-0">
                                        <Clock className="w-3 h-3 text-black" />
                                        <span className="text-sm font-bold text-black min-w-[42px] text-right">
                                          {taskSeconds > 0 ? formatSeconds(taskSeconds) : "—"}
                                        </span>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Core WBS Categories — Logged & Allocated Time Overview */}
                <div className="mt-12">
                  <div className="pb-3 border-b border-gray-200 flex items-center gap-2 mb-6">
                    <ClipboardList className="w-5 h-5 text-black" />
                    <h4 className="text-base font-bold uppercase tracking-wider text-black">
                      Primary WBS &mdash; Logged &amp; Allocated Time
                    </h4>
                  </div>
                  <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
                    {[
                      { key: "modelling", label: "Modelling", color: "text-green-600", bg: "bg-green-50" },
                      { key: "modelling_checking", label: "Modeling C.", color: "text-green-600", bg: "bg-green-50" },
                      { key: "detailing", label: "Detailing", color: "text-green-600", bg: "bg-green-50" },
                      { key: "detailing_checking", label: "Detailing C.", color: "text-green-600", bg: "bg-green-50" },
                      { key: "erection", label: "Erection", color: "text-green-600", bg: "bg-green-50" },
                      { key: "erection_checking", label: "Erection C.", color: "text-green-600", bg: "bg-green-50" },
                    ].map((cat) => (
                      <div key={cat.key} className="p-4 bg-slate-50/40 hover:bg-slate-50 transition-colors flex flex-col items-center justify-center text-center">
                        <span className="text-sm font-bold uppercase tracking-wider text-black mb-2.5 truncate w-full">
                          {cat.label}
                        </span>
                        <div className="flex flex-col gap-1.5 w-full max-w-[110px]">
                          <div className={`px-2.5 py-1 rounded-none ${cat.bg} border border-[#6bbd45]/20 flex justify-between items-center text-sm shadow-none`}>
                            <span className="font-bold text-black uppercase tracking-wider">W:</span>
                            <span className={`font-bold ${cat.color}`}>
                              {wbsCategoryTotals[cat.key]?.logged > 0 ? formatSeconds(wbsCategoryTotals[cat.key].logged) : "00:00"}
                            </span>
                          </div>
                          <div className="px-2.5 py-1 rounded-none bg-blue-50 border border-blue-100 flex justify-between items-center text-sm shadow-none">
                            <span className="font-bold text-black uppercase tracking-wider">A:</span>
                            <span className="font-bold text-blue-600">
                              {wbsCategoryTotals[cat.key]?.allocated > 0 ? formatSeconds(wbsCategoryTotals[cat.key].allocated) : "00:00"}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

          {/* ✅ Files */}
          {activeTab === "files" && (
            <div className="space-y-4">
              <AllDocument projectId={id} />
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
              {project.assists && project.assists.length > 0 && (
                <p>
                  Assists:{" "}
                  {project.assists.map(assist =>
                    `${assist.user?.firstName || ''} ${assist.user?.middleName || ''} ${assist.user?.lastName || ''}`.trim()
                  ).join(", ")}
                </p>
              )}
            </div>
          )}

          {/* ✅ Notes */}
          {activeTab === "notes" && <AllNotes projectId={id} />}
          {activeTab === "wbs" && (userRole !== "staff" || isAssist) && (
            <div className="space-y-6">
              <WBS id={id} stage={project.stage || ""} />
              <WbsBreakdownPanel wbsTasksByBundle={wbsTasksByBundle} />
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
                      whitespace-nowrap px-6 py-1.5 border-2 rounded-none transition-all font-bold text-sm uppercase tracking-tight shadow-sm cursor-pointer
                      ${rfiView === "list"
                        ? "bg-green-50 text-black border-green-700/80"
                        : "bg-white text-black border-black hover:bg-green-50"
                      }
                    `}
                  >
                    All RFIs
                  </button>
                  {canCreate && (
                    <button
                      onClick={() => setRfiView("add")}
                      className={`
                        whitespace-nowrap px-6 py-1.5 border-2 rounded-none transition-all font-bold text-sm uppercase tracking-tight shadow-sm cursor-pointer
                        ${rfiView === "add"
                          ? "bg-green-50 text-black border-green-700/80"
                          : "bg-white text-black border-black hover:bg-green-50"
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
                <AllRFI rfiData={rfiData} onUpdate={fetchProject} />
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
                      whitespace-nowrap px-6 py-1.5 border-2 rounded-none transition-all font-bold text-sm uppercase tracking-tight shadow-sm cursor-pointer
                      ${submittalView === "list"
                        ? "bg-green-50 text-black border-green-700/80"
                        : "bg-white text-black border-black hover:bg-green-50"
                      }
                    `}
                  >
                    All Submittals
                  </button>
                  {canCreate && (
                    <button
                      onClick={() => setSubmittalView("add")}
                      className={`
                        whitespace-nowrap px-6 py-1.5 border-2 rounded-none transition-all font-bold text-sm uppercase tracking-tight shadow-sm cursor-pointer
                        ${submittalView === "add"
                          ? "bg-green-50 text-black border-green-700/80"
                          : "bg-white text-black border-black hover:bg-green-50"
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
                <AllSubmittals submittalData={submittalData} projectId={id} />
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
          {activeTab === "CDrfi" && (userRole !== "staff" || isAssist) && (
            <div className="space-y-4">
              {/* Sub-tabs for RFI */}
              <div className="flex justify-start mb-4">
                <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                  <button
                    onClick={() => setRfiView("list")}
                    className={`
                      whitespace-nowrap px-6 py-1.5 border-2 rounded-none transition-all font-bold text-sm uppercase tracking-tight shadow-sm cursor-pointer
                      ${rfiView === "list"
                        ? "bg-green-50 text-black border-green-700/80"
                        : "bg-white text-black border-black hover:bg-green-50"
                      }
                    `}
                  >
                    All RFIs
                  </button>
                  {canCreate && (
                    <button
                      onClick={() => setRfiView("add")}
                      className={`
                        whitespace-nowrap px-6 py-1.5 border-2 rounded-none transition-all font-bold text-sm uppercase tracking-tight shadow-sm cursor-pointer
                        ${rfiView === "add"
                          ? "bg-green-50 text-black border-green-700/80"
                          : "bg-white text-black border-black hover:bg-green-50"
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
                <AllRFI rfiData={rfiData} onUpdate={fetchProject} />
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
          {activeTab === "CDsubmittals" && (userRole !== "staff" || isAssist) && (
            <div className="space-y-4">
              {/* Sub-tabs for RFI */}
              <div className="flex justify-start mb-4">
                <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                  <button
                    onClick={() => setSubmittalView("list")}
                    className={`
                      whitespace-nowrap px-6 py-1.5 border-2 rounded-none transition-all font-bold text-sm uppercase tracking-tight shadow-sm cursor-pointer
                      ${submittalView === "list"
                        ? "bg-green-50 text-black border-green-700/80"
                        : "bg-white text-black border-black hover:bg-green-50"
                      }
                    `}
                  >
                    All Submittals
                  </button>
                  {canCreate && (
                    <button
                      onClick={() => setSubmittalView("add")}
                      className={`
                        whitespace-nowrap px-6 py-1.5 border-2 rounded-none transition-all font-bold text-sm uppercase tracking-tight shadow-sm cursor-pointer
                        ${submittalView === "add"
                          ? "bg-green-50 text-black border-green-700/80"
                          : "bg-white text-black border-black hover:bg-green-50"
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
                <AllSubmittals submittalData={submittalData} projectId={id} />
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
          {activeTab === "changeOrder" && (userRole !== "staff" || isAssist) && (
            <div className="space-y-4">
              {/* Sub-tabs for RFI */}
              <div className="flex justify-start mb-4">
                <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                  <button
                    onClick={() => setChangeOrderView("list")}
                    className={`
                      whitespace-nowrap px-6 py-1.5 border-2 rounded-none transition-all font-bold text-sm uppercase tracking-tight shadow-sm cursor-pointer
                      ${changeOrderView === "list"
                        ? "bg-green-50 text-black border-green-700/80"
                        : "bg-white text-black border-black hover:bg-green-50"
                      }
                    `}
                  >
                    All Change Order
                  </button>
                  {canCreate && (
                    <button
                      onClick={() => setChangeOrderView("add")}
                      className={`
                        whitespace-nowrap px-6 py-1.5 border-2 rounded-none transition-all font-bold text-sm uppercase tracking-tight shadow-sm cursor-pointer
                        ${changeOrderView === "add"
                          ? "bg-green-50 text-black border-green-700/80"
                          : "bg-white text-black border-black hover:bg-green-50"
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
          {activeTab === "teamAnalytics" && (
            <TeamsAnalytics
              projectId={id}
              managerId={project.managerID}
              tasks={projectTasks}
            />
          )}
          {activeTab === "projectNotes" && (
            <AllProjectNotes projectId={id} project={project} />
          )}
          {activeTab === "coordinationDrawings" && (
            <CoordinationDrawings projectId={id} />
          )}
          {activeTab === "wpr" && (
            <WorkProgressReport
              projectId={id}
              project={project}
              milestones={milestones}
              rfiData={rfiData}
              submittalData={submittalData}
              coordinationDrawings={coordinationDrawings}
              onUpdate={fetchProject}
            />
          )}
        </div>
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
      )
      }

      {showAssistsModal && (
        <AddAssistsModal
          projectId={id}
          currentAssists={project?.assists || []}
          onClose={() => setShowAssistsModal(false)}
          onSuccess={() => {
            setShowAssistsModal(false);
            fetchProject();
          }}
        />
      )}
    </>
  );
};

/* ─────────────────────────────────────────────
   WBS Breakdown Panel imported above
───────────────────────────────────────────── */

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
    className={`px-4 py-1.5 text-sm font-black uppercase tracking-widest rounded-full border border-black ${active
      ? "bg-green-100 text-black shadow-sm"
      : "bg-gray-100 text-black/50"
      }`}
  >
    {label}
  </span>
);

export default GetProjectById;
