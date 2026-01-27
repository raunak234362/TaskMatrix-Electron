import { useState } from "react";
import AllFabricator from "../components/fabricator/fabricator/AllFabricator";
import AddFabricator from "../components/fabricator/fabricator/AddFabricator";

const FabricatorLayout = () => {
  const [activeTab, setActiveTab] = useState("allFabricator");

  return (
    <div className="w-full overflow-y-hidden overflow-x-hidden">
      <div className="flex flex-col w-full h-full">
        <div className="px-3 py-2 backdrop-blur-2xl bg-linear-to-t from-white/60 to-white/80 rounded-t-2xl flex flex-col md:flex-row items-center justify-end gap-4">
          <div className="flex flex-row gap-4 items-center justify-end">
            <button
              onClick={() => setActiveTab("allFabricator")}
              className={`flex items-center gap-2 px-6 py-3 rounded-[1.25rem] font-semibold transition-all ${activeTab === "allFabricator"
                  ? "bg-green-500 text-white shadow-[0_8px_20px_-4px_rgba(34,197,94,0.4)] hover:bg-green-600 hover:shadow-[0_12px_24px_-4px_rgba(34,197,94,0.5)]"
                  : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 hover:text-green-600 shadow-sm"
                }`}
            >
              All Fabricator
            </button>

            <button
              onClick={() => setActiveTab("addFabricator")}
              className={`flex items-center gap-2 px-6 py-3 rounded-[1.25rem] font-semibold transition-all ${activeTab === "addFabricator"
                  ? "bg-green-500 text-white shadow-[0_8px_20px_-4px_rgba(34,197,94,0.4)] hover:bg-green-600 hover:shadow-[0_12px_24px_-4px_rgba(34,197,94,0.5)]"
                  : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 hover:text-green-600 shadow-sm"
                }`}
            >
              Add Fabricator
            </button>
          </div>
        </div>
      </div>
      <div className="flex-1 min-h-0 bg-white p-2 rounded-b-2xl overflow-y-auto">
        {activeTab === "allFabricator" && (
          <div>
            <AllFabricator />
          </div>
        )}
        {activeTab === "addFabricator" && (
          <div>
            <AddFabricator />
          </div>
        )}
      </div>
    </div>
  );
};

export default FabricatorLayout;
