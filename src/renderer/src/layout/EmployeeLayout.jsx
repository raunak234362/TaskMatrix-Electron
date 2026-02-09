import { useState } from "react";
import { AddEmployee, AllEmployee } from "../components";

const EmployeeLayout = () => {
  //   console.log("RFQ Component Rendered with projectData:", projectData);
  const [activeTab, setActiveTab] = useState("allEmployee");
  const userRole = sessionStorage.getItem("userRole");
  return (
    <div className="w-full overflow-y-hidden overflow-x-hidden">
      <div className="flex flex-col w-full h-full">
        <div className="px-3 py-2 backdrop-blur-2xl bg-linear-to-t from-white/60 to-white/80 border-b rounded-t-2xl flex flex-col md:flex-row items-center justify-end gap-4">
          <div className="flex flex-row gap-3 items-end justify-end">
            <button
              onClick={() => setActiveTab("allEmployee")}
              className={`px-1.5 md:px-4 py-2 rounded-lg ${activeTab === "allEmployee"
                  ? "md:text-base text-sm bg-green-700 text-white "
                  : "text-base md:text-base bg-white/70 backdrop-xl text-gray-700 font-semibold"
                }`}
            >
              All Employee
            </button>

            {(userRole === "ADMIN" || userRole === "HUMAN_RESOURCE") && (
              <button
                onClick={() => setActiveTab("addEmployee")}
                className={`px-1.5 md:px-4 py-2 rounded-lg ${activeTab === "addEmployee"
                    ? "md:text-base text-sm bg-green-700 text-white "
                    : "text-base md:text-base bg-white/70 backdrop-xl text-gray-700 font-semibold"
                  }`}
              >
                Add Employee
              </button>
            )}
          </div>
        </div>
        <div className="flex-1 min-h-0 overflow-y-auto p-2 bg-white rounded-b-2xl">
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
