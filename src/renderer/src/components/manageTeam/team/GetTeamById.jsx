import { useEffect, useState } from "react";
import Service from "../../../api/Service";
import { AlertCircle, Loader2 } from "lucide-react";
import Button from "../../fields/Button";
import TeamMember from "./TeamMember";

const GetTeamByID = ({ id }) => {
  const [team, setTeam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [teamMember, setTeamMember] = useState(false);

  useEffect(() => {
    const fetchTeam = async () => {
      if (!id) {
        setError("Invalid team ID");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const response = await Service.GetTeamByID(id);
        const raw = response?.data;
        setTeam(raw);
      } catch (err) {
        const msg = "Failed to load team details";
        setError(msg);
        console.error(msg, err);
      } finally {
        setLoading(false);
      }
    };

    fetchTeam();
  }, [id]);

  const handleTeamMember = (teamMemberData) => {
    setTeamMember(teamMemberData);
  };

  const handleCloseTeamMember = () => {
    setTeamMember(false);
  };

  console.log(team);

  // ── Loading ──
  if (loading) {
    return (
      <div className="flex items-center justify-center py-8 text-gray-700">
        <Loader2 className="w-5 h-5 animate-spin mr-2" />
        Loading team details...
      </div>
    );
  }

  // ── Error / Not Found ──
  if (error || !team) {
    return (
      <div className="flex items-center justify-center py-8 text-red-600">
        <AlertCircle className="w-5 h-5 mr-2" />
        {error || "Team not found"}
      </div>
    );
  }

  // ── Helpers ──
  const fullManagerName = [
    team.manager?.firstName,
    team.manager?.middleName,
    team.manager?.lastName,
  ]
    .filter(Boolean)
    .join(" ")
    .trim();

  const memberCount = team.members?.length ?? 0;

  return (
    <div className="bg-gray-50/50 p-10 rounded-3xl border border-black/5 shadow-inner">
      {/* Header */}
      <div className="mb-8 border-b border-black/5 pb-4">
        <h3 className="text-2xl font-black text-black uppercase tracking-tight">{team.name}</h3>
      </div>

      {/* Two‑column grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10 text-sm">
        {/* Left */}
        <div className="space-y-4">
          <InfoRow label="Team Name" value={team.name} />
          <InfoRow label="Department" value={team.department?.name ?? "—"} />
        </div>

        {/* Right */}
        <div className="space-y-4">
          <InfoRow label="Manager" value={fullManagerName || "No Manager"} />
          {team.manager && (
            <>
              <InfoRow
                label="Email"
                value={
                  <a
                    href={`mailto:${team.manager.email}`}
                    className="text-black font-bold hover:underline"
                  >
                    {team.manager.email}
                  </a>
                }
              />
              <InfoRow
                label="Phone"
                value={
                  <a
                    href={`tel:${team.manager.phone}`}
                    className="text-black font-bold hover:underline"
                  >
                    {team.manager.phone}
                    {team.manager.extension && (
                      <span className="text-black/40 text-xs ml-1 font-bold">
                        (Ext: {team.manager.extension})
                      </span>
                    )}
                  </a>
                }
              />
            </>
          )}
          <InfoRow
            label="Members"
            value={`${memberCount} member${memberCount === 1 ? "" : "s"}`}
          />
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-4 mt-8 pt-6 border-t border-black/5">
        <Button className="flex items-center gap-2 px-8 py-3 bg-white border border-black/10 rounded-2xl text-black font-black text-xs uppercase tracking-widest hover:bg-gray-50 transition-all shadow-sm">
          Edit Team
        </Button>
        <Button className="flex items-center gap-2 px-8 py-3 bg-red-50 border border-red-100 rounded-2xl text-red-600 font-black text-xs uppercase tracking-widest hover:bg-red-100 transition-all shadow-sm">
          Delete Team
        </Button>
        <Button
          onClick={() => handleTeamMember(team)}
          className="flex items-center gap-2 px-8 py-3 bg-black text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-black/90 transition-all shadow-medium"
        >
          Team Members
        </Button>
      </div>
      {teamMember && (
        <TeamMember members={team} onClose={handleCloseTeamMember} />
      )}
    </div>
  );
};

// ── Reusable InfoRow ──
const InfoRow = ({ label, value }) => (
  <div className="flex justify-between items-center py-1">
    <span className="text-black/40 font-black uppercase tracking-[0.15em] text-[10px]">{label}</span>
    <span className="text-black font-black text-sm tracking-tight">{value}</span>
  </div>
);

export default GetTeamByID;
