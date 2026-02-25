// components/employee/EditEmployee.jsx
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import Service from "../../../api/Service";
import { X, Check } from "lucide-react";
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

      console.log(response);
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
      <ModalOverlay onClick={onClose}>
        <ModalContent className="flex flex-col items-center justify-center py-20 gap-4">
          <div className="animate-spin rounded-full h-10 w-10 border-4 border-black/5 border-t-black"></div>
          <span className="text-black font-black uppercase tracking-widest text-[10px]">Loading employee...</span>
        </ModalContent>
      </ModalOverlay>
    );
  }

  return (
    <ModalOverlay onClick={onClose}>
      <ModalContent onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between mb-10 border-b border-black/5 pb-6">
          <h2 className="text-3xl font-black text-black uppercase tracking-tight">Edit Employee</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            aria-label="Close"
          >
            <X className="w-6 h-6 text-black" />
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-8 p-4 bg-red-50 border border-red-100 text-red-600 rounded-2xl text-xs font-bold flex items-center gap-3">
            <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse"></span>
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* ── Basic Info ── */}
            <div className="space-y-2">
              <Input label="Username" {...register("username")} className="w-full" />
            </div>
            <div className="space-y-2">
              <Input label="Email" type="email" {...register("email")} className="w-full" />
            </div>

            <div className="space-y-2">
              <Input label="First Name" {...register("firstName")} className="w-full" />
            </div>
            <div className="space-y-2">
              <Input label="Middle Name" {...register("middleName")} className="w-full" />
            </div>
            <div className="space-y-2">
              <Input label="Last Name" {...register("lastName")} className="w-full" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Input label="Phone" {...register("phone")} className="w-full" />
              </div>
              <div className="space-y-2">
                <Input label="Extension" {...register("extension")} className="w-full" />
              </div>
            </div>

            <div className="space-y-2">
              <Input label="Alt Phone" {...register("altPhone")} className="w-full" />
            </div>
            <div className="space-y-2">
              <Input label="Designation" {...register("designation")} className="w-full" />
            </div>

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
                className="mt-1"
              />
              {errors.role && (
                <p className="mt-1 text-[10px] font-black text-red-600 uppercase ml-1">
                  {errors.role.message}
                </p>
              )}
            </div>

            {/* ── Address ── */}
            <div className="md:col-span-2 space-y-2">
              <Input label="Address" {...register("address")} className="w-full" />
            </div>
            <div className="space-y-2">
              <Input label="City" {...register("city")} className="w-full" />
            </div>
            <div className="space-y-2">
              <Input label="State" {...register("state")} className="w-full" />
            </div>
            <div className="space-y-2">
              <Input label="Country" {...register("country")} className="w-full" />
            </div>
            <div className="space-y-2">
              <Input label="Zip Code" {...register("zipCode")} className="w-full" />
            </div>
            <div className="space-y-2">
              <Input label="Landline" {...register("landline")} className="w-full" />
            </div>
            <div className="space-y-2">
              <Input label="Alt Landline" {...register("altLandline")} className="w-full" />
            </div>
          </div>

          {/* ── Actions ── */}
          <div className="flex justify-end gap-4 pt-10 border-t border-black/5">
            <button
              type="button"
              onClick={onClose}
              className="px-10 py-4 border border-black/10 rounded-2xl text-black font-black text-xs uppercase tracking-widest hover:bg-gray-50 transition-all shadow-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className={`px-10 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-medium flex items-center gap-3 ${submitting
                ? "bg-gray-100 text-black/20 cursor-not-allowed"
                : "bg-black text-white hover:bg-black/90 active:scale-95"
                }`}
            >
              {submitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-black/20 border-t-black"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </form>
      </ModalContent>
    </ModalOverlay>
  );
};

// ── Modal Wrappers ──
const ModalOverlay = ({ children, onClick }) => (
  <div
    className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
    onClick={(e) => {
      if (e.target === e.currentTarget) {
        onClick();
      }
    }}
  >
    {children}
  </div>
);

const ModalContent = ({ children, className = "", ...props }) => (
  <div
    className={`bg-white w-full max-w-5xl max-h-[90vh] rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.1)] border border-black/5 overflow-y-auto ${className} custom-scrollbar`}
    {...props}
  >
    <div className="p-12">{children}</div>
  </div>
);

export default EditEmployee;
