import { useState } from "react";
import CDdashboard from "../components/connectionDesigner/CDdashboard";
import AddVendor from "../components/vendor/designer/AddVendor";

const ConnectionLayout = () => {
  const [activeTab, setActiveTab] = useState("dashboard");
  const userRole = sessionStorage.getItem("userRole");
  return (
    <div className="w-full overflow-y-hidden overflow-x-hidden">
      <div className="flex flex-col w-full h-full">
        <div className="px-3 py-2 backdrop-blur-2xl bg-linear-to-t from-white/60 to-white/80 rounded-t-2xl flex flex-wrap items-center justify-center md:justify-end gap-3">

          <button
            onClick={() => setActiveTab("dashboard")}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold uppercase tracking-wider transition-all border ${activeTab === "dashboard"
              ? "bg-[#ebf5ea] text-black border-black shadow-sm"
              : "bg-white text-gray-500 border-gray-300 hover:border-black hover:bg-gray-50 hover:text-black"
              }`}
          >
            Vendor Home
          </button>

          {(userRole === "ADMIN" || userRole === "DEPUTY_MANAGER" || userRole === "OPERATION_EXECUTIVE") && (
            <button
              onClick={() => setActiveTab("AddConnectionDesigner")}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold uppercase tracking-wider transition-all border ${activeTab === "AddConnectionDesigner"
                ? "bg-[#ebf5ea] text-black border-black shadow-sm"
                : "bg-white text-gray-500 border-gray-300 hover:border-black hover:bg-gray-50 hover:text-black"
                }`}
            >
              Add Vendor
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
              <AddVendor />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ConnectionLayout;
