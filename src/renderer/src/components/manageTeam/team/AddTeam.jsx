import { useForm } from "react-hook-form";
import { Loader2 } from "lucide-react";
import Button from "../../fields/Button";
import Input from "../../fields/input";
import { useEffect, useMemo, useState } from "react";
import Service from "../../../api/Service";
import Select from "../../fields/Select";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";

const AddTeam = ({ onClose }) => {
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm();

  const [loading, setLoading] = useState(true);
  const [staffs, setStaffs] = useState([]);

  const departments = useSelector(
    (state) => state.userInfo.departmentData || [],
  );

  // ── Safely fetch managers (no errors shown) ──
  const fetchManagers = async () => {
    try {
      setLoading(true);

      const rolesToFetch = [
        "ADMIN",
        "DEPT_MANAGER",
        "PROJECT_MANAGER",
        "PROJECT_MANAGER_OFFICER",
      ];

      const promises = rolesToFetch.map((role) =>
        Service.FetchEmployeeByRole(role).catch(() => ({
          data: { employees: [] },
        })),
      );

      const responses = await Promise.all(promises);
      const allStaffs = responses
        .flatMap((res) => res?.data?.employees || [])
        .filter(Boolean);

      setStaffs(allStaffs);
    } catch (err) {
      console.warn("Managers not available (this is okay)", err);
      setStaffs([]); // Silent fallback
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchManagers();
  }, []);

  // ── Build manager options safely ──
  const managerOptions = useMemo(() => {
    if (!Array.isArray(staffs) || staffs.length === 0) {
      return [{ label: "No managers available", value: "" }];
    }

    return staffs
      .filter((user) => {
        const role = user.role?.toUpperCase();
        return [
          "ADMIN",
          "DEPT_MANAGER",
          "PROJECT_MANAGER",
          "PROJECT_MANAGER_OFFICER",
          "TEAM_LEAD",
        ].includes(role);
      })
      .map((user) => ({
        label:
          `${user.firstName || ""} ${user.lastName || ""}`.trim() ||
          "Unnamed Manager",
        value: user.id || "",
      }))
      .filter((opt) => opt.value);
  }, [staffs]);

  // ── Department options (safe) ──
  const departmentOptions = useMemo(() => {
    if (!Array.isArray(departments) || departments.length === 0) {
      return [{ label: "No departments found", value: "" }];
    }
    return departments.map((dept) => ({
      label: dept.name || "Unnamed Dept",
      value: dept.id || "",
    }));
  }, [departments]);

  // ── Form submit ──
  const addTeam = async (data) => {
    if (!data.managerID || !data.departmentID) {
      toast.warning("Please select a manager and department");
      return;
    }

    try {
      await Service.AddTeam(data);
      toast.success("Team created successfully!");
      if (onClose) onClose();
    } catch (error) {
      toast.error(error?.message || "Failed to create team");
    }
  };

  // ── Early loading UI ──
  if (loading) {
    return (
      <div className="flex items-center justify-center p-12 text-black bg-white rounded-2xl border border-gray-200 shadow-xl">
        <Loader2 className="w-8 h-8 animate-spin mr-3 text-[#6bbd45]" />
        <span className="text-sm font-black uppercase tracking-widest text-[#6bbd45]">Loading team setup...</span>
      </div>
    );
  }

  const hasManagers = managerOptions.some((opt) => opt.value);
  const hasDepartments = departmentOptions.some((opt) => opt.value);

  return (
    <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden animate-in fade-in zoom-in duration-200 w-full max-w-2xl mx-auto flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between p-6 border-b border-gray-200 bg-white">
        <div>
          <h2 className="text-xl font-black text-black tracking-tight uppercase">
            Create New Team
          </h2>
          <p className="text-[10px] font-black text-black uppercase tracking-[0.2em] mt-1">
            INITIALIZE A NEW ORGANIZATIONAL UNIT
          </p>
        </div>
        <button
          onClick={onClose}
          className="px-4 py-2 bg-red-50 border border-red-600 text-black font-black text-[10px] uppercase tracking-widest rounded-lg hover:bg-red-100 transition-all"
        >
          Close
        </button>
      </header>

      <form onSubmit={handleSubmit(addTeam)} className="p-8 space-y-8">
        {/* Team Name */}
        <div className="space-y-2">
          <Input
            label="Team Name"
            type="text"
            placeholder="e.g. Alpha Squad"
            {...register("name", { required: "Team name is required" })}
            className="w-full"
          />
          {errors.name && (
            <p className="text-red-500 text-[10px] font-black uppercase ml-1">{errors.name.message}</p>
          )}
        </div>

        {/* Manager Select */}
        <div className="space-y-2">
          <Select
            label="Team Manager"
            placeholder={
              hasManagers ? "Choose a manager" : "No managers available"
            }
            options={managerOptions}
            {...register("managerID")}
            onChange={(_, value) => setValue("managerID", value)}
          />
          {!hasManagers && (
            <p className="text-amber-600 font-bold text-xs mt-1 ml-1 font-black uppercase tracking-widest text-[10px]">
              Managers will appear once added in the system.
            </p>
          )}
        </div>

        {/* Department Select */}
        <div className="space-y-2">
          <Select
            label="Department"
            placeholder={
              hasDepartments ? "Choose a department" : "No departments found"
            }
            options={departmentOptions}
            {...register("departmentID")}
            onChange={(_, value) => setValue("departmentID", value)}
          />
          {!hasDepartments && (
            <p className="text-amber-600 font-bold text-xs mt-1 ml-1 font-black uppercase tracking-widest text-[10px]">
              Create departments first to assign teams.
            </p>
          )}
        </div>
      </form>

      {/* Footer */}
      <footer className="p-6 border-t border-gray-200 bg-white flex justify-end gap-3">
        <button
          type="button"
          onClick={onClose}
          className="px-8 py-3 bg-gray-50 border border-gray-300 hover:bg-gray-100 text-black rounded-lg text-[10px] font-black uppercase tracking-[0.2em] transition-all"
        >
          Cancel
        </button>
        <button
          type="submit"
          onClick={handleSubmit(addTeam)}
          disabled={isSubmitting || !hasManagers || !hasDepartments}
          className="px-8 py-3 bg-[#6bbd45]/15 hover:bg-[#6bbd45]/30 text-black border border-black rounded-lg text-[10px] font-black uppercase tracking-[0.2em] shadow-sm transition-all active:scale-95 disabled:opacity-50"
        >
          {isSubmitting ? "Processing..." : "Create Team"}
        </button>
      </footer>
    </div>
  );
};

export default AddTeam;
