/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState, useMemo } from "react";
import { useForm } from "react-hook-form";

import Input from "../../fields/input";
import Button from "../../fields/Button";
import Service from "../../../api/Service";

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
      managerIds: [],
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
            managerIds: Array.isArray(dept.managerIds)
              ? dept.managerIds.map((m) =>
                typeof m === "string" ? m : m.id
              )
              : [],
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
      const employees = response?.data?.employees || [];
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
  const executiveOptions = useMemo(() => {
    return staffs.map((user) => ({
      label: `${user.firstName} ${user.lastName}`.trim(),
      value: user.id,
    }));
  }, [staffs]);

  // ── Watch selected IDs (array) ──
  const selectedExecutiveIDs = watch("managerIds") || [];

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
      <div className="w-full mx-auto bg-white rounded-[2.5rem] shadow-soft p-20 border border-black/5 text-center">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-10 w-10 border-4 border-black/5 border-t-black"></div>
          <span className="text-black font-black uppercase tracking-widest text-[10px]">Loading department details...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto bg-white rounded-[2.5rem] shadow-soft p-12 mt-10 border border-black/5">
      <div className="mb-10 text-center">
        <h2 className="text-3xl font-black text-black uppercase tracking-tight">Edit Department</h2>
        <p className="text-black/60 text-sm font-bold tracking-wide mt-2">Update organizational unit details</p>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center p-20 gap-4">
          <div className="animate-spin rounded-full h-10 w-10 border-4 border-black/5 border-t-black"></div>
          <span className="text-black font-black uppercase tracking-widest text-[10px]">Loading executives...</span>
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          {/* ── Department Name ── */}
          <div className="space-y-2">
            <Input
              label="Department Name"
              type="text"
              {...register("name", { required: "Department name is required" })}
              placeholder="e.g. Engineering"
              className="w-full"
            />
            {errors.name && (
              <p className="text-red-500 text-[10px] font-black uppercase ml-1">{errors.name.message}</p>
            )}
          </div>

          {/* ── Executive Selection ── */}
          <div className="space-y-4">
            <label className="block text-[10px] font-black text-black uppercase tracking-[0.15em] ml-1">
              Select Operation Executive(s) <span className="text-black/20">(Optional)</span>
            </label>

            {executiveOptions.length === 0 ? (
              <div className="p-8 text-center bg-gray-50 rounded-2xl border border-dashed border-black/10">
                <p className="text-xs text-black/40 font-bold italic">
                  No operation executives available
                </p>
              </div>
            ) : (
              <div className="space-y-1 max-h-56 overflow-y-auto border border-black/5 rounded-2xl p-4 bg-gray-50/50 custom-scrollbar">
                {executiveOptions.map((option) => (
                  <label
                    key={option.value}
                    className="flex items-center gap-4 p-3 hover:bg-white rounded-xl cursor-pointer transition-all group border border-transparent hover:border-black/5 hover:shadow-sm"
                  >
                    <div className="relative flex items-center">
                      <input
                        type="checkbox"
                        checked={selectedExecutiveIDs.includes(option.value)}
                        onChange={() => toggleExecutive(option.value)}
                        className="peer h-5 w-5 cursor-pointer appearance-none rounded-md border border-black/10 transition-all checked:bg-black"
                      />
                      <svg
                        className="pointer-events-none absolute left-1/2 top-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 text-white opacity-0 peer-checked:opacity-100"
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="4"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <polyline points="20 6 9 17 4 12"></polyline>
                      </svg>
                    </div>
                    <span className="text-xs font-bold text-black group-hover:text-black transition-colors uppercase tracking-tight">
                      {option.label}
                    </span>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* ── Action Buttons ── */}
          <div className="flex flex-wrap gap-4 pt-6 border-t border-black/5">
            {onCancel && (
              <Button
                type="button"
                onClick={onCancel}
                className="flex-1 px-8 py-4 bg-white border border-black/10 rounded-2xl text-black font-black text-xs uppercase tracking-widest hover:bg-gray-50 transition-all shadow-sm"
              >
                Cancel
              </Button>
            )}
            <Button
              type="submit"
              disabled={isSubmitting}
              className={`flex-[2] px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-medium flex items-center justify-center gap-3 ${isSubmitting
                ? "bg-gray-100 text-black/20 cursor-not-allowed"
                : "bg-black text-white hover:bg-black/90 active:scale-95"
                }`}
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-black/20 border-t-black"></div>
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