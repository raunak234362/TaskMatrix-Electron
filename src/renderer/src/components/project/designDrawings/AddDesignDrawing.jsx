/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import { useForm } from "react-hook-form";
import Service from "../../../api/Service";
import Button from "../../fields/Button";
import { Loader2 } from "lucide-react";
import MultipleFileUpload from "../../fields/MultipleFileUpload";


const AddDesignDrawing = ({ projectId, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit, reset, formState: { errors } } = useForm();
  const [files, setFiles] = useState([]);
  const [formKey, setFormKey] = useState(0);

  const onError = (errors) => {
    console.error("Form Validation Errors:", errors);
  };

  const onSubmit = async (data) => {
    console.log("Submitting Design Drawing form with data:", data);
    try {
      setLoading(true);
      const formData = new FormData();
      formData.append("projectId", projectId);
      formData.append("stage", data.stage);
      formData.append("description", data.description);

      if (files && files.length > 0) {
        files.forEach((file) => {
          formData.append("files", file);
        });
      }

      await Service.CreateDesignDrawing(formData);
      reset();
      setFiles([]);
      setFormKey((prev) => prev + 1);
      onSuccess();
    } catch (error) {
      console.error("Error creating design drawing:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit, onError)}
      className="bg-white p-4 md:p-6 rounded-none border border-black space-y-6"
    >
      <div className="border-b border-black pb-4">
        <h3 className="text-sm font-bold text-black uppercase tracking-widest">Add Design Drawing</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="text-sm font-bold text-black uppercase tracking-wider">
            Stage
          </label>
          <select
            {...register("stage", { required: true })}
            className="w-full px-3 py-2 text-sm font-medium text-gray-900 bg-white border border-gray-300 rounded-none focus:outline-none focus:border-green-600 focus:ring-1 focus:ring-green-600 hover:border-gray-400 transition-all shadow-sm cursor-pointer"
          >
            <option value="">Select Stage</option>
            <option value="IFA">IFA</option>
            <option value="IFC">IFC</option>
            <option value="CO#">CO#</option>
          </select>
          {errors.stage && (
            <p className="text-red-500 text-xs mt-1">Stage is required</p>
          )}
        </div>

        <div className="space-y-2 md:col-span-2">
          <label className="text-sm font-bold text-black uppercase tracking-wider">
            Description
          </label>
          <textarea
            {...register("description", { required: true })}
            rows={3}
            className="w-full px-3 py-2 text-sm font-medium text-gray-900 bg-white border border-gray-300 rounded-none focus:outline-none focus:border-green-600 focus:ring-1 focus:ring-green-600 hover:border-gray-400 transition-all shadow-sm"
            placeholder="Enter drawing description..."
          />
          {errors.description && (
            <p className="text-red-500 text-xs mt-1">Description is required</p>
          )}
        </div>

        <div className="md:col-span-2">
          <MultipleFileUpload key={formKey} onFilesChange={setFiles} initialFiles={files} />
        </div>
      </div>

      <div className="flex justify-center pt-4">
        <button
          type="submit"
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 px-6 py-2 bg-green-50 text-black border-2 border-green-700/80 rounded-none hover:bg-green-100 transition-all font-bold text-sm uppercase tracking-tight shadow-sm cursor-pointer disabled:opacity-50"
        >
          {loading ? (
            <div className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Creating...</span>
            </div>
          ) : (
            "Create Document"
          )}
        </button>
      </div>
    </form>
  );
};

export default AddDesignDrawing;
