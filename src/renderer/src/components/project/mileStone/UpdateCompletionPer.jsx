import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";
import { X, CheckCircle, Save } from "lucide-react";

import Input from "../../fields/input";
import Button from "../../fields/Button";

import Service from "../../../api/Service";

const UpdateCompletionPer = ({
  milestoneId,
  initialData,
  onClose,
  onSuccess,
}) => {
  const [loading, setLoading] = useState(false);
  const {
    register,
    handleSubmit,

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
    },
  });

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
        });
      }
    };

    fetchData();
  }, [milestoneId, initialData, reset]);

  const onSubmit = async (data) => {
    try {
      const payload = {
        completeionPercentage: parseFloat(data.percentage),
      };

      await Service.UpdateCompletionPercentById(milestoneId, payload);
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
    <div className="flex flex-col h-full bg-white rounded-2xl shadow-xl overflow-hidden">
      {/* Header */}
      <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100 bg-gray-50/50">
        <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
          <CheckCircle className="w-6 h-6 text-green-600" />
          Update Completion Percentage
        </h3>
        <button
          onClick={onClose}
          className="px-6 py-1.5 bg-red-50 text-black border-2 border-red-700/80 rounded-lg hover:bg-red-100 transition-all font-bold text-sm uppercase tracking-tight shadow-sm"
        >
          Close
        </button>
      </div>

      {/* Form Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <Input
            label="Completion Percentage (%)"
            type="number"
            min={0}
            max={100}
            {...register("percentage", {
              min: { value: 0, message: "Minimum 0%" },
              max: { value: 100, message: "Maximum 100%" },
            })}
            error={errors.percentage?.message}
          />

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-6 mt-4 border-t border-gray-100">
            <Button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-1.5 bg-green-50 text-black border-2 border-green-700/80 rounded-none hover:bg-green-100 transition-all font-bold text-sm uppercase tracking-tight shadow-sm inline-flex items-center justify-center cursor-pointer"
            >
              {isSubmitting ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UpdateCompletionPer;
