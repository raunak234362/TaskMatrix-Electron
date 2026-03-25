import React, { useState } from "react";
import { useSelector } from "react-redux";
import Select from "react-select";
import { X, Loader2, Users } from "lucide-react";
import Button from "../fields/Button";
import Service from "../../api/Service";
import { toast } from "react-toastify";

const AddAssistsModal = ({ projectId, onClose, onSuccess, currentAssists = [] }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Get staff data from Redux
  const staffData = useSelector((state) => state.userInfo?.staffData || []);

  // Filter staff to exclude the main manager or others if needed, 
  // but usually "assists" can be any staff member.
  const staffOptions = staffData
    .filter((user) =>
      [
        "PROJECT_MANAGER",
        "DEPUTY_MANAGER",
        "ESTIMATION_HEAD",
        "OPERATION_EXECUTIVE",
        "DEPT_MANAGER",
        "STAFF",
        "ADMIN"
      ].includes(user.role)
    )
    .map((user) => ({
      label: `${user.firstName}${user.middleName ? " " + user.middleName : ""} ${user.lastName} (${user.role})`,
      value: user.id,
    }));

  const [selectedAssists, setSelectedAssists] = useState(
    currentAssists.map(a => a.id || a) // Handle both objects or IDs
  );

  const handleSubmit = async () => {
    if (selectedAssists.length === 0) {
      toast.error("Please select at least one assistant");
      return;
    }

    try {
      setIsSubmitting(true);
      
      // Since the backend expects 'userId' as a string per request, 
      // and we are selecting multiple, we should call the service for each selection.
      const addPromises = selectedAssists.map(id => 
        Service.AddProjectManagerAssists(projectId, { userId: id })
      );

      await Promise.all(addPromises);
      
      toast.success("Assists added successfully");
      if (onSuccess) onSuccess();
      if (onClose) onClose();
    } catch (error) {
      console.error("Failed to add assists:", error);
      toast.error(error?.response?.data?.message || "Failed to add assistants");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-100 p-4">
      <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden border border-gray-100 animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-green-50/30">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg text-green-600">
              <Users size={20} />
            </div>
            <h3 className="text-lg font-black uppercase tracking-tight text-black">
              Add Project <span className="text-green-600">Assists</span>
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400 hover:text-gray-600"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
              Select Assistants
            </label>
            <Select
              isMulti
              options={staffOptions}
              value={staffOptions.filter((o) => selectedAssists.includes(o.value))}
              onChange={(opts) => setSelectedAssists(opts ? opts.map((o) => o.value) : [])}
              placeholder="Search and select team members..."
              className="text-sm"
              styles={{
                control: (base) => ({
                  ...base,
                  borderRadius: "12px",
                  padding: "4px",
                  borderColor: "#e5e7eb",
                  "&:hover": { borderColor: "#6bbd45" },
                  boxShadow: "none",
                }),
                multiValue: (base) => ({
                  ...base,
                  backgroundColor: "#f0fdf4",
                  borderRadius: "6px",
                  border: "1px solid #dcfce7",
                }),
                multiValueLabel: (base) => ({
                  ...base,
                  color: "#166534",
                  fontWeight: "600",
                }),
                multiValueRemove: (base) => ({
                  ...base,
                  color: "#166534",
                  "&:hover": { backgroundColor: "#dcfce7", color: "#14532d" },
                }),
              }}
            />
            <p className="text-[10px] text-gray-400 mt-2 px-1">
              * Assign multiple team members to assist with this project.
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="px-6 py-5 bg-gray-50/50 border-t border-gray-100 flex gap-3">
          <Button
            className="flex-1 py-3 bg-white border border-gray-200 text-gray-600 hover:bg-gray-100 font-bold uppercase tracking-widest text-[10px]"
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            className="flex-1 py-3 bg-[#6bbd45] text-white hover:bg-[#5aa838] font-bold uppercase tracking-widest text-[10px] shadow-lg shadow-green-200"
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <div className="flex items-center justify-center gap-2">
                <Loader2 size={14} className="animate-spin" />
                Processing...
              </div>
            ) : (
              "Save Assistants"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AddAssistsModal;
