/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
import { TeamDashboard } from "../components";
import EmployeeLayout from "../layout/EmployeeLayout";
import DepartmentLayout from "../layout/DepartmentLayout";
import TeamLayout from "../layout/TeamLayout";
import Service from "../api/Service";
import { useDispatch, useSelector } from "react-redux";
import { showDepartment, showTeam } from "../store/userSlice";

const TeamPage = () => {
  const dispatch = useDispatch();

  const [activeTab, setActiveTab] = useState("teamDashboard");
  const userRole = sessionStorage.getItem("userRole");

  const departmentDatas = useSelector(
    (state) => state?.userInfo?.departmentData
  );
  const teamDatas = useSelector((state) => state?.userInfo?.teamData);

  // ✅ Fetch Departments only when data is null or empty
  const fetchDepartment = async () => {
    try {
      const response = await Service.AllDepartments();
      dispatch(showDepartment(response?.data));
    } catch (error) {
      console.log("Error fetching departments", error);
    }
  };

  // ✅ Fetch Teams only when data is null or empty
  const fetchTeam = async () => {
    try {
      const response = await Service.AllTeam();
      dispatch(showTeam(response?.data));
    } catch (error) {
      console.log("Error fetching teams", error);
    }
  };

  useEffect(() => {
    // ✅ Only call if no data exists
    if (!departmentDatas || departmentDatas.length === 0) {
      fetchDepartment();
    }

    if (!teamDatas || teamDatas.length === 0) {
      fetchTeam();
    }
  }, [dispatch]);

  return (
    <div className="h-full w-full overflow-y-auto overflow-x-hidden">
      <div className="flex flex-col w-full h-full">
        {/* ---------- TOP TABS ---------- */}
        <div className="px-3 py-2 backdrop-blur-2xl bg-linear-to-t from-white/60 to-white/80 rounded-t-2xl flex flex-wrap items-center justify-center md:justify-end gap-3">
          <button
            onClick={() => setActiveTab("teamDashboard")}
            className={`px-4 md:px-6 py-2 md:py-3 rounded-[1.25rem] text-sm md:text-base  transition-all shadow-sm ${activeTab === "teamDashboard"
              ? "bg-green-50 text-gray-700 border border-black font-semibold"
              : "bg-white text-gray-700 border border-black font-semibold"
              }`}
          >
            TEAM DASHBOARD
          </button>

          <button
            onClick={() => setActiveTab("manageEmployee")}
            className={`px-4 md:px-6 py-2 md:py-3 rounded-[1.25rem] text-sm md:text-base  transition-all shadow-sm ${activeTab === "manageEmployee"
              ? "bg-green-50 text-gray-700 border border-black font-semibold"
              : "bg-white text-gray-700 border border-black font-semibold"
              }`}
          >
            MANAGE EMPLOYEE
          </button>

          {(userRole === "ADMIN" || userRole === "HUMAN_RESOURCE") && (
            <button
              onClick={() => setActiveTab("manageDepartment")}
              className={`px-4 md:px-6 py-2 md:py-3 rounded-[1.25rem] text-sm md:text-base  transition-all shadow-sm ${activeTab === "manageDepartment"
                ? "bg-green-50 text-gray-700 border border-black font-semibold"
              : "bg-white text-gray-700 border border-black font-semibold"
                }`}
            >
              MANAGE DEPARTMENT
            </button>
          )}

          {(userRole === "ADMIN" ||
            userRole === "DEPT_MANAGER" ||
            userRole === "HUMAN_RESOURCE") && (
              <button
                onClick={() => setActiveTab("manageTeam")}
                className={`px-4 md:px-6 py-2 md:py-3 rounded-[1.25rem] text-sm md:text-base  transition-all shadow-sm ${activeTab === "manageTeam"
                  ? "bg-green-50 text-gray-700 border border-black font-semibold"
              : "bg-white text-gray-700 border border-black font-semibold"
                  }`}
              >
                MANAGE TEAM
              </button>
            )}
        </div>

        {/* ---------- TAB CONTENT ---------- */}
        <div className="flex-1 min-h-0 py-2 overflow-y-auto">
          {activeTab === "manageEmployee" && <EmployeeLayout />}
          {activeTab === "manageDepartment" && <DepartmentLayout />}
          {activeTab === "manageTeam" && <TeamLayout />}
          {activeTab === "teamDashboard" && <TeamDashboard />}
        </div>
      </div>
    </div>
  );
};

export default TeamPage;
