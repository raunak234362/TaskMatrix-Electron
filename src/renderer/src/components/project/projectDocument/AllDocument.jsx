import { useState } from "react";
import { useSelector } from "react-redux";
import AllDesignDrawings from "../designDrawings/AllDesignDrawings";
import AddDesignDrawing from "../designDrawings/AddDesignDrawing";
import AllDocumentsByProjectID from "../designDrawings/AllDocumentsByProjectID";
import { isCurrentCheckerOrModeler } from "../../../utils/designationUtils";

const AllDocument = ({ projectId, project }) => {
  const [view, setView] = useState("all");
  const userRole = sessionStorage.getItem("userRole")?.toLowerCase() || "";
  const staffData = useSelector((state) => state.userInfo?.staffData || []);
  const currentUserDetail = useSelector((state) => state.userInfo?.userDetail);
  const isCheckerOrModeler = isCurrentCheckerOrModeler(staffData, currentUserDetail);

  if (!projectId) return null;

  const canAddDesignDrawing =
    userRole === "admin" ||
    userRole === "operation_executive" ||
    userRole === "project_manager" ||
    userRole === "department_manager" ||
    userRole === "dept_manager" ||
    isCheckerOrModeler;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center pb-2 pt-2">
        <h2 className="text-sm font-bold text-black uppercase tracking-widest">Documents</h2>
        <div className="flex gap-2">
          <button
            onClick={() => setView("all")}
            className={`px-4 py-1.5 text-sm font-bold uppercase tracking-tight rounded-none border-2 transition-all cursor-pointer shadow-sm ${view === "all"
              ? "bg-green-50 text-black border-green-700/80 hover:bg-green-100"
              : "bg-white text-black border-black/20 hover:border-black/50 hover:bg-slate-50"
              }`}
          >
            All Documents
          </button>
          <button
            onClick={() => setView("list")}
            className={`px-4 py-1.5 text-sm font-bold uppercase tracking-tight rounded-none border-2 transition-all cursor-pointer shadow-sm ${view === "list"
              ? "bg-green-50 text-black border-green-700/80 hover:bg-green-100"
              : "bg-white text-black border-black/20 hover:border-black/50 hover:bg-slate-50"
              }`}
          >
            Design Drawings
          </button>
          {canAddDesignDrawing ? (
            <button
              onClick={() => setView("add")}
              className={`px-4 py-1.5 text-sm font-bold uppercase tracking-tight rounded-none border-2 transition-all cursor-pointer shadow-sm ${view === "add"
                ? "bg-green-50 text-black border-green-700/80 hover:bg-green-100"
                : "bg-white text-black border-black/20 hover:border-black/50 hover:bg-slate-50"
                }`}
            >
              Add Design Drawing
            </button>
          ) : null}
        </div>
      </div>

      {view === "all" && <AllDocumentsByProjectID projectId={projectId} />}
      {view === "list" && <AllDesignDrawings projectId={projectId} />}
      {view === "add" && <AddDesignDrawing projectId={projectId} project={project} onSuccess={() => setView("list")} />}
    </div>
  );
};

export default AllDocument;
