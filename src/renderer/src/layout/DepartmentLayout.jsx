import { useState } from "react";
import { AddDepartment, AllDepartments } from "../components";


const DepartmentLayout = () => {
  
  const [activeTab, setActiveTab] = useState("alldepartment");
  const userRole = sessionStorage.getItem("userRole");
  return (
    <div className="w-full overflow-y-hidden overflow-x-hidden">
      <div className="flex flex-col w-full h-full">
        <div className="px-3 flex flex-col justify-between items-start backdrop-blur-2xl bg-linear-to-t from-emerald-200/60 to-teal-600/50 border-b rounded-t-md ">
          <div className="flex w-full overflow-x-auto">
            <button
              onClick={() => setActiveTab("alldepartment")}
              className={`px-1.5 md:px-4 py-2 rounded-lg rounded-b ${
                activeTab === "alldepartment"
                  ? "text-base md:text-base bg-white/70 backdrop-xl text-gray-800 font-bold"
                  : "md:text-base text-sm text-white font-semibold"
              }`}
            >
              All Department
            </button>

            {(userRole === "ADMIN" || userRole === "human-resource") && (
              <>
                <button
                  onClick={() => setActiveTab("addDepartment")}
                  className={`px-1.5 md:px-4 py-2 rounded-lg rounded-b ${
                    activeTab === "addDepartment"
                      ? "text-base md:text-base bg-white/70 backdrop-xl text-gray-800 font-bold"
                      : "md:text-base text-sm text-white font-semibold"
                  }`}
                >
                  Add Department
                </button>
              </>
            )}
          </div>
        </div>
        <div className="flex-grow p-2 bg-white rounded-b-2xl">
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
