/* eslint-disable @typescript-eslint/no-explicit-any */
import React from "react";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";
import Service from "../../../api/Service";
import Input from "../../fields/input";
import { useDispatch } from "react-redux";
import { addStaff } from "../../../store/userSlice";
import { X, UserPlus, Loader2 } from "lucide-react";

const AddCDEngineer = ({ designer, onClose }) => {
  const dispatch = useDispatch();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm();

  const onSubmit = async (data) => {
    const payload = {
      ...data,
      role: "CONNECTION_DESIGNER_ENGINEER",
      connectionDesignerId: designer.id,
      username: data?.username?.toUpperCase(),
    };

    try {
      const response = await Service.AddEmployee(payload);
      dispatch(addStaff(response?.data?.user));
      toast.success("Engineer created successfully!");
      if (onClose) onClose();
    } catch (error) {
      console.error("Error creating employee:", error);
      toast.error(
        error?.response?.data?.message || "Failed to create engineer"
      );
    }
  };

  return (
    <div className="fixed inset-0 z-[11000] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-4xl bg-white rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden relative border border-white/20 animate-in fade-in zoom-in duration-200">

        {/* Header Section */}
        <div className="p-8 border-b border-gray-100 flex items-center justify-between bg-white">
          <div>
            <h2 className="text-2xl font-black text-gray-800 tracking-tight flex items-center gap-3">
              <UserPlus className="text-[#6bbd45]" size={28} />
              Onboard Engineer
            </h2>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mt-1">
              EXPAND WORKFORCE INTELLIGENCE FOR {designer?.name || "DESIGNER"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-3 bg-gray-50 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-xl transition-all active:scale-95 shadow-sm border border-gray-100"
          >
            <X size={20} strokeWidth={2.5} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">

              {/* Username */}
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

              {/* Email */}
              <div className="space-y-1">
                <Input
                  label="Engineer Email"
                  type="email"
                  {...register("email", { required: "Email is required" })}
                  placeholder="name@company.com"
                />
                {errors.email && (
                  <p className="text-red-500 text-[10px] font-black uppercase tracking-widest mt-1">{errors.email.message}</p>
                )}
              </div>

              {/* Phone & Extension */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Input
                    label="Contact Phone"
                    type="tel"
                    {...register("phone", { required: "Phone number is required" })}
                    placeholder="+91 XXX XXX XXXX"
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

              {/* First Name */}
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

              {/* Middle Name */}
              <div className="space-y-1">
                <Input
                  label="Middle Name"
                  type="text"
                  {...register("middleName")}
                  placeholder="Optional"
                />
              </div>

              {/* Last Name */}
              <div className="space-y-1">
                <Input
                  label="Last Name"
                  type="text"
                  {...register("lastName")}
                  placeholder="Legal last name"
                />
              </div>

              {/* Designation */}
              <div className="space-y-1 md:col-span-2">
                <Input
                  label="Engineering Role / Designation"
                  type="text"
                  {...register("designation", {
                    required: "Designation is required",
                  })}
                  placeholder="Senior Structural Engineer, etc."
                />
                {errors.designation && (
                  <p className="text-red-500 text-[10px] font-black uppercase tracking-widest mt-1">
                    {errors.designation.message}
                  </p>
                )}
              </div>
            </div>

            {/* Submit Container */}
            <div className="flex justify-end gap-3 pt-6 border-t border-gray-50 bg-white">
              <button
                type="button"
                onClick={onClose}
                className="px-8 py-3.5 bg-gray-50 hover:bg-gray-100 text-gray-500 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all"
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
                  "Initiate Onboarding"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddCDEngineer;
