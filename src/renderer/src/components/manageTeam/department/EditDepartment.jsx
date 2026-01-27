/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";

import Input from "../../fields/input";
import Button from "../../fields/Button";
import Service from "../../../api/Service";
import { Loader2 } from "lucide-react";



const EditDepartment = ({
  id,
  onSuccess,
  onCancel,
}) => {
  const [staffs, setStaffs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchingDept, setFetchingDept] = useState(true);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      name: "",
      managerIds: []
    },
  });

  // ── Fetch Department Data ──
  useEffect(() => {
    const fetchDepartment = async () => {
      try {
        setFetchingDept(true);
        const response = await Service.FetchDepartmentByID(id);
        const dept = response?.data;
        if (dept) {
          reset({
            name: dept.name,
            managerIds.isArray(dept.managerIds)
              ? dept.managerIds.map((m) =>
                  typeof m === "string" ? m : m.id
                )
              : []
          });
        }
      } catch (err) {
        console.error("Failed to fetch department:", err);
      } finally {
        setFetchingDept(false);
      }
    };

    if (id) fetchDepartment();
  }, [id, reset]);

  // ── Fetch Operation Executives ──
  const fetchExecutives = async () => {
    try {
      const response = await Service.FetchEmployeeByRole("OPERATION_EXECUTIVE");
      const employees = response?.data?.employees || []
      setStaffs(employees);
    } catch (err) {
      console.error("Failed to fetch operation executives:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExecutives();
  }, []);

  // ── Build options (OPERATION_EXECUTIVE) ──
  const executiveOptions = React.useMemo(() => {
    return staffs.map((user) => ({
      label: `${user.firstName} ${user.lastName}`.trim(),
      value: user.id,
    }));
  }, [staffs]);

  // ── Watch selected IDs (array) ──
  const selectedExecutiveIDs = watch("managerIds") || []

  // ── Toggle selection ──
  const toggleExecutive = (id) => {
    const updated = selectedExecutiveIDs.includes(id)
      ? selectedExecutiveIDs.filter((x) => x !== id)
      : [...selectedExecutiveIDs, id];

    setValue("managerIds", updated, { shouldValidate: true });
  };

  // ── Submit handler ──
  const onSubmit = async (data) => {
    try {
      await Service.EditDepartment(id, {
        name: data.name,
        managerIds: data.managerIds,
      });
      if (onSuccess) onSuccess();
    } catch (err) {
      console.error("Error updating department:", err);
    }
  };

  if (fetchingDept) {
    return (
      <div className="flex items-center justify-center py-8 text-gray-700">
        <Loader2 className="w-5 h-5 animate-spin mr-2" />
        Loading department details...
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto bg-white rounded-xl shadow-md p-6 mt-6 border border-gray-200">
      <h2 className="text-xl font-semibold text-gray-700 mb-5">
        Edit Department
      </h2>

      {loading ? (
        <p className="text-center text-gray-700">Loading executives...</p>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {/* ── Department Name ── */}
          <div>
            <Input
              label="Department Name"
              type="text"
              {...register("name", { required: "Department name is required" })}
              placeholder="e.g. Engineering"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-green-500 focus:border-green-500"
            />
            {errors.name && (
              <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>
            )}
          </div>

          {/* ── Executive Selection (Multi‑Select Checkbox List) ── */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Operation Executive(s){" "}
              <span className="text-gray-700">(Optional)</span>
            </label>

            {executiveOptions.length === 0 ? (
              <p className="text-sm text-gray-700 italic">
                No operation executives available
              </p>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto border border-gray-200 rounded-lg p-3 bg-gray-50">
                {executiveOptions.map((option) => (
                  <label
                    key={option.value}
                    className="flex items-center gap-3 p-2 hover:bg-white rounded cursor-pointer transition"
                  >
                    <input
                      type="checkbox"
                      checked={selectedExecutiveIDs.includes(option.value)}
                      onChange={() => toggleExecutive(option.value)}
                      className="w-4 h-4 text-green-600 rounded focus:ring-green-500"
                    />
                    <span className="text-sm text-gray-700">
                      {option.label}
                    </span>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* ── Action Buttons ── */}
          <div className="flex justify-end gap-3">
            {onCancel && (
              <Button
                type="button"
                onClick={onCancel}
                className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-300 transition"
              >
                Cancel
              </Button>
            )}
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="animate-spin w-4 h-4" />
                  Updating...
                </>
              ) : (
                "Update Department"
              )}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
};

export default EditDepartment;