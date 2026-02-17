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
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold uppercase tracking-wider transition-all border ${activeTab === "allFabricator"
                ? "bg-[#ebf5ea] text-black border-black shadow-sm"
                : "bg-white text-gray-500 border-gray-300 hover:border-black hover:bg-gray-50 hover:text-black"
                }`}
            >
              All Fabricator
            </button>

            <button
              onClick={() => setActiveTab("addFabricator")}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold uppercase tracking-wider transition-all border ${activeTab === "addFabricator"
                ? "bg-[#ebf5ea] text-black border-black shadow-sm"
                : "bg-white text-gray-500 border-gray-300 hover:border-black hover:bg-gray-50 hover:text-black"
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
