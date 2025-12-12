import { useEffect, useState } from "react";
import { AddEstimation, AllEstimation } from "../components";
import Service from "../api/Service";
import AllEstimationTask from "../components/estimation/estimationTask/AllEstimationTask";


const EstimationLayout = () => {
  const [activeTab, setActiveTab] = useState("allEstimation");
  const [estimation, setEstimation] = useState([]);
  const userRole = sessionStorage.getItem("userRole");

  const fetchAllEstimation = async () => {
    try {
      let response;
      if (userRole !== "ESTIMATOR") {
        response = await Service.GetEstimationTaskForAssignee();
      } else {
        response = await Service.AllEstimation();
      }
      console.log(response?.data);
      setEstimation(response?.data);
    } catch (error) {
      console.error("Error fetching estimations:", error);
    }
  };

  console.log(estimation);
  
  useEffect(() => {
    fetchAllEstimation();
  }, []);

  return (
    <div className="w-full overflow-y-hidden overflow-x-hidden">
      <div className="flex flex-col w-full h-full">
        <div className="px-3 flex flex-col justify-between items-start backdrop-blur-2xl bg-linear-to-t from-emerald-200/60 to-teal-600/50 border-b rounded-t-2xl">
          <h1 className="text-2xl py-2 font-bold text-white">Estimation Detail</h1>
          <div className="flex flex-row w-full">
            <button
              onClick={() => setActiveTab("allEstimation")}
              className={`px-1.5 md:px-4 py-2 rounded-lg rounded-b ${
                activeTab === "allEstimation"
                  ? "text-base md:text-base bg-white/70 backdrop-xl text-gray-800 font-bold"
                  : "md:text-base text-sm text-white font-semibold"
              }`}
            >
              All Estimations
            </button>

            <button
              onClick={() => setActiveTab("addEstimation")}
              className={`px-1.5 md:px-4 py-2 rounded-lg rounded-b ${
                activeTab === "addEstimation"
                  ? "text-base md:text-base bg-white/70 backdrop-xl text-gray-800 font-bold"
                  : "md:text-base text-sm text-white font-semibold"
              }`}
            >
              Add Estimation
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 min-h-0 bg-white p-2 rounded-b-2xl overflow-y-auto">
        {userRole === "ESTIMATION_HEAD" && (
          <>
            {activeTab === "allEstimation" && (
              <AllEstimation estimations={estimation} />
            )}
            {activeTab === "addEstimation" && <AddEstimation />}
          </>
        )}

          <AllEstimationTask estimations={estimation} />
 
      </div>
    </div>
  );
};

export default EstimationLayout;
