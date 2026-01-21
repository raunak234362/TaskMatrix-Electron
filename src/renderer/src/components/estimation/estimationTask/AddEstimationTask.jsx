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
import RichTextEditor from "../../fields/RichTextEditor";

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
    <div className="w-full">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        {/* Task Assignment */}
        <div className="bg-gray-50/50 p-4 rounded-2xl border border-gray-100">
          <SectionTitle title="Assignment" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
            <div className="flex flex-col">
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
                      control: (base) => ({
                        ...base,
                        borderRadius: "0.75rem",
                        padding: "0.25rem",
                        borderColor: "#e5e7eb",
                        "&:hover": { borderColor: "#0d9488" },
                      }),
                    }}
                  />
                )}
              />
              {errors.assignedToId && (
                <p className="text-red-500 text-xs mt-1 ml-1">
                  {errors.assignedToId.message}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Dates */}
        <div className="bg-gray-50/50 p-4 rounded-2xl border border-gray-100">
          <SectionTitle title="Timeline" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
            <div className="flex flex-col">
              <Input
                label="Start Date *"
                type="date"
                {...register("startDate", { required: "Start Date is required" })}
                className="rounded-xl"
              />
              {errors.startDate && (
                <p className="text-red-500 text-xs mt-1 ml-1">{errors.startDate.message}</p>
              )}
            </div>

            <div className="flex flex-col">
              <Input
                label="End Date *"
                type="date"
                {...register("endDate", { required: "End Date is required" })}
                className="rounded-xl"
              />
              {errors.endDate && (
                <p className="text-red-500 text-xs mt-1 ml-1">{errors.endDate.message}</p>
              )}
            </div>
          </div>
        </div>

        {/* Notes */}
        <div className="bg-gray-50/50 p-4 rounded-2xl border border-gray-100">
          <SectionTitle title="Notes" />
          <div className="mt-4">
            <Controller
              name="notes"
              control={control}
              render={({ field }) => (
                <RichTextEditor
                  value={field.value || ""}
                  onChange={field.onChange}
                  placeholder="Add notes..."
                />
              )}
            />
          </div>
        </div>

        {/* Attachments */}
        <div className="bg-gray-50/50 p-4 rounded-2xl border border-gray-100">
          <SectionTitle title="Attachments" />
          <div className="mt-4">
            <MultipleFileUpload onFilesChange={setFiles} />
            {files.length > 0 && (
              <p className="text-sm text-teal-600 font-medium mt-2 ml-1">
                {files.length} file(s) attached
              </p>
            )}
          </div>
        </div>

        {/* Submit Buttons */}
        <div className="flex justify-end gap-4 pt-6 border-t border-gray-100">
          <Button
            type="button"
            onClick={onClose}
            className="bg-gray-100 text-gray-700 hover:bg-gray-200 px-8 rounded-xl transition-all"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting || loading}
            className="bg-teal-600 text-white hover:bg-teal-700 px-8 rounded-xl shadow-lg shadow-teal-200 transition-all"
          >
            {loading ? "Creating..." : "Create Task"}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default AddEstimationTask;
