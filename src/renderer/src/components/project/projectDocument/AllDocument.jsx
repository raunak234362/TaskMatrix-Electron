import { useState } from "react";
import AllDesignDrawings from "../designDrawings/AllDesignDrawings";
import AddDesignDrawing from "../designDrawings/AddDesignDrawing";
import { useParams } from "react-router-dom";

const AllDocument = ({ projectId }) => {
  const [view, setView] = useState("list");
  const userRole = sessionStorage.getItem("userRole")?.toLowerCase() || "";
  if (!projectId) return null;

  return (
    <div className="space-y-4 mt-6">
      <div className="flex justify-between items-center border-b pb-2">
        <h2 className="text-xl  text-green-700">Documents</h2>
        <div className="flex gap-2">
          <button
            onClick={() => setView("list")}
            className={`px-3 py-1 text-sm font-medium rounded-md ${view === "list"
              ? "bg-green-600 text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
          >
            All Documents
          </button>
          {userRole === "admin" || userRole === "operation_executive" || userRole === "project_manager" || userRole === "department_manager" ? (
            <button
              onClick={() => setView("add")}
              className={`px-3 py-1 text-sm font-medium rounded-md ${view === "add"
                ? "bg-green-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
            >
              Add Documents
            </button>
          ) : null}
        </div>
      </div>

      {view === "list" ? (
        <AllDesignDrawings projectId={projectId} />
      ) : (
        <AddDesignDrawing projectId={projectId} onSuccess={() => setView("list")} />
      )}
    </div>
  );
};

export default AllDocument;
