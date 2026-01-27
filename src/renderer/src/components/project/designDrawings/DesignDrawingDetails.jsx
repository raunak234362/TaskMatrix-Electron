/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
import Service from "../../../api/Service";
import { Loader2, AlertCircle, FileText, Trash2, Edit } from "lucide-react";
import { openFileSecurely } from "../../../utils/openFileSecurely";
import EditDesignDrawing from "./EditDesignDrawing";


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
    <div className="p-4 bg-gray-50 rounded-lg border space-y-4">
      <div className="flex justify-between items-start">
        <div>
          <h4 className="font-semibold text-green-700">
            Stage: {drawing.stage}
          </h4>
          <p className="text-sm text-gray-600">{drawing.description}</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setIsEditing(true)}
            className="p-1 text-blue-600 hover:bg-blue-50 rounded"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={handleDelete}
            className="p-1 text-red-600 hover:bg-red-50 rounded"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {drawing.files && drawing.files.length > 0 && (
        <div className="space-y-2">
          <h5 className="text-sm font-medium text-gray-700">Attachments:</h5>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {drawing.files.map((file) => (
              <div
                key={file.id}
                onClick={() => openFileSecurely("design-drawings", id, file.id)}
                className="flex items-center p-2 bg-white border rounded hover:bg-gray-50 cursor-pointer transition-colors"
              >
                <FileText className="w-4 h-4 text-green-600 mr-2" />
                <span className="text-xs truncate">{file.originalName}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default DesignDrawingDetails;
