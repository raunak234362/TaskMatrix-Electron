import { useState } from "react";
import { AddDepartment, AllDepartments } from "../components";

const DepartmentLayout = () => {
  const [activeTab, setActiveTab] = useState("alldepartment");
  const userRole = sessionStorage.getItem("userRole");
  return (
    <div className="w-full overflow-y-hidden overflow-x-hidden">
      <div className="flex flex-col w-full h-full">
        <div className="px-3 py-2 backdrop-blur-2xl bg-linear-to-t from-white/60 to-white/80 flex flex-col md:flex-row items-center justify-end gap-4">
          <div className="flex flex-row gap-3 items-end justify-end">
            <button
              onClick={() => setActiveTab("alldepartment")}
              className={`px-1.5 md:px-4 py-2 border-2 rounded-none transition-all cursor-pointer text-xs font-bold uppercase tracking-widest shadow-sm ${activeTab === "alldepartment"
                ? "bg-green-50 text-black border-green-700/80"
                : "bg-white text-black/50 border-gray-200 hover:border-black hover:text-black"
                }`}
            >
              All Department
            </button>

            {(userRole === "ADMIN" || userRole === "HUMAN_RESOURCE") && (
              <button
                onClick={() => setActiveTab("addDepartment")}
                className={`px-1.5 md:px-4 py-2 border-2 rounded-none transition-all cursor-pointer text-xs font-bold uppercase tracking-widest shadow-sm ${activeTab === "addDepartment"
                  ? "bg-green-50 text-black border-green-700/80"
                  : "bg-white text-black/50 border-gray-200 hover:border-black hover:text-black"
                  }`}
              >
                Add Department
              </button>
            )}
          </div>
        </div>
        <div className="grow p-4 md:p-6 bg-white">
          {activeTab === "alldepartment" && (
            <div>
              <AllDepartments />
            </div>
          )}
          {activeTab === "addDepartment" && (
            <div>
              {" "}
              <AddDepartment />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DepartmentLayout;
