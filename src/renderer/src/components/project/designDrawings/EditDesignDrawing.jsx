/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import { useForm } from "react-hook-form";
import Service from "../../../api/Service";
import Button from "../../fields/Button";
import { Loader2 } from "lucide-react";
import MultipleFileUpload from "../../fields/MultipleFileUpload";


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
  const [files, setFiles] = useState([]);

  const onSubmit = async (data) => {
    try {
      setLoading(true);
      const formData = new FormData();
      formData.append("stage", data.stage);
      formData.append("description", data.description);

      if (files && files.length > 0) {
        files.forEach((file) => {
          formData.append("files", file);
        });
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
        <MultipleFileUpload onFilesChange={setFiles} />
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
