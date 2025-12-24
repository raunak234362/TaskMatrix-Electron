import { useEffect, useState } from "react";
import { X, Search, UserPlus, Trash2 } from "lucide-react";
import Button from "../fields/Button";
import { useSelector } from "react-redux";
import Service from "../../api/Service";

const GroupDetail = ({ group, onClose }) => {
  const allEmployees = useSelector(
    (state) =>
      (state.userData?.staffData ?? state.userInfo?.staffData ?? [])
  );
  console.log(allEmployees);

  const [activeTab, setActiveTab] = useState("members");
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [groupMembers, setGroupMembers] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);

  const fetchGroupMembers = async () => {
    try {
      const response = await Service.GetGroupMembers(group.id);
      const data = response?.data || response;
      if (data && Array.isArray(data.members)) {
        // Map the nested structure to flat User objects
        const members = data.members.map((item) => item.members);
        setGroupMembers(members);
      }
    } catch (error) {
      console.error("Failed to fetch group members", error);
    }
  };

  useEffect(() => {
    fetchGroupMembers();
  }, [group.id]);

  const handleAddMembers = async () => {
    if (selectedUsers.length === 0) return;
    setLoading(true);
    try {
      // Mock API call since actual endpoint is missing
      console.log("Adding members to group:", group.id, selectedUsers);
      const response = await Service.AddGroupMembers({
        groupId: group.id,
        memberIds: selectedUsers,
      });
      console.log(response);

      // Simulate delay
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Reset selection and close or show success
      setSelectedUsers([]);
      setActiveTab("members");
      // You might want to show a toast here
    } catch (error) {
      console.error("Failed to add members", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteMember = async (memberId) => {
    if (!confirm("Are you sure you want to remove this member?")) return;
    try {
      await Service.DeleteGroupMember(group.id, memberId);
      fetchGroupMembers();
    } catch (error) {
      console.error("Failed to delete member", error);
    }
  };

  const handleDeleteGroup = async () => {
    if (
      !confirm(
        "Are you sure you want to delete this group? This action cannot be undone."
      )
    )
      return;
    try {
      await Service.DeleteGroup(group.id);
      onClose();
      // Ideally trigger a refresh of the chat list here, but for now just close
      window.location.reload(); // Simple way to refresh for now as requested by user context implies reload might be needed or acceptable
    } catch (error) {
      console.error("Failed to delete group", error);
    }
  };

  const toggleUserSelection = (userId) => {
    setSelectedUsers((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  };

  const filteredEmployees = allEmployees.filter((user) =>
    `${user.firstName} ${user.lastName}`
      .toLowerCase()
      .includes(searchQuery.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 border-b flex justify-between items-center bg-gray-50">
          <h2 className="text-lg font-bold text-gray-800">{group.name}</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-200 rounded-full transition"
          >
            <X size={20} className="text-gray-600" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b">
          <button
            className={`flex-1 py-3 text-sm font-medium transition ${activeTab === "members"
                ? "text-teal-600 border-b-2 border-teal-600 bg-teal-50"
                : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
              }`}
            onClick={() => setActiveTab("members")}
          >
            Members
          </button>
          <button
            className={`flex-1 py-3 text-sm font-medium transition ${activeTab === "add"
                ? "text-teal-600 border-b-2 border-teal-600 bg-teal-50"
                : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
              }`}
            onClick={() => setActiveTab("add")}
          >
            Add Members
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {activeTab === "members" ? (
            <div className="space-y-2">
              {groupMembers.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  <p>No members found.</p>
                </div>
              ) : (
                groupMembers.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center gap-3 p-3 rounded-lg border border-gray-100 bg-gray-50 justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-teal-100 flex items-center justify-center text-teal-600 font-bold text-xs">
                        {member.firstName?.[0]}
                        {member.lastName?.[0]}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-800">
                          {member.firstName} {member.lastName}
                        </p>
                        <p className="text-xs text-gray-500">{member.role}</p>
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteMember(member.id);
                      }}
                      className="text-red-500 hover:bg-red-50 p-2 rounded-full transition"
                      title="Remove member"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="relative">
                <Search
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  size={18}
                />
                <input
                  type="text"
                  placeholder="Search employees..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div className="space-y-2">
                {filteredEmployees.map((user) => (
                  <div
                    key={user.id}
                    onClick={() => toggleUserSelection(user.id)}
                    className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition border ${selectedUsers.includes(user.id)
                        ? "bg-teal-50 border-teal-200"
                        : "hover:bg-gray-50 border-transparent"
                      }`}
                  >
                    <div
                      className={`w-5 h-5 rounded border flex items-center justify-center ${selectedUsers.includes(user.id)
                          ? "bg-teal-500 border-teal-500"
                          : "border-gray-300"
                        }`}
                    >
                      {selectedUsers.includes(user.id) && (
                        <span className="text-white text-xs">✓</span>
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-800">
                        {user.firstName} {user.lastName}
                      </p>
                      <p className="text-xs text-gray-500">{user.role}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t bg-gray-50 flex justify-between gap-3">
          <Button
            onClick={handleDeleteGroup}
            className="text-red-600 hover:bg-red-50 border border-red-200"
          >
            Delete Group
          </Button>

          {activeTab === "add" && (
            <div className="flex gap-3">
              <Button
                onClick={() => setSelectedUsers([])}
                className="text-gray-600 hover:bg-gray-200"
                disabled={loading}
              >
                Clear
              </Button>
              <Button
                onClick={handleAddMembers}
                disabled={selectedUsers.length === 0 || loading}
                className="bg-teal-600 text-white flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  "Adding..."
                ) : (
                  <>
                    <UserPlus size={18} />
                    Add Selected ({selectedUsers.length})
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GroupDetail;
