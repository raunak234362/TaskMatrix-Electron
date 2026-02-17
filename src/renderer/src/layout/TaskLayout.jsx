import { useState } from "react";

// import { useSelector } from "react-redux";
import AllTasks from "../components/task/AllTasks";
import AddTask from "../components/task/AddTask";
import AllActiveTask from "../components/task/AllActiveTask";
// import GetRFQByID from "../components/rfq/GetRFQByID";

const TaskLayout = () => {
  const userRole = sessionStorage.getItem("userRole")?.toLowerCase() || "";
  const [activeTab, setActiveTab] = useState(
    userRole === "connection_designer_engineer" || userRole === "estimation_head" || userRole === "project_manager"
      ? "allTask"
      : "activeTask",
  );
  //   const task = useSelector((state) => state.RFQInfos.RFQData);
  return (
    <div className="w-full overflow-y-hidden overflow-x-hidden">
      <div className="flex flex-col w-full h-full">
        <div className="px-3 py-2 backdrop-blur-2xl bg-linear-to-t from-white/60 to-white/80 rounded-t-2xl flex flex-wrap items-center justify-center md:justify-end gap-3">
          <button
            onClick={() => setActiveTab("activeTask")}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold uppercase tracking-wider transition-all border ${activeTab === "activeTask"
              ? "bg-[#ebf5ea] text-black border-black shadow-sm"
              : "bg-white text-gray-500 border-gray-300 hover:border-black hover:bg-gray-50 hover:text-black"
              }`}
          >
            Active Tasks
          </button>
          <button
            onClick={() => setActiveTab("allTask")}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold uppercase tracking-wider transition-all border ${activeTab === "allTask"
              ? "bg-[#ebf5ea] text-black border-black shadow-sm"
              : "bg-white text-gray-500 border-gray-300 hover:border-black hover:bg-gray-50 hover:text-black"
              }`}
          >
            All Task
          </button>
          {userRole === "admin" || userRole === "operation_executive" || userRole === "project_manager" || userRole === "department_manager" ? (
            <button
              onClick={() => setActiveTab("addTask")}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold uppercase tracking-wider transition-all border ${activeTab === "addTask"
                ? "bg-[#ebf5ea] text-black border-black shadow-sm"
                : "bg-white text-gray-500 border-gray-300 hover:border-black hover:bg-gray-50 hover:text-black"
                }`}
            >
              Add Task
            </button>
          ) : null}
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
