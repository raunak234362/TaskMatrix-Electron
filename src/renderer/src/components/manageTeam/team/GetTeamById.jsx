/* eslint-disable @typescript-eslint/no-explicit-any */
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
        // API returns { "0": { …team } }
        const raw = response?.data;
        // const teamData = raw ? Object.values(raw)[0] : null;
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
    <div className="bg-linear-to-br from-green-50 to-green-50 p-6 rounded-xl shadow-inner">
      {/* Header */}
      <div className="mb-5">
        <h3 className="text-xl  text-green-800">{team.name}</h3>
      </div>

      {/* Two‑column grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-sm">
        {/* Left */}
        <div className="space-y-3">
          <InfoRow label="Team Name" value={team.name} />
          {/* <InfoRow label="Team ID" value={team.id} /> */}
          <InfoRow label="Department" value={team.department?.name ?? "—"} />
        </div>

        {/* Right */}
        <div className="space-y-3">
          <InfoRow label="Manager" value={fullManagerName || "No Manager"} />
          {team.manager && (
            <>
              <InfoRow
                label="Email"
                value={
                  <a
                    href={`mailto:${team.manager.email}`}
                    className="text-green-600 hover:underline"
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
                    className="text-green-600 hover:underline"
                  >
                    {team.manager.phone}
                    {team.manager.extension && (
                      <span className="text-gray-700 text-xs ml-1">
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
      <div className="py-2 flex gap-2 mt-4">
        <Button className="py-1 px-2 text-lg">Edit Team</Button>
        <Button className="py-1 px-2 text-lg bg-red-500 hover:bg-red-600">
          Delete Team
        </Button>
        <Button
          onClick={() => handleTeamMember(team)}
          className="py-1 px-2 text-lg bg-red-500 hover:bg-red-600"
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

// ── Reusable InfoRow (same ) ──
const InfoRow = ({
  label,
  value,
}) => (
  <div className="flex justify-between">
    <span className=" text-gray-700">{label}:</span>
    <span className="text-gray-700 text-right">{value}</span>
  </div>
);

export default GetTeamByID;
