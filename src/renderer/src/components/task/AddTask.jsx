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

const formatMinutesToHHMM = (minutes) => {
  if (isNaN(minutes) || minutes === null) return "00:00";
  const isNegative = minutes < 0;
  const absMinutes = Math.abs(Math.round(minutes));
  const h = Math.floor(absMinutes / 60);
  const m = absMinutes % 60;
  return `${isNegative ? "-" : ""}${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
};

const parseHHMMToMinutes = (hhmm) => {
  if (!hhmm || typeof hhmm !== "string") return 0;
  const parts = hhmm.split(":");
  if (parts.length !== 2) return 0;
  const h = parseInt(parts[0], 10) || 0;
  const m = parseInt(parts[1], 10) || 0;
  return h * 60 + m;
};

const AddTask = () => {
  const [taskCategory, setTaskCategory] = useState("MILESTONE");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedWbs, setSelectedWbs] = useState(null);
  const [projectTasks, setProjectTasks] = useState([]);
  const [isLoadingTasks, setIsLoadingTasks] = useState(false);
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
      assignments: [{ employeeId: "", hours: "", minutes: "" }],
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

  // Fetch tasks for the selected project to calculate remaining hours
  useEffect(() => {
    const fetchProjectTasks = async () => {
      if (!selectedProjectId) {
        setProjectTasks([]);
        return;
      }
      try {
        setIsLoadingTasks(true);
        const res = await Service.GetTasksByProjectId(selectedProjectId);
        const taskData = Array.isArray(res?.data)
          ? res.data
          : res?.data?.data || [];
        setProjectTasks(taskData);
      } catch (error) {
        console.error("Error fetching project tasks:", error);
        // Fallback to empty if project-specific call fails
        setProjectTasks([]);
      } finally {
        setIsLoadingTasks(false);
      }
    };
    fetchProjectTasks();
  }, [selectedProjectId]);

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

  // Update selected WBS data and fetch details from API
  useEffect(() => {
    const fetchWbsDetail = async () => {
      if (selectedWbsId) {
        // Find locally first for immediate feedback - search inside bundles' wbs arrays
        let localWbs = null;
        for (const b of bundles) {
          if (b.wbs && Array.isArray(b.wbs)) {
            const found = b.wbs.find((w) => String(w.id) === String(selectedWbsId));
            if (found) {
              localWbs = found;
              break;
            }
          }
        }

        // If not found in wbs, check if it's a top-level bundle ID (fallback)
        if (!localWbs) {
          localWbs = bundles.find((w) => {
            const bundleId = w.id || w._id || (w.wbs && w.wbs[0]?.id);
            return String(bundleId) === String(selectedWbsId);
          });
        }

        setSelectedWbs(localWbs || null);

        try {
          // Fetch full/updated info from API
          const res = await Service.GetWBSById(selectedWbsId);
          if (res?.data) {
            setSelectedWbs(res.data);
          }
        } catch (error) {
          console.error("Error fetching WBS details:", error);
        }
      } else {
        setSelectedWbs(null);
      }
    };
    fetchWbsDetail();
  }, [selectedWbsId, bundles]);



  // Calculate existing hours for the selected WBS item and Type
  useEffect(() => {
    if (selectedWbsId && selectedWbsType) {
      const isChecking = selectedWbsType.toLowerCase().includes("checking");

      // Check projectTasks first as it covers all tasks
      if (projectTasks.length > 0) {
        const filtered = projectTasks.filter((t) => {
          const taskId = t.project_bundle_id || t.wbs_id;
          const typeMatch =
            String(t.wbsType).toLowerCase() ===
            String(selectedWbsType).toLowerCase();
          return String(taskId) === String(selectedWbsId) && typeMatch;
        });
        const totalMinutes = filtered.reduce((sum, t) => {
          if (t.allocationLog?.allocatedHours) {
            return sum + parseHHMMToMinutes(t.allocationLog.allocatedHours);
          }
          return sum + Number(t.hours || 0);
        }, 0);
        setExistingWbsHours(totalMinutes / 60);
      } else if (selectedWbs?.tasks && selectedWbs.tasks.length > 0) {
        // Use tasks from the object if projectTasks isn't loaded/available
        const filtered = selectedWbs.tasks.filter((t) => {
          const taskWbsType = (t.wbsType || "").toLowerCase();
          if (isChecking) {
            return taskWbsType === selectedWbsType.toLowerCase();
          } else {
            return (
              taskWbsType === selectedWbsType.toLowerCase() ||
              taskWbsType === ""
            );
          }
        });
        const totalMin = filtered.reduce((sum, t) => {
          if (t.allocationLog?.allocatedHours) {
            return sum + parseHHMMToMinutes(t.allocationLog.allocatedHours);
          }
          const hrs = parseFloat(t.hours) || 0;
          return sum + (hrs * 60);
        }, 0);
        setExistingWbsHours(totalMin / 60);
      } else {
        setExistingWbsHours(0);
      }
    } else {
      setExistingWbsHours(0);
    }
  }, [selectedWbsId, selectedWbs, projectTasks, selectedWbsType]);

  const filteredWbsItems = bundles.filter((w) => {
    const category = (w.bundle?.category || w.type || "").toLowerCase();
    const isCheckingType = selectedWbsType?.toLowerCase().includes("checking");
    const baseType = selectedWbsType
      ?.toLowerCase()
      .replace("_checking", "")
      .replace(" checking", "");

    const typeOk =
      !selectedWbsType ||
      selectedWbsType === "others" ||
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
    const h = parseFloat(a.hours) || 0;
    const m = parseFloat(a.minutes) || 0;
    return sum + h + (m / 60);
  }, 0);

  const isOtherWbs = selectedWbsType === "others";

  const totalWbsHours = selectedWbs && !isOtherWbs
    ? (selectedWbsType?.toLowerCase().includes("checking")
      ? selectedWbs.totalCheckHr || 0
      : selectedWbs.totalExecHr || 0) / 60
    : 0;

  // For 'Other', we don't calculate limits
  const availableHours = isOtherWbs ? Infinity : (totalWbsHours - existingWbsHours);
  const remainingHours = isOtherWbs ? Infinity : (availableHours - totalAssignedHours);

  const onSubmit = async (data) => {
    console.log("Form Data Submitted:", data);

    const isOverLimit = !isOtherWbs && (existingWbsHours + totalAssignedHours > totalWbsHours);

    try {
      setIsSubmitting(true);

      // Create a task for each assignment
      const promises = data.assignments.map((assignment) => {
        const isDuplicateUser = projectTasks.some(
          (t) =>
            String(t.project_bundle_id || t.wbs_id) ===
            String(data.project_bundle_id) &&
            String(t.user_id) === String(assignment.employeeId),
        );

        const isRework = isOverLimit || isDuplicateUser;

        const h = parseInt(assignment.hours) || 0;
        const m = parseInt(assignment.minutes) || 0;
        const totalMinutes = h * 60 + m;
        const durationStr = `${String(h).padStart(2, "0")}:${String(m).padStart(
          2,
          "0",
        )}`;

        // Decide which IDs to send. 
        // If we have a selectedWbs and it has a projectBundleId, 
        // then the selectedWbs is an activity (WBS item) and its parent is the bundle.
        const bundleId = selectedWbs?.projectBundleId || data.project_bundle_id;
        const wbsId = data.project_bundle_id;

        const payload = {
          name: data.name,
          description: data.name,
          status: isRework ? "REWORK" : "ASSIGNED",
          isRework: isRework,
          priority: data.priority,
          due_date: data.due_date,
          duration: durationStr,
          hours: totalMinutes,
          project_id: data.project_id,
          user_id: assignment.employeeId,
          mileStone_id: data.mileStone_id,
          start_date: data.start_date,
          Stage: data.Stage,
          departmentId: data.departmentId,
          project_bundle_id: bundleId,
          wbs_id: wbsId,
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
    { label: "OTHERS", value: "others" },
  ];

  const wbsOptions = selectedWbsType === "others"
    ? (() => {
      const otherBundles = bundles.filter((w) => {
        const category = (w.bundle?.category || w.bundleKey || w.category || w.type || "").toLowerCase();
        return (category === "other" || category === "others");
      });

      const items = otherBundles.flatMap(bundle => (bundle.wbs || []).map(item => ({
        label: `${item.wbsTemplate?.name || item.name || "Unnamed Activity"}${bundle.stage && String(bundle.stage).toLowerCase() !== String(selectedStage).toLowerCase() ? ` (${bundle.stage})` : ""}`,
        value: item.id,
      })));

      if (items.length > 0) {
        return [
          ...items,
          { label: "New WBS Item", value: "New WBS Item" },
        ];
      }

      return [
        { label: "Job Study", value: "Job Study" },
        { label: "Submittal Preparations", value: "Submittal Preparations" },
        { label: "Meetings", value: "Meetings" },
        { label: "RFI Preparation", value: "RFI Preparation" },
        { label: "Training & Practice", value: "Training & Practice" },
        { label: "New WBS Item", value: "New WBS Item" },
      ];
    })()
    : filteredWbsItems.map((w) => {
      const isChecking = selectedWbsType?.toLowerCase().includes("checking");
      const bundleName = w.name || w.bundle?.name || "Unnamed Bundle";

      // Fallback if no nested wbs items
      const totalMinutes = isChecking ? w.totalCheckHr || 0 : w.totalExecHr || 0;
      let existingHours = 0;
      const filtered = projectTasks.filter((t) => {
        const taskId = t.project_bundle_id || t.wbs_id;
        const typeMatch =
          !selectedWbsType ||
          String(t.wbsType).toLowerCase() ===
          String(selectedWbsType).toLowerCase();
        return (
          String(taskId) === String(w.id || w._id || (w.wbs && w.wbs[0]?.id)) &&
          typeMatch
        );
      });
      const existingMinutes = filtered.reduce((sum, t) => {
        if (t.allocationLog?.allocatedHours) {
          return sum + parseHHMMToMinutes(t.allocationLog.allocatedHours);
        }
        return sum + Number(t.hours || 0);
      }, 0);

      const remainingMinutes = totalMinutes - existingMinutes;

      return {
        label: `${bundleName} (${formatMinutesToHHMM(remainingMinutes)} remaining)`,
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

                <div className="space-y-6 md:col-span-2">
                  <div className="flex flex-col space-y-3">
                    <label className="text-sm font-semibold text-slate-700">
                      Task Category *
                    </label>
                    <div className="flex gap-4 p-1 bg-slate-100 rounded-xl w-fit">
                      <button
                        type="button"
                        onClick={() => {
                          setTaskCategory("MILESTONE");
                        }}
                        className={`px-6 py-2 rounded-lg text-sm  transition-all ${taskCategory === "MILESTONE"
                          ? "bg-white text-indigo-600 shadow-sm"
                          : "text-slate-500 hover:text-slate-700"
                          }`}
                      >
                        Milestone Task
                      </button>
                      {/* <button
                        type="button"
                        onClick={() => {
                          setTaskCategory("GENERAL");
                          setValue("mileStone_id", ""); // Clear milestone if switching to general
                        }}
                        className={`px-6 py-2 rounded-lg text-sm  transition-all ${taskCategory === "GENERAL"
                          ? "bg-white text-indigo-600 shadow-sm"
                          : "text-slate-500 hover:text-slate-700"
                          }`}
                      >
                        General / Training Task
                      </button> */}
                    </div>
                  </div>
                </div>

                {selectedProjectId && taskCategory === "MILESTONE" && (
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

            {selectedProjectId && (taskCategory === "GENERAL" || selectedMilestoneId) && (
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
                        <Layers className="w-4 h-4 text-blue-500" />{" "}
                        {selectedWbsType === "others" ? "Activity Item" : "WBS Item"} *
                      </label>
                      <Controller
                        name="project_bundle_id"
                        control={control}
                        rules={{ required: "This field is required" }}
                        render={({ field }) => (
                          <Select
                            name="project_bundle_id"
                            options={wbsOptions}
                            value={field.value}
                            onChange={(_, val) => field.onChange(val)}
                            placeholder={
                              selectedWbsType === "others"
                                ? "Select Activity"
                                : "Select WBS Item"
                            }
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
                  {selectedWbs && !isOtherWbs && (
                    <div className="bg-blue-50 border border-blue-100 rounded-2xl p-6 grid grid-cols-1 md:grid-cols-4 gap-6">
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-blue-100 rounded-xl">
                          <Clock className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-xs  text-blue-600 uppercase tracking-wider">
                            Execution Hours
                          </p>
                          <p className="text-xl  text-slate-900">
                            {formatMinutesToHHMM(selectedWbs.totalExecHr || 0)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-indigo-100 rounded-xl">
                          <Clock className="w-6 h-6 text-indigo-600" />
                        </div>
                        <div>
                          <p className="text-xs  text-indigo-600 uppercase tracking-wider">
                            Checking Hours
                          </p>
                          <p className="text-xl  text-slate-900">
                            {formatMinutesToHHMM(selectedWbs.totalCheckHr || 0)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-emerald-100 rounded-xl">
                          <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                        </div>
                        <div>
                          <p className="text-xs  text-emerald-600 uppercase tracking-wider">
                            Total Bundle Hours
                          </p>
                          <p className="text-xl  text-slate-900">
                            {formatMinutesToHHMM(totalWbsHours * 60)}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-emerald-100 rounded-xl">
                          <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                        </div>
                        <div>
                          <p className="text-xs  text-emerald-600 uppercase tracking-wider">
                            Remaining Hours
                          </p>
                          <p className="text-xl  text-slate-900">
                            {formatMinutesToHHMM(remainingHours * 60)}
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
                        label="Task Description *"
                        placeholder="e.g., Prepare GA Drawings"
                        {...register("name", { required: "Name is required" })}
                      />
                      {errors.name && (
                        <p className="text-xs text-red-500">
                          {errors.name.message}
                        </p>
                      )}
                    </div>

                    {/* <div className="md:col-span-2">
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
                    </div> */}
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
                    {/* <Input
                      label="Duration (e.g., 2w, 3d)"
                      placeholder="2w"
                      {...register("duration")}
                    /> */}
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
                    {!isOtherWbs && (
                      <div className="flex items-center gap-2 px-4 py-2 bg-slate-100 rounded-xl">
                        <span className="text-sm font-medium text-slate-600">
                          Assigned:
                        </span>
                        <span
                          className={`text-sm  ${totalAssignedHours > remainingHours
                            ? "text-red-600"
                            : "text-indigo-600"
                            }`}
                        >
                          {formatMinutesToHHMM(totalAssignedHours * 60)} /{" "}
                          {formatMinutesToHHMM(availableHours * 60)}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-4">
                    {fields.map((field, index) => (
                      <div
                        key={field.id}
                        className="flex items-end gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100"
                      >
                        <div className="flex-1 space-y-2">
                          <label className="text-xs  text-slate-500 uppercase">
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
                                  const isDuplicate = projectTasks.some(
                                    (t) =>
                                      String(
                                        t.project_bundle_id || t.wbs_id,
                                      ) === String(selectedWbsId) &&
                                      String(t.user_id) === String(field.value),
                                  );
                                  const isOverLimitValue =
                                    !isOtherWbs && (existingWbsHours + totalAssignedHours >
                                      totalWbsHours);
                                  if (isDuplicate || isOverLimitValue) {
                                    return (
                                      <div className="flex items-center gap-1 text-[10px]  text-amber-600 uppercase">
                                        <AlertCircle className="w-3 h-3" />
                                        Will be marked
                                        {isDuplicate && " (Duplicate User)"}
                                        {isOverLimitValue && " (Hours Exceeded)"}
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
                        <div className="w-56 space-y-2">
                          <label className="text-xs  text-slate-500 uppercase">
                            Duration (HH:MM)
                          </label>
                          <div className="flex items-center gap-2">
                            <div className="flex-1 space-y-1">
                              <Input
                                type="number"
                                placeholder="HH"
                                {...register(`assignments.${index}.hours`, {
                                  required: "HH required",
                                })}
                              />
                            </div>
                            <span className=" text-slate-400">:</span>
                            <div className="flex-1 space-y-1">
                              <Input
                                type="number"
                                placeholder="MM"
                                {...register(`assignments.${index}.minutes`, {
                                  required: "MM required",
                                  min: { value: 0, message: "Min 0" },
                                  max: { value: 59, message: "Max 59" },
                                })}
                              />
                            </div>
                          </div>
                          {(errors.assignments?.[index]?.hours ||
                            errors.assignments?.[index]?.minutes) && (
                              <p className="text-[10px] text-red-500">
                                {errors.assignments[index]?.hours?.message ||
                                  errors.assignments[index]?.minutes?.message}
                              </p>
                            )}
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
                      onClick={() =>
                        append({ employeeId: "", hours: "", minutes: "" })
                      }
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
                    className="w-full py-3 bg-[#6bbd45] hover:bg-primary/80 text-white  shadow-lg shadow-indigo-200 transition-all active:scale-95 disabled:opacity-50"
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
