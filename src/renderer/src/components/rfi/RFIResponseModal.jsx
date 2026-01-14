import React, { useState } from "react";
import { useForm, Controller } from "react-hook-form";
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
  const { handleSubmit, control, reset } = useForm();
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

      files.forEach((file) => formData.append("files", file));

      await Service.addRFIResponse(formData, rfiId);

      reset();
      setFiles([]);
      onSuccess();
      onClose();
    } catch (err) {
      console.error("Error submitting RFI response:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/40">
      <div className="bg-white w-full max-w-lg p-6 rounded-xl shadow-lg relative">
        <button onClick={onClose} className="absolute top-3 right-3">
          <X className="text-gray-700 hover:text-red-500" size={18} />
        </button>

        <h2 className="text-xl font-semibold text-green-700">Add Response</h2>

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
              <MultipleFileUpload onFilesChange={(f) => setFiles(f)} />
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
