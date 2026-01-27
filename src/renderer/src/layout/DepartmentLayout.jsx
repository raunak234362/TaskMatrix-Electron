import { useState } from "react";
import { AddDepartment, AllDepartments } from "../components";

const DepartmentLayout = () => {
  const [activeTab, setActiveTab] = useState("alldepartment");
  const userRole = sessionStorage.getItem("userRole");
  return (
    <div className="w-full overflow-y-hidden overflow-x-hidden">
      <div className="flex flex-col w-full h-full">
        <div className="px-3 py-2 backdrop-blur-2xl bg-linear-to-t from-white/60 to-white/80 border-b rounded-t-2xl flex flex-col md:flex-row items-center justify-end gap-4">
          <div className="flex flex-row gap-3 items-end justify-end">
            <button
              onClick={() => setActiveTab("alldepartment")}
              className={`px-1.5 md:px-4 py-2 rounded-lg ${
                activeTab === "alldepartment"
                  ? "md:text-base text-sm bg-green-700 text-white font-bold"
                  : "text-base md:text-base bg-white/70 backdrop-xl text-gray-700 font-semibold"
              }`}
            >
              All Department
            </button>

            {(userRole === "ADMIN" || userRole === "HUMAN_RESOURCE") && (
              <button
                onClick={() => setActiveTab("addDepartment")}
                className={`px-1.5 md:px-4 py-2 rounded-lg ${
                  activeTab === "addDepartment"
                    ? "md:text-base text-sm bg-green-700 text-white font-bold"
                    : "text-base md:text-base bg-white/70 backdrop-xl text-gray-700 font-semibold"
                }`}
              >
                Add Department
              </button>
            )}
          </div>
        </div>
        <div className="grow p-2 bg-white rounded-b-2xl">
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
