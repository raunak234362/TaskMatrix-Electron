import React from "react";
import { Users } from "lucide-react";



const TeamsList = ({
  filteredTeams,
  selectedTeam,
  onTeamSelect,
}) => {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-700 flex items-center gap-2">
        <Users size={20} className="text-green-600" />
        Teams
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {filteredTeams.map((team) => (
          <div
            key={team.id}
            onClick={() => onTeamSelect(team.id)}
            className={`p-4 rounded-2xl border transition-all cursor-pointer group ${
              selectedTeam === team.id
                ? "bg-green-50 border-green-200 shadow-sm shadow-green-100"
                : "bg-white border-gray-100 hover:border-green-200 hover:shadow-md hover:shadow-gray-100"
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <h4
                className={`font-bold transition-colors ${
                  selectedTeam === team.id
                    ? "text-green-700"
                    : "text-gray-700 group-hover:text-green-600"
                }`}
              >
                {team.name}
              </h4>
              <div
                className={`p-2 rounded-lg transition-colors ${
                  selectedTeam === team.id
                    ? "bg-green-100 text-green-600"
                    : "bg-gray-50 text-gray-400 group-hover:bg-green-50 group-hover:text-green-500"
                }`}
              >
                <Users size={16} />
              </div>
            </div>
            <p className="text-xs text-gray-700">
              {team.members?.length || 0} members
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TeamsList;
