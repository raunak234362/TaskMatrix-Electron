
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
    (state) => state.fabricatorInfo?.fabricatorData || []
  );
  const departmentDatas = useSelector(
    (state) => state.userInfo?.departmentData || []
  );
  const teamDatas = useSelector((state) => state.userInfo?.teamData || []);
  const users = useSelector((state) => state.userInfo?.staffData || []);
  const rfqData = useSelector((state) => state.RFQInfos?.RFQData || []);

  console.log(teamDatas);

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
      value: String(r.id),
    })),
    fabricators: fabricators.map((f) => ({
      label: f.fabName,
      value: String(f.id),
    })),
    departments: departmentDatas.map((d) => ({
      label: d.name,
      value: String(d.id),
    })),
    managers: users.map((u) => ({
      label: `${u.firstName} ${u.lastName}`,
      value: String(u.id),
    })),
    teams: teamDatas.map((t) => ({
      label: t.name,
      value: String(t.id),
    })),
    connectionDesigners: connectionDesigners.map((c) => ({
      label: c.connectionDesignerName || c.name,
      value: String(c.id),
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
    (r) => String(r.id) === String(selectedRfqId)
  );

  useEffect(() => {
    if (!selectedRfq) return;

    setValue("name", selectedRfq.projectName || "");
    setValue(
      "projectNumber",
      selectedRfq.projectNumber ||
      `PROJ-${new Date().getFullYear()}-${String(
        rfqData.indexOf(selectedRfq) + 1
      ).padStart(3, "0")}`
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
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-blue-50 to-indigo-100 ">
      <div className="w-full mx-auto">
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/30 overflow-hidden">
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="p-4 md:p-10 space-y-8 md:space-y-14"
          >
            {/* Link RFQ — Hero Section */}
            <div className="relative ">
              <Controller
                name="rfqId"
                control={control}
                render={({ field }) => (
                  <Select
                    options={options.rfqs}
                    value={
                      options.rfqs.find((o) => o.value === field.value) || null
                    }
                    onChange={(opt) => field.onChange(opt?.value || "")}
                    placeholder="Search RFQ by project name or fabricator..."
                    isClearable
                    isSearchable
                    className="text-gray-700"
                    styles={{
                      control: (base) => ({
                        ...base,
                        backgroundColor: "white",
                        borderRadius: "16px",
                        padding: "8px",
                      }),
                    }}
                  />
                )}
              />
            </div>

            {/* RFQ Preview */}
            {selectedRfq && (
              <div className="bg-linear-to-r from-emerald-50 to-green-50 border-2 border-emerald-200 rounded-2xl p-8 -mt-6 mb-10 shadow-inner">
                <div className="flex items-center gap-3 mb-4">
                  <Zap className="w-5 h-5 md:w-7 md:h-7 text-emerald-600" />
                  <h3 className="text-lg md:text-2xl font-bold text-emerald-900">
                    RFQ Auto-Filled
                  </h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 text-sm">
                  <div className="bg-white/70 p-4 rounded-xl">
                    <p className="text-gray-700">Project</p>
                    <p className="font-bold text-gray-700 truncate">
                      {selectedRfq.projectName}
                    </p>
                  </div>
                  <div className="bg-white/70 p-4 rounded-xl">
                    <p className="text-gray-700">Fabricator</p>
                    <p className="font-bold">
                      {selectedRfq.fabricator?.fabName}
                    </p>
                  </div>
                  <div className="bg-white/70 p-4 rounded-xl">
                    <p className="text-gray-700">Tool</p>
                    <p className="font-bold text-purple-700">
                      {selectedRfq.tools || "TEKLA"}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Project Info */}
            <SectionTitle title="Project Details" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
              <Input
                label="Project Number *"
                placeholder="PROJ-2025-089"
                {...register("projectNumber", { required: "Required" })}
              />
              <Input
                label="Project Name *"
                placeholder="Empire State Tower - Phase II"
                {...register("name", { required: "Required" })}
              />
              <div className="md:col-span-2">
                <label className="text-sm font-medium text-gray-700 mb-2 block">
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
                      placeholder="Full structural steel detailing for 40-story commercial building..."
                    />
                  )}
                />
              </div>
            </div>

            {/* Team Assignment */}
            <SectionTitle title="Team & Assignments" />
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-8">
              <div>
                <label className="flex items-center gap-2 font-semibold text-gray-700 mb-3">
                  <Building2 className="w-5 h-5 text-blue-600" /> Fabricator *
                </label>
                <Controller
                  name="fabricatorID"
                  control={control}
                  rules={{ required: true }}
                  render={({ field }) => (
                    <Select
                      options={options.fabricators}
                      value={options.fabricators.find(
                        (o) => o.value === field.value
                      )}
                      onChange={(o) => field.onChange(o?.value || "")}
                      placeholder="Select..."
                      isSearchable
                    />
                  )}
                />
              </div>
              <div>
                <label className="flex items-center gap-2 font-semibold text-gray-700 mb-3">
                  <HardHat className="w-5 h-5 text-amber-600" /> Project Manager
                  *
                </label>
                <Controller
                  name="managerID"
                  control={control}
                  rules={{ required: true }}
                  render={({ field }) => (
                    <Select
                      options={options.managers}
                      value={options.managers.find(
                        (o) => o.value === field.value
                      )}
                      onChange={(o) => field.onChange(o?.value || "")}
                      placeholder="Assign manager"
                      isSearchable
                    />
                  )}
                />
              </div>
              <div>
                <label className="flex items-center gap-2 font-semibold text-gray-700 mb-3">
                  <UserCheck className="w-5 h-5 text-green-600" /> Department *
                </label>
                <Controller
                  name="departmentID"
                  control={control}
                  rules={{ required: true }}
                  render={({ field }) => (
                    <Select
                      options={options.departments}
                      value={options.departments.find(
                        (o) => o.value === field.value
                      )}
                      onChange={(o) => field.onChange(o?.value || "")}
                      placeholder="Select dept"
                    />
                  )}
                />
              </div>

              {selectedDeptId && (
                <div>
                  <label className="flex items-center gap-2 font-semibold text-gray-700 mb-3">
                    <Wrench className="w-5 h-5 text-purple-600" /> Tool
                  </label>
                  <Controller
                    name="tools"
                    control={control}
                    render={({ field }) => (
                      <Select
                        options={options.tools}
                        value={options.tools.find(
                          (o) => o.value === field.value
                        )}
                        onChange={(o) => field.onChange(o?.value || "TEKLA")}
                      />
                    )}
                  />
                </div>
              )}

              {selectedDeptId && (
                <div>
                  <label className="flex items-center gap-2 font-semibold text-gray-700 mb-3">
                    <Users className="w-5 h-5 text-purple-600" /> Team
                  </label>
                  <Controller
                    name="teamID"
                    control={control}
                    render={({ field }) => {
                      const filteredTeams = teamDatas
                        .filter(
                          (t) =>
                            !selectedDeptId || t.departmentID === selectedDeptId
                        )
                        .map((t) => ({
                          label: t.name,
                          value: String(t.id),
                        }));

                      return (
                        <Select
                          options={filteredTeams}
                          value={filteredTeams.find(
                            (o) => o.value === field.value
                          )}
                          onChange={(o) => field.onChange(o?.value || "")}
                          placeholder="Select team"
                          isClearable
                        />
                      );
                    }}
                  />
                </div>
              )}
            </div>

            {/* Scope: Connection Design */}
            <div className="bg-linear-to-r from-cyan-50 to-blue-50 rounded-3xl p-2 border-2 border-cyan-200">
              <div className="flex items-center gap-4 mb-8">
                <Layers className="w-5 h-5 text-cyan-600" />
                <div>
                  <h3 className="text-lg md:text-xl font-bold text-cyan-900">
                    Connection Design Scope
                  </h3>
                  <p className="text-cyan-700">
                    Define connection engineering deliverables
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-8">
                {[
                  "connectionDesign::Main Connection Design",
                  "miscDesign::Misc Design",
                  "customerDesign::Customer Design",
                ].map((item) => {
                  const [key, label] = item.split("::");
                  return (
                    <Controller
                      key={key}
                      name={key}
                      control={control}
                      render={({ field }) => (
                        <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all border border-cyan-100">
                          <ToggleField
                            label={label}
                            checked={!!field.value}
                            onChange={field.onChange}
                          />
                        </div>
                      )}
                    />
                  );
                })}
              </div>
            </div>

            {/* Scope: Detailing */}
            <div className="bg-linear-to-r from-amber-50 to-orange-50 rounded-3xl p-2 border-2 border-amber-200">
              <div className="flex items-center gap-4 mb-8">
                <Wrench className="w-5 h-5 text-amber-600" />
                <div>
                  <h3 className="text-lg md:text-xl font-bold text-amber-900">
                    Detailing Scope
                  </h3>
                  <p className="text-amber-700">
                    Shop & erection drawing deliverables
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-8">
                {[
                  "detailingMain::Detailing Main",
                  "detailingMisc::Detailing Misc",
                ].map((item) => {
                  const [key, label] = item.split("::");
                  return (
                    <Controller
                      key={key}
                      name={key}
                      control={control}
                      render={({ field }) => (
                        <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all border border-amber-100">
                          <ToggleField
                            label={label}
                            checked={!!field.value}
                            onChange={field.onChange}
                          />
                        </div>
                      )}
                    />
                  );
                })}
              </div>
            </div>

            {/* Timeline & Estimation */}
            <SectionTitle title="Timeline & Estimation" />
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-8">
              <Input
                label="Estimated Hours"
                type="number"
                placeholder="1200"
                {...register("estimatedHours")}
              />
              <Input
                label="Start Date *"
                type="date"
                {...register("startDate", { required: "Required" })}
              />
              <Input
                label="Target End Date"
                type="date"
                {...register("endDate")}
              />
            </div>

            {/* Attachments */}
            <SectionTitle title="Project Attachments" />
            <div className="bg-gray-50/70 border-2 border-dashed border-gray-300 rounded-3xl p-10 text-center">
              <Controller
                name="files"
                control={control}
                render={({ field }) => (
                  <MultipleFileUpload
                    onFilesChange={(files) => field.onChange(files)}
                  />
                )}
              />
            </div>

            {/* Submit */}
            <div className="flex justify-end gap-6 pt-10 border-t-2 border-gray-200">
              <Button
                className=" flex items-center gap-3"
                type="submit"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>Creating Project...</>
                ) : (
                  <>
                    <Sparkles className="w-6 h-6" />
                    Create Project
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
