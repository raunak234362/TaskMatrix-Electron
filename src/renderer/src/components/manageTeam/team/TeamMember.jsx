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

  const columns = [
    {
      accessorKey: "member.firstName",
      header: "Name",
      cell: ({ row }) => {
        const m = row.original.member;
        return (
          <span className="font-black text-black uppercase tracking-tight text-sm">
            {m.firstName} {m.middleName || ""} {m.lastName}
          </span>
        );
      },
    },
    {
      accessorKey: "member.email",
      header: "Email",
      cell: ({ row }) => (
        <span className="text-black/60 font-bold text-xs lowercase">
          {row.original.member.email}
        </span>
      ),
    },
    {
      accessorKey: "member.phone",
      header: "Phone",
      cell: ({ row }) => (
        <span className="text-black/60 font-bold text-xs tracking-widest">
          {row.original.member.phone || "—"}
          {row.original.member.extension && (
            <span className="text-black/30 ml-1 font-black">
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
        <span className="px-5 py-1.5 bg-gray-100 text-black font-black uppercase tracking-widest rounded-full text-[10px] border border-black/5 shadow-sm">
          {row.original.role}
        </span>
      ),
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <div className="flex gap-4">
          <button
            onClick={() => setEditingMember(row.original)}
            className="text-[10px] font-black uppercase tracking-widest text-black/40 hover:text-black transition-colors"
            title="Edit Role"
          >
            Edit
          </button>
          <button
            onClick={() => console.log("DELETE MEMBER:", row.original.id)}
            className="text-[10px] font-black uppercase tracking-widest text-red-400 hover:text-red-600 transition-colors"
            title="Delete Member"
          >
            Delete
          </button>
        </div>
      ),
      enableSorting: false,
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="w-[1000px] max-w-full bg-white rounded-[2.5rem] p-10 shadow-[0_20px_50px_rgba(0,0,0,0.1)] border border-black/5 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between mb-8 border-b border-black/5 pb-6">
          <h2 className="text-3xl font-black text-black uppercase tracking-tight">
            Team Members - <span className="text-black/40">{members.name}</span>
          </h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-6 h-6 text-black" />
          </button>
        </div>

        {/* Add Team Member Button */}
        <div className="flex justify-end mb-6">
          <Button
            onClick={handleOpenAddTeam}
            className="flex items-center gap-2 px-8 py-3 bg-black text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-black/90 transition-all shadow-medium"
          >
            + Add Team Member
          </Button>
        </div>

        {/* DataTable */}
        <div className="rounded-[1.5rem] border border-black/5 overflow-hidden">
          <DataTable
            columns={columns}
            data={teamData?.members || []}
            pageSizeOptions={[10, 20, 50]}
          />
        </div>

        {/* Add Member Modal */}
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
