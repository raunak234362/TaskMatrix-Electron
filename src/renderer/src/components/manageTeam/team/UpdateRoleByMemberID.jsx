import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";
import { X } from "lucide-react";
import Service from "../../../api/Service";
import Select from "../../fields/Select";

const roles = [
  { label: "CHECKER", value: "CHECKER" },
  { label: "DETAILER", value: "DETAILER" },
  { label: "ERECTER", value: "ERECTER" },
  { label: "MODELER", value: "MODELER" },
  { label: "DESIGNER", value: "DESIGNER" },
  { label: "ESTIMATOR", value: "ESTIMATOR" },
  { label: "GUEST", value: "GUEST" },
  { label: "TEAM_LEAD", value: "TEAM_LEAD" },
];

const UpdateRoleByMemberID = ({ teamId, member, onClose, onSuccess }) => {
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm();

  useEffect(() => {
    if (member) {
      setValue("userId", member.member.id);
      setValue("newRole", member.role);
    }
  }, [member, setValue]);

  const onSubmit = async (data) => {
    try {
      await Service.UpdateTeamMemberRole(teamId, data);
      toast.success("Role updated successfully!");
      onSuccess();
      onClose();
    } catch (error) {
      console.error("Error updating role:", error);
      toast.error("Failed to update role.");
    }
  };

  if (!member) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 text-left">
      <div className="w-full max-w-lg bg-white rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.1)] border border-black/5 p-10">
        <div className="flex items-center justify-between mb-8 border-b border-black/5 pb-6">
          <div className="text-left">
            <h2 className="text-2xl font-black text-black uppercase tracking-tight">
              Update Role
            </h2>
            <p className="text-black/60 text-[10px] font-black uppercase tracking-widest mt-1">
              For {member.member.firstName} {member.member.lastName}
            </p>
          </div>
          <button onClick={onClose} aria-label="Close" className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <X className="w-6 h-6 text-black" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          <div className="space-y-2">
            <label className="block text-[10px] font-black text-black uppercase tracking-[0.15em] ml-1">New Role</label>
            <Select
              options={roles}
              {...register("newRole", { required: "A new role is required." })}
              onChange={(_, value) => setValue("newRole", value)}
              placeholder="Select a new role"
            />
            {errors.newRole && (
              <p className="text-red-500 text-[10px] font-black uppercase ml-1 mt-1">
                {errors.newRole.message}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-3 pt-6 border-t border-black/5">
            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full h-14 rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-medium flex items-center justify-center gap-3 ${isSubmitting
                ? "bg-gray-100 text-black/20 cursor-not-allowed"
                : "bg-black text-white hover:bg-black/90 active:scale-95 shadow-black/10"
                }`}
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-black/20 border-t-black"></div>
                  Processing...
                </>
              ) : (
                "Update Role"
              )}
            </button>

            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="w-full h-14 bg-white border border-black/10 rounded-2xl text-black font-black text-xs uppercase tracking-widest hover:bg-gray-50 transition-all text-center"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UpdateRoleByMemberID;
