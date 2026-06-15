import React, { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { toast } from "react-toastify";
import MultipleFileUpload from "../fields/MultipleFileUpload";
import Service from "../../api/Service";
import { X } from "lucide-react";
import Button from "../fields/Button";

import RichTextEditor from "../fields/RichTextEditor";


const RFIResponseModal = ({
  rfiId,
  onClose,
  onSuccess,
}) => {
  const { handleSubmit, control, reset } = useForm({
    defaultValues: {
      wbtStatus: "",
    },
  });
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (data) => {
    try {
      setLoading(true);

      const userId = sessionStorage.getItem("userId") || "";
      const userRole = sessionStorage.getItem("userRole")?.toLowerCase() || "";
      const payload = {
        ...data,
        rfiId,
        parentResponseId: data.parentResponseId || "",
      };
      console.log(payload);
      const formData = new FormData();
      formData.append("rfiId", rfiId);
      formData.append("reason", data.reason);

      //   formData.append("responseState", data.responseState ? "true" : "false");
      formData.append("userRole", userRole);
      formData.append("userId", userId);
      formData.append("wbtStatus", data.wbtStatus || "");

      files.forEach((file) => formData.append("files", file));

      let fabricatorName = "";
      let projectName = "";
      if (rfiId) {
        const rfiRes = await Service.GetRFIbyId(rfiId);
        const rfi = rfiRes?.data || rfiRes;
        const pid = rfi?.projectId || rfi?.project_id || rfi?.project?.id;
        if (pid) {
          const projectRes = await Service.GetProjectById(pid);
          const project = projectRes?.data || projectRes;
          fabricatorName = project?.fabricator?.fabName || project?.fabricatorName || "";
          projectName = project?.projectName || project?.name || "";
        }
      }

      await Service.addRFIResponse(formData, rfiId, fabricatorName, projectName);
      toast.success("Response submitted successfully!");
      reset();
      setFiles([]);
      onSuccess();
      onClose();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to submit response");
      console.error("Error submitting RFI response:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/40">
      <div className="bg-white w-full max-w-lg p-6 rounded-xl shadow-lg relative">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-green-700">Add Response</h2>
          <button onClick={onClose} className="px-6 py-1.5 bg-red-50 text-black border-2 border-red-700/80 rounded-lg hover:bg-red-100 transition-all font-bold text-sm uppercase tracking-tight shadow-sm">
            Close
          </button>
        </div>

        <form className="space-y-4 mt-4" onSubmit={handleSubmit(onSubmit)}>
          {/* Message */}
          <Controller
            name="reason"
            control={control}
            rules={{ required: "Message is required" }}
            render={({ field }) => (
              <RichTextEditor
                value={field.value || ""}
                onChange={field.onChange}
                placeholder="Write your response..."
              />
            )}
          />

          {/* File uploader */}
          <Controller
            name="files"
            control={control}
            render={() => (
              <MultipleFileUpload onFilesChange={setFiles} initialFiles={files} />
            )}
          />

          {/* Status Dropdown */}
          <Controller
            name="wbtStatus"
            control={control}
            rules={{ required: true }}
            render={({ field }) => (
              <div className="flex flex-col gap-1">
                <select
                  {...field}
                  className="w-full border border-gray-300 rounded-md p-2 text-sm text-gray-700"
                  required
                >
                  <option value="">Select Status</option>
                  <option value="PARTIAL">Partial</option>
                  <option value="COMPLETE">Complete</option>
                </select>
              </div>
            )}
          />

          <div className="flex justify-end gap-3">
            <Button onClick={onClose}>Cancel</Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-green-600 text-white"
            >
              {loading ? "Submitting..." : "Submit Response"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RFIResponseModal;
