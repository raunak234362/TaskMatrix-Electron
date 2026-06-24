import { useState } from "react";
import Button from "../fields/Button";
import Service from "../../api/Service";
import RichTextEditor from "../fields/RichTextEditor";
import MultipleFileUpload from "../fields/MultipleFileUpload";
import { toast } from "react-toastify";


const SubmittalResponseModal = ({
  submittalId,
  submittalVersionId,
  onClose,
  onSuccess,
  parentResponseId = null,
}) => {
  console.log("submittalId:", submittalId, "submittalVersionId:", submittalVersionId);

  const [reason, setReason] = useState("");
  const [description, setDescription] = useState("");

  const [files, setFiles] = useState([]);

  const handleSubmit = async () => {
    const userId = sessionStorage.getItem("userId") || "";
    const userRole = sessionStorage.getItem("userRole") || "";

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
    formData.append("userId", userId);
    formData.append("userRole", userRole);

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
        const project = projectRes?.data || projectRes;
        fabricatorName = project?.fabricator?.fabName || project?.fabricatorName || "";
        projectName = project?.projectName || project?.name || "";
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
    <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-[200]">
      <div className="bg-white p-6 rounded-xl w-full max-w-lg shadow-lg relative space-y-4">
        {/* CLOSE BUTTON */}
        {/* <button onClick={onClose} className="absolute top-3 right-3">
          <X size={18} />
        </button> */}

        <h2 className="text-xl font-semibold text-green-700">
          Add Submittal Response
        </h2>

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
