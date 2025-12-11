/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { toast } from "react-toastify";
import Select from "react-select";
import Input from "../../fields/input";
import Button from "../../fields/Button";
import MultipleFileUpload from "../../fields/MultipleFileUpload";
import SectionTitle from "../../ui/SectionTitle";
import Service from "../../../api/Service";
import { useSelector } from "react-redux";
const AddEstimationTask = ({
  estimationId,
  onClose,
  onSuccess,
}) => {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);

  const staffData = useSelector((state) => state.userInfo.staffData);
  const user = useSelector((state) => state.userInfo.userDetail);
  const currentUserId = user?.id;

  // Dropdown options for staff
  const staffOptions =
    staffData
      ?.filter(
        (staff) =>
          ["STAFF", "ESTIMATOR", "ESTIMATION_HEAD"].includes(staff.role)
      )
      .map((staff) => ({
        label: `${staff.firstName} ${staff.lastName}`,
        value: staff.id,
      })) ?? [];

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      status: "ASSIGNED",
    },
  });

  const onSubmit = async (data) => {
    try {
      setLoading(true);

      if (!currentUserId) {
        toast.error("Could not identify current user. Please try again.");
        setLoading(false);
        return;
      }

      // --- Prepare Payload
      const payload = {
        ...data,
        assignedById: currentUserId,
        estimationId,
        startDate: data.startDate
          ? new Date(data.startDate).toISOString()
          : new Date().toISOString(),
        endDate: data.endDate
          ? new Date(data.endDate).toISOString()
          : new Date().toISOString(),
        files,
      };

      // --- Convert to FormData
      const formData = new FormData();
      Object.entries(payload).forEach(([key, value]) => {
        if (key === "files" && Array.isArray(value)) {
          value.forEach((file) => formData.append("files", file));
        } else if (value !== undefined && value !== null) {
          formData.append(key, String(value));
        }
      });

      await Service.AddEstimationTask(formData);

      toast.success("Estimation Task created successfully!");
      onSuccess?.();
      onClose();
      reset();
      setFiles([]);
    } catch (error) {
      console.error("Error creating task:", error);
      toast.error(error?.response?.data?.message || "Failed to create task");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full bg-white rounded-xl shadow-md p-6">
      <h2 className="text-2xl font-bold text-center mb-6 text-gray-800">
        Add Estimation Task
      </h2>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Task Assignment */}
        <SectionTitle title="Assignment" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Controller
            name="assignedToId"
            control={control}
            rules={{ required: "Assigned To is required" }}
            render={({ field }) => (
              <Select
                placeholder="Assigned To *"
                options={staffOptions}
                value={staffOptions.find((opt) => opt.value === field.value) || null}
                onChange={(option) => field.onChange(option?.value)}
                menuPortalTarget={document.body}
                styles={{
                  menuPortal: (base) => ({ ...base, zIndex: 9999 }),
                }}
              />
            )}
          />
          {errors.assignedToId && (
            <p className="text-red-500 text-xs mt-1">
              {errors.assignedToId.message}
            </p>
          )}
        </div>

        {/* Dates */}
        <SectionTitle title="Timeline" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Input
            label="Start Date *"
            type="date"
            {...register("startDate", { required: "Start Date is required" })}
          />
          {errors.startDate && (
            <p className="text-red-500 text-xs">{errors.startDate.message}</p>
          )}

          <Input
            label="End Date *"
            type="date"
            {...register("endDate", { required: "End Date is required" })}
          />
          {errors.endDate && (
            <p className="text-red-500 text-xs">{errors.endDate.message}</p>
          )}
        </div>

        {/* Notes */}
        <SectionTitle title="Notes" />
        <div>
          <textarea
            {...register("notes")}
            rows={3}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 resize-none"
            placeholder="Add notes..."
          />
        </div>

        {/* Attachments */}
        <SectionTitle title="Attachments" />
        <MultipleFileUpload onFilesChange={setFiles} />
        {files.length > 0 && (
          <p className="text-sm text-gray-600 mt-2">{files.length} file(s) attached</p>
        )}

        {/* Submit Buttons */}
        <div className="flex justify-end gap-4 pt-6 border-t border-gray-200">
          <Button
            type="button"
            onClick={onClose}
            className="bg-gray-200 text-gray-800 hover:bg-gray-300"
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting || loading}>
            {loading ? "Creating..." : "Create Task"}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default AddEstimationTask;
