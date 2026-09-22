import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";
import Button from "../fields/Button";
import MultipleFileUpload from "../fields/MultipleFileUpload";
import Service from "../../api/Service";
import { X, Loader2 } from "lucide-react";

const CoResponseModal = ({
  CoId,
  projectId: propProjectId,
  co: propCo,
  fabricatorName: propFabName,
  projectName: propProjName,
  onClose,
  onSuccess,
}) => {
  const { register, handleSubmit, control } = useForm();
  const reduxProjects = useSelector((state) => state.projectInfo?.projectData || []);
  const reduxFabricators = useSelector((state) => state.fabricatorInfo?.fabricatorData || []);

  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (data) => {
    try {
      setLoading(true);
      const userId = sessionStorage.getItem("userId") || "";
      const userRole = sessionStorage.getItem("userRole") || "";

      const formData = new FormData();

      formData.append("CoId", CoId);
      formData.append("description", (data.description || "").toUpperCase());
      formData.append("status", data.status);
      formData.append("userId", userId);
      formData.append("userRole", userRole);
      formData.append("ParentResponseId", data.parentResponseId ?? "");

      if (files?.length) {
        files.forEach((file) => {
          formData.append("files", file);
        });
      }

      let fabricatorName = propFabName || "";
      let projectName = propProjName || "";
      let co = propCo;

      if (!co && CoId) {
        try {
          const coRes = await Service.GetChangeOrderByID(CoId);
          co = coRes?.data?.data || coRes?.data || coRes;
        } catch (e) {
          console.error("Error fetching CO by ID in CoResponseModal:", e);
        }
      }

      if (!fabricatorName) {
        fabricatorName =
          co?.fabricator?.fabName ||
          co?.fabricator?.name ||
          co?.fabricatorName ||
          co?.Project?.fabricator?.fabName ||
          co?.Project?.fabricator?.name ||
          co?.Project?.fabricatorName ||
          co?.project?.fabricator?.fabName ||
          co?.project?.fabricator?.name ||
          co?.project?.fabricatorName ||
          "";
      }

      if (!projectName) {
        projectName =
          co?.projectName ||
          co?.project?.projectName ||
          co?.project?.name ||
          co?.Project?.projectName ||
          co?.Project?.name ||
          "";
      }

      const pid =
        (typeof propProjectId === "object" ? (propProjectId?.id || propProjectId?._id) : propProjectId) ||
        (typeof co?.project === "string" ? co.project : null) ||
        (typeof co?.Project === "string" ? co.Project : null) ||
        co?.projectId ||
        co?.project_id ||
        co?.ProjectId ||
        co?.project?.id ||
        co?.project?._id ||
        co?.Project?.id ||
        co?.Project?._id;

      let project = null;
      if (pid) {
        project = reduxProjects.find((p) => String(p.id || p._id) === String(pid));

        if (!project || !fabricatorName || !projectName) {
          try {
            const projectRes = await Service.GetProjectById(pid);
            const apiProj = projectRes?.data?.project || projectRes?.data?.data || projectRes?.data || projectRes;
            if (apiProj && typeof apiProj === "object") {
              project = { ...project, ...apiProj };
            }
          } catch (e) {
            console.error("Error fetching project by ID in CoResponseModal:", e);
          }
        }
      }

      if (project) {
        if (!projectName) {
          projectName = project?.projectName || project?.name || "";
        }
        if (!fabricatorName) {
          fabricatorName =
            project?.fabricator?.fabName ||
            project?.fabricator?.name ||
            project?.fabricatorName ||
            "";

          if (!fabricatorName) {
            const fabId = project?.fabricatorId || (typeof project?.fabricator === "string" ? project.fabricator : null);
            if (fabId) {
              const fab = reduxFabricators.find((f) => String(f.id || f._id) === String(fabId));
              if (fab) {
                fabricatorName = fab.fabName || fab.name || "";
              }
            }
          }
        }
      }

      if (!fabricatorName) {
        const fabId = co?.fabricatorId || (typeof co?.fabricator === "string" ? co.fabricator : null);
        if (fabId) {
          const fab = reduxFabricators.find((f) => String(f.id || f._id) === String(fabId));
          if (fab) {
            fabricatorName = fab.fabName || fab.name || "";
          }
        }
      }

      // Safe fallback to prevent "fabricatorName query param is required for upload"
      if (!fabricatorName) {
        fabricatorName = "UNKNOWN";
      }
      if (!projectName) {
        projectName = "UNKNOWN";
      }

      await Service.addCOResponse(formData, CoId, fabricatorName, projectName);

      toast.success("CO response added successfully");
      if (onSuccess) onSuccess();
      if (onClose) onClose();
    } catch (error) {
      console.error("CO Response error:", error);
      toast.error(error?.response?.data?.message || "Failed to add CO response");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-[130] flex items-center justify-center">
      <div className="bg-white w-full max-w-lg p-6 rounded-xl relative">
        <button onClick={onClose} className="px-6 py-1.5 bg-red-50 text-black border-2 border-red-700/80 rounded-lg hover:bg-red-100 transition-all font-bold text-sm uppercase tracking-tight shadow-sm">
          Close
        </button>

        <h2 className="text-xl font-semibold text-green-700">
          Add CO Response
        </h2>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-4">
          {/* Description */}
          <textarea
            {...register("description", { required: true })}
            rows={4}
            className="w-full border rounded-md p-3 uppercase"
            placeholder="WRITE YOUR RESPONSE..."
          />

          {/* Status */}
          <select
            {...register("status", { required: true })}
            className="w-full border rounded-md p-2"
          >
            <option value="">Select Status</option>
            <option value="PENDING">Pending</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
          </select>

          {/* Files */}
          <Controller
            name="files"
            control={control}
            render={() => <MultipleFileUpload onFilesChange={setFiles} initialFiles={files} />}
          />

          <div className="flex justify-end gap-3">
            <Button onClick={onClose}>Cancel</Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-green-600 text-white"
            >
              {loading ? "Submitting..." : "Submit"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CoResponseModal;
