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
      status: "ACTIVE",
    },
  });

  const statusOptions = [
    { label: "Pending", value: "PENDING" },
    { label: "In Progress", value: "ACTIVE" },
    { label: "Completed", value: "COMPLETE" },
    { label: "Approved", value: "APPROVED" },
    { label: "On Hold", value: "ONHOLD" },
    { label: "Delay", value: "DELAY" },
  ];
  const stageOptions = [
    { label: "IFA", value: "IFA" },
    { label: "IFC", value: "IFC" },
    { label: "RIFA", value: "RIFA" },
    { label: "RIFC", value: "RIFC" },
    { label: "CO", value: "CO" },
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

  const onSubmit = async (data) => {
    try {
      const payload = {
        ...data,
        stage: data.stage || "IFA",
        date: data.date ? new Date(data.date).toISOString() : undefined,
        approvalDate: data.approvalDate
          ? new Date(data.approvalDate).toISOString()
          : undefined,
        CDApprovalDate: data.CDApprovalDate
          ? new Date(data.CDApprovalDate).toISOString()
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
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl h-[90vh] border border-gray-200 overflow-y-auto flex flex-col relative">

        {/* Header */}
        <div className="flex justify-between items-center p-5 border-b bg-gray-50">
          <h3 className="text-xl  text-gray-700 flex items-center gap-2">
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
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-5 overflow-y-auto h-[80vh]">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Subject *
            </label>
            <Controller
              name="subject"
              control={control}
              rules={{ required: "Subject is required" }}
              defaultValue={subjectOptions[0].value}
              render={({ field }) => (
                <Select
                  {...field}
                  options={subjectOptions}
                  value={subjectOptions.find((opt) => opt.value === field.value)}
                  onChange={(opt) => field.onChange(opt?.value || "")}
                  className="text-sm"
                  menuPlacement="bottom"
                  styles={{
                    control: (base) => ({
                      ...base,
                      borderRadius: "0.5rem",
                      padding: "2px",
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
                  placeholder=""
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
            <Input
              label="Approval Date/Reapproved Date/Fabrication Date"
              type="date"
              {...register("approvalDate")}
            />
            <Input
              label="CD Approval Date"
              type="date"
              {...register("CDApprovalDate")}
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
              menuPlacement="top"
              styles={{
                control: (base) => ({
                  ...base,
                  borderRadius: "0.5rem",
                  padding: "2px",
                }),
              }}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Stage
            </label>
            <Select
              options={stageOptions}
              defaultValue={stageOptions[0]}
              onChange={(opt) => setValue("stage", opt?.value || "IFA")}
              className="text-sm"
              menuPlacement="top"
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
