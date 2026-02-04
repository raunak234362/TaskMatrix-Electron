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
  Layers,
  X,
  Save,
  Users,
} from "lucide-react";

import Input from "../fields/input";
import Button from "../fields/Button";
import SectionTitle from "../ui/SectionTitle";
import Service from "../../api/Service";
import ToggleField from "../fields/Toggle";

import { updateProject } from "../../store/projectSlice";
import { showDepartment, showTeam, showStaff } from "../../store/userSlice";


const EditProject = ({
  projectId,
  onCancel,
  onSuccess,
}) => {
  const dispatch = useDispatch();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [connectionDesigners, setConnectionDesigners] = useState([]);
  const [loading, setLoading] = useState(true);

  const fabricators = useSelector(
    (state) => state.fabricatorInfo?.fabricatorData || []
  );
  const departmentDatas = useSelector(
    (state) => state.userInfo?.departmentData || []
  );
  const teamDatas = useSelector((state) => state.userInfo?.teamData || []);
  const users = useSelector((state) => state.userInfo?.staffData || []);

  const { register, handleSubmit, control, setValue, watch } =
    useForm({
      defaultValues: {
        tools: "TEKLA",
        connectionDesign: false,
        miscDesign: false,
        customerDesign: false,
        detailingMain: false,
        detailingMisc: false,
      },
    });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [cdRes, projectRes, deptRes, teamRes, staffRes] =
          await Promise.all([
            Service.FetchAllConnectionDesigner(),
            Service.GetProjectById(projectId),
            departmentDatas.length === 0
              ? Service.AllDepartments()
              : null,
            teamDatas.length === 0 ? Service.AllTeam() : null,
            users.length === 0
              ? Service.FetchAllEmployee()
              : null,
          ]);

        setConnectionDesigners(cdRes?.data || []);
        if (deptRes) dispatch(showDepartment(deptRes.data || deptRes));
        if (teamRes) dispatch(showTeam(teamRes.data || teamRes));
        if (staffRes) dispatch(showStaff(staffRes.data || staffRes));

        const project = projectRes?.data;
        if (project) {
          setValue("name", project.name);
          setValue("projectNumber", project.projectNumber);
          setValue("description", project.description);
          setValue("fabricatorID", project.fabricatorID);
          setValue("managerID", project.managerID);
          setValue("departmentID", project.department?.id);
          setValue("teamID", project.team?.id);
          setValue("tools", project.tools);
          setValue("stage", project.stage);
          setValue("estimatedHours", project.estimatedHours);
          setValue(
            "startDate",
            project.startDate
              ? new Date(project.startDate).toISOString().split("T")[0]
              : ""
          );
          setValue(
            "endDate",
            project.endDate
              ? new Date(project.endDate).toISOString().split("T")[0]
              : ""
          );

          setValue("connectionDesign", project.connectionDesign);
          setValue("miscDesign", project.miscDesign);
          setValue("customerDesign", project.customerDesign);
          setValue("detailingMain", project.detailingMain);
          setValue("detailingMisc", project.detailingMisc);
        }
      } catch (error) {
        console.error("Failed to load data", error);
        toast.error("Failed to load project details");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [projectId, setValue]);

  const options = {
    fabricators: (Array.isArray(fabricators) ? fabricators : []).map(
      (f) => ({
        label: f.fabName,
        value: f.id,
      })
    ),
    departments: (Array.isArray(departmentDatas) ? departmentDatas : []).map(
      (d) => ({
        label: d.name,
        value: d.id,
      })
    ),
    managers: (Array.isArray(users) ? users : []).map((u) => ({
      label: `${u.firstName} ${u.lastName}`,
      value: u.id,
    })),
    teams: (Array.isArray(teamDatas) ? teamDatas : []).map((t) => ({
      label: t.name,
      value: t.id,
    })),
    connectionDesigners: connectionDesigners.map((c) => ({
      label: c.connectionDesignerName || c.name,
      value: c.id,
    })),
    tools: [
      { label: "TEKLA", value: "TEKLA" },
      { label: "SDS2", value: "SDS2" },
      { label: "Both (TEKLA + SDS2)", value: "BOTH" },
    ],
    stage: [
      { label: "IFA - (Issue for Approval)", value: "IFA" },
      { label: "IFC - (Issue for Construction)", value: "IFC" },
      { label: "CO# - (Change Order)", value: "CO#" },
    ],
  };

  const onSubmit = async (data) => {
    try {
      setIsSubmitting(true);
      const formData = new FormData();

      Object.entries(data).forEach(([key, value]) => {
        if (value === null || value === undefined) return;
        if (key === "files") return;

        if (typeof value === "boolean") {
          formData.append(key, value ? "true" : "false");
        } else {
          formData.append(key, String(value));
        }
      });

      const res = await Service.EditProjectById(projectId, formData);
      if (res?.data) {
        dispatch(updateProject(res.data));
      }
      toast.success("Project updated successfully!");
      onSuccess();
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to update project");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <div className="text-center">Loading project data...</div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={onCancel}
    >
      <div
        className="bg-white w-full max-w-5xl rounded-xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Scrollable Content */}
        <div className="overflow-y-auto p-6">
          <div className="flex justify-between items-center mb-6 border-b pb-4 sticky top-0 bg-white z-10">
            <h2 className="text-2xl font-bold text-gray-700">Edit Project</h2>
            <button
              onClick={onCancel}
              className="text-gray-700 hover:text-gray-700"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            {/* Project Info */}
            <SectionTitle title="Project Details" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input
                label="Project Number"
                placeholder="PROJ-2025-089"
                {...register("projectNumber")}
              />
              <Input
                label="Project Name"
                placeholder="Empire State Tower - Phase II"
                {...register("name")}
              />
              <div className="md:col-span-2">
                <Input
                  label="Description"
                  placeholder="Full structural steel detailing for 40-story commercial building..."
                  {...register("description")}
                />
              </div>
            </div>

            {/* Team Assignment */}
            <SectionTitle title="Team & Assignments" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="flex items-center gap-2 font-semibold text-gray-700 mb-2">
                  <Building2 className="w-4 h-4 text-blue-600" /> Fabricator
                </label>
                <Controller
                  name="fabricatorID"
                  control={control}
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
                <label className="flex items-center gap-2 font-semibold text-gray-700 mb-2">
                  <HardHat className="w-4 h-4 text-amber-600" /> Project Manager
                </label>
                <Controller
                  name="managerID"
                  control={control}
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
                <label className="flex items-center gap-2 font-semibold text-gray-700 mb-2">
                  <UserCheck className="w-4 h-4 text-green-600" /> Department
                </label>
                <Controller
                  name="departmentID"
                  control={control}
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
              <div>
                <label className="flex items-center gap-2 font-semibold text-gray-700 mb-2">
                  <Users className="w-4 h-4 text-purple-600" /> Team
                </label>
                <Controller
                  name="teamID"
                  control={control}
                  render={({ field }) => {
                    const selectedDeptId = watch("departmentID");
                    const filteredTeams = (Array.isArray(teamDatas) ? teamDatas : [])
                      .filter(
                        (t) =>
                          !selectedDeptId ||
                          String(t.departmentID) === String(selectedDeptId)
                      )
                      .map((t) => ({
                        label: t.name,
                        value: t.id,
                      }));

                    return (
                      <Select
                        options={filteredTeams}
                        value={filteredTeams.find(
                          (o) => o.value === field.value
                        )}
                        onChange={(o) => field.onChange(o?.value || "")}
                        placeholder="Select team"
                        isSearchable
                        isClearable
                        isDisabled={!selectedDeptId}
                      />
                    );
                  }}
                />
              </div>
            </div>

            {/* Connection Design */}
            <div className="bg-cyan-50/50 rounded-xl p-4 border border-cyan-100">
              <div className="flex items-center gap-2 mb-4">
                <Layers className="w-5 h-5 text-cyan-600" />
                <h3 className="text-lg font-bold text-cyan-900">
                  Connection Design Scope
                </h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  "connectionDesign::Connection Design",
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
                        <div className="bg-white rounded-lg p-3 shadow-sm border border-cyan-100">
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

            {/* Detailing Scope */}
            <div className="bg-amber-50/50 rounded-xl p-4 border border-amber-100">
              <div className="flex items-center gap-2 mb-4">
                <Wrench className="w-5 h-5 text-amber-600" />
                <h3 className="text-lg font-bold text-amber-900">
                  Detailing Scope
                </h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                        <div className="bg-white rounded-lg p-3 shadow-sm border border-amber-100">
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

            {/* Tools & Timeline */}
            <SectionTitle title="Tools & Timeline" />
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div>
                <label className="flex items-center gap-2 font-semibold text-gray-700 mb-2">
                  <Wrench className="w-4 h-4 text-purple-600" /> Tool
                </label>
                <Controller
                  name="tools"
                  control={control}
                  render={({ field }) => (
                    <Select
                      options={options.tools}
                      value={options.tools.find((o) => o.value === field.value)}
                      onChange={(o) => field.onChange(o?.value || "TEKLA")}
                    />
                  )}
                />
              </div>
              <div>
                <label className="flex items-center gap-2 font-semibold text-gray-700 mb-2">
                  <Layers className="w-4 h-4 text-cyan-600" /> Stage
                </label>
                <Controller
                  name="stage"
                  control={control}
                  render={({ field }) => (
                    <Select
                      options={options.stage}
                      value={options.stage.find((o) => o.value === field.value)}
                      onChange={(o) => field.onChange(o?.value || "IFA")}
                    />
                  )}
                />
              </div>
              <Input
                label="Estimated Hours"
                type="number"
                placeholder="1200"
                {...register("estimatedHours")}
              />
              <Input
                label="Start Date"
                type="date"
                {...register("startDate")}
              />
              <Input
                label="Target End Date"
                type="date"
                {...register("endDate")}
              />
            </div>

            {/* Submit */}
            <div className="flex justify-end gap-4 pt-6 border-t border-gray-200">
              <Button
                className="bg-gray-500 hover:bg-gray-600"
                onClick={onCancel}
                type="button"
              >
                Cancel
              </Button>
              <Button
                className="flex items-center gap-2"
                type="submit"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>Saving...</>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Save Changes
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

export default EditProject;
