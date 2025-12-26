import { useState } from "react";
import { AllActiveTask, AllTasks } from "../components";

// import GetRFQByID from "../components/rfq/GetRFQByID";


const TaskLayout = () => {
  const [activeTab, setActiveTab] = useState("activeTask");

  return (
    <div className="w-full overflow-y-hidden overflow-x-hidden">
      <div className="flex flex-col w-full h-full">
        <div className="px-3 flex flex-col justify-between items-start backdrop-blur-2xl bg-linear-to-t from-emerald-200/60 to-teal-600/50 border-b rounded-t-2xl ">
          <h1 className="text-2xl py-2 font-bold text-white">Task Detail</h1>
          <div className="flex flex-row w-full">
            <button
              onClick={() => setActiveTab("activeTask")}
              className={`px-1.5 md:px-4 py-2 rounded-lg rounded-b ${
                activeTab === "activeTask"
                  ? "text-base md:text-base bg-white/70 backdrop-xl text-gray-800 font-bold"
                  : "md:text-base text-sm text-white font-semibold"
              }`}
            >
              Active Tasks
            </button>
            <button
              onClick={() => setActiveTab("allTask")}
              className={`px-1.5 md:px-4 py-2 rounded-lg rounded-b ${
                activeTab === "allTask"
                  ? "text-base md:text-base bg-white/70 backdrop-xl text-gray-800 font-bold"
                  : "md:text-base text-sm text-white font-semibold"
              }`}
            >
              All Tasks
            </button>

            {/* <button
              onClick={() => setActiveTab("addTask")}
              className={`px-1.5 md:px-4 py-2 rounded-lg rounded-b ${
                activeTab === "addTask"
                  ? "text-base md:text-base bg-white/70 backdrop-xl text-gray-800 font-bold"
                  : "md:text-base text-sm text-white font-semibold"
              }`}
            >
              Add Task
            </button> */}
          </div>
        </div>
      </div>
      <div className="flex-1 min-h-0 bg-white p-2 rounded-b-2xl overflow-y-auto">
        {activeTab === "allTask" && (
          <div>
            <AllTasks/>
          </div>
        )}
        {/* {activeTab === "addTask" && (
          <div>
            <AddTask/>
          </div>
        )} */}
        {activeTab === "activeTask" && (
          <div>
            <AllActiveTask/>
          </div>
        )}
      </div>
    </div>
  );
};

export default TaskLayout