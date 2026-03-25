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

  const handleDeleteMember = async (userId) => {
    if (!window.confirm("Are you sure you want to remove this member from the team?")) return;
    console.log("DELETE MEMBER DATA:", {
      teamId: members.id,
      userId
    });
    try {
      await Service.DeleteTeamMember({ teamId: members.id, userId });
      fetchTeamData();
    } catch (error) {
      console.error("Failed to delete member:", error);
    }
  };

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
            className="text-[10px] font-black uppercase tracking-widest text-black/40 hover:text-[#6bbd45] transition-colors"
            title="Edit Role"
          >
            Edit
          </button>
          <button
            onClick={() => handleDeleteMember(row.original.member.id)}
            className="text-[10px] font-black uppercase tracking-widest text-red-600 hover:text-red-700 transition-colors"
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
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-5xl bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <header className="flex items-center justify-between p-6 border-b border-gray-200 bg-white shrink-0">
          <div>
            <h2 className="text-xl font-black text-black tracking-tight uppercase">
              Team Members - <span className="text-[#6bbd45]">{members.name}</span>
            </h2>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-red-50 border border-red-600 text-black font-black text-[10px] uppercase tracking-widest rounded-lg hover:bg-red-100 transition-all"
          >
            Close
          </button>
        </header>

        <div className="p-8 overflow-y-auto custom-scrollbar flex-1 flex flex-col">
          {/* Add Team Member Button */}
          <div className="flex justify-end mb-6">
            <button
              onClick={handleOpenAddTeam}
              className="px-8 py-3 bg-[#6bbd45]/15 hover:bg-[#6bbd45]/30 text-black border border-black rounded-lg text-[10px] font-black uppercase tracking-[0.2em] shadow-sm transition-all active:scale-95 flex items-center gap-2"
            >
              + Add Team Member
            </button>
          </div>

          {/* DataTable */}
          <div className="rounded-xl border border-gray-200 overflow-hidden shadow-sm flex-1">
            <DataTable
              columns={columns}
              data={teamData?.members || []}
              pageSizeOptions={[10, 20, 50]}
            />
          </div>
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
