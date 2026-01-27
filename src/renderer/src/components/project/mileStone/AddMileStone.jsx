import { useForm, Controller } from "react-hook-form";
import { toast } from "react-toastify";
import { X, CheckCircle } from "lucide-react";
import Service from "../../../api/Service";
import Input from "../../fields/input";
import Button from "../../fields/Button";
import Select from "react-select";

import RichTextEditor from "../../fields/RichTextEditor";


const AddMileStone = ({
  projectId,
  fabricatorId,
  onClose,
  onSuccess,
}) => {
  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      project_id: projectId,
      fabricator_id: fabricatorId,
      status: "PENDING",
    },
  });

  const statusOptions = [
    { label: "Pending", value: "PENDING" },
    { label: "In Progress", value: "IN_PROGRESS" },
    { label: "Completed", value: "COMPLETED" },
    { label: "Approved", value: "APPROVED" },
  ];

  const onSubmit = async (data) => {
    try {
      const payload = {
        ...data,
        status: "ACTIVE",
        date: data.date ? new Date(data.date).toISOString() : undefined,
        approvalDate: data.approvalDate
          ? new Date(data.approvalDate).toISOString()
          : undefined,
      };
      await Service.AddProjectMilestone(payload);
      toast.success("Milestone added successfully!");
      if (onSuccess) onSuccess();
      //   onClose();
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to add milestone");
    }
  };

  return (
    <div className="flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full w-full overflow-hidden animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="flex justify-between items-center p-5 border-b bg-gray-50">
          <h3 className="text-xl font-bold text-gray-700 flex items-center gap-2">
            <CheckCircle className="w-6 h-6 text-green-600" />
            Add New Milestone
          </h3>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-200 text-gray-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-5">
          <Input
            label="Subject *"
            placeholder="e.g. 50% Submission"
            {...register("subject", { required: "Required" })}
          />
          {errors.subject && (
            <p className="text-red-500 text-xs mt-1">
              {errors.subject.message}
            </p>
          )}

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Description *
            </label>
            <Controller
              name="description"
              control={control}
              rules={{ required: "Required" }}
              render={({ field }) => (
                <RichTextEditor
                  value={field.value || ""}
                  onChange={field.onChange}
                  placeholder="Describe the milestone deliverables..."
                />
              )}
            />
            {errors.description && (
              <p className="text-red-500 text-xs mt-1">
                {errors.description.message}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* <div>
              <Input
                label="Target Date *"
                type="date"
                {...register("date", { required: "Required" })}
              />
              {errors.date && (
                <p className="text-red-500 text-xs mt-1">{errors.date.message}</p>
              )}
            </div> */}
            <Input
              label="Approval Date"
              type="date"
              {...register("approvalDate")}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Status
            </label>
            <Select
              options={statusOptions}
              defaultValue={statusOptions[0]}
              onChange={(opt) => setValue("status", opt?.value || "PENDING")}
              className="text-sm"
              styles={{
                control: (base) => ({
                  ...base,
                  borderRadius: "0.5rem",
                  padding: "2px",
                }),
              }}
            />
          </div>

          {/* Footer */}
          <div className="flex flex-col sm:flex-row justify-center gap-3 pt-4 border-t mt-2">
            <Button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto px-5 bg-gray-100 text-gray-700 hover:bg-gray-200"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-green-600 hover:bg-green-700 text-white px-6"
            >
              {isSubmitting ? "Adding..." : "Add Milestone"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddMileStone;
