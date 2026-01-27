import { useState } from "react";
import AddTeam from "../components/manageTeam/team/AddTeam";
import AllTeam from "../components/manageTeam/team/AllTeam";

const TeamLayout = () => {
  const [activeTab, setActiveTab] = useState("allTeam");
  const userRole = sessionStorage.getItem("userRole");
  return (
    <div className="w-full overflow-y-hidden overflow-x-hidden">
      <div className="flex flex-col w-full h-full">
        <div className="px-3 py-2 backdrop-blur-2xl bg-linear-to-t from-white/60 to-white/80 border-b rounded-t-2xl flex flex-col md:flex-row items-center justify-end gap-4">
          <div className="flex flex-row gap-3 items-end justify-end">
            <button
              onClick={() => setActiveTab("allTeam")}
              className={`px-1.5 md:px-4 py-2 rounded-lg ${
                activeTab === "allTeam"
                  ? "md:text-base text-sm bg-green-700 text-white font-bold"
                  : "text-base md:text-base bg-white/70 backdrop-xl text-gray-700 font-semibold"
              }`}
            >
              All Team
            </button>

            {(userRole === "ADMIN" || userRole === "HUMAN_RESOURCE") && (
              <button
                onClick={() => setActiveTab("addTeam")}
                className={`px-1.5 md:px-4 py-2 rounded-lg ${
                  activeTab === "addTeam"
                    ? "md:text-base text-sm bg-green-700 text-white font-bold"
                    : "text-base md:text-base bg-white/70 backdrop-xl text-gray-700 font-semibold"
                }`}
              >
                Add Team
              </button>
            )}
          </div>
        </div>
        <div className="grow p-2 bg-white rounded-b-2xl">
          {activeTab === "allTeam" && (
            <div>
              <AllTeam />
            </div>
          )}
          {activeTab === "addTeam" && (
            <div>
              {" "}
              <AddTeam />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TeamLayout;
