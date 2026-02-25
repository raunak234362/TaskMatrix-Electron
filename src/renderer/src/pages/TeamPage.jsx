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
        <div className="px-6 py-4 bg-white/50 backdrop-blur-xl border-b border-gray-100 flex flex-wrap items-center justify-center md:justify-end gap-3">
          <button
            onClick={() => setActiveTab("teamDashboard")}
            className={`px-6 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all shadow-sm border-2 ${activeTab === "teamDashboard"
              ? "bg-green-100 text-black border-black shadow-[2px_2px_0px_#000]"
              : "bg-white text-black/50 border-gray-200 hover:border-black hover:text-black"
              }`}
          >
            Team Dashboard
          </button>

          <button
            onClick={() => setActiveTab("manageEmployee")}
            className={`px-6 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all shadow-sm border-2 ${activeTab === "manageEmployee"
              ? "bg-green-100 text-black border-black shadow-[2px_2px_0px_#000]"
              : "bg-white text-black/50 border-gray-200 hover:border-black hover:text-black"
              }`}
          >
            Manage Employee
          </button>

          {(userRole === "ADMIN" || userRole === "HUMAN_RESOURCE") && (
            <button
              onClick={() => setActiveTab("manageDepartment")}
              className={`px-6 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all shadow-sm border-2 ${activeTab === "manageDepartment"
                ? "bg-green-100 text-black border-black shadow-[2px_2px_0px_#000]"
                : "bg-white text-black/50 border-gray-200 hover:border-black hover:text-black"
                }`}
            >
              Manage Department
            </button>
          )}

          {(userRole === "ADMIN" ||
            userRole === "DEPT_MANAGER" ||
            userRole === "HUMAN_RESOURCE") && (
              <button
                onClick={() => setActiveTab("manageTeam")}
                className={`px-6 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all shadow-sm border-2 ${activeTab === "manageTeam"
                  ? "bg-green-100 text-black border-black shadow-[2px_2px_0px_#000]"
                  : "bg-white text-black/50 border-gray-200 hover:border-black hover:text-black"
                  }`}
              >
                Manage Team
              </button>
            )}
        </div>

        {/* ---------- TAB CONTENT ---------- */}
        <div className="flex-1 min-h-0 overflow-y-auto">
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
