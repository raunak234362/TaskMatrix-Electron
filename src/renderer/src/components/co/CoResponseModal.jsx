import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import Button from "../fields/Button";
import MultipleFileUpload from "../fields/MultipleFileUpload";
import Service from "../../api/Service";
import { X } from "lucide-react";

const CoResponseModal = ({ CoId, onClose, onSuccess }) => {
  const { register, handleSubmit, control } = useForm();
  console.log(CoId);

  const [files, setFiles] = useState([]);
  const [loading] = useState(false);
  const onSubmit = async (data) => {
    try {
      const userId = sessionStorage.getItem("userId") || "";
      const userRole = sessionStorage.getItem("userRole") || "";

      const formData = new FormData();

      formData.append("CoId", CoId);
      formData.append("description", data.description);
      formData.append("status", data.status);
      formData.append("userId", userId);
      formData.append("userRole", userRole);
      formData.append("ParentResponseId", data.parentResponseId ?? "");

      if (files?.length) {
        files.forEach((file) => {
          formData.append("files", file);
        });
      }

      await Service.addCOResponse(formData, CoId);

      onSuccess();
      onClose();
    } catch (error) {
      console.error("CO Response error:", error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
      <div className="bg-white w-full max-w-lg p-6 rounded-xl relative">
        <button onClick={onClose} className="absolute top-3 right-3">
          <X size={18} />
        </button>

        <h2 className="text-xl font-semibold text-green-700">
          Add CO Response
        </h2>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-4">
          {/* Description */}
          <textarea
            {...register("description", { required: true })}
            rows={4}
            className="w-full border rounded-md p-3"
            placeholder="Write your response..."
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
            render={() => <MultipleFileUpload onFilesChange={setFiles} />}
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
