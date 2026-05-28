/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
import Service from "../../../api/Service";
import { Loader2, AlertCircle, Trash2, Edit } from "lucide-react";
import EditDesignDrawing from "./EditDesignDrawing";
import RenderFiles from "../../common/RenderFiles";


const DesignDrawingDetails = ({ id, onUpdate }) => {
  const [drawing, setDrawing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

  const fetchDrawing = async () => {
    try {
      setLoading(true);
      const response = await Service.GetDesignDrawingById(id);
      setDrawing(response.data);
    } catch (err) {
      setError("Failed to load design drawing details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchDrawing();
  }, [id]);

  const handleDelete = async () => {
    if (
      window.confirm("Are you sure you want to delete this design drawing?")
    ) {
      try {
        await Service.DeleteDesignDrawing(id);
        onUpdate();
      } catch (error) {
        console.error("Error deleting design drawing:", error);
      }
    }
  };

  if (loading) return <Loader2 className="w-5 h-5 animate-spin mx-auto" />;
  if (error || !drawing)
    return (
      <div className="text-red-500 flex items-center">
        <AlertCircle className="w-4 h-4 mr-1" />
        {error}
      </div>
    );

  if (isEditing) {
    return (
      <EditDesignDrawing
        drawing={drawing}
        onCancel={() => setIsEditing(false)}
        onSuccess={() => {
          setIsEditing(false);
          fetchDrawing();
          onUpdate();
        }}
      />
    );
  }

  return (
    <div className="p-4 bg-white rounded-none border border-black space-y-4">
      <div className="flex justify-between items-start">
        <div>
          <h4 className="text-sm font-bold text-black uppercase tracking-widest">
            Stage: {drawing.stage}
          </h4>
          <p className="text-sm text-black mt-1">{drawing.description}</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setIsEditing(true)}
            className="p-1 text-blue-700 hover:bg-blue-50 rounded-none border border-transparent hover:border-blue-700/30 transition-all cursor-pointer"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={handleDelete}
            className="p-1 text-red-700 hover:bg-red-50 rounded-none border border-transparent hover:border-red-700/30 transition-all cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {drawing.files && drawing.files.length > 0 && (
        <RenderFiles
          files={drawing.files}
          table="designDrawings"
          parentId={id}
        />
      )}
    </div>
  );
};

export default DesignDrawingDetails;
