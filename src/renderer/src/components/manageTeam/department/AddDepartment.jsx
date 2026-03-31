/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";
import Input from "../../fields/input";
import Service from "../../../api/Service";
import { Check, Loader2, Plus, Zap } from "lucide-react";

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
      managerIds: [],
    },
  });

  const fetchManagers = async () => {
    try {
      const [adminRes, deptMgrRes, pmoRes] = await Promise.all([
        Service.FetchEmployeeByRole("ADMIN"),
        Service.FetchEmployeeByRole("DEPT_MANAGER"),
        Service.FetchEmployeeByRole("PROJECT_MANAGER_OFFICER")
      ]);

      const admins = adminRes?.data?.employees || [];
      const deptMgrs = deptMgrRes?.data?.employees || [];
      const pmoMgrs = pmoRes?.data?.employees || [];

      setStaffs([...admins, ...deptMgrs, ...pmoMgrs]);
    } catch (err) {
      console.error("Failed to fetch managers:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchManagers();
  }, []);

  const managerOptions = React.useMemo(() => {
    return staffs.map((user) => ({
      label: `${user.firstName} ${user.lastName}`.trim(),
      value: user.id,
    }));
  }, [staffs]);

  const selectedManagerIDs = watch("managerIds") || [];

  const toggleManager = (id) => {
    const updated = selectedManagerIDs.includes(id)
      ? selectedManagerIDs.filter((x) => x !== id)
      : [...selectedManagerIDs, id];

    setValue("managerIds", updated, { shouldValidate: true });
  };

  const onSubmit = async (data) => {
    try {
      await Service.AddDepartment({
        name: data.name,
        managerIds: data.managerIds,
      });
      toast.success("Department created successfully!");
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to create department");
      console.error("Error creating department:", err);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto bg-white rounded-2xl shadow-sm p-12 mt-10 border border-gray-200 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="mb-10 flex items-center gap-4">
        <div className="p-3 bg-[#6bbd45]/15 rounded-xl text-[#6bbd45]">
          <Zap className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-2xl font-black text-black uppercase tracking-tight">Create New Department</h2>
          <p className="text-[10px] font-black text-black/40 uppercase tracking-[0.2em] mt-1">ESTABLISH NEW ORGANIZATIONAL STRUCTURE</p>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <Loader2 className="w-10 h-10 animate-spin text-[#6bbd45]" />
          <span className="text-black font-black uppercase tracking-widest text-[10px]">Synchronizing Workforce...</span>
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            {/* Left: Basic Details */}
            <div className="space-y-6">
              <div className="space-y-2">
                <Input
                  label="Department Name"
                  type="text"
                  {...register("name", { required: "Department name is required" })}
                  placeholder="e.g. STRUCTURAL ENGINEERING"
                  className="w-full"
                />
                {errors.name && (
                  <p className="text-red-600 text-[10px] font-black uppercase ml-1">{errors.name.message}</p>
                )}
              </div>
            </div>

            {/* Right: Manager Selection */}
            <div className="space-y-4">
              <label className="block text-[10px] font-black text-black uppercase tracking-[0.15em] ml-1">
                Assign Manager(s) <span className="text-black/20 text-[8px] italic">(Optional)</span>
              </label>

              {managerOptions.length === 0 ? (
                <div className="p-8 text-center bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                  <p className="text-[10px] text-black/40 font-black uppercase italic tracking-widest">
                    No Eligible Managers Found
                  </p>
                </div>
              ) : (
                <div className="space-y-1 max-h-64 overflow-y-auto border border-gray-100 rounded-2xl p-4 bg-gray-50/50 custom-scrollbar">
                  {managerOptions.map((option) => (
                    <label
                      key={option.value}
                      className="flex items-center gap-4 p-3 hover:bg-white rounded-xl cursor-pointer transition-all group border border-transparent hover:border-gray-200 hover:shadow-xs"
                    >
                      <div className="relative flex items-center">
                        <input
                          type="checkbox"
                          checked={selectedManagerIDs.includes(option.value)}
                          onChange={() => toggleManager(option.value)}
                          className="peer h-5 w-5 cursor-pointer appearance-none rounded-md border border-gray-300 transition-all checked:bg-[#6bbd45]"
                        />
                        <Check className="pointer-events-none absolute left-1/2 top-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 text-white opacity-0 peer-checked:opacity-100 font-black" />
                      </div>
                      <span className="text-xs font-bold text-black uppercase tracking-tight group-hover:text-black transition-colors">
                        {option.label}
                      </span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Action Button */}
          <div className="flex justify-end pt-8 border-t border-gray-100">
            <button
              type="submit"
              disabled={isSubmitting}
              className={`px-12 py-4 rounded-xl font-black text-[10px] uppercase tracking-[0.2em] transition-all shadow-sm flex items-center justify-center gap-3 ${isSubmitting
                ? "bg-gray-100 text-black/20 cursor-not-allowed"
                : "bg-[#6bbd45]/15 hover:bg-[#6bbd45]/30 text-black border border-black active:scale-95"
                }`}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="animate-spin h-3 w-3" />
                  Generating...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  Create Department
                </>
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default AddDepartment;
