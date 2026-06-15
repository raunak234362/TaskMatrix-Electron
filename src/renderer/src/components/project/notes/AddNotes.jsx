import { useState } from "react";
import { useForm } from "react-hook-form";
import { Loader2, Upload, X } from "lucide-react";
import Service from "../../../api/Service";
import Button from "../../fields/Button";
import { toast } from "react-toastify";
import { Controller } from "react-hook-form";
import RichTextEditor from "../../fields/RichTextEditor";
import MultipleFileUpload from "../../fields/MultipleFileUpload";



const AddNotes = ({ projectId, onNoteAdded, onClose }) => {
  const [loading, setLoading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm();


  const onSubmit = async (data) => {
    try {
      setLoading(true);
      const formData = new FormData();
      formData.append("content", data.content);
      formData.append("stage", data.stage);
      formData.append("projectId", projectId);

      selectedFiles.forEach((file) => {
        formData.append("files", file);
      });

      let fabricatorName = "";
      let projectName = "";
      if (projectId) {
        const projectRes = await Service.GetProjectById(projectId);
        const project = projectRes?.data || projectRes;
        fabricatorName = project?.fabricator?.fabName || project?.fabricatorName || "";
        projectName = project?.projectName || project?.name || "";
      }

      await Service.CreateProjectNote(projectId, formData, fabricatorName, projectName);
      toast.success("Note added successfully");
      onNoteAdded();
      onClose();
    } catch (error) {
      console.error("Error adding note:", error);
      toast.error("Failed to add note");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/20 backdrop-blur-sm flex justify-center items-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-white w-11/12 md:w-1/2 rounded-xl shadow-lg p-6 border border-gray-100 relative"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center border-b pb-3 mb-4">
          <h2 className="text-xl font-semibold text-gray-700">
            Add Project Note
          </h2>
          <button
            onClick={onClose}
            className="px-6 py-1.5 bg-red-50 text-black border-2 border-red-700/80 rounded-lg hover:bg-red-100 transition-all font-bold text-sm uppercase tracking-tight shadow-sm"
          >
            Close
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Stage
            </label>
            <select
              {...register("stage", { required: "Stage is required" })}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="">Select Stage</option>
              <option value="IFA">IFA</option>
              <option value="RFI">RFI</option>
              <option value="RIFA">RIFA</option>
              <option value="RIFC">RIFC</option>
              <option value="CO">COR</option>
              <option value="REV">REVESION</option>
              <option value="COMPLETED">Completed</option>

            </select>
            {errors.stage && (
              <p className="text-red-500 text-xs mt-1">
                {errors.stage.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Content
            </label>
            <Controller
              name="content"
              control={control}
              rules={{ required: "Content is required" }}
              render={({ field }) => (
                <RichTextEditor
                  value={field.value || ""}
                  onChange={field.onChange}
                  placeholder="Enter note details..."
                />
              )}
            />
            {errors.content && (
              <p className="text-red-500 text-xs mt-1">
                {errors.content.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Attachments
            </label>
            <MultipleFileUpload onFilesChange={setSelectedFiles} initialFiles={selectedFiles} />
          </div>

          <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t">

            <Button type="submit" disabled={loading} className="w-full">
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Saving...
                </>
              ) : (
                "Save Note"
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddNotes;
