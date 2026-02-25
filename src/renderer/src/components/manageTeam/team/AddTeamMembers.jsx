import { useState } from "react";
import { toast } from "react-toastify";
import Service from "../../../api/Service";
import { useForm } from "react-hook-form";
import { useSelector } from "react-redux";
import Select from "../../fields/Select";

const roles = [
  "CHECKER",
  "DETAILER",
  "ERECTER",
  "MODELER",
  "DESIGNER",
  "ESTIMATOR",
  "GUEST",
];

const AddTeamMembers = ({ teamMember, onClose }) => {
  const teamId = teamMember?.id || "";
  console.log(teamMember);

  const staffData = useSelector((state) => state.userInfo.staffData);
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      teamId: teamId,
      userId: "",
    },
  });

  const [role, setRole] = useState("");

  const onSubmit = async (data) => {
    if (!role) return toast.error("Please select a role!");

    try {
      const res = await Service.AddTeamMembers(role, data);
      if (res) {
        toast.success("User added successfully!");
        onClose();
      }
    } catch (error) {
      console.log(error);
      toast.error("Error adding user");
    }
  };

  return (
    <div className="p-10 w-full max-w-md bg-white rounded-[2.5rem] shadow-soft border border-black/5 space-y-8">
      <div className="text-center">
        <h2 className="text-2xl font-black text-black uppercase tracking-tight">Add Team Member</h2>
        <p className="text-black/60 text-[10px] font-black uppercase tracking-widest mt-1">Append new talent to {teamMember?.name || 'team'}</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Role */}
        <div className="space-y-2">
          <label className="block text-[10px] font-black text-black uppercase tracking-[0.15em] ml-1">Select Role</label>
          <div className="relative">
            <select
              className="w-full h-12 px-4 rounded-2xl border border-black/10 bg-gray-50/50 text-xs font-bold text-black focus:border-black focus:ring-0 appearance-none transition-all"
              value={role}
              onChange={(e) => setRole(e.target.value)}
            >
              <option value="">-- Choose Role --</option>
              {roles.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
              <svg className="w-4 h-4 text-black/20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </div>

        {/* Team ID (ReadOnly) */}
        <div className="space-y-2 opacity-60">
          <label className="block text-[10px] font-black text-black uppercase tracking-[0.15em] ml-1">Team ID</label>
          <input
            className="w-full h-12 px-4 rounded-2xl border border-black/5 bg-gray-100 text-[10px] font-black tracking-widest text-black/40 cursor-not-allowed"
            {...register("teamId")}
            disabled
          />
        </div>

        {/* User Select */}
        <div className="space-y-2">
          <label className="block text-[10px] font-black text-black uppercase tracking-[0.15em] ml-1">Select Employee</label>
          <Select
            placeholder="Search employee..."
            options={(staffData || []).map((staff) => ({
              label: `${staff.firstName} ${staff.lastName}`,
              value: staff.id,
            }))}
            {...register("userId", { required: "User ID required" })}
            onChange={(_, value) => setValue("userId", value)}
          />

          {errors.userId && (
            <span className="text-red-500 text-[10px] font-black uppercase ml-1">
              {errors.userId.message}
            </span>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-3 pt-6">
          <button
            type="submit"
            className={`w-full h-14 rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-medium flex items-center justify-center gap-2 ${isSubmitting
              ? "bg-gray-100 text-black/20 cursor-not-allowed"
              : "bg-black text-white hover:bg-black/90 active:scale-95 shadow-black/10"
              }`}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-black/20 border-t-black"></div>
                Processing...
              </>
            ) : (
              "Add to Team"
            )}
          </button>

          <button
            type="button"
            onClick={onClose}
            className="w-full h-14 bg-white border border-black/10 rounded-2xl text-black font-black text-xs uppercase tracking-widest hover:bg-gray-50 transition-all"
            disabled={isSubmitting}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddTeamMembers;
