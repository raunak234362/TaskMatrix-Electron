/* eslint-disable @typescript-eslint/no-explicit-any */
import { FC, useEffect, useState } from "react";
import { useForm } from "react-hook-form";

import Input from "../../fields/input";
import Button from "../../fields/Button";
import Service from "../../../api/Service";


const AddDepartment = () => {
  const [staffs, setStaffs] = useState([]);
  const [loading, setLoading] = useState(true);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      name: "",
      managerIds: [], // ← start as empty array
    },
  });

  // ── Fetch admins & department managers ──
  const fetchManagers = async () => {
    try {
      const response = await Service.FetchEmployeeByRole("ADMIN");
      const employees = response?.data?.employees || [];

      // Also fetch department managers if needed
      const deptMgrRes = await Service.FetchEmployeeByRole("DEPT_MANAGER");
      const deptMgrs = deptMgrRes?.data?.employees || [];
      const pmoRes = await Service.FetchEmployeeByRole(
        "PROJECT_MANAGER_OFFICER",
      );
      const pmoMgrs = pmoRes?.data?.employees || [];
      setStaffs([...employees, ...deptMgrs, ...pmoMgrs]);
    } catch (err) {
      console.error("Failed to fetch managers:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchManagers();
  }, []);

  // ── Build options (ADMIN + DEPT_MANAGER) ──
  const managerOptions = React.useMemo(() => {
    return staffs
      .filter((user) => {
        const role = user.role?.toUpperCase();
        return (
          role === "ADMIN" ||
          role === "DEPT_MANAGER" ||
          role === "PROJECT_MANAGER_OFFICER"
        );
      })
      .map((user) => ({
        label: `${user.firstName} ${user.lastName}`.trim(),
        value: user.id,
      }));
  }, [staffs]);

  // ── Watch selected IDs (array) ──
  const selectedManagerIDs = watch("managerIds") || [];

  // ── Toggle selection ──
  const toggleManager = (id) => {
    const updated = selectedManagerIDs.includes(id)
      ? selectedManagerIDs.filter((x) => x !== id)
      : [...selectedManagerIDs, id];

    setValue("managerIds", updated, { shouldValidate: true });
  };

  // ── Submit handler ──
  const onSubmit = async (data) => {
    console.log("Submitted:", data);

    try {
      const response = await Service.AddDepartment({
        name: data.name,
        managerIds: data.managerIds, // ← array!
      });
      console.log("Department created:", response);
      // toast.success("Department created!");
    } catch (err) {
      console.error("Error:", err);
      // toast.error(err?.response?.data?.message || "Failed");
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto bg-white rounded-[2.5rem] shadow-soft p-12 mt-10 border border-black/5">
      <div className="mb-10 text-center">
        <h2 className="text-3xl font-black text-black uppercase tracking-tight">Add New Department</h2>
        <p className="text-black/60 text-sm font-bold tracking-wide mt-2">Organize your workforce efficiently</p>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center p-20 gap-4">
          <div className="animate-spin rounded-full h-10 w-10 border-4 border-black/5 border-t-black"></div>
          <span className="text-black font-black uppercase tracking-widest text-[10px]">Loading managers...</span>
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

          {/* ── Manager Selection ── */}
          <div className="space-y-4">
            <label className="block text-[10px] font-black text-black uppercase tracking-[0.15em] ml-1">
              Select Manager(s) <span className="text-black/20">(Optional)</span>
            </label>

            {managerOptions.length === 0 ? (
              <div className="p-8 text-center bg-gray-50 rounded-2xl border border-dashed border-black/10">
                <p className="text-xs text-black/40 font-bold italic">
                  No admin or department managers available
                </p>
              </div>
            ) : (
              <div className="space-y-1 max-h-56 overflow-y-auto border border-black/5 rounded-2xl p-4 bg-gray-50/50 custom-scrollbar">
                {managerOptions.map((option) => (
                  <label
                    key={option.value}
                    className="flex items-center gap-4 p-3 hover:bg-white rounded-xl cursor-pointer transition-all group border border-transparent hover:border-black/5 hover:shadow-sm"
                  >
                    <div className="relative flex items-center">
                      <input
                        type="checkbox"
                        checked={selectedManagerIDs.includes(option.value)}
                        onChange={() => toggleManager(option.value)}
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

          {/* ── Submit Button ── */}
          <div className="pt-6">
            <Button
              type="submit"
              disabled={isSubmitting}
              className={`w-full px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-medium flex items-center justify-center gap-3 ${isSubmitting
                ? "bg-gray-100 text-black/20 cursor-not-allowed"
                : "bg-black text-white hover:bg-black/90 active:scale-95"
                }`}
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-black/20 border-t-black"></div>
                  Processing...
                </>
              ) : (
                "Create Department"
              )}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
};

export default AddDepartment;
