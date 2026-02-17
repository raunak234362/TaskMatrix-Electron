import { useEffect, useState } from "react";
import { AddEstimation, AllEstimation } from "../components";
import EstimationDashboard from "../components/estimation/EstimationDashboard";
import Service from "../api/Service";
import AllEstimationTask from "../components/estimation/estimationTask/AllEstimationTask";

const EstimationLayout = () => {
  const [activeTab, setActiveTab] = useState("dashboard"); // Default to dashboard
  const [estmation, setEstimation] = useState([]);
  const userRole = sessionStorage.getItem("userRole")?.toLowerCase() || "";
  const fetchAllEstimation = async () => {
    try {
      const estimationTask = await Service.GetEstimationTaskForAssignee();
      console.log(estimationTask?.data);
      setEstimation(estimationTask?.data);
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    // We might not need to fetch all estimations here for the dashboard if the dashboard fetches its own data,
    // but if we want to share data, we can pass it down.
    // For now, let's keep it as is for AllEstimation tab.
    fetchAllEstimation();
  }, []);

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
            Estimation Home
          </button>
          <button
            onClick={() => setActiveTab("allEstimation")}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold uppercase tracking-wider transition-all border ${activeTab === "allEstimation"
              ? "bg-[#ebf5ea] text-black border-black shadow-sm"
              : "bg-white text-gray-500 border-gray-300 hover:border-black hover:bg-gray-50 hover:text-black"
              }`}
          >
            Estimation Task
          </button>

          <button
            onClick={() => setActiveTab("addEstimation")}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold uppercase tracking-wider transition-all border ${activeTab === "addEstimation"
              ? "bg-[#ebf5ea] text-black border-black shadow-sm"
              : "bg-white text-gray-500 border-gray-300 hover:border-black hover:bg-gray-50 hover:text-black"
              }`}
          >
            Add Estimation
          </button>
        </div>
      </div>
      <div className="flex-1 min-h-0 bg-white p-2 rounded-b-2xl overflow-y-auto">
        {activeTab === "dashboard" && (
          <div className="h-full">
            <EstimationDashboard />
          </div>
        )}
        {activeTab === "allEstimation" && (
          <div>
            <AllEstimationTask
              estimations={estmation}
              onRefresh={fetchAllEstimation}
            />
          </div>
        )}
        {activeTab === "addEstimation" && (
          <div>
            <AddEstimation
              onSuccess={() => {
                fetchAllEstimation();
                setActiveTab("allEstimation");
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default EstimationLayout;
