/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import { useForm } from "react-hook-form";
import Service from "../../../api/Service";
import Button from "../../fields/Button";
import { Loader2, Upload } from "lucide-react";


const EditDesignDrawing = ({
  drawing,
  onCancel,
  onSuccess,
}) => {
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit } = useForm({
    defaultValues: {
      stage: drawing.stage,
      description: drawing.description,
    },
  });
  const [files, setFiles] = useState(null);

  const onSubmit = async (data) => {
    try {
      setLoading(true);
      const formData = new FormData();
      formData.append("stage", data.stage);
      formData.append("description", data.description);

      if (files) {
        for (let i = 0; i < files.length; i++) {
          formData.append("files", files[i]);
        }
      }

      await Service.UpdateDesignDrawing(drawing.id, formData);
      onSuccess();
    } catch (error) {
      console.error("Error updating design drawing:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="bg-white p-4 rounded-lg border space-y-4"
    >
      <h3 className="text-lg font-semibold text-green-700">
        Edit Design Drawing
      </h3>

      <div>
        <label className="block text-sm font-medium text-gray-700">Stage</label>
        <select
          {...register("stage", { required: true })}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm"
        >
          <option value="IFA">IFA</option>
          <option value="IFC">IFC</option>
          <option value="CO#">CO#</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Description
        </label>
        <textarea
          {...register("description", { required: true })}
          rows={3}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Add More Files (Optional)
        </label>
        <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
          <div className="space-y-1 text-center">
            <Upload className="mx-auto h-8 w-8 text-gray-400" />
            <div className="flex text-sm text-gray-600">
              <label className="relative cursor-pointer bg-white rounded-md font-medium text-green-600 hover:text-green-500 focus-within:outline-none">
                <span>Upload files</span>
                <input
                  type="file"
                  multiple
                  className="sr-only"
                  onChange={(e) => setFiles(e.target.files)}
                />
              </label>
            </div>
            <p className="text-xs text-gray-500">
              {files
                ? `${files.length} files selected`
                : "PNG, JPG, PDF up to 10MB"}
            </p>
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <Button
          type="button"
          onClick={onCancel}
          className="bg-gray-100 text-gray-700 hover:bg-gray-200"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={loading}
          className="bg-green-600 text-white"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
              Updating...
            </>
          ) : (
            "Update Drawing"
          )}
        </Button>
      </div>
    </form>
  );
};

export default EditDesignDrawing;
