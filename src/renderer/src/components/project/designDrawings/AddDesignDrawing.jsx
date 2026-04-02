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
          {errors.stage && (
            <p className="text-red-500 text-xs mt-1">Stage is required</p>
          )}
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
          {errors.description && (
            <p className="text-red-500 text-xs mt-1">Description is required</p>
          )}
        </div>

        <div className="md:col-span-2">
          <MultipleFileUpload key={formKey} onFilesChange={setFiles} />
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
            "Create Document"
          )}
        </Button>
      </div>
    </form>
  );
};

export default AddDesignDrawing;
