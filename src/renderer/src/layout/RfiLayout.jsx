import { useState } from "react";
import AddRFI from "../components/rfi/AddRFI";
import AllRFI from "../components/rfi/AllRfi";

const RfiLayout = ({ project, rfiData, fetchProject, canCreate = true }) => {
  const [activeTab, setActiveTab] = useState("allRFI");
  const userRole = (sessionStorage.getItem("userRole") || "").toLowerCase().trim();
  const isCreationAllowed = canCreate && userRole !== "operation_executive_trainee";

  return (
    <div className="w-full space-y-4">
      <div className="flex justify-start mb-4">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          <button
            onClick={() => setActiveTab("allRFI")}
            className={`whitespace-nowrap px-6 py-1.5 rounded-none transition-all font-bold text-sm uppercase tracking-tight shadow-sm cursor-pointer ${
              activeTab === "allRFI"
                ? "bg-green-50 text-black border-2 border-green-700/80"
                : "bg-gray-100 text-black border border-gray-300 hover:bg-gray-200"
            }`}
          >
            All RFI
          </button>

          {isCreationAllowed && (
            <button
              onClick={() => setActiveTab("addRFI")}
              className={`whitespace-nowrap px-6 py-1.5 rounded-none transition-all font-bold text-sm uppercase tracking-tight shadow-sm cursor-pointer ${
                activeTab === "addRFI"
                  ? "bg-green-50 text-black border-2 border-green-700/80"
                  : "bg-gray-100 text-black border border-gray-300 hover:bg-gray-200"
              }`}
            >
              Add RFI
            </button>
          )}
        </nav>
      </div>

      <div className="flex-1 min-h-0 bg-white p-2 rounded-b-2xl overflow-y-auto">
        {activeTab === "allRFI" && (
          <div>
            <AllRFI rfiData={rfiData} onUpdate={fetchProject} />
          </div>
        )}
        {isCreationAllowed && activeTab === "addRFI" && (
          <div>
            <AddRFI
              project={project}
              rfiData={rfiData}
              onSuccess={() => {
                if (fetchProject) fetchProject();
                setActiveTab("allRFI");
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default RfiLayout;
