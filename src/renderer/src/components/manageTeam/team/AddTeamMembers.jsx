/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import { toast } from "react-toastify";
import Service from "../../../api/Service";
import { useForm } from "react-hook-form";

import { useSelector } from "react-redux";
import Select from "../../fields/Select";


const roles = [
  "CHECKER",
  "DETAILER",
  "ERECTER",
  "MODELER",
  "DESIGNER",
  "ESTIMATOR",
  "GUEST",
];

const AddTeamMembers = ({ teamMember, onClose }) => {
  const teamId = teamMember?.id || "";
  console.log(teamMember);

  const staffData = useSelector((state) => state.userInfo.staffData);
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      teamId: teamId,
      userId: "",
    },
  });

  const [role, setRole] = useState("");

  const onSubmit = async (data) => {
    if (!role) return toast.error("Please select a role!");

    try {
      const res = await Service.AddTeamMembers(role, data);
      if (res) {
        toast.success("User added successfully!");
        onClose();
      }
    } catch (error) {
      console.log(error);
      toast.error("Error adding user");
    }
  };

  return (
    <div className="p-4 w-[400px] bg-white rounded-xl shadow-lg space-y-4">
      <h2 className="text-xl font-semibold">Add Team Member</h2>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Role */}
        <div className="flex flex-col gap-1">
          <label className="font-medium">Select Role</label>
          <select
            className="border px-3 py-2 rounded"
            value={role}
            onChange={(e) => setRole(e.target.value)}
          >
            <option value="">-- Select Role --</option>
            {roles.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>

        {/* Team ID */}
        <div className="flex flex-col gap-1">
          <label className="font-medium">Team ID</label>
          <input
            className="border px-3 py-2 rounded bg-gray-100"
            {...register("teamId")}
            disabled
          />
        </div>

        {/* User ID */}
        <div className="flex flex-col gap-1">
          <label className="font-medium">User ID</label>
          <Select
            placeholder="Enter USER-UUID"
            className="border px-3 py-2 rounded"
            options={staffData.map((staff) => ({
              label: `${staff.firstName} ${staff.lastName}`,
              value: staff.id,
            }))}
            {...register("userId", { required: "User ID required" })}
            onChange={(_, value) => setValue("userId", value)}
          />

          {errors.userId && (
            <span className="text-red-500 text-sm">
              {errors.userId.message}
            </span>
          )}
        </div>
        {/* Actions */}
        <div className="flex flex-col sm:flex-row justify-center gap-2">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
            disabled={isSubmitting}
          >
            Cancel
          </button>

          <button
            type="submit"
            className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Adding..." : "Add"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddTeamMembers;
