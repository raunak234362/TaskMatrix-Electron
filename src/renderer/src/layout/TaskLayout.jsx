import { useState } from "react";

// import { useSelector } from "react-redux";
import AllTasks from "../components/task/AllTasks";
import AddTask from "../components/task/AddTask";
import AllActiveTask from "../components/task/AllActiveTask";
import PendingTrainings from "../components/training/PendingTrainings";
import MyTrainings from "../components/training/MyTrainings";

const TaskLayout = () => {
  const userRole = sessionStorage.getItem("userRole")?.toLowerCase() || "";
  const [activeTab, setActiveTab] = useState(
    userRole === "connection_designer_engineer" || userRole === "estimation_head" || userRole === "project_manager" || userRole === "dept_manager"
      ? "allTask"
      : "activeTask",
  );
  //   const task = useSelector((state) => state.RFQInfos.RFQData);
  return (
    <div className="w-full overflow-y-hidden overflow-x-hidden">
      <div className="flex flex-col w-full h-full">
        <div className="px-3 py-2 backdrop-blur-2xl bg-linear-to-t from-white/60 to-white/80 rounded-none flex flex-wrap items-center justify-center md:justify-end gap-3">
          <button
            onClick={() => setActiveTab("activeTask")}
            className={`px-6 py-1.5 border-2 rounded-none text-sm font-bold uppercase tracking-tight shadow-sm inline-flex items-center justify-center transition-all cursor-pointer ${activeTab === "activeTask"
              ? "bg-green-200 text-black border-green-700/80"
              : "bg-green-50 text-black border-green-700/80 hover:bg-green-100"
              }`}
          >
            Active Tasks
          </button>
          <button
            onClick={() => setActiveTab("allTask")}
            className={`px-6 py-1.5 border-2 rounded-none text-sm font-bold uppercase tracking-tight shadow-sm inline-flex items-center justify-center transition-all cursor-pointer ${activeTab === "allTask"
              ? "bg-green-200 text-black border-green-700/80"
              : "bg-green-50 text-black border-green-700/80 hover:bg-green-100"
              }`}
          >
            All Task
          </button>
          {userRole === "admin" || userRole === "operation_executive" || userRole === "project_manager" || userRole === "department_manager" || userRole === "dept_manager" ? (
            <button
              onClick={() => setActiveTab("addTask")}
              className={`px-6 py-1.5 border-2 rounded-none text-sm font-bold uppercase tracking-tight shadow-sm inline-flex items-center justify-center transition-all cursor-pointer ${activeTab === "addTask"
                ? "bg-green-200 text-black border-green-700/80"
                : "bg-green-50 text-black border-green-700/80 hover:bg-green-100"
                }`}
            >
              Add Task
            </button>
          ) : null}
          {['admin', 'operation_executive', 'deputy_manager', 'human_resource'].includes(userRole) ? (
            <button
              onClick={() => setActiveTab("pendingTraining")}
              className={`px-6 py-1.5 border-2 rounded-none text-sm font-bold uppercase tracking-tight shadow-sm inline-flex items-center justify-center gap-2 transition-all cursor-pointer ${activeTab === "pendingTraining"
                ? "bg-purple-200 text-black border-purple-700/80"
                : "bg-purple-50 text-black border-purple-700/80 hover:bg-purple-100"
                }`}
            >
              🎓 Pending Training
            </button>
          ) : null}
          <button
            onClick={() => setActiveTab("myTraining")}
            className={`px-6 py-1.5 border-2 rounded-none text-sm font-bold uppercase tracking-tight shadow-sm inline-flex items-center justify-center gap-2 transition-all cursor-pointer ${activeTab === "myTraining"
              ? "bg-purple-200 text-black border-purple-700/80"
              : "bg-purple-50 text-black border-purple-700/80 hover:bg-purple-100"
              }`}
          >
            🎓 My Trainings
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
        {activeTab === "pendingTraining" && (
          <div className="p-4">
            <PendingTrainings />
          </div>
        )}
        {activeTab === "myTraining" && (
          <div className="p-4">
            <MyTrainings />
          </div>
        )}
      </div>
    </div>
  );
};

export default TaskLayout;
