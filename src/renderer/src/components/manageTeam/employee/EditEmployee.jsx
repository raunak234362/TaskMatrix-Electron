/* eslint-disable @typescript-eslint/no-explicit-any */
// components/employee/EditEmployee.tsx
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import Service from "../../../api/Service";

import { Loader2, X, Check } from "lucide-react";
import Input from "../../fields/input";
import Select from "../../fields/Select";
import { useDispatch, useSelector } from "react-redux";
import { updateStaffData, setUserData } from "../../../store/userSlice";


const EditEmployee = ({
  employeeData,
  onClose,
  onSuccess,
}) => {
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
    formState: { errors },
  } = useForm({
    defaultValues: {
      role: "STAFF",
    },
  });

  const roleOptions = [
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

      const response = await Service.EditEmployeeByID(employeeData?.id, data);
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
        <ModalContent className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-green-600" />
          <span className="ml-3 text-lg">Loading employee...</span>
        </ModalContent>
      </ModalOverlay>
    );
  }

  return (
    <ModalOverlay onClick={onClose}>
      <ModalContent onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="sticky top-0 z-10 flex md:flex-row flex-col items-center justify-between p-2 bg-linear-to-r from-green-400 to-green-100 border-b rounded-md">
          <h2 className="text-2xl  text-gray-700">Edit Employee</h2>
          <button
            onClick={onClose}
            className="text-gray-700 hover:text-gray-700 transition-colors"
            aria-label="Close"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* ── Basic Info ── */}
            <Input
              label="Username"
              {...register("username", { required: "Username is required" })}
            />
            <Input
              label="Email"
              type="email"
              {...register("email", {
                required: "Email is required",
                pattern: {
                  value: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
                  message: "Invalid email address",
                },
              })}
            />

            <Input
              label="First Name"
              {...register("firstName", { required: "First name is required" })}
            />
            <Input label="Middle Name" {...register("middleName")} />
            <Input
              label="Last Name"
              {...register("lastName", { required: "Last name is required" })}
            />
            <div className="grid grid-cols-2 gap-2">
              <Input
                label="Phone"
                {...register("phone", {
                  required: "Phone is required",
                  pattern: {
                    value: /^\+?[0-9]{10,15}$/,
                    message: "Invalid phone (10–15 digits)",
                  },
                })}
              />
              <Input label="Extension" {...register("extension")} />
            </div>
            <Input label="Alt Phone" {...register("altPhone")} />
            <Input
              label="Designation"
              {...register("designation", {
                required: "Designation is required",
              })}
            />

            {/* Role */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Role
              </label>
              <Select
                options={roleOptions}
                {...register("role")}
                value={selectedRoleOption?.value}
                onChange={(_, value) => setValue("role", value)}
                placeholder="Select role..."
                className="mt-1"
              />
              {errors.role && (
                <p className="mt-1 text-xs text-red-600">
                  {errors.role.message}
                </p>
              )}
            </div>

            {/* ── Address ── */}
            <div className="md:col-span-2">
              <Input label="Address" {...register("address")} />
            </div>
            <Input label="City" {...register("city")} />
            <Input label="State" {...register("state")} />
            <Input label="Country" {...register("country")} />
            <Input label="Zip Code" {...register("zipCode")} />
            <Input label="Landline" {...register("landline")} />
            <Input label="Alt Landline" {...register("altLandline")} />
          </div>

          {/* ── Actions ── */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
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
const ModalOverlay = ({
  children,
  onClick,
}) => (
  <div
    className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 bg-opacity-80 p-4"
    onClick={(e) => {
      if (e.target === e.currentTarget) {
        onClick();
      }
    }}
  >
    {children}
  </div>
);

const ModalContent = ({
  children,
  className = "",
  ...props
}) => (
  <div
    className={`bg-white w-full max-w-4xl max-h-[85vh] rounded-xl shadow-2xl overflow-y-auto ${className}`}
    {...props}
  >
    <div className="p-6">{children}</div>
  </div>
);

export default EditEmployee;
