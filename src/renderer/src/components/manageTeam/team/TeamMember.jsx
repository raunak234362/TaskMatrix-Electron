/* eslint-disable @typescript-eslint/no-explicit-any */
import { X } from "lucide-react";
import { useState } from "react";

import DataTable from "../../ui/table";
import Button from "../../fields/Button";
import AddTeamMembers from "./AddTeamMembers";
import UpdateRoleByMemberID from "./UpdateRoleByMemberID";
import Service from "../../../api/Service";


const TeamMember = ({ members, onClose }) => {
  const [addTeamModal, setAddTeamModal] = useState(false);
  const [editingMember, setEditingMember] = useState(null);
  const [teamData, setTeamData] = useState(members);

  const fetchTeamData = async () => {
    if (members?.id) {
      const response = await Service.GetTeamByID(members.id);
      setTeamData(response?.data);
    }
  };

  const handleOpenAddTeam = () => setAddTeamModal(true);
  const handleCloseAddTeam = () => setAddTeamModal(false);

  // const tableData = members?.members || []

  const columns = [
    {
      accessorKey: "member.firstName",
      header: "Name",
      cell: ({ row }) => {
        const m = row.original.member;
        return (
          <span className="font-semibold">
            {m.firstName} {m.middleName || ""} {m.lastName}
          </span>
        );
      },
    },
    {
      accessorKey: "member.email",
      header: "Email",
      cell: ({ row }) => row.original.member.email,
    },
    {
      accessorKey: "member.phone",
      header: "Phone",
      cell: ({ row }) => (
        <span>
          {row.original.member.phone || "—"}
          {row.original.member.extension && (
            <span className="text-gray-700 text-xs ml-1">
              (Ext: {row.original.member.extension})
            </span>
          )}
        </span>
      ),
    },
    {
      accessorKey: "role",
      header: "Role",
      cell: ({ row }) => (
        <span className="px-2 py-1 rounded bg-gray-100 text-gray-700 text-xs">
          {row.original.role}
        </span>
      ),
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <div className="flex gap-2">
          <button
            onClick={() => setEditingMember(row.original)}
            className="text-blue-600 hover:text-blue-800"
            title="Edit Role"
          >
            ✏️
          </button>
          <button
            onClick={() => console.log("DELETE MEMBER:", row.original.id)}
            className="text-red-600 hover:text-red-800"
            title="Delete Member"
          >
            🗑️
          </button>
        </div>
      ),
      enableSorting: false,
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-3/4 h-2/3 overflow-y-auto bg-white rounded-xl p-4 shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-3 border-b pb-2">
          <h2 className="text-xl font-semibold text-gray-700">
            Team - <span className="">{members.name}</span>
          </h2>
          <button onClick={onClose} aria-label="Close">
            <X className="w-6 h-6 text-gray-700 hover:text-gray-700" />
          </button>
        </div>

        {/* Add Team Member Button */}
        <Button onClick={handleOpenAddTeam} className="mb-3">
          + Add Team Member
        </Button>

        {/* ✅ DataTable */}
        <div className="border rounded-lg">
          <DataTable
            columns={columns}
            data={teamData?.members || []}

          />
        </div>

        {/* ✅ Add Member Modal */}
        {addTeamModal && (
          <AddTeamMembers teamMember={members} onClose={handleCloseAddTeam} />
        )}

        {editingMember && (
          <UpdateRoleByMemberID
            teamId={members.id}
            member={editingMember}
            onClose={() => setEditingMember(null)}
            onSuccess={fetchTeamData}
          />
        )}
      </div>
    </div>
  );
};

export default TeamMember;
