import { useState } from "react";
import { toast } from "react-toastify";
import Service from "../../../api/Service";
import { useForm } from "react-hook-form";
import { useSelector } from "react-redux";
import Select from "../../fields/Select";
import { X, Check, Loader2, UserPlus } from "lucide-react";

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
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden animate-in fade-in zoom-in duration-200 w-full max-w-md flex flex-col">
        {/* Header */}
        <header className="flex items-center justify-between p-6 border-b border-gray-200 bg-white shrink-0">
          <div>
            <h2 className="text-xl font-black text-black tracking-tight uppercase">
              Add Team Member
            </h2>
            <p className="text-[10px] font-black text-black uppercase tracking-[0.2em] mt-1">
              APPEND NEW TALENT TO {teamMember?.name}
            </p>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-red-50 border border-red-600 text-black font-black text-[10px] uppercase tracking-widest rounded-lg hover:bg-red-100 transition-all"
          >
            Close
          </button>
        </header>

        <form onSubmit={handleSubmit(onSubmit)} className="p-8 space-y-6">
          {/* Role */}
          <div className="space-y-2">
            <label className="block text-[10px] font-black text-black uppercase tracking-[0.15em] ml-1">
              Select Role
            </label>
            <div className="relative">
              <select
                className="w-full h-12 px-4 rounded-xl border border-gray-200 bg-gray-50 text-[11px] font-black uppercase tracking-widest text-black focus:border-[#6bbd45] focus:ring-0 appearance-none transition-all"
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

          {/* User Select */}
          <div className="space-y-2">
            <label className="block text-[10px] font-black text-black uppercase tracking-[0.15em] ml-1">
              Select Employee
            </label>
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
              <span className="text-red-600 text-[10px] font-black uppercase ml-1">
                {errors.userId.message}
              </span>
            )}
          </div>
        </form>

        {/* Footer */}
        <footer className="p-6 border-t border-gray-200 bg-white flex justify-end gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-8 py-3 bg-gray-50 border border-gray-300 hover:bg-gray-100 text-black text-[10px] font-black uppercase tracking-[0.2em] rounded-lg transition-all active:scale-95"
          >
            Cancel
          </button>
          <button
            type="submit"
            onClick={handleSubmit(onSubmit)}
            disabled={isSubmitting}
            className={`px-8 py-3 rounded-lg font-black text-[10px] uppercase tracking-[0.2em] transition-all shadow-sm flex items-center gap-2 ${isSubmitting
                ? "bg-gray-100 text-black/20 cursor-not-allowed"
                : "bg-[#6bbd45]/15 hover:bg-[#6bbd45]/30 text-black border border-black active:scale-95"
              }`}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-3 h-3 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <UserPlus className="w-4 h-4" />
                Add to Team
              </>
            )}
          </button>
        </footer>
      </div>
    </div>
  );
};

export default AddTeamMembers;
