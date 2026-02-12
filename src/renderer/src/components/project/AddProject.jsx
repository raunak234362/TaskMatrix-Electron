/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { toast } from "react-toastify";
import { useDispatch, useSelector } from "react-redux";
import Select from "react-select";
import {
  Building2,
  UserCheck,
  HardHat,
  Wrench,
  Sparkles,
  Zap,
  Layers,
  Users,
} from "lucide-react";

import Input from "../fields/input";
import Button from "../fields/Button";
import MultipleFileUpload from "../fields/MultipleFileUpload";
import SectionTitle from "../ui/SectionTitle";
import Service from "../../api/Service";
import ToggleField from "../fields/Toggle";
import RichTextEditor from "../fields/RichTextEditor";

import { addProject } from "../../store/projectSlice";

const AddProject = () => {
  const dispatch = useDispatch();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [connectionDesigners, setConnectionDesigners] = useState([]);

  const fabricators = useSelector(
    (state) => state.fabricatorInfo?.fabricatorData || [],
  );
  const departmentDatas = useSelector(
    (state) => state.userInfo?.departmentData || [],
  );
  const teamDatas = useSelector((state) => state.userInfo?.teamData || []);
  const rfqData = useSelector((state) => state.RFQInfos?.RFQData || []);
  const managerOption = useSelector((state) =>
    (state.userInfo?.staffData || [])
      .filter((user) =>
        [
          "PROJECT_MANAGER",
          "DEPUTY_MANAGER",
          "ESTIMATION_HEAD",
          "OPERATION_EXECUTIVE",
          "DEPT_MANAGER",
        ].includes(user.role),
      )
      .map((user) => ({
        label: `${user.firstName}${user.middleName ? " " + user.middleName : ""} ${user.lastName}`,
        value: user.id,
      })),
  );

  const { register, handleSubmit, control, watch, setValue } =
    useForm({
      defaultValues: {
        tools: "TEKLA",
        connectionDesign: false,
        miscDesign: false,
        customerDesign: false,
        detailingMain: false,
        detailingMisc: false,
        files: [],
      },
    });

  useEffect(() => {
    Service.FetchAllConnectionDesigner()
      .then((res) => setConnectionDesigners(res?.data || []))
      .catch(() => toast.error("Failed to load connection designers"));
  }, []);

  const options = {
    rfqs: rfqData.map((r) => ({
      label: `${r.projectName} • ${r.fabricator?.fabName}`,
      value: r.id,
    })),
    fabricators: fabricators.map((f) => ({
      label: f.fabName,
      value: f.id,
    })),
    departments: departmentDatas.map((d) => ({
      label: d.name,
      value: d.id,
    })),
    teams: teamDatas.map((t) => ({
      label: t.name,
      value: t.id,
    })),
    connectionDesigners: connectionDesigners.map((c) => ({
      label: c.connectionDesignerName || c.name,
      value: c.id,
    })),
    tools: [
      { label: "Tekla", value: "TEKLA" },
      { label: "SDS/2", value: "SDS2" },
      { label: "Both (Tekla + SDS/2)", value: "BOTH" },
    ],
  };

  const selectedRfqId = watch("rfqId");
  const selectedDeptId = watch("departmentID");
  const selectedRfq = rfqData.find(
    (r) => String(r.id) === String(selectedRfqId),
  );

  useEffect(() => {
    if (!selectedRfq) return;

    setValue("name", selectedRfq.projectName || "");
    setValue(
      "projectNumber",
      selectedRfq.projectNumber ||
      `PROJ-${new Date().getFullYear()}-${String(
        rfqData.indexOf(selectedRfq) + 1,
      ).padStart(3, "0")}`,
    );
    setValue("description", selectedRfq.description || "");
    setValue("fabricatorID", String(selectedRfq.fabricatorId || ""));
    setValue("tools", selectedRfq.tools || "TEKLA");

    setValue("connectionDesign", !!selectedRfq.connectionDesign);
    setValue("miscDesign", !!selectedRfq.miscDesign);
    setValue("customerDesign", !!selectedRfq.customerDesign);
    setValue("detailingMain", !!selectedRfq.detailingMain);
    setValue("detailingMisc", !!selectedRfq.detailingMisc);

    toast.success("RFQ data auto-filled!", {
      icon: <Sparkles className="w-5 h-5" />,
    });
  }, [selectedRfq, setValue, rfqData]);

  const onSubmit = async (data) => {
    try {
      setIsSubmitting(true);
      const formData = new FormData();

      Object.entries(data).forEach(([key, value]) => {
        if (value === null || value === undefined) return;
        if (key === "files" && Array.isArray(value)) {
          value.forEach((file) => formData.append("files", file));
        } else if (typeof value === "boolean") {
          formData.append(key, value ? "true" : "false");
        } else {
          formData.append(key, String(value));
        }
      });

      formData.append("status", "ACTIVE");
      formData.append("stage", "IFA");

      const res = await Service.AddProject(formData);
      if (res?.data) {
        dispatch(addProject(res.data));
      }
      toast.success("Project launched successfully!");
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to create project");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-white p-4 lg:p-8">
      <div className="w-full mx-auto">
        <div className="bg-green-50/30 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 overflow-hidden">
          {/* Header */}
          <div className="px-8 py-10 flex items-center justify-between bg-linear-to-r from-green-50/30 to-transparent border-b border-gray-50">
            <div>
              <h1 className="text-3xl font-extrabold text-gray-600 tracking-tight">
                Create New <span className="text-green-600">Project</span>
              </h1>
        
            </div>
            <div className="hidden md:flex items-center gap-3">
              <div className="h-10 w-px bg-gray-100" />
              <div className="text-right">
               
              </div>
            </div>
          </div>

          <form
            onSubmit={handleSubmit(onSubmit)}
            className="px-8 py-12 space-y-12"
          >
            {/* RFQ Integration */}
            <div className="bg-zinc-100 rounded-2xl p-6 border border-gray-100">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-white rounded-xl shadow-sm border border-gray-100">
                    <Zap className="w-6 h-6 text-green-500 fill-green-500/10" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-gray-800">Select RFQ</h3>
                  
                  </div>
                </div>
                <div className="w-full lg:w-[400px]">
                  <Controller
                    name="rfqId"
                    control={control}
                    render={({ field }) => (
                      <Select
                        options={options.rfqs}
                        value={options.rfqs.find((o) => o.value === field.value) || null}
                        onChange={(opt) => field.onChange(opt?.value || "")}
                        placeholder="Search RFQ..."
                        isClearable
                        isSearchable
                        className="text-sm"
                        styles={{
                          control: (base) => ({
                            ...base,
                            backgroundColor: "white",
                            borderRadius: "12px",
                            padding: "4px 8px",
                            borderColor: "#e5e7eb",
                            boxShadow: "none",
                            "&:hover": { borderColor: "#d1d5db" }
                          })
                        }}
                      />
                    )}
                  />
                </div>
              </div>

              {selectedRfq && (
                <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4 px-4 py-4 bg-white rounded-xl border border-green-100/50 animate-in fade-in slide-in-from-top-2">
                  <div className="space-y-0.5">
                    <span className="text-[10px] uppercase font-bold text-gray-400">Project</span>
                    <p className="text-xs font-bold text-gray-800 truncate">{selectedRfq.projectName}</p>
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-[10px] uppercase font-bold text-gray-400">Fabricator</span>
                    <p className="text-xs font-bold text-gray-800">{selectedRfq.fabricator?.fabName || "N/A"}</p>
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-[10px] uppercase font-bold text-gray-400">Tools</span>
                    <p className="text-xs font-bold text-green-600">{selectedRfq.tools || "TEKLA"}</p>
                  </div>
                  <div className="flex items-center">
                    <div className="px-2 py-0.5 bg-green-50 text-green-700 rounded-md text-[10px] font-black border border-green-100 flex items-center gap-1">
                      <Sparkles className="w-2.5 h-2.5" /> SYNCED
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Form Sections */}
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-12">
              {/* Left Column - Core Info */}
              <div className="xl:col-span-8 space-y-10">
                <section className="bg-zinc-100 rounded-2xl border border-gray-50 p-8 space-y-8">
                  <SectionTitle title="Core Identity" className="mb-6" />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <Input
                      label="Project Number *"
                      
                      placeholder="Give a unique project number..."
                      className="bg-gray-50/50 border-gray-200 focus:bg-white transition-all"
                      {...register("projectNumber", { required: "Required" })}
                    />
                    <Input
                      label="Project Name *"
                      placeholder="Enter project name..."
                      className="bg-gray-50/50 border-gray-200 focus:bg-white transition-all"
                      {...register("name", { required: "Required" })}
                    />
                    <div className="md:col-span-2 space-y-3">
                      <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                        Project Description *
                      </label>
                      <div className="rounded-xl overflow-hidden border border-gray-200 bg-gray-50/30">
                        <Controller
                          name="description"
                          control={control}
                          rules={{ required: "Required" }}
                          render={({ field }) => (
                            <RichTextEditor
                              value={field.value || ""}
                              onChange={field.onChange}
                              placeholder="Describe the project scope..."
                            />
                          )}
                        />
                      </div>
                    </div>
                  </div>
                </section>

                <section className="bg-zinc-100 rounded-2xl border border-gray-50 p-8 space-y-8">
                  <SectionTitle title="Timeline & Resources" className="mb-6" />
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <Input label="Estimated Hours" type="number" className="bg-gray-50/50" {...register("estimatedHours")} />
                    <Input label="Start Date *" type="date" className="bg-gray-50/50" {...register("startDate", { required: "Required" })} />
                    <Input label="Deadline" type="date" className="bg-gray-50/50" {...register("endDate")} />
                  </div>
                </section>

                <section className="bg-zinc-100 rounded-2xl border border-gray-50 p-8 space-y-6">
                  <SectionTitle title="Documentation" className="mb-6" />
                  <div className="bg-white border-2 border-dashed border-green-200 rounded-2xl p-10 hover:border-green-300 transition-all group">
                    <Controller
                      name="files"
                      control={control}
                      render={({ field }) => (
                        <MultipleFileUpload onFilesChange={(files) => field.onChange(files)} />
                      )}
                    />
                  </div>
                </section>
              </div>

              {/* Right Column - Assignments & Scope */}
              <div className="xl:col-span-4 space-y-10">
                <section className="bg-zinc-100 rounded-2xl border border-gray-50 p-8 space-y-6">
                  <SectionTitle title="Leadership" className="mb-6" />
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase">Fabricator</label>
                      <Controller
                        name="fabricatorID"
                        control={control}
                        rules={{ required: true }}
                        render={({ field }) => (
                          <Select
                            options={options.fabricators}
                            value={options.fabricators.find((o) => o.value === field.value)}
                            onChange={(o) => field.onChange(o?.value || "")}
                            placeholder="Select..."
                            className="text-sm"
                            styles={{ control: (b) => ({ ...b, borderRadius: '10px', backgroundColor: '#f9fafb' }) }}
                          />
                        )}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase">Project Manager</label>
                      <Controller
                        name="managerID"
                        control={control}
                        rules={{ required: true }}
                        render={({ field }) => (
                          <Select
                            options={managerOption}
                            value={managerOption.find((o) => String(o.value) === String(field.value))}
                            onChange={(o) => field.onChange(o?.value || "")}
                            placeholder="Assign..."
                            className="text-sm"
                            styles={{ control: (b) => ({ ...b, borderRadius: '10px', backgroundColor: '#f9fafb' }) }}
                          />
                        )}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase">Department</label>
                      <Controller
                        name="departmentID"
                        control={control}
                        rules={{ required: true }}
                        render={({ field }) => (
                          <Select
                            options={options.departments}
                            value={options.departments.find((o) => o.value === field.value)}
                            onChange={(o) => field.onChange(o?.value || "")}
                            placeholder="Select..."
                            className="text-sm"
                            styles={{ control: (b) => ({ ...b, borderRadius: '10px', backgroundColor: '#f9fafb' }) }}
                          />
                        )}
                      />
                    </div>
                  </div>
                </section>

                <section className="bg-zinc-100 rounded-2xl border border-gray-50 p-8 space-y-8">
                  <SectionTitle title="Detailing Scope" className="mb-6" />

                  <div className="space-y-8">
                    {/* Connection Design */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 text-green-600">
                        <Layers size={14} />
                        <h4 className="text-[10px] font-black uppercase tracking-widest">Engineering</h4>
                      </div>
                      <div className="space-y-2">
                        {["connectionDesign::Connection", "miscDesign::Misc", "customerDesign::Customer"].map((item) => {
                          const [key, label] = item.split("::");
                          return (
                            <Controller
                              key={key}
                              name={key}
                              control={control}
                              render={({ field }) => (
                                <div
                                  onClick={() => field.onChange(!field.value)}
                                  className={`
                                    flex items-center justify-between px-4 py-3 rounded-xl border transition-all cursor-pointer text-xs
                                    ${field.value ? "bg-green-50 border-green-200 text-green-800" : "bg-gray-50/50 border-gray-100 text-gray-600 hover:border-gray-200"}
                                  `}
                                >
                                  <span className="font-bold">{label}</span>
                                  <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${field.value ? "border-green-600 bg-green-600" : "border-gray-300 bg-white"}`}>
                                    {field.value && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                                  </div>
                                </div>
                              )}
                            />
                          );
                        })}
                      </div>
                    </div>

                    {/* Detailing */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 text-green-600">
                        <Wrench size={14} />
                        <h4 className="text-[10px] font-black uppercase tracking-widest">Detailing</h4>
                      </div>
                      <div className="space-y-2">
                        {["detailingMain::Main Shop", "detailingMisc::Misc Shop"].map((item) => {
                          const [key, label] = item.split("::");
                          return (
                            <Controller
                              key={key}
                              name={key}
                              control={control}
                              render={({ field }) => (
                                <div
                                  onClick={() => field.onChange(!field.value)}
                                  className={`
                                    flex items-center justify-between px-4 py-3 rounded-xl border transition-all cursor-pointer text-xs
                                    ${field.value ? "bg-green-50 border-green-200 text-green-800" : "bg-gray-50/50 border-gray-100 text-gray-600 hover:border-gray-200"}
                                  `}
                                >
                                  <span className="font-bold">{label}</span>
                                  <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${field.value ? "border-green-600 bg-green-600" : "border-gray-300 bg-white"}`}>
                                    {field.value && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                                  </div>
                                </div>
                              )}
                            />
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </section>
              </div>
            </div>

            {/* Submit Action */}
            <div className="pt-8 flex justify-end">
              <Button
                type="submit"
                disabled={isSubmitting}
                className="px-10 py-4 bg-gray-900 hover:bg-green-700 text-white rounded-xl font-bold transition-all shadow-lg flex items-center gap-3"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                    Creating Project...
                  </>
                ) : (
                  <>
                   
                    Add Project
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddProject;
