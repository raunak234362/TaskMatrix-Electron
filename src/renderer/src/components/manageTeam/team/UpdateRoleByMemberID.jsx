/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";
import { X } from "lucide-react";
import Service from "../../../api/Service";

import Select from "../../fields/Select";
import Button from "../../fields/Button";


const roles = [
  { label: "CHECKER", value: "CHECKER" },
  { label: "DETAILER", value: "DETAILER" },
  { label: "ERECTER", value: "ERECTER" },
  { label: "MODELER", value: "MODELER" },
  { label: "DESIGNER", value: "DESIGNER" },
  { label: "ESTIMATOR", value: "ESTIMATOR" },
  { label: "GUEST", value: "GUEST" },
  { label: "TEAM_LEAD", value: "TEAM_LEAD" },
];

const UpdateRoleByMemberID = ({
  teamId,
  member,
  onClose,
  onSuccess,
}) => {
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm();

  useEffect(() => {
    if (member) {
      setValue("userId", member.member.id);
      setValue("newRole", member.role);
    }
  }, [member, setValue]);

  const onSubmit = async (data) => {
    try {
      await Service.UpdateTeamMemberRole(teamId, data);
      toast.success("Role updated successfully!");
      onSuccess();
      onClose();
    } catch (error) {
      console.error("Error updating role:", error);
      toast.error("Failed to update role.");
    }
  };

  if (!member) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md bg-white rounded-xl p-6 shadow-xl">
        <div className="flex items-center justify-between mb-4 border-b pb-2">
          <h2 className="text-xl font-semibold text-gray-700">
            Update Role for {member.member.firstName} {member.member.lastName}
          </h2>
          <button onClick={onClose} aria-label="Close">
            <X className="w-6 h-6 text-gray-700 hover:text-gray-700" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="font-medium">New Role</label>
            <Select
              options={roles}
              {...register("newRole", { required: "A new role is required." })}
              onChange={(_, value) => setValue("newRole", value)}
              placeholder="Select a new role"
            />
            {errors.newRole && (
              <p className="text-red-500 text-sm mt-1">
                {errors.newRole.message}
              </p>
            )}
          </div>

          <div className="flex justify-end gap-4 pt-4">
            <Button type="button" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-blue-600 text-white hover:bg-blue-700"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Updating..." : "Update Role"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UpdateRoleByMemberID;
