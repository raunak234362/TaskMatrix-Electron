import { useEffect, useState } from "react";
import { AddEstimation, AllEstimation } from "../components";
import EstimationDashboard from "../components/estimation/EstimationDashboard";
import Service from "../api/Service";

const EstimationLayout = () => {
  const [activeTab, setActiveTab] = useState("dashboard"); // Default to dashboard
  const [estmation, setEstimation] = useState([]);

  const fetchAllEstimation = async () => {
    try {
      const response = await Service.AllEstimation();
      console.log(response?.data);
      setEstimation(response?.data);
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
            className={`flex items-center gap-2 px-4 md:px-6 py-2 md:py-3 rounded-[1.25rem] text-sm md:text-base font-semibold transition-all ${
              activeTab === "dashboard"
                ? "bg-green-500 text-white shadow-[0_8px_20px_-4px_rgba(34,197,94,0.4)] hover:bg-green-600 hover:shadow-[0_12px_24px_-4px_rgba(34,197,94,0.5)]"
                : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 hover:text-green-600 shadow-sm"
            }`}
          >
            Estimation Home
          </button>

          <button
            onClick={() => setActiveTab("addEstimation")}
            className={`flex items-center gap-2 px-4 md:px-6 py-2 md:py-3 rounded-[1.25rem] text-sm md:text-base font-semibold transition-all ${
              activeTab === "addEstimation"
                ? "bg-green-500 text-white shadow-[0_8px_20px_-4px_rgba(34,197,94,0.4)] hover:bg-green-600 hover:shadow-[0_12px_24px_-4px_rgba(34,197,94,0.5)]"
                : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 hover:text-green-600 shadow-sm"
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
            <AllEstimation
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
