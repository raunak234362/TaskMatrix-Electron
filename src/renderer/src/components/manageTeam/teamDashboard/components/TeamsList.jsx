import { Users } from "lucide-react";

const TeamsList = ({
  filteredTeams,
  selectedTeam,
  onTeamSelect,
}) => {
  return (
    <div className="space-y-6">
      <h3 className="text-2xl font-bold text-black flex items-center gap-3 uppercase tracking-tight">
        <Users size={24} strokeWidth={2.5} className="text-black" />
        Teams
      </h3>
      <div className="flex flex-wrap w-full gap-4">
        {filteredTeams.map((team) => (
          <div
            key={team.id}
            onClick={() => onTeamSelect(team.id)}
            className={`p-5 rounded-none border transition-all cursor-pointer group flex-1 min-w-[250px] flex items-center justify-between ${selectedTeam === team.id
              ? "bg-green-50 border-green-700/80 shadow-sm"
              : "bg-white border-black/15 hover:border-black hover:shadow-sm"
              }`}
          >
            <h4 className={`text-lg font-bold tracking-tight text-black transition-colors uppercase`}>
              {team.name}
            </h4>
            <p className="text-xs font-bold text-black/60 uppercase">
              {team.members?.length || 0} members
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TeamsList;
