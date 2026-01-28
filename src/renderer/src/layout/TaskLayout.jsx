import { useState } from "react";

// import { useSelector } from "react-redux";
import AllTasks from "../components/task/AllTasks";
import AddTask from "../components/task/AddTask";
import AllActiveTask from "../components/task/AllActiveTask";
// import GetRFQByID from "../components/rfq/GetRFQByID";

const TaskLayout = () => {
  const [activeTab, setActiveTab] = useState("allTask");
  //   const task = useSelector((state) => state.RFQInfos.RFQData);
  return (
    <div className="w-full overflow-y-hidden overflow-x-hidden">
      <div className="flex flex-col w-full h-full">
        <div className="px-3 py-2 backdrop-blur-2xl bg-linear-to-t from-white/60 to-white/80 rounded-t-2xl flex flex-wrap items-center justify-center md:justify-end gap-3">
          <button
            onClick={() => setActiveTab("activeTask")}
            className={`flex items-center gap-2 px-4 md:px-6 py-2 md:py-3 rounded-[1.25rem] text-sm md:text-base font-semibold transition-all ${
              activeTab === "activeTask"
                ? "bg-green-500 text-white shadow-[0_8px_20px_-4px_rgba(34,197,94,0.4)] hover:bg-green-600 hover:shadow-[0_12px_24px_-4px_rgba(34,197,94,0.5)]"
                : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 hover:text-green-600 shadow-sm"
            }`}
          >
            Active Tasks
          </button>
          <button
            onClick={() => setActiveTab("allTask")}
            className={`flex items-center gap-2 px-4 md:px-6 py-2 md:py-3 rounded-[1.25rem] text-sm md:text-base font-semibold transition-all ${
              activeTab === "allTask"
                ? "bg-green-500 text-white shadow-[0_8px_20px_-4px_rgba(34,197,94,0.4)] hover:bg-green-600 hover:shadow-[0_12px_24px_-4px_rgba(34,197,94,0.5)]"
                : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 hover:text-green-600 shadow-sm"
            }`}
          >
            All Task
          </button>

          <button
            onClick={() => setActiveTab("addTask")}
            className={`flex items-center gap-2 px-4 md:px-6 py-2 md:py-3 rounded-[1.25rem] text-sm md:text-base font-semibold transition-all ${
              activeTab === "addTask"
                ? "bg-green-500 text-white shadow-[0_8px_20px_-4px_rgba(34,197,94,0.4)] hover:bg-green-600 hover:shadow-[0_12px_24px_-4px_rgba(34,197,94,0.5)]"
                : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 hover:text-green-600 shadow-sm"
            }`}
          >
            Add Task
          </button>
        </div>
      </div>
      <div className="flex-1 min-h-0 bg-white p-2 rounded-b-2xl overflow-y-auto">
        {activeTab === "activeTask" && (
          <div>
            <AllActiveTask />
          </div>
        )}
        {activeTab === "allTask" && (
          <div>
            <AllTasks />
          </div>
        )}
        {activeTab === "addTask" && (
          <div>
            <AddTask />
          </div>
        )}
      </div>
    </div>
  );
};

export default TaskLayout;
