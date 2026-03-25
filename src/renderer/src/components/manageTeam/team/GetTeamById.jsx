import { useEffect, useState } from "react";
import Service from "../../../api/Service";
import { AlertCircle, Loader2, Users, Mail, Phone, Shield, Edit2, Trash2, UserPlus } from "lucide-react";
import Button from "../../fields/Button";
import TeamMember from "./TeamMember";

const GetTeamByID = ({ id, onClose, onSuccess }) => {
  const [team, setTeam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [teamMember, setTeamMember] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteTeam = async () => {
    try {
      setIsDeleting(true);
      const response = await Service.DeleteTeam(id);
      console.log("DELETE TEAM RESPONSE:", response);
      if (onSuccess) onSuccess();
    } catch (err) {
      console.error("Failed to delete team:", err);
    } finally {
      setIsDeleting(false);
    }
  };

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

  // ── Loading ──
  if (loading) {
    return (
      <div className="flex items-center justify-center p-12 text-black bg-white rounded-2xl border border-gray-200 shadow-xl">
        <Loader2 className="w-8 h-8 animate-spin mr-3 text-[#6bbd45]" />
        <span className="text-sm font-black uppercase tracking-widest text-[#6bbd45]">Loading team details...</span>
      </div>
    );
  }

  // ── Error / Not Found ──
  if (error || !team) {
    return (
      <div className="flex items-center justify-center p-12 text-red-600 bg-white rounded-2xl border border-gray-200 shadow-xl">
        <AlertCircle className="w-8 h-8 mr-3" />
        <span className="text-sm font-black uppercase tracking-widest">{error || "Team not found"}</span>
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
    <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden animate-in fade-in zoom-in duration-200 w-full max-w-4xl mx-auto flex flex-col max-h-[90vh]">
      {/* Header */}
      <header className="flex items-center justify-between p-6 border-b border-gray-200 bg-white sticky top-0 z-10 shrink-0">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-[#6bbd45]/15 rounded-xl text-[#6bbd45]">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-black text-black tracking-tight uppercase">
              {team.name}
            </h2>
            <p className="text-[10px] font-black text-black uppercase tracking-[0.2em] mt-1">
              TEAM DETAILS AND MANAGEMENT
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="px-4 py-2 bg-red-50 border border-red-600 text-black font-black text-[10px] uppercase tracking-widest rounded-lg hover:bg-red-100 transition-all"
        >
          Close
        </button>
      </header>

      <div className="p-8 overflow-y-auto custom-scrollbar flex-1">
        <div className="mb-8 p-6 bg-gray-50 border border-gray-200 rounded-2xl shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <InfoRow label="Team Name" value={team.name} icon={<Users className="w-4 h-4 text-[#6bbd45]" />} />
              <InfoRow label="Department" value={team.department?.name ?? "—"} icon={<Shield className="w-4 h-4 text-[#6bbd45]" />} />
              <InfoRow label="Total Members" value={`${memberCount} member${memberCount === 1 ? "" : "s"}`} icon={<UserPlus className="w-4 h-4 text-[#6bbd45]" />} />
            </div>

            <div className="space-y-6">
              <InfoRow label="Manager" value={fullManagerName || "No Manager"} icon={<Shield className="w-4 h-4 text-[#6bbd45]" />} />
              {team.manager && (
                <>
                  <div className="flex flex-col gap-1">
                    <span className="text-black/40 font-black uppercase tracking-[0.15em] text-[10px] flex items-center gap-2">
                      <Mail className="w-3 h-3" /> Email
                    </span>
                    <a
                      href={`mailto:${team.manager.email}`}
                      className="text-black font-black text-sm tracking-tight hover:text-[#6bbd45] transition-colors"
                    >
                      {team.manager.email}
                    </a>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-black/40 font-black uppercase tracking-[0.15em] text-[10px] flex items-center gap-2">
                      <Phone className="w-3 h-3" /> Phone
                    </span>
                    <a
                      href={`tel:${team.manager.phone}`}
                      className="text-black font-black text-sm tracking-tight hover:text-[#6bbd45] transition-colors"
                    >
                      {team.manager.phone}
                      {team.manager.extension && (
                        <span className="text-black/40 text-[10px] ml-2 font-black">
                          (EXT: {team.manager.extension})
                        </span>
                      )}
                    </a>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {teamMember && (
          <div className="mt-8 border-t border-gray-100 pt-8 animate-in fade-in slide-in-from-top-4 duration-300">
            <TeamMember members={team} onClose={handleCloseTeamMember} />
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="p-6 border-t border-gray-200 bg-white flex flex-wrap justify-end gap-3 shrink-0">
        <button className="flex items-center gap-2 px-6 py-3 bg-gray-50 border border-gray-300 hover:bg-gray-100 text-black text-[10px] font-black uppercase tracking-[0.2em] rounded-lg transition-all active:scale-95">
          <Edit2 className="w-4 h-4 text-[#6bbd45]" />
          Edit Team
        </button>
        <button
          onClick={handleDeleteTeam}
          disabled={isDeleting}
          className="flex items-center gap-2 px-6 py-3 bg-red-50 border border-red-600 hover:bg-red-100 text-black text-[10px] font-black uppercase tracking-[0.2em] rounded-lg transition-all active:scale-95 disabled:opacity-50"
        >
          <Trash2 className="w-4 h-4 text-red-600" />
          {isDeleting ? "Deleting..." : "Delete Team"}
        </button>
        <button
          onClick={() => handleTeamMember(team)}
          className="flex items-center gap-2 px-6 py-3 bg-[#6bbd45]/15 hover:bg-[#6bbd45]/30 text-black border border-black text-[10px] font-black uppercase tracking-[0.2em] rounded-lg shadow-sm transition-all active:scale-95"
        >
          <Users className="w-4 h-4" />
          Team Members
        </button>
      </footer>
    </div>
  );
};

// ── Reusable InfoRow ──
const InfoRow = ({ label, value, icon }) => (
  <div className="flex flex-col gap-1">
    <span className="text-black/40 font-black uppercase tracking-[0.15em] text-[10px] flex items-center gap-2">
      {icon} {label}
    </span>
    <span className="text-black font-black text-sm tracking-tight">{value}</span>
  </div>
);

export default GetTeamByID;
