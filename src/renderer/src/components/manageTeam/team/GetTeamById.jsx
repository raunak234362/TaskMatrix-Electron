import { useEffect, useState } from "react";
import Service from "../../../api/Service";
import { AlertCircle, Loader2, Users, Mail, Phone, Shield, Edit2, Trash2, UserPlus } from "lucide-react";
import TeamMember from "./TeamMember";
import EditTeamById from "./EditTeamById";

const GetTeamByID = ({ id, onClose, onSuccess, isInline = false }) => {
  const [team, setTeam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [teamMember, setTeamMember] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

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

      if (raw?.isDeleted) {
        setError("Team not found");
        setTeam(null);
        return;
      }

      setTeam(raw);
    } catch (err) {
      const msg = "Failed to load team details";
      setError(msg);
      console.error(msg, err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTeam = async () => {
  try {
    setIsDeleting(true);
    const response = await Service.DeleteTeam(id);

    console.log("DELETE TEAM RESPONSE:", response);
    if (onClose) onClose();
    if (onSuccess) onSuccess();
  } catch (err) {
    console.error("Failed to delete team:", err);
  } finally {
    setIsDeleting(false);
  }
};

  useEffect(() => {
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
      <div className="flex items-center justify-center p-12 text-black bg-white rounded-none border border-black shadow-xl">
        <Loader2 className="w-8 h-8 animate-spin mr-3 text-black" />
        <span className="text-sm font-bold uppercase tracking-normal text-black">Loading team details...</span>
      </div>
    );
  }

  // ── Error / Not Found ──
  if (error || !team) {
    return (
      <div className="flex items-center justify-center p-12 text-red-600 bg-white rounded-none border border-black shadow-xl">
        <AlertCircle className="w-8 h-8 mr-3" />
        <span className="text-sm font-bold uppercase tracking-normal">{error || "Team not found"}</span>
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
    <div className={isInline ? "bg-white w-full flex flex-col" : "bg-white rounded-none shadow-2xl  overflow-hidden animate-in fade-in zoom-in duration-200 w-full max-w-4xl mx-auto flex flex-col max-h-[90vh]"}>
      {/* Header */}
      {!isInline && (
        <header className="flex items-center justify-between p-6 border-b border-black/10 bg-white sticky top-0 z-10 shrink-0">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-50 rounded-none border border-black/10 text-black">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-black tracking-normal uppercase">
                {team.name}
              </h2>
            
            </div>
          </div>
          <button
            onClick={onClose}
            className="px-6 py-1.5 bg-red-50 text-black border-2 border-red-700/80 rounded-none hover:bg-red-100 transition-all font-semibold text-sm uppercase tracking-tight shadow-sm cursor-pointer"
          >
            Close
          </button>
        </header>
      )}

      <div className={isInline ? "p-0 flex-1" : "p-8 overflow-y-auto custom-scrollbar flex-1"}>
        <div className="mb-8 p-6 bg-gray-50 rounded-none shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <InfoRow label="Team Name" value={team.name} icon={<Users className="w-4 h-4 text-black" />} />
              <InfoRow label="Department" value={team.department?.name ?? "—"} icon={<Shield className="w-4 h-4 text-black" />} />
              <InfoRow label="Total Members" value={`${memberCount} member${memberCount === 1 ? "" : "s"}`} icon={<UserPlus className="w-4 h-4 text-black" />} />
            </div>

            <div className="space-y-6">
              <InfoRow label="Manager" value={fullManagerName || "No Manager"} icon={<Shield className="w-4 h-4 text-black" />} />
              {team.manager && (
                <>
                  <div className="flex flex-col gap-1">
                    <span className="text-black font-semibold uppercase tracking-normal text-xs flex items-center gap-2">
                      <Mail className="w-3 h-3" /> Email
                    </span>
                    <a
                      href={`mailto:${team.manager.email}`}
                      className="text-black font-semibold text-base tracking-normal hover:text-[#6bbd45] transition-colors"
                    >
                      {team.manager.email}
                    </a>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-black font-semibold uppercase tracking-normal text-xs flex items-center gap-2">
                      <Phone className="w-3 h-3" /> Phone
                    </span>
                    <a
                      href={`tel:${team.manager.phone}`}
                      className="text-black font-semibold text-base tracking-normal hover:text-[#6bbd45] transition-colors"
                    >
                      {team.manager.phone}
                      {team.manager.extension && (
                        <span className="text-black text-xs ml-2 font-semibold">
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
      <footer className="p-6 border-t border-black/10 bg-white flex flex-wrap justify-end gap-3 shrink-0">
        <button 
          onClick={() => setShowEditModal(true)}
          className="flex items-center gap-2 px-6 py-2.5 bg-green-50 text-black border-2 border-green-700/80 rounded-none hover:bg-green-100 transition-all font-bold text-xs uppercase tracking-tight shadow-sm cursor-pointer"
        >
          <Edit2 className="w-4 h-4 text-black" />
          Edit Team
        </button>
        <button
          onClick={handleDeleteTeam}
          disabled={isDeleting}
          className="flex items-center gap-2 px-6 py-2.5 bg-red-50 text-black border-2 border-red-700/80 rounded-none hover:bg-red-100 transition-all font-bold text-xs uppercase tracking-tight shadow-sm cursor-pointer disabled:opacity-50"
        >
          <Trash2 className="w-4 h-4 text-black" />
          {isDeleting ? "Deleting..." : "Delete Team"}
        </button>
        <button
          onClick={() => handleTeamMember(team)}
          className="flex items-center gap-2 px-6 py-2.5 bg-green-50 text-black border-2 border-green-700/80 rounded-none hover:bg-green-100 transition-all font-bold text-xs uppercase tracking-tight shadow-sm cursor-pointer"
        >
          <Users className="w-4 h-4" />
          Team Members
        </button>
      </footer>

      {showEditModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <EditTeamById
            id={id}
            onClose={() => setShowEditModal(false)}
            onSuccess={() => {
              fetchTeam();
              if (onSuccess) onSuccess();
            }}
          />
        </div>
      )}
    </div>
  );
};

// ── Reusable InfoRow ──
const InfoRow = ({ label, value, icon }) => (
  <div className="flex flex-col gap-1">
    <span className="text-black font-semibold uppercase tracking-normal text-xs flex items-center gap-2">
      {icon} {label}
    </span>
    <span className="text-black font-semibold text-base tracking-normal">{value}</span>
  </div>
);

export default GetTeamByID;
