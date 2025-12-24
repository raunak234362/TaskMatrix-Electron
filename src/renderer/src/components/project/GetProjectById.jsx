import { useEffect, useState, useMemo, useCallback } from "react";
import {
  Loader2,
  AlertCircle,
  FileText,
  Link2,
  Settings,
  FolderOpenDot,
  Users,
  Clock,
  ClipboardList,
} from "lucide-react";
import Service from "../../api/Service";
import { openFileSecurely } from "../../utils/openFileSecurely";
import Button from "../fields/Button";
import AllMileStone from "./mileStone/AllMileStone";
import AllDocument from "./projectDocument/AllDocument";

import AllRFI from "../rfi/AllRfi";
import AddRFI from "../rfi/AddRFI";
import AllSubmittals from "../submittals/AllSubmittals";
import AllNotes from "./notes/AllNotes";
import EditProject from "./EditProject";



const GetProjectById = ({
  id
}) => {
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("details");
  const [rfiView, setRfiView] = useState("list");
  const [submittalView, setSubmittalView] = useState("list");
  const [editModel, setEditModel] = useState(null);
  const userRole = sessionStorage.getItem("userRole")?.toLowerCase() || "";
  const rfiData = useMemo(() => {
    return project?.rfi || [];
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

  console.log(editModel);


  const handleModelClose = () => {
    setEditModel(null);
  };


  const submittalData = useMemo(() => {
    return project?.submittals || [];
  }, [project]);

  const rfiColumns = [
    { accessorKey: "subject", header: "Subject" },
    {
      accessorKey: "sender",
      header: "Sender",
      cell: ({ row }) =>
        `${row.original.sender?.firstName || ""} ${row.original.sender?.lastName || ""
        }`,
    },
    {
      accessorKey: "recepients",
      header: "Recipient",
      cell: ({ row }) =>
        `${row.original.recepients?.firstName || ""} ${row.original.recepients?.lastName || ""
        }`,
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => (
        <span
          className={`px-2 py-1 rounded-full text-xs font-medium ${row.original.status
              ? "bg-green-100 text-green-800"
              : "bg-yellow-100 text-yellow-800"
            }`}
        >
          {row.original.status ? "Closed" : "Open"}
        </span>
      ),
    },
    {
      accessorKey: "date",
      header: "Date",
      cell: ({ row }) => formatDate(row.original.date),
    },
  ];


  const submittalColumns = [
    { accessorKey: "subject", header: "Subject" },
    {
      accessorKey: "sender",
      header: "Sender",
      cell: ({ row }) =>
        `${row.original.sender?.firstName || ""} ${row.original.sender?.lastName || ""
        }`,
    },
    {
      accessorKey: "recepients",
      header: "Recipient",
      cell: ({ row }) =>
        `${row.original.recepients?.firstName || ""} ${row.original.recepients?.lastName || ""
        }`,
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => (
        <span
          className={`px-2 py-1 rounded-full text-xs font-medium ${row.original.status
              ? "bg-green-100 text-green-800"
              : "bg-yellow-100 text-yellow-800"
            }`}
        >
          {row.original.status ? "Closed" : "Open"}
        </span>
      ),
    },
    {
      accessorKey: "date",
      header: "Date",
      cell: ({ row }) => formatDate(row.original.date),
    },
  ];

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
    console.log(id);
    // FetchWBSbyProjectId();
  }, [id]);


  const formatDate = (date) =>
    date
      ? new Date(date).toLocaleString("en-IN", {
        dateStyle: "medium",
        timeStyle: "short",
      })
      : "—";

  if (loading)
    return (
      <div className="flex items-center justify-center py-8 text-gray-500">
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
      <div className="w-full bg-white h-auto p-3 md:p-6 rounded-lg shadow-sm border relative">
        {/* Header */}
        <div className="flex justify-between items-center border-b pb-3 mb-3">
          <div>
            <h2 className="text-xl md:text-2xl font-semibold text-teal-700">{project.name}</h2>
            <p className="text-gray-500 text-sm">Project No: {project.projectNumber}</p>
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
        <div className="mb-4 border-b">
          {/* Mobile Dropdown */}
          <div className="block md:hidden mb-2">
            <select
              value={activeTab}
              onChange={(e) => setActiveTab(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-teal-500"
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
              ].map((tab) => (
                <option key={tab.key} value={tab.key}>
                  {tab.label}
                </option>
              ))}
            </select>
          </div>

          {/* Desktop Tabs */}
          <div className="hidden md:flex gap-2 overflow-x-auto">
            {[
              { key: "details", label: "Details", icon: ClipboardList },
              { key: "files", label: "Files", icon: FileText },
              { key: "wbs", label: "WBS", icon: FileText },
              { key: "milestones", label: "Milestones", icon: FileText },
              { key: "notes", label: "Notes", icon: FolderOpenDot },
              { key: "rfi", label: "RFI", icon: FolderOpenDot },
              { key: "submittals", label: "Submittals", icon: FolderOpenDot },
            ].map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`flex items-center gap-2 px-4 py-2 text-sm rounded-t-md font-medium transition-colors whitespace-nowrap ${activeTab === key
                    ? "bg-teal-600 text-white"
                    : "text-gray-600 hover:text-teal-700 hover:bg-gray-50"
                  }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="p-2">
          {/* ✅ Details */}
          {activeTab === "details" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
              <div className="md:col-span-2 mt-6">
                <h4 className="font-semibold text-teal-700 mb-2 flex items-center gap-1">
                  <FolderOpenDot className="w-4 h-4" /> Description
                </h4>
                <p className="text-gray-700 bg-gray-50 p-3 rounded-lg border border-gray-200 shadow-sm">
                  {project.description || "No description available."}
                </p>
              </div>
              <div className="space-y-3">
                <InfoRow label="Estimated Hours" value={project.estimatedHours || 0} />
                <InfoRow label="Department" value={project.department?.name || "—"} />
                <InfoRow label="Team" value={project.team?.name || "—"} />
                <InfoRow
                  label="Manager"
                  value={
                    project.manager
                      ? `${project.manager.firstName} ${project.manager.lastName} (${project.manager.username})`
                      : "—"
                  }
                />
                <InfoRow label="Fabricator" value={project.fabricator?.fabName || "—"} />
                <InfoRow label="Tools" value={project.tools || "—"} />
              </div>

              <div className="space-y-3">
                <InfoRow label="Stage" value={project.stage || "—"} />
                <InfoRow label="Start Date" value={formatDate(project.startDate)} />
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
                <h4 className="text-lg font-semibold text-teal-700 mb-3 flex items-center gap-1">
                  <Settings className="w-5 h-5" /> Connection Design Scope
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <ScopeTag label="Connection Design" active={project.connectionDesign} />
                  <ScopeTag label="Misc Design" active={project.miscDesign} />
                  <ScopeTag label="Customer Design" active={project.customerDesign} />
                </div>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg border text-sm">
                <h4 className="text-lg font-semibold text-teal-700 mb-3 flex items-center gap-1">
                  <Settings className="w-5 h-5" /> Detailing Scope
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <ScopeTag label="Detailing Main" active={project.detailingMain} />
                  <ScopeTag label="Detailing Misc" active={project.detailingMisc} />
                </div>
              </div>

              {/* Footer Buttons */}
              <div className="pt-2 flex flex-wrap gap-3">
                <Button className="py-1 px-3 text-sm bg-teal-600 text-white" onClick={() => handleEditModel(project)}>
                  Edit Project
                </Button>
              </div>
            </div>
          )}

          {/* ✅ Files */}
          {activeTab === "files" && (
            <div className="space-y-4">
              {Array.isArray(project.files) && project.files.length > 0 ? (
                <ul className="text-gray-700 space-y-1">
                  {project.files.map((file) => (
                    <li
                      key={file.id}
                      className="flex justify-between items-center bg-white px-3 py-2 rounded-md shadow-sm border"
                    >
                      <span>{file.originalName}</span>
                      <a
                        className="text-teal-600 text-sm flex items-center gap-1 hover:underline cursor-pointer"
                        onClick={() => openFileSecurely("project", id, file.id)}
                      >
                        <Link2 className="w-3 h-3" /> Open
                      </a>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-600 italic">No files attached.</p>
              )}
              <AllDocument />
            </div>
          )}
          {
            activeTab === "milestones" && (
              <AllMileStone project={project} onUpdate={fetchProject} />
            )
          }

          {/* ✅ Team */}
          {activeTab === "team" && (
            <div className="text-gray-700 text-sm">
              <h4 className="font-semibold text-teal-700 mb-2 flex items-center gap-1">
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
            <div className="text-gray-600 italic text-center py-10">
              <Clock className="w-6 h-6 mx-auto mb-2 text-gray-400" />
              Timeline view will be integrated soon.
            </div>
          )}



          {/* ✅ Notes */}
          {activeTab === "notes" && (
            <AllNotes projectId={id} />
          )}
          {activeTab === "wbs" && (
            <div className="text-gray-600 italic text-center py-10">
              {/* <FolderOpenDot className="w-6 h-6 mx-auto mb-2 text-gray-400" /> */}
              <WBS id={id} />
            </div>
          )}
          {activeTab === "rfi" && (
            <div className="space-y-4">
              {/* Sub-tabs for RFI */}
              <div className="flex justify-start border-b border-gray-200 mb-4">
                <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                  <button
                    onClick={() => setRfiView("list")}
                    className={`
                      whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm
                      ${rfiView === "list"
                        ? "border-teal-500 text-teal-600"
                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
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
                          ? "border-teal-500 text-teal-600"
                          : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
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
                <AddRFI project={project} />
              )}
            </div>
          )}
          {activeTab === "submittals" && (
            <div className="space-y-4">
              {/* Sub-tabs for RFI */}
              <div className="flex justify-start border-b border-gray-200 mb-4">
                <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                  <button
                    onClick={() => setSubmittalView("list")}
                    className={`
                      whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm
                      ${submittalView === "list"
                        ? "border-teal-500 text-teal-600"
                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
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
                          ? "border-teal-500 text-teal-600"
                          : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
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
                <AllSubmittals subData={submittalData} />
              ) : (
                <AddRFI project={project} />
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
const InfoRow = ({ label, value }) => (
  <div className="flex justify-between border-b border-gray-100 pb-1">
    <span className="font-medium text-gray-600">{label}:</span>
    <span className="text-gray-900">{value}</span>
  </div>
);

// ✅ ScopeTag Component
const ScopeTag = ({ label, active }) => (
  <span
    className={`px-3 py-1 text-xs font-medium rounded-full ${active
        ? "bg-teal-100 text-teal-800 border border-teal-300"
        : "bg-gray-100 text-gray-500 border border-gray-200"
      }`}
  >
    {label}
  </span>
);

export default GetProjectById;
