// components/employee/EditEmployee.jsx
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import Service from "../../../api/Service";
import { X, Check, Loader2 } from "lucide-react";
import Input from "../../fields/input";
import Select from "../../fields/Select";
import { useDispatch, useSelector } from "react-redux";
import { updateStaffData, setUserData } from "../../../store/userSlice";

const EditEmployee = ({ employeeData, onClose, onSuccess }) => {
  const dispatch = useDispatch();
  const currentUser = useSelector((state) => state.userInfo.userDetail);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, dirtyFields },
  } = useForm({
    defaultValues: {
      role: "STAFF",
    },
  });

  const isClientRole = [
    "CLIENT",
    "CLIENT_ADMIN",
    "CLIENT_PROJECT_COORDINATOR",
    "CLIENT_GENERAL_CONSTRUCTOR",
  ].includes(employeeData?.role || "");

  const roleOptions = isClientRole
    ? [
      { label: "Client", value: "CLIENT" },
      { label: "Client Administrator", value: "CLIENT_ADMIN" },
      {
        label: "Client Project Coordinator",
        value: "CLIENT_PROJECT_COORDINATOR",
      },
      {
        label: "Client General Constructor",
        value: "CLIENT_GENERAL_CONSTRUCTOR",
      },
    ]
    : [
      { label: "STAFF", value: "STAFF" },
      { label: "ADMIN", value: "ADMIN" },
      { label: "OPERATION_EXECUTIVE", value: "OPERATION_EXECUTIVE" },
      { label: "PROJECT_MANAGER_OFFICER", value: "PROJECT_MANAGER_OFFICER" },
      { label: "DEPUTY_MANAGER", value: "DEPUTY_MANAGER" },
      { label: "DEPT_MANAGER", value: "DEPT_MANAGER" },
      { label: "PROJECT_MANAGER", value: "PROJECT_MANAGER" },
      { label: "TEAM_LEAD", value: "TEAM_LEAD" },
      { label: "SALES_MANAGER", value: "SALES_MANAGER" },
      { label: "SALES_PERSON", value: "SALES_PERSON" },
      { label: "SYSTEM_ADMIN", value: "SYSTEM_ADMIN" },
      { label: "ESTIMATION_HEAD", value: "ESTIMATION_HEAD" },
      { label: "ESTIMATOR", value: "ESTIMATOR" },
      { label: "HUMAN_RESOURCE", value: "HUMAN_RESOURCE" },
    ];

  // Watch current role value (string)
  const selectedRole = watch("role");

  // Find the full option object for display
  const selectedRoleOption =
    roleOptions.find((opt) => opt.value === selectedRole) || null;

  // ── Fetch employee data & pre‑fill form ──
  useEffect(() => {
    const fetchEmployee = async () => {
      if (!employeeData?.id) {
        setError("Invalid employee ID");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const employee = employeeData;

        if (!employee) throw new Error("Employee not found");

        // Fill form
        Object.keys(employee).forEach((key) => {
          const value = employee[key];
          if (value !== undefined && value !== null) {
            setValue(key, value);
          }
        });
      } catch (err) {
        setError(err?.response?.data?.message || "Failed to load employee");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchEmployee();
  }, [employeeData, setValue]);

  // ── Submit handler ──
  const onSubmit = async (data) => {
    try {
      setSubmitting(true);
      setError(null);

      // Create a payload with only dirty fields
      const dirtyData = Object.keys(dirtyFields).reduce((acc, key) => {
        acc[key] = data[key];
        return acc;
      }, {});

      // If nothing changed, just close the modal
      if (Object.keys(dirtyData).length === 0) {
        onClose();
        return;
      }

      const response = await Service.EditEmployeeByID(
        employeeData?.id,
        dirtyData,
      );
      const updatedEmployee =
        response?.data?.user || response?.data || response;

      if (updatedEmployee) {
        // Update staff list
        dispatch(updateStaffData(updatedEmployee));

        // Update current user profile if editing self
        if (String(currentUser?.id) === String(employeeData?.id)) {
          dispatch(setUserData(updatedEmployee));
        }
      }

      onSuccess?.();
      onClose();
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to update employee");
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  // ── Loading UI ──
  if (loading) {
    return (
      <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
        <div className="bg-white rounded-2xl p-12 border border-gray-200 shadow-xl flex items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-[#6bbd45]" />
          <span className="text-sm font-black uppercase tracking-widest text-[#6bbd45]">Loading employee...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden animate-in fade-in zoom-in duration-200 w-full max-w-5xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <header className="flex items-center justify-between p-6 border-b border-gray-200 bg-white shrink-0">
          <div>
            <h2 className="text-xl font-black text-black tracking-tight uppercase">
              Edit Employee
            </h2>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-red-50 border border-red-600 text-black font-black text-[10px] uppercase tracking-widest rounded-lg hover:bg-red-100 transition-all"
          >
            Close
          </button>
        </header>

        <div className="p-8 overflow-y-auto custom-scrollbar flex-1">
          {/* Error */}
          {error && (
            <div className="mb-8 p-4 bg-red-50 border border-red-200 text-red-600 rounded-xl text-xs font-bold flex items-center gap-3">
              <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse"></span>
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 border border-gray-200 rounded-2xl p-4 bg-zinc-100">
              {/* ── Basic Info ── */}
              <Input label="Username" {...register("username")} className="w-full" />
              <Input label="Email" type="email" {...register("email")} className="w-full" />
              <Input label="First Name" {...register("firstName")} className="w-full" />
              <Input label="Middle Name" {...register("middleName")} className="w-full" />
              <Input label="Last Name" {...register("lastName")} className="w-full" />

              <div className="grid grid-cols-2 gap-4">
                <Input label="Phone" {...register("phone")} className="w-full" />
                <Input label="Extension" {...register("extension")} className="w-full" />
              </div>

              <Input label="Alt Phone" {...register("altPhone")} className="w-full" />
              <Input label="Designation" {...register("designation")} className="w-full" />

              {/* Role */}
              <div className="space-y-2">
                <label className="block text-[10px] font-black text-black uppercase tracking-[0.15em] ml-1">
                  Role
                </label>
                <Select
                  options={roleOptions}
                  {...register("role")}
                  value={selectedRoleOption?.value}
                  onChange={(_, value) =>
                    setValue("role", value, { shouldDirty: true })
                  }
                  placeholder="Select role..."
                />
                {errors.role && (
                  <p className="mt-1 text-[10px] font-black text-red-600 uppercase ml-1">
                    {errors.role.message}
                  </p>
                )}
              </div>

              {/* ── Address ── */}
              <div className="md:col-span-2">
                <Input label="Address" {...register("address")} className="w-full" />
              </div>
              <Input label="City" {...register("city")} className="w-full" />
              <Input label="State" {...register("state")} className="w-full" />
              <Input label="Country" {...register("country")} className="w-full" />
              <Input label="Zip Code" {...register("zipCode")} className="w-full" />
              <Input label="Landline" {...register("landline")} className="w-full" />
              <Input label="Alt Landline" {...register("altLandline")} className="w-full" />
            </div>
          </form>
        </div>

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
            disabled={submitting}
            className={`px-8 py-3 rounded-lg font-black text-[10px] uppercase tracking-[0.2em] transition-all shadow-sm flex items-center gap-2 ${submitting
              ? "bg-gray-100 text-black/20 cursor-not-allowed"
              : "bg-[#6bbd45]/15 hover:bg-[#6bbd45]/30 text-black border border-black active:scale-95"
              }`}
          >
            {submitting ? (
              <>
                <Loader2 className="w-3 h-3 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                Save Changes
              </>
            )}
          </button>
        </footer>
      </div>
    </div>
  );
};

export default EditEmployee;
