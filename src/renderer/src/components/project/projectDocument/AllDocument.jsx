import { useState } from "react";
import AllDesignDrawings from "../designDrawings/AllDesignDrawings";
import AddDesignDrawing from "../designDrawings/AddDesignDrawing";
import AllDocumentsByProjectID from "../designDrawings/AllDocumentsByProjectID";

const AllDocument = ({ projectId }) => {
  const [view, setView] = useState("all");
  const userRole = sessionStorage.getItem("userRole")?.toLowerCase() || "";
  if (!projectId) return null;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center border-b pb-2 pt-2">
        <h2 className="text-xl text-green-700">Documents</h2>
        <div className="flex gap-2">
          <button
            onClick={() => setView("all")}
            className={`px-3 py-1.5 text-xs font-black uppercase tracking-widest rounded-lg border-2 transition-all ${view === "all"
              ? "bg-[#6bbd45] text-white border-[#6bbd45]"
              : "bg-white text-black border-slate-200 hover:border-slate-300"
              }`}
          >
            All Documents
          </button>
          <button
            onClick={() => setView("list")}
            className={`px-3 py-1.5 text-xs font-black uppercase tracking-widest rounded-lg border-2 transition-all ${view === "list"
              ? "bg-[#6bbd45] text-white border-[#6bbd45]"
              : "bg-white text-black border-slate-200 hover:border-slate-300"
              }`}
          >
            Design Drawings
          </button>
          {userRole === "admin" || userRole === "operation_executive" || userRole === "project_manager" || userRole === "department_manager" ? (
            <button
              onClick={() => setView("add")}
              className={`px-3 py-1.5 text-xs font-black uppercase tracking-widest rounded-lg border-2 transition-all ${view === "add"
                ? "bg-[#6bbd45] text-white border-[#6bbd45]"
                : "bg-white text-black border-slate-200 hover:border-slate-300"
                }`}
            >
              Add Design Drawing
            </button>
          ) : null}
        </div>
      </div>

      {view === "all" && <AllDocumentsByProjectID projectId={projectId} />}
      {view === "list" && <AllDesignDrawings projectId={projectId} />}
      {view === "add" && <AddDesignDrawing projectId={projectId} onSuccess={() => setView("list")} />}
    </div>
  );
};

export default AllDocument;
