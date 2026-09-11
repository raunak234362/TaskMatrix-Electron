import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import Button from "../fields/Button";
import Service from "../../api/Service";
import RichTextEditor from "../fields/RichTextEditor";
import MultipleFileUpload from "../fields/MultipleFileUpload";
import { toast } from "react-toastify";
import { isCurrentCheckerOrModeler, getProjectManager, getProjectManagerName } from "../../utils/designationUtils";

const SubmittalResponseModal = ({
  submittalId,
  submittalVersionId,
  project,
  onClose,
  onSuccess,
  parentResponseId = null,
}) => {
  console.log("submittalId:", submittalId, "submittalVersionId:", submittalVersionId);

  const [reason, setReason] = useState("");
  const [description, setDescription] = useState("");
  const [isClientSide, setIsClientSide] = useState(false);
  const [files, setFiles] = useState([]);

  const staffData = useSelector((state) => state.userInfo?.staffData || []);
  const currentUserDetail = useSelector((state) => state.userInfo?.userDetail);
  const [resolvedProject, setResolvedProject] = useState(project || null);

  useEffect(() => {
    if (project && (project.manager || project.managerID || project.managerId)) {
      setResolvedProject(project);
      return;
    }
    const loadProject = async () => {
      if (!submittalId) return;
      try {
        const submittalDetails = await Service.GetSubmittalbyId(submittalId);
        const pid = submittalDetails?.projectId || submittalDetails?.project_id || submittalDetails?.data?.projectId || submittalDetails?.data?.project_id || submittalDetails?.project?.id || submittalDetails?.data?.project?.id;
        if (pid) {
          const projectRes = await Service.GetProjectById(pid);
          setResolvedProject(projectRes?.data || projectRes);
        } else if (submittalDetails?.project) {
          setResolvedProject(submittalDetails.project);
        }
      } catch (err) {
        console.error("Error loading project in SubmittalResponseModal:", err);
      }
    };
    loadProject();
  }, [submittalId, project]);

  const userRoleSession = sessionStorage.getItem("userRole")?.toUpperCase() || "";
  const isEligibleForClientSide = ["ADMIN", "OPERATION_EXECUTIVE", "PROJECT_MANAGER", "DEPT_MANAGER", "DEPUTY_MANAGER"].includes(userRoleSession);
  const isCheckerOrModeler = isCurrentCheckerOrModeler(staffData, currentUserDetail);
  const pmName = isCheckerOrModeler ? getProjectManagerName(resolvedProject, staffData) : null;

  const handleSubmit = async () => {
    const userId = sessionStorage.getItem("userId") || "";
    let finalUserRole = sessionStorage.getItem("userRole") || "";
    let effectiveUserId = userId;

    if (isClientSide) {
      finalUserRole = "CLIENT";
    } else if (isCheckerOrModeler) {
      const pm = getProjectManager(resolvedProject, staffData);
      if (pm?.id || resolvedProject?.managerID) {
        effectiveUserId = pm?.id || resolvedProject?.managerID;
        finalUserRole = "PROJECT_MANAGER";
      }
    }

    if (!reason.trim()) {
      toast.error("Reason is required");
      return;
    }

    const strippedDescription = description.replace(/<[^>]+>/g, "").trim();
    if (!strippedDescription) {
      toast.error("Description is required");
      return;
    }

    const formData = new FormData();

    formData.append("reason", reason);
    formData.append("description", description);

    formData.append("submittalsId", submittalId);
    formData.append("submittalVersionId", submittalVersionId || "");
    formData.append("userId", effectiveUserId);
    formData.append("userRole", finalUserRole);

    if (parentResponseId) {
      formData.append("parentResponseId", parentResponseId);
    }

    files.forEach((file) => formData.append("files", file));

    try {
      let fabricatorName = "";
      let projectName = "";
      const submittalDetails = await Service.GetSubmittalbyId(submittalId);
      const pid = submittalDetails?.projectId || submittalDetails?.project_id || submittalDetails?.data?.projectId || submittalDetails?.data?.project_id || submittalDetails?.project?.id || submittalDetails?.data?.project?.id;
      if (pid) {
        const projectRes = await Service.GetProjectById(pid);
        const p = projectRes?.data || projectRes;
        fabricatorName = p?.fabricator?.fabName || p?.fabricatorName || "";
        projectName = p?.projectName || p?.name || "";
      }
      await Service.addSubmittalResponse(formData, fabricatorName, projectName);
      toast.success("Response submitted successfully");
      if (onSuccess) onSuccess();
      if (onClose) onClose();
    } catch (err) {
      console.error("Submittal response failed:", err);
      toast.error(err?.response?.data?.message || "Failed to submit response");
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-200">
      <div className="bg-white p-6 rounded-xl w-full max-w-lg shadow-lg relative space-y-4">
        {/* CLOSE BUTTON */}
        {/* <button onClick={onClose} className="absolute top-3 right-3">
          <X size={18} />
        </button> */}

        <h2 className="text-xl font-semibold text-green-700">
          Add Submittal Response
        </h2>

        {isCheckerOrModeler && !isClientSide && pmName && (
          <div className="bg-blue-50 border border-blue-200 text-blue-800 text-xs px-3 py-2 font-medium rounded-md">
            Submitting as Project Manager: <span className="font-bold">{pmName}</span>
          </div>
        )}

        {/* REASON */}
        <div>
          <label className="text-sm font-medium">Reason *</label>
          <input
            type="text"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full border rounded-md p-2 mt-1"
            placeholder="Enter reason..."
          />
        </div>

        {/* DESCRIPTION */}
        <div>
          <label className="text-sm font-medium">Description *</label>
          <RichTextEditor
            value={description}
            onChange={setDescription}
            placeholder="Write your message..."
          />
        </div>

        {/* STATUS ENUM */}
        {/* <div>
          <label className="text-sm font-medium">Status</label>
          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setWbtStatus(e.target.value);
            }}
            className="w-full border rounded-md p-2 mt-1"
          >
            <option value="PENDING">Pending</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
          </select>
        </div> */}

        {/* FILE UPLOAD */}
        <div>
          <label className="text-sm font-medium">Attachments</label>
          <MultipleFileUpload onFilesChange={setFiles} initialFiles={files} />
        </div>

        {/* WRITE FROM CLIENT SIDE */}
        {parentResponseId && isEligibleForClientSide && (
          <div className="flex items-center gap-2 mt-4">
            <input
              type="checkbox"
              id="clientSide"
              checked={isClientSide}
              onChange={(e) => setIsClientSide(e.target.checked)}
              className="w-4 h-4 cursor-pointer text-green-600 rounded border-gray-300 focus:ring-green-500"
            />
            <label htmlFor="clientSide" className="text-sm font-medium text-gray-700 cursor-pointer">
              Write from Client Side
            </label>
          </div>
        )}

        {/* ACTIONS */}
        <div className="flex justify-end gap-2 pt-2">
          <Button onClick={onClose}>Cancel</Button>
          <Button className="bg-green-600 text-white" onClick={handleSubmit}>
            Submit Response
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SubmittalResponseModal;
