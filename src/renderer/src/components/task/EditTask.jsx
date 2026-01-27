/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { toast } from "react-toastify";
import { useSelector } from "react-redux";
import {
  FileText,
  AlertCircle,
  User,
  Layers,
  Save,
  X,
  Flag,
} from "lucide-react";
import Service from "../../api/Service";
import Input from "../fields/input";
import Button from "../fields/Button";
import Select from "../fields/Select";
import SectionTitle from "../ui/SectionTitle";
import RichTextEditor from "../fields/RichTextEditor";





const EditTask = ({ id, onClose, refresh }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  const employees = useSelector(
    (state) => state.userInfo?.staffData || []
  );

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm();

  useEffect(() => {
    const fetchTask = async () => {
      try {
        setLoading(true);
        const response = await Service.GetTaskById(id.toString());
        if (response?.data) {
          const task = response.data;
          reset({
            name: task.name || "",
            description: task.description || "",
            priority: task.priority || 2,
            start_date: task.start_date
              ? new Date(task.start_date).toISOString().slice(0, 16)
              : "",
            due_date: task.due_date
              ? new Date(task.due_date).toISOString().slice(0, 16)
              : "",
            duration: task.duration || "",
            status: task.status || "ASSIGNED",
            Stage: task.Stage || "IFA",
            user_id: task.user_id || task.user?.id || "",
          });
        }
      } catch (error) {
        console.error("Error fetching task:", error);
        toast.error("Failed to load task details");
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchTask();
    }
  }, [id, reset]);

  const onSubmit = async (data) => {
    try {
      setIsSubmitting(true);
      const payload = {
        ...data,
        priority: data.priority,
      };
      await Service.UpdateTaskById(id.toString(), payload);
      toast.success("Task updated successfully!");
      if (refresh) refresh();
      onClose();
    } catch (error) {
      toast.error("Failed to update task");
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const employeeOptions = employees.map((e) => ({
    label: `${e.firstName} ${e.lastName}`,
    value: e.id,
  }));

  const statusOptions = [
    { label: "Assigned", value: "ASSIGNED" },
    { label: "In Progress", value: "IN_PROGRESS" },
    { label: "On Break", value: "BREAK" },
    { label: "Completed", value: "COMPLETED" },
    { label: "Pending", value: "PENDING" },
    { label: "Rework", value: "REWORK" },
  ];

  const stageOptions = [
    { label: "IFA", value: "IFA" },
    { label: "IFC", value: "IFC" },
    { label: "RE-IFA", value: "RE-IFA" },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center p-10">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden max-w-4xl mx-auto">
      <div className="bg-slate-50 px-8 py-4 border-b border-slate-200 flex justify-between items-center">
        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
          <FileText className="w-5 h-5 text-indigo-500" /> Edit Task
        </h2>
        <button
          onClick={onClose}
          className="p-2 hover:bg-slate-200 rounded-full transition-colors"
        >
          <X className="w-5 h-5 text-slate-500" />
        </button>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="p-8 space-y-8">
        {/* Task Basic Info */}
        <section className="space-y-6">
          <SectionTitle title="Task Details" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2 space-y-1">
              <Input
                label="Task Name *"
                placeholder="e.g., Prepare GA Drawings"
                {...register("name", { required: "Name is required" })}
              />
              {errors.name && (
                <p className="text-xs text-red-500">{errors.name.message}</p>
              )}
            </div>

            <div className="md:col-span-2">
              <label className="text-sm font-semibold text-slate-700 mb-2 block">
                Description
              </label>
              <Controller
                name="description"
                control={control}
                render={({ field }) => (
                  <RichTextEditor
                    value={field.value || ""}
                    onChange={field.onChange}
                    placeholder="Provide detailed instructions..."
                  />
                )}
              />
            </div>
          </div>
        </section>

        {/* Status & Assignment */}
        <section className="space-y-6">
          <SectionTitle title="Status & Assignment" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-500" /> Status
              </label>
              <Controller
                name="status"
                control={control}
                render={({ field }) => (
                  <Select
                    name="status"
                    options={statusOptions}
                    value={field.value}
                    onChange={(_, val) => field.onChange(val)}
                    placeholder="Select Status"
                  />
                )}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                <Layers className="w-4 h-4 text-blue-500" /> Stage
              </label>
              <Controller
                name="Stage"
                control={control}
                render={({ field }) => (
                  <Select
                    name="Stage"
                    options={stageOptions}
                    value={field.value}
                    onChange={(_, val) => field.onChange(val)}
                    placeholder="Select Stage"
                  />
                )}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                <User className="w-4 h-4 text-emerald-500" /> Assigned To
              </label>
              <Controller
                name="user_id"
                control={control}
                render={({ field }) => (
                  <Select
                    name="user_id"
                    options={employeeOptions}
                    value={field.value}
                    onChange={(_, val) => field.onChange(val)}
                    placeholder="Select Employee"
                  />
                )}
              />
            </div>
          </div>
        </section>

        {/* Schedule & Priority */}
        <section className="space-y-6">
          <SectionTitle title="Schedule & Priority" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1">
              <Input
                label="Start Date *"
                type="datetime-local"
                {...register("start_date", {
                  required: "Start date is required",
                })}
              />
              {errors.start_date && (
                <p className="text-xs text-red-500">
                  {errors.start_date.message}
                </p>
              )}
            </div>
            <div className="space-y-1">
              <Input
                label="Due Date *"
                type="datetime-local"
                {...register("due_date", { required: "Due date is required" })}
              />
              {errors.due_date && (
                <p className="text-xs text-red-500">
                  {errors.due_date.message}
                </p>
              )}
            </div>
            <Input
              label="Duration (e.g., 2w, 3d)"
              placeholder="2w"
              {...register("duration")}
            />
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                <Flag className="w-4 h-4 text-indigo-500" /> Priority
              </label>
              <Controller
                name="priority"
                control={control}
                render={({ field }) => (
                  <Select
                    name="priority"
                    options={[
                      { label: "Low", value: 1 },
                      { label: "Medium", value: 2 },
                      { label: "High", value: 3 },
                      { label: "Critical", value: 4 },
                    ]}
                    value={String(field.value)}
                    onChange={(_, val) => field.onChange(Number(val))}
                    placeholder="Select Priority"
                  />
                )}
              />
            </div>
          </div>
        </section>

        {/* Footer */}
        <div className="flex justify-end gap-4 pt-6 border-t border-slate-100">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            className="px-6 py-2"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting}
            className="px-10 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-lg shadow-indigo-200 transition-all active:scale-95 disabled:opacity-50 flex items-center gap-2"
          >
            {isSubmitting ? (
              "Saving..."
            ) : (
              <>
                <Save className="w-4 h-4" /> Save Changes
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default EditTask;
