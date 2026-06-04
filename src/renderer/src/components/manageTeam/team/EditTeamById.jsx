import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import Service from "../../../api/Service";
import { toast } from "react-toastify";
import Input from "../../fields/input";
import Button from "../../fields/Button";
import { X, Loader2, Users } from "lucide-react";

const EditTeamById = ({ id, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [employees, setEmployees] = useState([]);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
    reset,
  } = useForm();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const teamRes = await Service.GetTeamByID(id);
        const team = teamRes?.data || teamRes;

        if (team) {
          reset({
            name: team.name || "",
            managerId: team.managerID || team.managerId || team.manager?._id || team.manager?.id || "",
          });
        }

        const rolesToFetch = [
          "PROJECT_MANAGER",
          "DEPT_MANAGER",
          "DEPUTY_MANAGER",
        ];

        const promises = rolesToFetch.map((role) =>
          Service.FetchEmployeeByRole(role).catch(() => ({
            data: { employees: [] },
          }))
        );

        const responses = await Promise.all(promises);
        const allStaffs = responses
          .flatMap((res) => res?.data?.employees || [])
          .filter(Boolean);

        setEmployees(allStaffs);
      } catch (error) {
        console.error("Error fetching team data:", error);
        toast.error("Failed to load team details");
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchData();
  }, [id, reset]);

  const onSubmit = async (data) => {
    try {
      setSubmitting(true);
      const payload = {
        name: data.name,
        managerId: data.managerId,
      };

      await Service.EditTeam(id, payload);
      toast.success("Team updated successfully");
      if (onSuccess) onSuccess();
      if (onClose) onClose();
    } catch (error) {
      console.error("Error updating team:", error);
      toast.error("Failed to update team");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl overflow-hidden animate-in fade-in zoom-in duration-200 max-w-md w-full">
      <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
            <Users size={20} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-black uppercase tracking-tight">Edit Team</h3>
            <p className="text-[10px] font-black text-black/40 uppercase tracking-widest">Update team details and manager</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-2 hover:bg-gray-200 rounded-full transition-colors"
        >
          <X className="w-5 h-5 text-gray-400" />
        </button>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
        <div className="space-y-4">
          <Input
            label="Team Name *"
            {...register("name", { required: "Team name is required" })}
            placeholder="Enter team name"
            error={errors.name?.message}
          />

          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-black/40 uppercase tracking-widest ml-1">
              Team Manager *
            </label>
            <select
              {...register("managerId", { required: "Please select a manager" })}
              className={`w-full p-3 bg-gray-50 border-2 rounded-xl text-sm font-bold transition-all outline-none ${
                errors.managerId 
                  ? "border-red-500 focus:border-red-600" 
                  : "border-black focus:border-primary"
              }`}
            >
              <option value="">Select Manager</option>
              {employees.map((emp) => (
                <option key={emp.id || emp._id} value={emp.id || emp._id}>
                  {emp.firstName} {emp.lastName} {emp.role ? `(${emp.role.replace(/_/g, " ")})` : ""}
                </option>
              ))}
            </select>
            {errors.managerId && (
              <p className="text-[10px] font-bold text-red-600 uppercase tracking-wider ml-1">
                {errors.managerId.message}
              </p>
            )}
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            className="flex-1 border-2 border-black font-black uppercase tracking-widest text-[10px]"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={submitting}
            className="flex-1 bg-black text-white border-2 border-black font-black uppercase tracking-widest text-[10px] hover:bg-gray-800 transition-all"
          >
            {submitting ? (
              <Loader2 className="w-4 h-4 animate-spin mx-auto" />
            ) : (
              "Update Team"
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default EditTeamById;