import { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { toast } from "react-toastify";
import { X, CheckCircle, Save } from "lucide-react";
import Select from "react-select";
import Input from "../../fields/input";
import Button from "../../fields/Button";
import RichTextEditor from "../../fields/RichTextEditor";
import Service from "../../../api/Service";

const EditMileStone = ({
  milestoneId,
  initialData,
  onClose,
  onSuccess,
}) => {
  const [loading, setLoading] = useState(false);
  const {
    register,
    handleSubmit,
    control,

    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      subject: "",
      description: "",
      status: "PENDING",
      percentage: 0,
      approvalDate: "",
      stage: "",
      reason: "",
    },
  });

  const statusOptions = [
    { label: "Pending", value: "PENDING" },
    { label: "In Progress", value: "IN_PROGRESS" },
    { label: "Completed", value: "COMPLETED" },
    { label: "Approved", value: "APPROVED" },
  ];

  const stageOptions = [
    { label: "IFA", value: "IFA" },
    { label: "IFC", value: "IFC" },
    { label: "OFC", value: "OFC" },
    { label: "RIF", value: "RIF" },
  ];

  useEffect(() => {
    const fetchData = async () => {
      let data = initialData;

      if (!data && milestoneId) {
        setLoading(true);
        try {
          const response = await Service.GetMilestoneById(milestoneId);
          if (response?.data) {
            data = response.data;
          }
        } catch (error) {
          console.error("Error fetching milestone:", error);
          toast.error("Failed to load milestone data");
        } finally {
          setLoading(false);
        }
      }

      if (data) {
        reset({
          subject: data.subject || "",
          description: data.description || "",
          status: data.status || "PENDING",
          percentage:
            data.percentage !== undefined ? Number(data.percentage) : 0,
          approvalDate: data.approvalDate
            ? new Date(data.approvalDate).toISOString().split("T")[0]
            : "",
          stage: data.stage || "",
          reason: data.reason || "",
        });
      }
    };

    fetchData();
  }, [milestoneId, initialData, reset]);

  const onSubmit = async (data) => {
    try {
      const payload = {
        ...data,
        percentage: Number(data.percentage),
        approvalDate: data.approvalDate
          ? new Date(data.approvalDate).toISOString()
          : null,
      };

      await Service.EditExistingMilestoneByID(milestoneId, payload);
      toast.success("Milestone updated successfully!");
      if (onSuccess) onSuccess();
      onClose();
    } catch (error) {
      console.error(error);
      toast.error(
        error?.response?.data?.message || "Failed to update milestone",
      );
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-40">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white rounded-2xl shadow-xl overflow-hidden z-40">
      {/* Header */}
      <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100 bg-gray-50/50">
        <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
          <CheckCircle className="w-6 h-6 text-blue-600" />
          Edit Milestone
        </h3>
        <button
          onClick={onClose}
          className="p-2 rounded-full hover:bg-gray-200 text-gray-500 hover:text-gray-700 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Form Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <Input
            label="Subject *"
            placeholder="e.g. 50% Submission"
            {...register("subject", { required: "Subject is required" })}
            error={errors.subject?.message}
          />

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Description
            </label>
            <Controller
              name="description"
              control={control}
              render={({ field }) => (
                <RichTextEditor
                  value={field.value}
                  onChange={field.onChange}
                  placeholder="Describe the milestone deliverables..."
                />
              )}
            />
          </div>
          <Input label="Reason" {...register("reason")} />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Controller
              name="stage"
              control={control}
              render={({ field }) => (
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-semibold text-gray-700">
                    Stage
                  </label>
                  <Select
                    options={stageOptions}
                    value={stageOptions.find((o) => o.value === field.value)}
                    onChange={(val) => field.onChange(val?.value)}
                    placeholder="Select Stage"
                    className="text-sm"
                    styles={{
                      control: (base) => ({
                        ...base,
                        borderRadius: "0.5rem",
                        padding: "2px",
                        borderColor: "#e5e7eb",
                        boxShadow: "none",
                        "&:hover": {
                          borderColor: "#d1d5db",
                        },
                      }),
                    }}
                  />
                </div>
              )}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input
              label="Approval Date"
              type="date"
              {...register("approvalDate")}
            />

            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-gray-700">
                Status
              </label>
              <Controller
                name="status"
                control={control}
                render={({ field }) => (
                  <Select
                    options={statusOptions}
                    value={statusOptions.find((c) => c.value === field.value)}
                    onChange={(val) => field.onChange(val?.value)}
                    className="text-sm"
                    styles={{
                      control: (base) => ({
                        ...base,
                        borderRadius: "0.5rem",
                        padding: "2px",
                        borderColor: "#e5e7eb",
                        boxShadow: "none",
                        "&:hover": {
                          borderColor: "#d1d5db",
                        },
                      }),
                    }}
                  />
                )}
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-6 mt-4 border-t border-gray-100">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="px-6"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              {isSubmitting ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditMileStone;
