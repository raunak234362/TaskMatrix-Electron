import { useState } from "react";
import { useForm } from "react-hook-form";
import { Loader2, Upload, X } from "lucide-react";
import Service from "../../../api/Service";
import Button from "../../fields/Button";
import { toast } from "react-toastify";
import { Controller } from "react-hook-form";
import RichTextEditor from "../../fields/RichTextEditor";



const AddNotes = ({ projectId, onNoteAdded, onClose }) => {
  const [loading, setLoading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm();

  const handleFileChange = (e) => {
    if (e.target.files) {
      setSelectedFiles(Array.from(e.target.files));
    }
  };

  const removeFile = (index) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

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

      await Service.CreateProjectNote(projectId, formData);
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
            className="p-2 rounded-full hover:bg-gray-100 text-gray-700"
          >
            <X className="w-5 h-5" />
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
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:bg-gray-50 transition-colors relative">
              <input
                type="file"
                multiple
                onChange={handleFileChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <Upload className="w-6 h-6 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-700">
                Click or drag files to upload
              </p>
            </div>

            {selectedFiles.length > 0 && (
              <div className="mt-3 space-y-2">
                {selectedFiles.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between bg-gray-50 p-2 rounded text-sm"
                  >
                    <span className="truncate max-w-[80%]">{file.name}</span>
                    <button
                      type="button"
                      onClick={() => removeFile(index)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
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
