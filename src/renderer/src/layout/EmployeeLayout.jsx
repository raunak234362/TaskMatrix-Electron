import { useState } from "react";
import { AddEmployee, AllEmployee } from "../components";

const EmployeeLayout = () => {
  //   console.log("RFQ Component Rendered with projectData:", projectData);
  const [activeTab, setActiveTab] = useState("allEmployee");
  const userRole = sessionStorage.getItem("userRole");
  return (
    <div className="w-full overflow-y-hidden overflow-x-hidden">
      <div className="flex flex-col w-full h-full">
        <div className="px-3 py-2 backdrop-blur-2xl bg-linear-to-t from-white/60 to-white/80 border-b flex flex-col md:flex-row items-center justify-end gap-4">
          <div className="flex flex-row gap-3 items-end justify-end">
            <button
              onClick={() => setActiveTab("allEmployee")}
              className={`px-1.5 md:px-4 py-2 border-2 rounded-none transition-all cursor-pointer text-xs font-bold uppercase tracking-widest shadow-sm ${activeTab === "allEmployee"
                ? "bg-green-50 text-black border-green-700/80"
                : "bg-white text-black/50 border-gray-200 hover:border-black hover:text-black"
                }`}
            >
              All Employee
            </button>

            {(userRole === "ADMIN" || userRole === "HUMAN_RESOURCE") && (
              <button
                onClick={() => setActiveTab("addEmployee")}
                className={`px-1.5 md:px-4 py-2 border-2 rounded-none transition-all cursor-pointer text-xs font-bold uppercase tracking-widest shadow-sm ${activeTab === "addEmployee"
                  ? "bg-green-50 text-black border-green-700/80"
                  : "bg-white text-black/50 border-gray-200 hover:border-black hover:text-black"
                  }`}
              >
                Add Employee
              </button>
            )}
          </div>
        </div>
        <div className="flex-1 min-h-0 overflow-y-auto p-2 bg-white">
          {activeTab === "allEmployee" && (
            <div>
              <AllEmployee />
            </div>
          )}

          {activeTab === "addEmployee" && (
            <div>
              {" "}
              <AddEmployee />{" "}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EmployeeLayout;
