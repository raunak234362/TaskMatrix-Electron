import { useEffect, useState } from "react";
import { AddEstimation, AllEstimation } from "../components";
import EstimationDashboard from "../components/estimation/EstimationDashboard";
import Service from "../api/Service";
import AllEstimationTask from "../components/estimation/estimationTask/AllEstimationTask";
import AllAssignedTask from "../components/estimation/estimationTask/AllActiveTask";

const EstimationLayout = () => {
  const [activeTab, setActiveTab] = useState("dashboard"); // Default to dashboard
  const [estmation, setEstimation] = useState([]);
  const [myTasks, setMyTasks] = useState([]);
  const userRole = sessionStorage.getItem("userRole")?.toLowerCase() || "";

  const managementRoles = ['estimation_head', 'admin', 'operation_executive', 'deputy_manager', 'operation-executive'];
  const isManagement = managementRoles.includes(userRole);

  const fetchAllEstimation = async () => {
    try {
      let response
      if (userRole === 'estimator') {
        response = await Service.GetAllAssignedEstimationTaskForME()
      } else {
        response = await Service.GetAllEstimationTasks()
      }
      const data = Array.isArray(response) ? response : response?.data || []
      setEstimation(data)
    } catch (error) {
      console.error('Error fetching estimation tasks:', error)
    }
  }

  const fetchMyTasks = async () => {
    try {
      const response = await Service.GetEstimationTaskForME()
      const data = Array.isArray(response) ? response : response?.data || []
      setMyTasks(data)
    } catch (error) {
      console.error('Error fetching my tasks:', error)
    }
  }

  useEffect(() => {
    fetchAllEstimation();
    fetchMyTasks();
  }, []);

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
            Estimation Home
          </button>
          <button
            onClick={() => setActiveTab("myTask")}
            className={`flex items-center gap-2 px-6 py-1.5 rounded-lg text-sm font-bold uppercase tracking-tight transition-all border-2 shadow-sm ${activeTab === "myTask"
              ? "bg-green-50 text-black border-green-700/80"
              : "bg-white text-gray-500 border-gray-300 hover:bg-green-50/40 hover:border-green-700/30 hover:text-black"
              }`}
          >
            Active Task
          </button>
          <button
            onClick={() => setActiveTab("allEstimation")}
            className={`flex items-center gap-2 px-6 py-1.5 rounded-lg text-sm font-bold uppercase tracking-tight transition-all border-2 shadow-sm ${activeTab === "allEstimation"
              ? "bg-green-50 text-black border-green-700/80"
              : "bg-white text-gray-500 border-gray-300 hover:bg-green-50/40 hover:border-green-700/30 hover:text-black"
              }`}
          >
            All Estimation Task
          </button>
          {isManagement && (
            <button
              onClick={() => setActiveTab("addEstimation")}
              className={`flex items-center gap-2 px-6 py-1.5 rounded-lg text-sm font-bold uppercase tracking-tight transition-all border-2 shadow-sm ${activeTab === "addEstimation"
                ? "bg-green-50 text-black border-green-700/80"
                : "bg-white text-gray-500 border-gray-300 hover:bg-green-50/40 hover:border-green-700/30 hover:text-black"
                }`}
            >
              Add Estimation
            </button>
          )
          }
        </div>
      </div>
      <div className="flex-1 min-h-0 bg-white p-2 rounded-b-2xl overflow-y-auto">
        {activeTab === "dashboard" && (
          <div className="h-full">
            <EstimationDashboard />
          </div>
        )}
        {activeTab === "myTask" && (
          <div className="h-full">
            <AllAssignedTask
              estimations={myTasks}
              onRefresh={fetchMyTasks}
            />
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
