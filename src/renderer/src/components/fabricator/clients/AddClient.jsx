import React from "react";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";
import Button from "../../fields/Button";
import Service from "../../../api/Service";
import Input from "../../fields/input";
import { useDispatch } from "react-redux";
import { addStaff } from "../../../store/userSlice";
import Select from "../../fields/Select";
import { X, UserPlus, Loader2 } from "lucide-react";

const AddClients = ({ fabricator, onClose }) => {
  const dispatch = useDispatch();
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm();

  const onSubmit = async (data) => {
    const payload = {
      ...data,
      username: data?.username?.toUpperCase(),
    };

    try {
      const response = await Service.AddClientByFabricator(
        fabricator.id,
        payload
      );
      dispatch(addStaff(response?.data?.user));
      toast.success("POC created successfully!");
      onClose();
    } catch (error) {
      console.error("Error creating POC:", error);
      toast.error(
        error?.response?.data?.message || "Failed to create POC"
      );
    }
  };

  const roleOptions = [
    { label: "CLIENT", value: "CLIENT" },
    { label: "CLIENT ADMIN", value: "CLIENT_ADMIN" },
    { label: "CLIENT PROJECT COORDINATOR", value: "CLIENT_PROJECT_COORDINATOR" },
    { label: "CLIENT GENERAL CONSTRUCTOR", value: "CLIENT_GENERAL_CONSTRUCTOR" },
  ];

  const selectedRole = watch("role");
  const selectedRoleOption = roleOptions.find((opt) => opt.value === selectedRole) || null;

  return (
    <div className="fixed inset-0 z-[11000] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-4xl bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden relative border border-gray-100 animate-in fade-in zoom-in duration-200">

        {/* Header Section */}
        <div className="p-8 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-black text-gray-800 tracking-tight flex items-center gap-3">
              <UserPlus className="text-[#6bbd45]" size={28} />
              Add New POC
            </h2>
           
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-red-50 border border-red-600 text-black font-black text-[10px] uppercase tracking-widest rounded-lg hover:bg-red-100 transition-all"
          >
            Close
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">

              <div className="space-y-1">
                <Select
                  label="Branch Association"
                  placeholder="Select branch"
                  options={fabricator.branches
                    ?.filter((branch) => branch.id !== undefined)
                    .map((branch) => ({
                      label: branch.name,
                      value: branch.id,
                    })) || []}
                  {...register("branchId")}
                  onChange={(_, value) => setValue("branchId", value)}
                />
              </div>

              <div className="space-y-1">
                <Input
                  label="Unique Username"
                  type="text"
                  {...register("username", { required: "Username is required" })}
                  placeholder="Enter username"
                />
                {errors.username && (
                  <p className="text-red-500 text-[10px] font-black uppercase tracking-widest mt-1">
                    {errors.username.message}
                  </p>
                )}
              </div>

              <div className="space-y-1">
                <Input
                  label="Official Email"
                  type="email"
                  {...register("email", { required: "Email is required" })}
                  placeholder="poc@company.com"
                />
                {errors.email && (
                  <p className="text-red-500 text-[10px] font-black uppercase tracking-widest mt-1">{errors.email.message}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Input
                    label="Contact Phone"
                    type="tel"
                    {...register("phone", { required: "Phone number is required" })}
                    placeholder="+1 XXX XXX XXXX"
                  />
                  {errors.phone && (
                    <p className="text-red-500 text-[10px] font-black uppercase tracking-widest mt-1">
                      {errors.phone.message}
                    </p>
                  )}
                </div>
                <div className="space-y-1">
                  <Input
                    label="Extension"
                    type="text"
                    {...register("extension")}
                    placeholder="Ext"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Input
                  label="First Name"
                  type="text"
                  {...register("firstName", { required: "First name is required" })}
                  placeholder="Legal first name"
                />
                {errors.firstName && (
                  <p className="text-red-500 text-[10px] font-black uppercase tracking-widest mt-1">
                    {errors.firstName.message}
                  </p>
                )}
              </div>

              <div className="space-y-1">
                <Input
                  label="Last Name"
                  type="text"
                  {...register("lastName")}
                  placeholder="Legal last name"
                />
              </div>

              <div className="space-y-1">
                <Input
                  label="Professional Title"
                  type="text"
                  {...register("designation", {
                    required: "Designation is required",
                  })}
                  placeholder="Project Manager, etc."
                />
                {errors.designation && (
                  <p className="text-red-500 text-[10px] font-black uppercase tracking-widest mt-1">
                    {errors.designation.message}
                  </p>
                )}
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">
                  Network Role
                </label>
                <Select
                  options={roleOptions}
                  {...register("role")}
                  value={selectedRoleOption?.value}
                  onChange={(_, value) => setValue("role", value)}
                  placeholder="Select network role..."
                />
              </div>
            </div>

            <div className="md:col-span-2">
              <Input
                label="Department Association"
                type="text"
                {...register("departmentId")}
                placeholder="Optional department tag"
              />
            </div>

            <div className="flex justify-end gap-3 pt-6 border-t border-gray-50">
              <button
                type="button"
                onClick={onClose}
                className="px-8 py-3.5 bg-gray-50 border hover:bg-gray-100 text-black rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-10 py-3.5 bg-[#6bbd45]/15 hover:bg-[#6bbd45]/30 text-black border border-black rounded-xl text-[10px] font-black uppercase tracking-[0.2em] shadow-sm disabled:opacity-50 transition-all flex items-center gap-3 active:scale-95"
              >
                {isSubmitting ? (
                  <Loader2 className="animate-spin w-4 h-4" />
                ) : (
                  "Add POC"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddClients;
