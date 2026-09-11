import { useState } from "react";
import AllSubmittals from "../components/submittals/AllSubmittals";
import AddSubmittal from "../components/submittals/AddSubmittals";

const SubmittalLayout = ({
  project,
  submittalData,
  projectId,
  fetchProject,
  canCreate = true
}) => {
  const [submittalView, setSubmittalView] = useState("list");
  const targetProjectId = projectId || project?.id;

  return (
    <div className="w-full space-y-4">
      <div className="flex justify-start mb-4">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          <button
            onClick={() => setSubmittalView("list")}
            className={`whitespace-nowrap px-6 py-1.5 rounded-none transition-all font-bold text-sm uppercase tracking-tight shadow-sm cursor-pointer ${
              submittalView === "list"
                ? "bg-green-50 text-black border-2 border-green-700/80"
                : "bg-gray-100 text-black border border-gray-300 hover:bg-gray-200"
            }`}
          >
            All Submittals
          </button>
          {canCreate && (
            <button
              onClick={() => setSubmittalView("add")}
              className={`whitespace-nowrap px-6 py-1.5 rounded-none transition-all font-bold text-sm uppercase tracking-tight shadow-sm cursor-pointer ${
                submittalView === "add"
                  ? "bg-green-50 text-black border-2 border-green-700/80"
                  : "bg-gray-100 text-black border border-gray-300 hover:bg-gray-200"
              }`}
            >
              Create Submittal
            </button>
          )}
        </nav>
      </div>

      <div className="flex-1 min-h-0 bg-white p-2 rounded-b-2xl overflow-y-auto">
        {submittalView === "list" ? (
          <AllSubmittals
            submittalData={submittalData}
            projectId={targetProjectId}
            onUpdate={fetchProject}
          />
        ) : (
          <AddSubmittal
            project={project}
            submittalData={submittalData}
            onSuccess={() => {
              if (fetchProject) fetchProject();
              setSubmittalView("list");
            }}
          />
        )}
      </div>
    </div>
  );
};

export default SubmittalLayout;
