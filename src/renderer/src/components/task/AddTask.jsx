/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState } from "react";
import { useForm, Controller, useFieldArray } from "react-hook-form";
import { toast } from "react-toastify";
import { useDispatch, useSelector } from "react-redux";
import {
  Plus,
  Trash2,
  Clock,
  Layers,
  AlertCircle,
  CheckCircle2,
  Briefcase,
  Flag,
} from "lucide-react";
import Service from "../../api/Service";
import Input from "../fields/input";
import Button from "../fields/Button";
import Select from "../fields/Select";
import SectionTitle from "../ui/SectionTitle";
import RichTextEditor from "../fields/RichTextEditor";

import { setProjectData, updateProject } from "../../store/projectSlice";
import { setMilestonesForProject } from "../../store/milestoneSlice";



const AddTask = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedWbs, setSelectedWbs] = useState(null);
  const [allTasks, setAllTasks] = useState([]);
  const [existingWbsHours, setExistingWbsHours] = useState(0);
  const [bundles, setBundles] = useState([]);

  const dispatch = useDispatch();
  const projects = useSelector(
    (state) => state.projectInfo?.projectData || [],
  );
  const milestonesByProject = useSelector(
    (state) => state.milestoneInfo?.milestonesByProject || {},
  );

  useEffect(() => {
    if (projects.length === 0) {
      Service.GetAllProjects().then((res) => {
        dispatch(setProjectData(res.data));
      });
    }
  }, [dispatch, projects.length]);

  const employees = useSelector(
    (state) => state.userInfo?.staffData || [],
  );

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors },
  } = useForm({
    defaultValues: {
      priority: 2,
      Stage: "IFA",
      assignments: [{ employeeId: "", duration: "" }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "assignments",
  });

  const selectedProjectId = watch("project_id");
  const selectedMilestoneId = watch("mileStone_id");
  const selectedWbsType = watch("wbsType");
  const selectedStage = watch("Stage");
  const selectedWbsId = watch("project_bundle_id");

  const milestones = selectedProjectId
    ? milestonesByProject[selectedProjectId] || []
    : [];
  const selectedProject = projects.find((p) => p.id === selectedProjectId);

  // Fetch Project Details and Milestones when project changes
  useEffect(() => {
    if (selectedProjectId) {
      // Reset selections when project changes
      setValue("mileStone_id", "");
      setValue("wbsType", "");
      setValue("project_bundle_id", "");
      setSelectedWbs(null);

      // Fetch full project details if projectWbs is missing
      if (!selectedProject?.projectWbs) {
        Service.GetProjectById(selectedProjectId).then((res) => {
          if (res?.data) {
            dispatch(updateProject(res.data));
          }
        });
      }

      // Fetch WBS bundles
      Service.GetBundleByProjectId(selectedProjectId).then((res) => {
        setBundles(res?.data || []);
      });

      if (!milestonesByProject[selectedProjectId]) {
        Service.GetProjectMilestoneById(selectedProjectId).then((res) => {
          dispatch(
            setMilestonesForProject({
              projectId: selectedProjectId,
              milestones: res?.data || [],
            }),
          );
        });
      }
    } else {
      setValue("mileStone_id", "");
      setValue("wbsType", "");
      setValue("project_bundle_id", "");
      setValue("departmentId", "");
      setSelectedWbs(null);
    }
  }, [
    selectedProjectId,
    milestonesByProject,
    selectedProject?.projectWbs,
    dispatch,
    setValue,
  ]);

  // Auto-populate department from project team
  useEffect(() => {
    const deptId =
      (selectedProject)?.team?.departmentID ||
      selectedProject?.department?.id;
    if (deptId) {
      setValue("departmentId", deptId);
    }
  }, [selectedProject, setValue]);

  // After milestone selection, reset WBS selections
  useEffect(() => {
    if (selectedProjectId && selectedMilestoneId) {
      // Reset WBS selections when milestone changes
      setValue("wbsType", "");
      setValue("project_bundle_id", "");
      setSelectedWbs(null);
    }
  }, [selectedMilestoneId, setValue]);

  // Update selected WBS data
  useEffect(() => {
    if (selectedWbsId) {
      const wbs = bundles.find((w) => {
        const bundleId = w.id || w._id || (w.wbs && w.wbs[0]?.id);
        return String(bundleId) === String(selectedWbsId);
      });
      setSelectedWbs(wbs || null);
    } else {
      setSelectedWbs(null);
    }
  }, [selectedWbsId, bundles]);

  // Fetch all tasks to calculate remaining hours
  useEffect(() => {
    const fetchAllTasks = async () => {
      try {
        const res = await Service.GetAllTask();
        const taskData = Array.isArray(res?.data)
          ? res.data
          : res?.data?.data || [];
        setAllTasks(taskData);
      } catch (error) {
        console.error("Error fetching all tasks:", error);
      }
    };
    fetchAllTasks();
  }, []);

  // Calculate existing hours for the selected WBS and Type
  useEffect(() => {
    if (selectedWbsId && allTasks.length > 0) {
      const filtered = allTasks.filter((t) => {
        const taskId = t.project_bundle_id || t.wbs_id;
        const typeMatch =
          !selectedWbsType ||
          String(t.wbsType).toLowerCase() ===
          String(selectedWbsType).toLowerCase();
        return String(taskId) === String(selectedWbsId) && typeMatch;
      });
      const total = filtered.reduce(
        (sum, t) => sum + Number(t.hours || 0),
        0,
      );
      setExistingWbsHours(total);
    } else {
      setExistingWbsHours(0);
    }
  }, [selectedWbsId, allTasks, selectedWbsType]);

  const filteredWbsItems = bundles.filter((w) => {
    const category = (w.bundle?.category || w.type || "").toLowerCase();
    const isCheckingType = selectedWbsType?.toLowerCase().includes("checking");
    const baseType = selectedWbsType
      ?.toLowerCase()
      .replace("_checking", "")
      .replace(" checking", "");

    const typeOk =
      !selectedWbsType ||
      (isCheckingType
        ? (w.totalCheckHr || 0) > 0 && category === baseType
        : category === selectedWbsType.toLowerCase());
    const stageOk =
      !selectedStage ||
      (w.stage && w.stage.toLowerCase() === selectedStage.toLowerCase());
    return typeOk && stageOk;
  });

  const assignments = watch("assignments") || [];

  const totalAssignedHours = assignments.reduce((sum, a) => {
    // Try to parse duration as hours if it's a number string
    const h = parseFloat(a.duration);
    return sum + (isNaN(h) ? 0 : h);
  }, 0);
  const totalWbsHours = selectedWbs
    ? selectedWbsType?.toLowerCase().includes("checking")
      ? selectedWbs.totalCheckHr || 0
      : selectedWbs.totalExecHr || 0
    : 0;
  const availableHours = Math.max(0, totalWbsHours - existingWbsHours);
  const remainingHours = Math.max(0, availableHours - totalAssignedHours);

  const onSubmit = async (data) => {
    console.log("Form Data Submitted:", data);

    const isOverLimit = existingWbsHours + totalAssignedHours > totalWbsHours;

    try {
      setIsSubmitting(true);

      // Create a task for each assignment
      const promises = data.assignments.map((assignment) => {
        const isDuplicateUser = allTasks.some(
          (t) =>
            String(t.project_bundle_id || t.wbs_id) ===
            String(data.project_bundle_id) &&
            String(t.user_id) === String(assignment.employeeId),
        );

        const isRework = isOverLimit || isDuplicateUser;

        const payload = {
          name: data.name,
          description: data.description,
          status: isRework ? "REWORK" : "ASSIGNED",
          isRework: isRework,
          priority: data.priority,
          due_date: data.due_date,
          duration: assignment.duration,
          hours: parseFloat(assignment.duration) || 0,
          project_id: data.project_id,
          user_id: assignment.employeeId,
          mileStone_id: data.mileStone_id,
          start_date: data.start_date,
          Stage: data.Stage,
          departmentId: data.departmentId,
          project_bundle_id: data.project_bundle_id,
          wbsType: selectedWbsType,
        };
        return Service.AddTask(payload);
      });

      await Promise.all(promises);
      toast.success("Tasks assigned successfully!");
    } catch (error) {
      toast.error("Failed to assign tasks");
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const projectOptions = projects.map((p) => ({
    label: p.name,
    value: p.id,
  }));

  const milestoneOptions = milestones.map((m) => ({
    label: m.subject || m.name || "Unnamed Milestone",
    value: m.id,
  }));

  const wbsTypeOptions = [
    { label: "Modeling", value: "modeling" },
    { label: "Model Checking", value: "modeling_checking" },
    { label: "Detailing", value: "detailing" },
    { label: "Detail Checking", value: "detailing_checking" },
    { label: "Erection", value: "erection" },
    { label: "Erection Checking", value: "erection_checking" },
  ];

  const wbsOptions = filteredWbsItems.map((w) => {
    const total = selectedWbsType?.toLowerCase().includes("checking")
      ? w.totalCheckHr || 0
      : w.totalExecHr || 0;

    // Calculate existing hours for this specific bundle and type
    const filtered = allTasks.filter((t) => {
      const taskId = t.project_bundle_id || t.wbs_id;
      const typeMatch =
        !selectedWbsType || []
      String(t.wbsType).toLowerCase() ===
        String(selectedWbsType).toLowerCase();
      return (
        String(taskId) === String(w.id || w._id || (w.wbs && w.wbs[0]?.id)) &&
        typeMatch
      );
    });
    const existing = filtered.reduce(
      (sum, t) => sum + Number(t.hours || 0),
      0,
    );
    const remaining = Math.max(0, total - existing);

    return {
      label: `${w.name || w.bundle?.name || "Unnamed Bundle"
        } (${remaining}h remaining)`,
      value: w.id || w._id || (w.wbs && w.wbs[0]?.id),
    };
  });

  const employeeOptions = employees.map((e) => ({
    label: `${e.firstName} ${e.lastName}`,
    value: e.id,
  }));

  return (
    <div className="min-h-screen bg-slate-50/50">
      <div className="w-full mx-auto">
        <div className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden">
          <form
            onSubmit={handleSubmit(onSubmit, (errors) => {
              console.log("Form Validation Errors:", errors);
              toast.error(
                "Please fix the errors in the form before submitting.",
              );
            })}
            className="p-8 space-y-10"
          >
            {/* Project & Milestone Section */}
            <section className="space-y-6">
              <SectionTitle title="Project Context" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                    <Briefcase className="w-4 h-4 text-indigo-500" /> Project *
                  </label>
                  <Controller
                    name="project_id"
                    control={control}
                    rules={{ required: "Project is required" }}
                    render={({ field }) => (
                      <Select
                        name="project_id"
                        options={projectOptions}
                        value={field.value}
                        onChange={(_, val) => field.onChange(val)}
                        placeholder="Select Project"
                      />
                    )}
                  />
                  {errors.project_id && (
                    <p className="text-xs text-red-500">
                      {errors.project_id.message}
                    </p>
                  )}
                </div>

                {selectedProjectId && (
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                      <Flag className="w-4 h-4 text-indigo-500" /> Milestone *
                    </label>
                    <Controller
                      name="mileStone_id"
                      control={control}
                      rules={{ required: "Milestone is required" }}
                      render={({ field }) => (
                        <Select
                          name="mileStone_id"
                          options={milestoneOptions}
                          value={field.value}
                          onChange={(_, val) => field.onChange(val)}
                          placeholder="Select Milestone"
                        />
                      )}
                    />
                    {errors.mileStone_id && (
                      <p className="text-xs text-red-500">
                        {errors.mileStone_id.message}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </section>

            {selectedProjectId && selectedMilestoneId && (
              <>
                {/* WBS Section */}
                <section className="space-y-6">
                  <SectionTitle title="Work Breakdown Structure" />
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                        <Layers className="w-4 h-4 text-blue-500" /> WBS Type
                      </label>
                      <Controller
                        name="wbsType"
                        control={control}
                        render={({ field }) => (
                          <Select
                            name="wbsType"
                            options={wbsTypeOptions}
                            value={field.value}
                            onChange={(_, val) => {
                              field.onChange(val);
                              setValue("project_bundle_id", "");
                            }}
                            placeholder="Select Type"
                          />
                        )}
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                        <Layers className="w-4 h-4 text-blue-500" /> WBS Item *
                      </label>
                      <Controller
                        name="project_bundle_id"
                        control={control}
                        rules={{ required: "WBS Item is required" }}
                        render={({ field }) => (
                          <Select
                            name="project_bundle_id"
                            options={wbsOptions}
                            value={field.value}
                            onChange={(_, val) => field.onChange(val)}
                            placeholder="Select WBS Item"
                          />
                        )}
                      />
                      {errors.project_bundle_id && (
                        <p className="text-xs text-red-500">
                          {errors.project_bundle_id.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                        <Layers className="w-4 h-4 text-blue-500" /> Stage *
                      </label>
                      <Controller
                        name="Stage"
                        control={control}
                        render={({ field }) => (
                          <Select
                            name="Stage"
                            options={[
                              { label: "IFA", value: "IFA" },
                              { label: "IFC", value: "IFC" },
                              { label: "RE-IFA", value: "RE-IFA" },
                            ]}
                            value={field.value}
                            onChange={(_, val) => {
                              field.onChange(val);
                              // Reset WBS selection when stage changes
                              setValue("project_bundle_id", "");
                              setSelectedWbs(null);
                            }}
                            placeholder="Select Stage"
                          />
                        )}
                      />
                    </div>
                  </div>

                  {/* WBS Timing Display */}
                  {selectedWbs && (
                    <div className="bg-blue-50 border border-blue-100 rounded-2xl p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-blue-100 rounded-xl">
                          <Clock className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-blue-600 uppercase tracking-wider">
                            Execution Hours
                          </p>
                          <p className="text-xl font-black text-slate-900">
                            {selectedWbs.totalExecHr || 0}h
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-indigo-100 rounded-xl">
                          <Clock className="w-6 h-6 text-indigo-600" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-indigo-600 uppercase tracking-wider">
                            Checking Hours
                          </p>
                          <p className="text-xl font-black text-slate-900">
                            {selectedWbs.totalCheckHr || 0}h
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-emerald-100 rounded-xl">
                          <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-emerald-600 uppercase tracking-wider">
                            Total Bundle Hours
                          </p>
                          <p className="text-xl font-black text-slate-900">
                            {totalWbsHours}h
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-emerald-100 rounded-xl">
                          <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-emerald-600 uppercase tracking-wider">
                            Remaining Hours
                          </p>
                          <p className="text-xl font-black text-slate-900">
                            {remainingHours}h
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </section>

                {/* Task Details */}
                <section className="space-y-6">
                  <SectionTitle title="Task Information" />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-1">
                      <Input
                        label="Task Name *"
                        placeholder="e.g., Prepare GA Drawings"
                        {...register("name", { required: "Name is required" })}
                      />
                      {errors.name && (
                        <p className="text-xs text-red-500">
                          {errors.name.message}
                        </p>
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
                    <div className="space-y-1">
                      <Input
                        label="Start Date *"
                        type="date"
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
                        type="date"
                        {...register("due_date", {
                          required: "Due date is required",
                        })}
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

                {/* Employee Assignment Section */}
                <section className="space-y-6">
                  <div className="flex items-center justify-between">
                    <SectionTitle title="Team Assignment" />
                    <div className="flex items-center gap-2 px-4 py-2 bg-slate-100 rounded-xl">
                      <span className="text-sm font-medium text-slate-600">
                        Assigned:
                      </span>
                      <span
                        className={`text-sm font-bold ${totalAssignedHours > remainingHours
                            ? "text-red-600"
                            : "text-indigo-600"
                          }`}
                      >
                        {totalAssignedHours}h / {availableHours}h
                      </span>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {fields.map((field, index) => (
                      <div
                        key={field.id}
                        className="flex items-end gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100"
                      >
                        <div className="flex-1 space-y-2">
                          <label className="text-xs font-bold text-slate-500 uppercase">
                            Employee
                          </label>
                          <Controller
                            name={`assignments.${index}.employeeId`}
                            control={control}
                            rules={{ required: "Employee is required" }}
                            render={({ field }) => (
                              <div className="space-y-1">
                                <Select
                                  name={field.name}
                                  options={employeeOptions}
                                  value={field.value}
                                  onChange={(_, val) => field.onChange(val)}
                                  placeholder="Select Employee"
                                />
                                {(() => {
                                  const isDuplicate = allTasks.some(
                                    (t) =>
                                      String(
                                        t.project_bundle_id || t.wbs_id,
                                      ) === String(selectedWbsId) &&
                                      String(t.user_id) === String(field.value),
                                  );
                                  const isOverLimit =
                                    existingWbsHours + totalAssignedHours >
                                    totalWbsHours;
                                  if (isDuplicate || isOverLimit) {
                                    return (
                                      <div className="flex items-center gap-1 text-[10px] font-bold text-amber-600 uppercase">
                                        <AlertCircle className="w-3 h-3" />
                                        Will be marked
                                        {isDuplicate && " (Duplicate User)"}
                                        {isOverLimit && " (Hours Exceeded)"}
                                      </div>
                                    );
                                  }
                                  return null;
                                })()}
                                {errors.assignments?.[index]?.employeeId && (
                                  <p className="text-xs text-red-500">
                                    {
                                      errors.assignments[index]?.employeeId
                                        ?.message
                                    }
                                  </p>
                                )}
                              </div>
                            )}
                          />
                        </div>
                        <div className="w-32 space-y-2">
                          <label className="text-xs font-bold text-slate-500 uppercase">
                            Duration
                          </label>
                          <div className="space-y-1">
                            <Input
                              placeholder="e.g. 4h"
                              {...register(
                                `assignments.${index}.duration`,
                                {
                                  required: "Duration is required",
                                },
                              )}
                            />
                            {errors.assignments?.[index]?.duration && (
                              <p className="text-xs text-red-500">
                                {errors.assignments[index]?.duration?.message}
                              </p>
                            )}
                          </div>
                        </div>
                        {fields.length > 1 && (
                          <button
                            type="button"
                            onClick={() => remove(index)}
                            className="p-2.5 text-red-500 hover:bg-red-50 rounded-md transition-colors"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        )}
                      </div>
                    ))}

                    <button
                      type="button"
                      onClick={() => append({ employeeId: "", duration: "" })}
                      className="w-full py-4 border-2 border-dashed border-slate-200 rounded-md text-slate-500 font-medium hover:border-indigo-300 hover:text-indigo-600 hover:bg-indigo-50 transition-all flex items-center justify-center gap-2"
                    >
                      <Plus className="w-5 h-5" />
                      Add Another Employee
                    </button>
                  </div>

                  {totalAssignedHours > availableHours &&
                    availableHours > 0 && (
                      <div className="flex items-center gap-2 text-red-600 bg-red-50 p-4 rounded-xl border border-red-100">
                        <AlertCircle className="w-5 h-5" />
                        <p className="text-sm font-medium">
                          Total assigned hours exceed the available WBS hours!
                        </p>
                      </div>
                    )}
                </section>

                {/* Footer */}
                <div className="flex justify-center w-full pt-6 border-t border-slate-100">
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-lg shadow-indigo-200 transition-all active:scale-95 disabled:opacity-50"
                  >
                    {isSubmitting ? "Assigning..." : "Confirm & Assign Tasks"}
                  </Button>
                </div>
              </>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddTask;
