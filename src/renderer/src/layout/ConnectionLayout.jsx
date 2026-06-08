import { useState } from "react";
import { AddConnectionDesigner } from "../components";
import CDdashboard from "../components/connectionDesigner/CDdashboard";

const ConnectionLayout = () => {
  const [activeTab, setActiveTab] = useState("dashboard");
  const userRole = sessionStorage.getItem("userRole");
  return (
    <div className="w-full overflow-y-hidden overflow-x-hidden">
      <div className="flex flex-col w-full h-full">
        <div className="px-3 py-2 backdrop-blur-2xl bg-linear-to-t from-white/60 to-white/80 rounded-t-2xl flex flex-wrap items-center justify-center md:justify-end gap-3">

          <button
            onClick={() => setActiveTab("dashboard")}
            className={`flex items-center gap-2 px-6 py-1.5 rounded-lg text-sm font-bold uppercase tracking-tight transition-all border-2 shadow-sm ${activeTab === "dashboard"
              ? "bg-green-50 text-black border-green-700/80"
              : "bg-white text-gray-500 border-gray-300 hover:bg-green-50/40 hover:border-green-700/30 hover:text-black"
              }`}
          >
            Connection Designer Home
          </button>

          {(userRole === "ADMIN" || userRole === "DEPUTY_MANAGER" || userRole === "OPERATION_EXECUTIVE") && (
            <button
              onClick={() => setActiveTab("AddConnectionDesigner")}
              className={`flex items-center gap-2 px-6 py-1.5 rounded-lg text-sm font-bold uppercase tracking-tight transition-all border-2 shadow-sm ${activeTab === "AddConnectionDesigner"
                ? "bg-green-50 text-black border-green-700/80"
                : "bg-white text-gray-500 border-gray-300 hover:bg-green-50/40 hover:border-green-700/30 hover:text-black"
                }`}
            >
              Add Connection Designer
            </button>
          )}
    
        </div>
        <div className="grow p-2 bg-white rounded-b-2xl">
          {activeTab === "dashboard" && (
            <div className="h-full">
              <CDdashboard />
            </div>
          )}
          {activeTab === "AddConnectionDesigner" && (
            <div>
              {" "}
              <AddConnectionDesigner />
            </div>
          )}
          {activeTab === "moreInfo" && (
            <div className="p-4">
              <h2 className="text-xl font-bold">More Info</h2>
              <p>More information content goes here.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ConnectionLayout;
