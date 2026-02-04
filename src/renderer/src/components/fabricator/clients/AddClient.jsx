/* eslint-disable @typescript-eslint/no-explicit-any */
import React from "react";
import { useForm } from "react-hook-form";

import { toast } from "react-toastify";
import Button from "../../fields/Button";
import Service from "../../../api/Service";
import Input from "../../fields/input";
import { useDispatch } from "react-redux";
import { addStaff } from "../../../store/userSlice";
import Select from "../../fields/Select";


const AddClients = ({
  fabricator,
  onClose,
}) => {
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
        payload,
      );
      console.log("Employee created:", response);
      dispatch(addStaff(response?.data?.user));
      toast.success("Employee created successfully!");
    } catch (error) {
      console.error("Error creating employee:", error);
      toast.error(
        error?.response?.data?.message || "Failed to create employee",
      );
    }
  };

  const roleOptions = [
    { label: "CLIENT", value: "CLIENT" },
    { label: "CLIENT ADMIN", value: "CLIENT_ADMIN" },
    {
      label: "CLIENT PROJECT COORDINATOR",
      value: "CLIENT_PROJECT_COORDINATOR",
    },
    {
      label: "CLIENT GENERAL CONSTRUCTOR",
      value: "CLIENT_GENERAL_CONSTRUCTOR",
    },
  ];

  // Watch current role value (string)
  const selectedRole = watch("role");

  // Find the full option object for display
  const selectedRoleOption =
    roleOptions.find((opt) => opt.value === selectedRole) || null;

  return (
    <div className="w-full h-[100vh] overflow-y-auto mx-auto bg-white rounded-xl shadow-md p-6 mt-6 border border-gray-200">
      <Button onClick={onClose}>Close</Button>
      <h2 className="text-xl font-semibold text-gray-700 mb-6">
        Add New Employee
      </h2>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="grid grid-cols-1 md:grid-cols-2 gap-5"
      >
        {/* Fabricator Branches */}
        <div>
          <Select
            label="Fabricator Branches"
            placeholder="Select branch"
            options={fabricator.branches
              .filter((branch) => branch.id !== undefined)
              .map((branch) => ({
                label: branch.name,
                value: branch.id,
              }))}
            {...register("branchId")}
            onChange={(_, value) => setValue("branchId", value)}
          />
        </div>

        {/* Username */}
        <div>
          <Input
            label="Username"
            type="text"
            {...register("username", { required: "Username is required" })}
            placeholder="Enter username"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-green-500 focus:border-green-500"
          />
          {errors.username && (
            <p className="text-red-500 text-xs mt-1">
              {errors.username.message}
            </p>
          )}
        </div>

        {/* Email */}
        <div>
          <Input
            label="Email"
            type="email"
            {...register("email", { required: "Email is required" })}
            placeholder="employee@company.com"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-green-500 focus:border-green-500"
          />
          {errors.email && (
            <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>
          )}
        </div>

        {/* Phone & Extension */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Input
              label="Phone"
              type="tel"
              {...register("phone", { required: "Phone number is required" })}
              placeholder="+91XXXXXXXXXX"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-green-500 focus:border-green-500"
            />
            {errors.phone && (
              <p className="text-red-500 text-xs mt-1">
                {errors.phone.message}
              </p>
            )}
          </div>
          <div>
            <Input
              label="Extension"
              type="text"
              {...register("extension")}
              placeholder="Ext"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-green-500 focus:border-green-500"
            />
          </div>
        </div>

        {/* First Name */}
        <div>
          <Input
            label="First Name"
            type="text"
            {...register("firstName", { required: "First name is required" })}
            placeholder="John"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-green-500 focus:border-green-500"
          />
          {errors.firstName && (
            <p className="text-red-500 text-xs mt-1">
              {errors.firstName.message}
            </p>
          )}
        </div>

        {/* Middle Name */}
        <div>
          <Input
            label="Middle Name"
            type="text"
            {...register("middleName")}
            placeholder="M."
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-green-500 focus:border-green-500"
          />
        </div>

        {/* Last Name */}
        <div>
          <Input
            label="Last Name"
            type="text"
            {...register("lastName")}
            placeholder="Doe"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-green-500 focus:border-green-500"
          />
        </div>

        {/* Designation */}
        <div>
          <Input
            label="Designation"
            type="text"
            {...register("designation", {
              required: "Designation is required",
            })}
            placeholder="Software Engineer"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-green-500 focus:border-green-500"
          />
          {errors.designation && (
            <p className="text-red-500 text-xs mt-1">
              {errors.designation.message}
            </p>
          )}
        </div>

        {/* Role – FIXED */}
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
            <p className="text-red-500 text-xs mt-1">{errors.role.message}</p>
          )}
        </div>

        {/* Department */}
        <div className="md:col-span-2">
          <Input
            label="Department ID"
            type="text"
            {...register("departmentId")}
            placeholder="Optional of department"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-green-500 focus:border-green-500"
          />
        </div>

        {/* Submit */}
        <div className="md:col-span-2 flex justify-center mt-6">
          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24">
                  <circle
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                    className="opacity-25"
                  />
                  <path
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    className="opacity-75"
                  />
                </svg>
                Creating...
              </>
            ) : (
              "Create POC"
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default AddClients;
