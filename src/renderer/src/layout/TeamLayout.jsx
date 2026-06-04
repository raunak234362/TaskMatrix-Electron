import { useState } from "react";
import AddTeam from "../components/manageTeam/team/AddTeam";
import AllTeam from "../components/manageTeam/team/AllTeam";

const TeamLayout = () => {
  const [activeTab, setActiveTab] = useState("allTeam");
  const userRole = sessionStorage.getItem("userRole");
  return (
    <div className="w-full overflow-y-hidden overflow-x-hidden">
      <div className="flex flex-col w-full h-full">
        <div className="px-3 py-2 backdrop-blur-2xl bg-linear-to-t from-white/60 to-white/80 flex flex-col md:flex-row items-center justify-end gap-4">
          <div className="flex flex-row gap-3 items-end justify-end">
            <button
              onClick={() => setActiveTab("allTeam")}
              className={`px-1.5 md:px-4 py-2 border-2 rounded-none transition-all cursor-pointer text-xs font-bold uppercase tracking-widest shadow-sm ${activeTab === "allTeam"
                ? "bg-green-50 text-black border-green-700/80"
                : "bg-white text-black/50 border-gray-200 hover:border-black hover:text-black"
                }`}
            >
              All Team
            </button>

            {(userRole === "ADMIN" || userRole === "HUMAN_RESOURCE") && (
              <button
                onClick={() => setActiveTab("addTeam")}
                className={`px-1.5 md:px-4 py-2 border-2 rounded-none transition-all cursor-pointer text-xs font-bold uppercase tracking-widest shadow-sm ${activeTab === "addTeam"
                  ? "bg-green-50 text-black border-green-700/80"
                  : "bg-white text-black/50 border-gray-200 hover:border-black hover:text-black"
                  }`}
              >
                Add Team
              </button>
            )}
          </div>
        </div>
        <div className="grow p-4 md:p-6 bg-white">
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
