import { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { toast } from "react-toastify";
import { X, CheckCircle, Save, Trash2 } from "lucide-react";
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
  mileStoneVersionId,
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
      status: "ACTIVE",
      percentage: 0,
      approvalDate: "",
      CDApprovalDate: "",
      stage: "",
      reason: "",
    },
  });

  const statusOptions = [
    { label: "In Progress", value: "ACTIVE" },
    { label: "On Hold", value: "ONHOLD" },
    { label: "Completed", value: "COMPLETE" },
    { label: "Delay", value: "DELAY" },
  ];

  const subjectOptions = [
    { label: "Anchor Bolt", value: "Anchor Bolt" },
    { label: "Main Steel", value: "Main Steel" },
    { label: "Main Steel Connection Design", value: "Main Steel Connection Design" },
    { label: "Misc Steel", value: "Misc Steel" },
    { label: "Misc Steel Connection Design", value: "Misc Steel Connection Design" },
    { label: "Foundation Embeds", value: "Foundation Embeds" },
    { label: "Panel Embeds", value: "Panel Embeds" },
    { label: "Others", value: "Others" },
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
          CDApprovalDate: data.CDApprovalDate
            ? new Date(data.CDApprovalDate).toISOString().split("T")[0]
            : "",
          stage: data.stage || "",
          reason: data.reason || "",
        });
      }
    };

    fetchData();
  }, [milestoneId, initialData, reset]);

  const handleDelete = () => {
    toast.info(
      ({ closeToast }) => (
        <div className="flex flex-col gap-3 p-1">
          <p className="font-bold text-gray-800 text-sm">Delete Milestone?</p>
          <p className="text-xs text-gray-600 font-medium">This action cannot be undone.</p>
          <div className="flex gap-4 items-center mt-2">
            <button
              onClick={async () => {
                closeToast();
                try {
                  setLoading(true);
                  await Service.DeleteMilestoneById(milestoneId);
                  toast.success("Milestone deleted successfully!", {
                    position: "bottom-right",
                  });
                  if (onSuccess) await onSuccess();
                  onClose();
                } catch (error) {
                  console.error(error);
                  toast.error("Failed to delete milestone");
                } finally {
                  setLoading(false);
                }
              }}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-1.5 rounded-lg text-xs font-bold transition-all shadow-md active:scale-95"
            >
              Confirm Delete
            </button>
            <button
              onClick={closeToast}
              className="text-gray-500 hover:text-gray-800 text-xs font-bold transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      ),
      {
        autoClose: false,
        closeOnClick: false,
        draggable: false,
        closeButton: false,
        position: "top-center",
        className: "shadow-2xl rounded-2xl border border-gray-100",
        style: { width: "320px" },
      },
    );
  };

  const onSubmit = async (data) => {
    try {
      const payload = {
        ...data,
        percentage: Number(data.percentage),
        approvalDate: data.approvalDate
          ? new Date(data.approvalDate).toISOString()
          : null,
        CDApprovalDate: data.CDApprovalDate
          ? new Date(data.CDApprovalDate).toISOString()
          : null,
      };

      if (mileStoneVersionId) {
        await Service.EditMilestoneById(milestoneId, payload);
      } else {
        await Service.EditExistingMilestoneByID(milestoneId, payload);
      }
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
          className=" text-black bg-red-200 hover:bg-red-500 hover:text-white border border-black rounded-md px-2 py-1 "
        >
          close
        </button>
      </div>

      {/* Form Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Subject *
            </label>
            <Controller
              name="subject"
              control={control}
              rules={{ required: "Subject is required" }}
              render={({ field }) => (
                <Select
                  {...field}
                  options={subjectOptions}
                  value={subjectOptions.find((opt) => opt.value === field.value)}
                  onChange={(opt) => field.onChange(opt?.value || "")}
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
            {errors.subject && (
              <p className="text-red-500 text-xs mt-1">
                {errors.subject.message}
              </p>
            )}
          </div>

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
            <Input
              label="CD Approval Date"
              type="date"
              {...register("CDApprovalDate")}
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
          <div className="flex justify-between items-center pt-6 mt-4 border-t border-gray-100">
            <div>
              {milestoneId && (
                <Button
                  type="button"
                  onClick={handleDelete}
                  className="bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 hover:text-red-700 px-4 font-bold flex items-center gap-2 h-10 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </Button>
              )}
            </div>
            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="px-6 h-10 border-gray-200 hover:bg-gray-50 font-bold"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-gray-200 hover:bg-green-500 text-black px-8 flex items-center gap-2 h-10 font-bold shadow-sm"
              >
                <Save className="w-4 h-4" />
                {isSubmitting ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditMileStone;
