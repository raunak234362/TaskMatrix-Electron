import { Users } from "lucide-react";

const TeamsList = ({
  filteredTeams,
  selectedTeam,
  onTeamSelect,
}) => {
  return (
    <div className="space-y-6">
      <h3 className="text-2xl font-black text-black flex items-center gap-3 uppercase tracking-tight">
        <Users size={24} strokeWidth={2.5} className="text-[#6bbd45]" />
        Teams
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-4 gap-4">
        {filteredTeams.map((team) => (
          <div
            key={team.id}
            onClick={() => onTeamSelect(team.id)}
            className={`p-5 rounded-[1.25rem] border transition-all cursor-pointer group flex flex-col justify-between  ${selectedTeam === team.id
              ? "bg-green-50 border-[#6bbd45]/40 shadow-sm ring-1 ring-[#6bbd45]/5"
              : "bg-white border-black/10 hover:border-black/20 hover:shadow-sm"
              }`}
          >
            <div className="flex items-start justify-between">
              <div>
                <h4 className={`text-xl font-black tracking-tight text-black/80 transition-colors uppercase ${selectedTeam === team.id ? 'text-black' : ''}`}>
                  {team.name}
                </h4>
                <p className="text-sm font-bold text-black/40">
                  {team.members?.length || 0} members
                </p>
              </div>
              <div className={`p-2.5 rounded-xl transition-all ${selectedTeam === team.id ? 'bg-[#6bbd45]/20 text-[#6bbd45]' : 'bg-gray-50 text-black/10 group-hover:text-[#6bbd45] group-hover:bg-[#6bbd45]/5'}`}>
                <Users size={16} strokeWidth={2.5} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TeamsList;
