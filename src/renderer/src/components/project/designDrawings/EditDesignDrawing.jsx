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

      let fabricatorName = "";
      let projectName = "";
      const pid = drawing.projectId || drawing.project_id;
      if (pid) {
        const projectRes = await Service.GetProjectById(pid);
        const project = projectRes?.data || projectRes;
        fabricatorName = project?.fabricator?.fabName || project?.fabricatorName || "";
        projectName = project?.projectName || project?.name || "";
      }

      await Service.UpdateDesignDrawing(drawing.id, formData, fabricatorName, projectName);
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
      className="bg-white p-4 rounded-none border border-black space-y-4"
    >
      <h3 className="text-sm font-bold text-black uppercase tracking-widest">
        Edit Design Drawing
      </h3>

      <div>
        <label className="block text-sm font-bold text-black uppercase tracking-wider">Stage</label>
        <select
          {...register("stage", { required: true })}
          className="w-full mt-1 px-3 py-2 text-sm font-medium text-gray-900 bg-white border border-gray-300 rounded-none focus:outline-none focus:border-green-600 focus:ring-1 focus:ring-green-600 hover:border-gray-400 transition-all shadow-sm cursor-pointer"
        >
          <option value="IFA">IFA</option>
          <option value="IFC">IFC</option>
          <option value="CO#">CO#</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-bold text-black uppercase tracking-wider">
          Description
        </label>
        <textarea
          {...register("description", { required: true })}
          rows={3}
          className="w-full mt-1 px-3 py-2 text-sm font-medium text-gray-900 bg-white border border-gray-300 rounded-none focus:outline-none focus:border-green-600 focus:ring-1 focus:ring-green-600 hover:border-gray-400 transition-all shadow-sm"
        />
      </div>

      <div>
        <label className="block text-sm font-bold text-black uppercase tracking-wider">
          Add More Files (Optional)
        </label>
        <MultipleFileUpload onFilesChange={setFiles} initialFiles={files} />
      </div>

      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="px-6 py-1.5 bg-red-50 text-black border-2 border-red-700/80 rounded-none hover:bg-red-100 transition-all font-bold text-sm uppercase tracking-tight shadow-sm cursor-pointer"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-1.5 bg-green-50 text-black border-2 border-green-700/80 rounded-none hover:bg-green-100 transition-all font-bold text-sm uppercase tracking-tight shadow-sm cursor-pointer disabled:opacity-50"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
              Updating...
            </>
          ) : (
            "Update Drawing"
          )}
        </button>
      </div>
    </form>
  );
};

export default EditDesignDrawing;
