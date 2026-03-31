/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState, useMemo } from "react";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";
import Input from "../../fields/input";
import Service from "../../../api/Service";
import { X, Check, Loader2, Layers } from "lucide-react";

const EditDepartment = ({ id, onSuccess, onCancel }) => {
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
              ? dept.managerIds.map((m) => (typeof m === "string" ? m : m.id))
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
      toast.success("Department updated successfully!");
      if (onSuccess) onSuccess();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to update department");
      console.error("Error updating department:", err);
    }
  };

  if (fetchingDept) {
    return (
      <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <div className="bg-white rounded-2xl p-12 border border-gray-200 shadow-xl flex items-center gap-4 animate-in fade-in duration-200">
          <Loader2 className="w-8 h-8 animate-spin text-[#6bbd45]" />
          <span className="text-sm font-black uppercase tracking-widest text-black">
            Analyzing Department...
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden animate-in fade-in zoom-in duration-200 w-full max-w-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <header className="flex items-center justify-between p-6 border-b border-gray-200 bg-white shrink-0">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-[#6bbd45]/15 rounded-xl text-[#6bbd45]">
              <Layers className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-black text-black tracking-tight uppercase">
                Edit Department
              </h2>
              <p className="text-[10px] font-black text-black uppercase tracking-[0.2em] mt-1">
                UPDATE ORGANIZATIONAL UNIT DETAILS
              </p>
            </div>
          </div>
          <button
            onClick={onCancel}
            className="px-4 py-2 bg-red-50 border border-red-600 text-black font-black text-[10px] uppercase tracking-widest rounded-lg hover:bg-red-100 transition-all font-black"
          >
            Close
          </button>
        </header>

        <div className="p-8 overflow-y-auto custom-scrollbar flex-1">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 gap-4">
              <Loader2 className="w-8 h-8 animate-spin text-black/20" />
              <span className="text-black/40 font-black uppercase tracking-widest text-[10px]">
                Loading executives list...
              </span>
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
                  <p className="text-red-600 text-[10px] font-black uppercase ml-1">
                    {errors.name.message}
                  </p>
                )}
              </div>

              {/* ── Executive Selection ── */}
              <div className="space-y-4">
                <label className="block text-[10px] font-black text-black uppercase tracking-[0.15em] ml-1">
                  Select Operation Executive(s) <span className="text-black/20">(Optional)</span>
                </label>

                {executiveOptions.length === 0 ? (
                  <div className="p-8 text-center bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                    <p className="text-xs text-black/40 font-bold italic">
                      No operation executives available
                    </p>
                  </div>
                ) : (
                  <div className="space-y-1 max-h-56 overflow-y-auto border border-gray-100 rounded-2xl p-4 bg-gray-50/50 custom-scrollbar">
                    {executiveOptions.map((option) => (
                      <label
                        key={option.value}
                        className="flex items-center gap-4 p-3 hover:bg-white rounded-xl cursor-pointer transition-all group border border-transparent hover:border-gray-200 hover:shadow-sm"
                      >
                        <div className="relative flex items-center">
                          <input
                            type="checkbox"
                            checked={selectedExecutiveIDs.includes(option.value)}
                            onChange={() => toggleExecutive(option.value)}
                            className="peer h-5 w-5 cursor-pointer appearance-none rounded-md border border-gray-300 transition-all checked:bg-black"
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
                        <span className="text-xs font-bold text-black uppercase tracking-tight">
                          {option.label}
                        </span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            </form>
          )}
        </div>

        {/* Footer */}
        <footer className="p-6 border-t border-gray-200 bg-white flex justify-end gap-3 shrink-0">
          <button
            type="button"
            onClick={onCancel}
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
                Updating...
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                Update Department
              </>
            )}
          </button>
        </footer>
      </div>
    </div>
  );
};

export default EditDepartment;