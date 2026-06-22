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
  UserPlus,
} from "lucide-react";

import Input from "../fields/input";
import Button from "../fields/Button";
import SectionTitle from "../ui/SectionTitle";
import Service from "../../api/Service";
import ToggleField from "../fields/Toggle";
import RichTextEditor from "../fields/RichTextEditor";

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
  const [clients, setClients] = useState([]);
  const [isFetchingClients, setIsFetchingClients] = useState(false);
  const [cdEngineers, setCdEngineers] = useState([]);
  const [isFetchingEngineers, setIsFetchingEngineers] = useState(false);

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
        isAwarded: false,
        clientProjectManagers: [],
        connectionDesignerID: [],
        pocOfConnectionDesigner: [],
        status: "ACTIVE",
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
          setValue("status", project.status || "ACTIVE");
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
          setValue(
            "approvalDate",
            project.approvalDate
              ? new Date(project.approvalDate).toISOString().split("T")[0]
              : ""
          );
          setValue(
            "fabricationDate",
            project.fabricationDate
              ? new Date(project.fabricationDate).toISOString().split("T")[0]
              : ""
          );

          setValue("connectionDesign", project.connectionDesign);
          setValue("miscDesign", project.miscDesign);
          setValue("customerDesign", project.customerDesign);
          setValue("detailingMain", project.detailingMain);
          setValue("detailingMisc", project.detailingMisc);
          setValue("isAwarded", project.isAwarded || false);
          const selectedCDs = Array.isArray(project.connectionDesignerID)
            ? project.connectionDesignerID
            : project.connectionDesignerID
            ? [project.connectionDesignerID]
            : [];
          setValue("connectionDesignerID", selectedCDs);

          let selectedPocs = [];
          if (project.pocOfConnectionDesigner) {
            if (Array.isArray(project.pocOfConnectionDesigner)) {
              selectedPocs = project.pocOfConnectionDesigner.map(
                (poc) => poc?.id || poc?._id || poc
              );
            } else {
              const singleId = project.pocOfConnectionDesigner?.id || project.pocOfConnectionDesigner?._id || (typeof project.pocOfConnectionDesigner === 'string' ? project.pocOfConnectionDesigner : "");
              if (singleId) {
                selectedPocs = [singleId];
              }
            }
          }
          setValue("pocOfConnectionDesigner", selectedPocs);

          // Handle clientProjectManagers
          if (project.clientProjectManagers) {
            const selectedManagers = Array.isArray(project.clientProjectManagers)
              ? project.clientProjectManagers.map((m) => (m?.id || m))
              : [];
            setValue("clientProjectManagers", selectedManagers);
          }
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

  const watchedFabricatorId = watch("fabricatorID");
  const watchedCdId = watch("connectionDesignerID");

  useEffect(() => {
    const fetchClients = async () => {
      if (watchedFabricatorId) {
        setIsFetchingClients(true);
        try {
          const res = await Service.FetchAllClientsByFabricatorID(watchedFabricatorId);
          setClients(Array.isArray(res?.data) ? res.data : []);
        } catch (error) {
          console.error("Failed to fetch clients", error);
          setClients([]);
        } finally {
          setIsFetchingClients(false);
        }
      } else {
        setClients([]);
      }
    };
    fetchClients();
  }, [watchedFabricatorId]);

  useEffect(() => {
    const fetchEngineers = async () => {
      const cdIds = Array.isArray(watchedCdId) ? watchedCdId : (watchedCdId ? [watchedCdId] : []);
      if (cdIds.length > 0) {
        setIsFetchingEngineers(true);
        try {
          const results = await Promise.all(
            cdIds.map((id) => Service.FetchConnectionDesignerByID(id))
          );
          const allEngineers = [];
          results.forEach((res) => {
            const engineers = res?.data?.CDEngineers;
            if (Array.isArray(engineers)) {
              engineers.forEach((eng) => {
                if (eng && !allEngineers.some((e) => (e.id || e._id) === (eng.id || eng._id))) {
                  allEngineers.push(eng);
                }
              });
            }
          });
          setCdEngineers(allEngineers);

          // Safeguard: Filter out any selected POC that no longer belongs to the selected connection designers
          const currentPocs = watch("pocOfConnectionDesigner") || [];
          const updatedPocs = (Array.isArray(currentPocs) ? currentPocs : [currentPocs]).filter((pocId) =>
            allEngineers.some((e) => (e.id || e._id) === pocId)
          );
          if (JSON.stringify(currentPocs) !== JSON.stringify(updatedPocs)) {
            setValue("pocOfConnectionDesigner", updatedPocs);
          }
        } catch (error) {
          console.error("Failed to fetch engineers", error);
          setCdEngineers([]);
        } finally {
          setIsFetchingEngineers(false);
        }
      } else {
        setCdEngineers([]);
      }
    };
    fetchEngineers();
  }, [watchedCdId]);

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
      { label: "R-IFA - (Revised Issue for Approval)", value: "RIFA" },
      { label: "IFC - (Issue for Construction)", value: "IFC" },
      { label: "R-IFC - (Revised Issue for Construction)", value: "RIFC" },
      { label: "COR - (Change Order)", value: "CO" },
    ],
    status: [
      { label: "Active", value: "ACTIVE" },
      { label: "On Hold", value: "ONHOLD" },
      { label: "Inactive", value: "INACTIVE" },
      { label: "Delay", value: "DELAY" },
      { label: "Complete", value: "COMPLETE" },
      { label: "Assigned", value: "ASSIGNED" },
    ],
    clientProjectManagers: clients
      .filter((c) => c && ["CLIENT", "CLIENT_ADMIN"].includes(c.role))
      .map((c) => ({
        label: `${c.firstName} ${c.lastName} (${c.role === 'CLIENT_ADMIN' ? 'Admin' : 'Client'})`,
        value: c.id,
      })),
    pocOfConnectionDesigner: cdEngineers.map((e) => ({
      label: `${e.firstName} ${e.lastName}`,
      value: e.id || e._id,
    })),
  };

  const onSubmit = async (data) => {
    try {
      setIsSubmitting(true);
      const formData = new FormData();

      Object.entries(data).forEach(([key, value]) => {
        if (value === null || value === undefined) return;
        if (key === "files") return;

        if (Array.isArray(value)) {
          value.forEach((v) => {
            const val = (v && typeof v === "object") ? (v.id || v._id || v.value) : v;
            if (val !== undefined && val !== null) formData.append(key, String(val));
          });
        } else if (typeof value === "boolean") {
          formData.append(key, value ? "true" : "false");
        } else {
          const val = (value && typeof value === "object") ? (value.id || value._id || value.value) : value;
          if (val !== undefined && val !== null && typeof val !== "object") {
            formData.append(key, String(val));
          }
        }
      });
      console.log(formData);
      console.log(data,"=========");
      

      const res = await Service.EditProjectById(projectId, formData);
      if (res && res.success !== false) {
        if (res?.data) {
          dispatch(updateProject(res.data));
        } else {
          dispatch(updateProject(res));
        }
        toast.success("Project updated successfully!");
        onSuccess();
      } else {
        toast.error(res?.message || "Failed to update project");
      }
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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onCancel}
    >
      <div
        className="bg-[#fcfdfc] w-full max-w-[96vw] rounded-3xl shadow-2xl overflow-hidden max-h-[96vh] flex flex-col p-6 border border-gray-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header-less Top Bar with Close Button */}
        <div className="flex justify-end mb-4 shrink-0">
          <button
            onClick={onCancel}
            type="button"
            className="px-6 py-1.5 bg-red-50 text-black border-2 border-red-700/80 rounded-none hover:bg-red-100 transition-all font-bold text-sm uppercase tracking-tight shadow-sm inline-flex items-center justify-center cursor-pointer"
          >
            Close
          </button>
        </div>

        {/* Scrollable Content Form */}
        <div className="overflow-y-auto pr-2 flex-1">
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="space-y-12"
          >
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-stretch">
              {/* Row 1, Col 1: Project Details */}
              <section className="bg-zinc-100 rounded-2xl border border-gray-50 p-8 flex flex-col justify-between lg:col-span-7">
                <div className="flex flex-col flex-1">
                  <SectionTitle title="Project Details" className="mb-6 shrink-0" />
                  <div className="flex flex-col flex-1 gap-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 shrink-0">
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
                    </div>
                    <div className="space-y-3 flex-1 flex flex-col">
                      <label className="text-sm font-medium text-gray-700 uppercase shrink-0">
                        Project Scope *
                      </label>
                      <div className="flex-1 flex flex-col">
                        <Controller
                          name="description"
                          control={control}
                          rules={{ required: "Required" }}
                          render={({ field }) => (
                            <RichTextEditor
                              value={field.value || ""}
                              onChange={field.onChange}
                              placeholder=""
                              height={540}
                            />
                          )}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              {/* Row 1, Col 2: POC */}
              <section className="bg-zinc-100 rounded-2xl border border-gray-50 p-8 space-y-6 flex flex-col justify-between lg:col-span-5">
                <div>
                  <SectionTitle title="POC" className="mb-6" />
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700 uppercase">Fabricator</label>
                      <Controller
                        name="fabricatorID"
                        control={control}
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
                      <label className="text-sm font-medium text-gray-700 uppercase">Tools *</label>
                      <Controller
                        name="tools"
                        control={control}
                        render={({ field }) => (
                          <Select
                            options={options.tools}
                            value={options.tools.find((o) => o.value === field.value)}
                            onChange={(o) => field.onChange(o?.value || "")}
                            placeholder="Select..."
                            className="text-sm"
                            styles={{ control: (b) => ({ ...b, borderRadius: '10px', backgroundColor: '#f9fafb' }) }}
                          />
                        )}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700 uppercase">Project Manager</label>
                      <Controller
                        name="managerID"
                        control={control}
                        render={({ field }) => (
                          <Select
                            options={options.managers}
                            value={options.managers.find((o) => String(o.value) === String(field.value))}
                            onChange={(o) => field.onChange(o?.value || "")}
                            placeholder="Assign..."
                            className="text-sm"
                            styles={{ control: (b) => ({ ...b, borderRadius: '10px', backgroundColor: '#f9fafb' }) }}
                          />
                        )}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700 uppercase">Department</label>
                      <Controller
                        name="departmentID"
                        control={control}
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
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700 uppercase">Team</label>
                      <Controller
                        name="teamID"
                        control={control}
                        render={({ field }) => {
                          const selectedDeptId = watch("departmentID");
                          const filteredTeams = (Array.isArray(teamDatas) ? teamDatas : [])
                            .filter(
                              (t) => {
                                const isDeleted = t.isDeleted === true || t.isDeleted === "true" || String(t.isDeleted).toLowerCase() === "true";
                                if (isDeleted) return false;
                                if (!selectedDeptId) return true;
                                const tDeptId = t.departmentID || t.department?.id || t.department?._id || t.departmentId;
                                return String(tDeptId) === String(selectedDeptId);
                              }
                            )
                            .map((t) => ({
                              label: t.name,
                              value: t.id,
                            }));

                          return (
                            <Select
                              options={filteredTeams}
                              value={filteredTeams.find((o) => o.value === field.value)}
                              onChange={(o) => field.onChange(o?.value || "")}
                              placeholder="Select team"
                              isSearchable
                              isClearable
                              isDisabled={!selectedDeptId}
                              className="text-sm"
                              styles={{ control: (b) => ({ ...b, borderRadius: '10px', backgroundColor: '#f9fafb' }) }}
                            />
                          );
                        }}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700 uppercase">Client Project Managers</label>
                      <Controller
                        name="clientProjectManagers"
                        control={control}
                        render={({ field }) => (
                          <Select
                            isMulti
                            options={options.clientProjectManagers}
                            value={options.clientProjectManagers.filter((o) =>
                              (Array.isArray(field.value) ? field.value : []).includes(o.value)
                            )}
                            onChange={(selectedOptions) =>
                              field.onChange(selectedOptions ? selectedOptions.map((o) => o.value) : [])
                            }
                            placeholder={isFetchingClients ? "Loading clients..." : "Select..."}
                            isLoading={isFetchingClients}
                            isDisabled={!watchedFabricatorId || isFetchingClients}
                            className="text-sm"
                            styles={{ control: (b) => ({ ...b, borderRadius: '10px', backgroundColor: '#f9fafb' }) }}
                          />
                        )}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700 uppercase">Connection Designer</label>
                      <Controller
                        name="connectionDesignerID"
                        control={control}
                        render={({ field }) => (
                          <Select
                            isMulti
                            options={options.connectionDesigners}
                            value={options.connectionDesigners.filter((o) =>
                              (Array.isArray(field.value) ? field.value : []).includes(o.value)
                            )}
                            onChange={(selectedOptions) =>
                              field.onChange(selectedOptions ? selectedOptions.map((o) => o.value) : [])
                            }
                            placeholder="Select Designer"
                            isSearchable
                            isClearable
                            className="text-sm"
                            styles={{ control: (b) => ({ ...b, borderRadius: '10px', backgroundColor: '#f9fafb' }) }}
                          />
                        )}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700 uppercase">CD POC</label>
                      <Controller
                        name="pocOfConnectionDesigner"
                        control={control}
                        render={({ field }) => {
                          const cdIds = Array.isArray(watchedCdId) ? watchedCdId : (watchedCdId ? [watchedCdId] : []);
                          const hasCdSelected = cdIds.length > 0;
                          return (
                            <Select
                              isMulti
                              options={options.pocOfConnectionDesigner}
                              value={options.pocOfConnectionDesigner.filter((o) =>
                                (Array.isArray(field.value) ? field.value : []).includes(o.value)
                              )}
                              onChange={(selectedOptions) =>
                                field.onChange(selectedOptions ? selectedOptions.map((o) => o.value) : [])
                              }
                              placeholder={isFetchingEngineers ? "Loading..." : "Select POC"}
                              isSearchable
                              isClearable
                              isDisabled={!hasCdSelected || isFetchingEngineers}
                              className="text-sm"
                              styles={{ control: (b) => ({ ...b, borderRadius: '10px', backgroundColor: '#f9fafb' }) }}
                            />
                          );
                        }}
                      />
                    </div>
                  </div>
                </div>
              </section>

              {/* Row 2, Col 1: Timeline */}
              <section className="bg-zinc-100 rounded-2xl border border-gray-50 p-8 space-y-8 flex flex-col justify-between lg:col-span-7">
                <div>
                  <SectionTitle title="Timeline" className="mb-6" />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <Input label="Estimated Hours" type="number" className="bg-gray-50/50" {...register("estimatedHours")} />
                    <Input label="Start Date *" type="date" className="bg-gray-50/50" {...register("startDate", { required: "Required" })} />
                    <Input label="Deadline" type="date" className="bg-gray-50/50" {...register("endDate")} />
                    <Input label="Approval Date" type="date" className="bg-gray-50/50" {...register("approvalDate")} />
                    <Input label="Fabrication Date" type="date" className="bg-gray-50/50" {...register("fabricationDate")} />
                    
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700 uppercase">Stage</label>
                      <Controller
                        name="stage"
                        control={control}
                        render={({ field }) => (
                          <Select
                            options={options.stage}
                            value={options.stage.find((o) => o.value === field.value)}
                            onChange={(o) => field.onChange(o?.value || "IFA")}
                            className="text-sm"
                            styles={{ control: (b) => ({ ...b, borderRadius: '10px', backgroundColor: '#f9fafb' }) }}
                          />
                        )}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700 uppercase">Status</label>
                      <Controller
                        name="status"
                        control={control}
                        render={({ field }) => (
                          <Select
                            options={options.status}
                            value={options.status.find((o) => o.value === field.value)}
                            onChange={(o) => field.onChange(o?.value || "ACTIVE")}
                            className="text-sm"
                            styles={{ control: (b) => ({ ...b, borderRadius: '10px', backgroundColor: '#f9fafb' }) }}
                          />
                        )}
                      />
                    </div>
                  </div>
                </div>
              </section>

              {/* Row 2, Col 2: Scope */}
              <section className="bg-zinc-100 rounded-2xl border border-gray-50 p-8 space-y-8 flex flex-col justify-between lg:col-span-5">
                <div>
                  <SectionTitle title="Scope" className="mb-6" />

                  <div className="space-y-8">
                    {/* Connection Design */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 text-green-600">
                        <Layers size={14} />
                        <h4 className="text-sm font-bold uppercase tracking-wider">Connection Design Scope</h4>
                      </div>
                      <div className="space-y-2">
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
                                <div
                                  onClick={() => field.onChange(!field.value)}
                                  className={`
                                    flex items-center justify-between px-4 py-3 rounded-xl border transition-all cursor-pointer text-sm
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
                        <h4 className="text-sm font-bold uppercase tracking-wider">Detailing Scope</h4>
                      </div>
                      <div className="space-y-2">
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
                                <div
                                  onClick={() => field.onChange(!field.value)}
                                  className={`
                                    flex items-center justify-between px-4 py-3 rounded-xl border transition-all cursor-pointer text-sm
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

                    {/* Project Award Status */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 text-green-600">
                        <UserCheck size={14} />
                        <h4 className="text-sm font-bold uppercase tracking-wider">Project Award Status</h4>
                      </div>
                      <div className="space-y-2">
                        <Controller
                          name="isAwarded"
                          control={control}
                          render={({ field }) => (
                            <div
                              onClick={() => {
                                const newValue = !field.value;
                                if (newValue) {
                                  Service.AwardProject(projectId)
                                    .then(() => {
                                      toast.success("Project awarded successfully");
                                      field.onChange(newValue);
                                    })
                                    .catch((err) => {
                                      console.error(err);
                                      toast.error("Failed to award project");
                                    });
                                } else {
                                  field.onChange(newValue);
                                }
                              }}
                              className={`
                                flex items-center justify-between px-4 py-3 rounded-xl border transition-all cursor-pointer text-sm
                                ${field.value ? "bg-green-50 border-green-200 text-green-800" : "bg-gray-50/50 border-gray-100 text-gray-600 hover:border-gray-200"}
                              `}
                            >
                              <span className="font-bold">Is Awarded</span>
                              <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${field.value ? "border-green-600 bg-green-600" : "border-gray-300 bg-white"}`}>
                                {field.value && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                              </div>
                            </div>
                          )}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            </div>

            {/* Submit Actions */}
            <div className="pt-8 flex justify-end">
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-1.5 bg-green-50 text-black border-2 border-green-700/80 rounded-none hover:bg-green-100 transition-all font-bold text-sm uppercase tracking-tight shadow-sm inline-flex items-center justify-center cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EditProject;
