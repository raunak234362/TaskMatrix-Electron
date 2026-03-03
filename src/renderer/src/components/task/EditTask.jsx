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
    formState: { errors, dirtyFields },
  } = useForm();

  /* ---------------- FETCH TASK ---------------- */
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
            hours: task.duration?.includes(":")
              ? task.duration.split(":")[0]
              : "",
            minutes: task.duration?.includes(":")
              ? task.duration.split(":")[1]
              : "",
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

    if (id) fetchTask();
  }, [id, reset]);

  /* ---------------- SUBMIT ---------------- */
  const onSubmit = async (data) => {
    try {
      setIsSubmitting(true);

      const payload = {};

      // Add only modified fields
      Object.keys(dirtyFields).forEach((key) => {
        payload[key] = data[key];
      });

      // Handle duration ONLY if hours or minutes were edited
      if (dirtyFields.hours || dirtyFields.minutes) {
        const hh = parseInt(data.hours) || 0;
        const mm = parseInt(data.minutes) || 0;

        payload.duration = `${String(hh).padStart(2, "0")}:${String(mm).padStart(
          2,
          "0"
        )}`;
        payload.hours = hh * 60 + mm;
      }

      // Ensure priority is numeric
      if (dirtyFields.priority) {
        payload.priority = Number(data.priority);
      }

      // If no changes → do nothing
      if (Object.keys(payload).length === 0) {
        toast.info("No changes to update");
        setIsSubmitting(false);
        return;
      }

      await Service.UpdateTaskById(id.toString(), payload);

      toast.success("Task updated successfully!");
      refresh?.();
      onClose();
    } catch (error) {
      console.error(error);
      toast.error("Failed to update task");
    } finally {
      setIsSubmitting(false);
    }
  };

  /* ---------------- OPTIONS ---------------- */
  const employeeOptions = employees.map((e) => ({
    label: `${e.firstName} ${e.lastName}`,
    value: e.id,
  }));

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

  /* ---------------- UI ---------------- */
  return (
    <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden max-w-4xl mx-auto animate-in fade-in zoom-in duration-200">
      <div className="bg-white px-8 py-4 border-b border-gray-200 flex justify-between items-center">
        <h2 className="text-xl font-black text-black tracking-tight uppercase flex items-center gap-2">
          <FileText className="w-5 h-5 text-[#6bbd45]" /> Edit Task
        </h2>
        <button
          onClick={onClose}
          className="px-4 py-2 bg-red-50 border border-red-600 text-black font-black text-[10px] uppercase tracking-widest rounded-lg hover:bg-red-100 transition-all"
        >
          Close
        </button>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="p-8 space-y-8">
        {/* Task Details */}
        <section className="space-y-6">
          <SectionTitle title="Task Details" />
          <div>
            <label className="text-sm font-medium text-slate-700">Task Name</label>
            <Input {...register("name")} />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700">Description</label>
            <Controller
              name="description"
              control={control}
              render={({ field }) => (
                <RichTextEditor
                  value={field.value || ""}
                  onChange={field.onChange}
                />
              )}
            />
          </div>
        </section>

        {/* Assignment & Stage */}
        <section className="space-y-6">
          <SectionTitle title="Assignment & Stage" />
          <div>
            <label className="text-sm font-medium text-slate-700">Stage</label>
            <Controller
              name="Stage"
              control={control}
              render={({ field }) => (
                <Select
                  options={stageOptions}
                  value={field.value}
                  onChange={(_, v) => field.onChange(v)}
                />
              )}
            />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700">Assignee</label>
            <Controller
              name="user_id"
              control={control}
              render={({ field }) => (
                <Select
                  options={employeeOptions}
                  value={field.value}
                  onChange={(_, v) => field.onChange(v)}
                />
              )}
            />
          </div>
        </section>

        {/* Schedule & Priority */}
        <section className=" ">
          <SectionTitle title="Schedule & Priority" />
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-2 py-2">
              <Input type="datetime-local" label="Start Date" {...register("start_date")} />
              <Input type="datetime-local" label="Due Date" {...register("due_date")} />
            </div>
            <label className="text-sm font-medium text-slate-700">Duration</label>
            <div className="grid grid-cols-2 gap-2 py-2">
              <Input type="number" placeholder="HH" {...register("hours")} />
              <Input type="number" placeholder="MM" {...register("minutes")} />
            </div>
            <div className="">
              <label className="text-sm font-medium text-slate-700">Priority</label>
              <Controller
                name="priority"
                control={control}
                render={({ field }) => (
                  <Select
                    options={[
                      { label: "Low", value: 1 },
                      { label: "Medium", value: 2 },
                      { label: "High", value: 3 },
                      { label: "Critical", value: 4 },
                    ]}
                    value={String(field.value)}
                    onChange={(_, v) => field.onChange(Number(v))}
                  />
                )}
              />
            </div>
          </div>
        </section>

        {/* Footer */}
        <div className="flex justify-end gap-4 pt-6 border-t border-gray-200">
          <button
            type="button"
            onClick={onClose}
            className="px-8 py-3 bg-gray-50 border border-gray-300 hover:bg-gray-100 text-black rounded-lg text-[10px] font-black uppercase tracking-[0.2em] transition-all"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-8 py-3 bg-[#6bbd45]/15 hover:bg-[#6bbd45]/30 text-black border border-black rounded-lg text-[10px] font-black uppercase tracking-[0.2em] shadow-sm transition-all flex items-center gap-3 active:scale-95 disabled:opacity-50"
          >
            {isSubmitting ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </form>
    </div >
  );
};

export default EditTask;
