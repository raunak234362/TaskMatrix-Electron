/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import { useForm } from "react-hook-form";
import Service from "../../../api/Service";
import Button from "../../fields/Button";
import { Loader2, Upload } from "lucide-react";


const AddDesignDrawing = ({ projectId, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit, reset } = useForm();
  const [files, setFiles] = useState(null);

  const onSubmit = async (data) => {
    try {
      setLoading(true);
      const formData = new FormData();
      formData.append("projectId", projectId);
      formData.append("stage", data.stage);
      formData.append("description", data.description);

      if (files) {
        for (let i = 0; i < files.length; i++) {
          formData.append("files", files[i]);
        }
      }

      await Service.CreateDesignDrawing(formData);
      reset();
      setFiles(null);
      onSuccess();
    } catch (error) {
      console.error("Error creating design drawing:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="bg-white p-4 md:p-6 rounded-xl shadow-sm border border-gray-100 space-y-6"
    >
      <div className="border-b border-gray-50 pb-4">
        <h3 className="text-xl  text-gray-800">Add Design Drawing</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="text-sm font-semibold text-gray-700 uppercase tracking-wider">
            Stage
          </label>
          <select
            {...register("stage", { required: true })}
            className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all bg-gray-50/50"
          >
            <option value="">Select Stage</option>
            <option value="IFA">IFA</option>
            <option value="IFC">IFC</option>
            <option value="CO#">CO#</option>
          </select>
        </div>

        <div className="space-y-2 md:col-span-2">
          <label className="text-sm font-semibold text-gray-700 uppercase tracking-wider">
            Description
          </label>
          <textarea
            {...register("description", { required: true })}
            rows={3}
            className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all bg-gray-50/50"
            placeholder="Enter drawing description..."
          />
        </div>

        <div className="space-y-2 md:col-span-2">
          <label className="text-sm font-semibold text-gray-700 uppercase tracking-wider">
            Attachments
          </label>
          <div className="relative group">
            <input
              type="file"
              multiple
              className="hidden"
              id="file-upload"
              onChange={(e) => setFiles(e.target.files)}
            />
            <label
              htmlFor="file-upload"
              className="flex flex-col items-center justify-center w-full h-32 px-4 transition bg-white border-2 border-gray-300 border-dashed rounded-xl appearance-none cursor-pointer hover:border-green-400 focus:outline-none group-hover:bg-gray-50"
            >
              <div className="flex flex-col items-center space-y-2">
                <Upload className="w-8 h-8 text-gray-400 group-hover:text-green-500 transition-colors" />
                <span className="font-medium text-gray-600">
                  {files && files.length > 0
                    ? `${files.length} files selected`
                    : "Click to upload or drag and drop"}
                </span>
                <span className="text-xs text-gray-400">
                  PNG, JPG, PDF up to 10MB
                </span>
              </div>
            </label>
          </div>
        </div>
      </div>

      <div className="flex justify-center pt-4">
        <Button
          type="submit"
          disabled={loading}
          className="w-full bg-green-600 hover:bg-green-700 text-white px-8 py-2.5 rounded-xl shadow-lg shadow-green-200 transition-all disabled:opacity-50"
        >
          {loading ? (
            <div className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Creating...</span>
            </div>
          ) : (
            "Create Design Drawing"
          )}
        </Button>
      </div>
    </form>
  );
};

export default AddDesignDrawing;
