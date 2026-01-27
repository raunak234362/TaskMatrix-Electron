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
            className={`flex items-center gap-2 px-4 sm:px-6 py-2 sm:py-3 rounded-lg sm:rounded-[1.25rem] text-sm sm:font-semibold transition-all ${activeTab === "dashboard"
              ? "bg-green-500 text-white shadow-[0_8px_20px_-4px_rgba(34,197,94,0.4)] hover:bg-green-600 hover:shadow-[0_12px_24px_-4px_rgba(34,197,94,0.5)]"
              : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 hover:text-green-600 shadow-sm"
              }`}
          >
            Connection Designer Home
          </button>

          {(userRole === "ADMIN" || userRole === "DEPUTY_MANAGER" || userRole === "OPERATION_EXECUTIVE") && (
            <button
              onClick={() => setActiveTab("AddConnectionDesigner")}
              className={`flex items-center gap-2 px-4 sm:px-6 py-2 sm:py-3 rounded-lg sm:rounded-[1.25rem] text-sm sm:font-semibold transition-all ${activeTab === "AddConnectionDesigner"
                ? "bg-green-500 text-white shadow-[0_8px_20px_-4px_rgba(34,197,94,0.4)] hover:bg-green-600 hover:shadow-[0_12px_24px_-4px_rgba(34,197,94,0.5)]"
                : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 hover:text-green-600 shadow-sm"
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
        </div>
      </div>
    </div>
  );
};

export default ConnectionLayout;
