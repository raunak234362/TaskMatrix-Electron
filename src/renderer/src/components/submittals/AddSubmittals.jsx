import { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";
import Select from "react-select";
import Input from "../fields/input";
import Button from "../fields/Button";
import MultipleFileUpload from "../fields/MultipleFileUpload";
import SectionTitle from "../ui/SectionTitle";
import Service from "../../api/Service";

import RichTextEditor from "../fields/RichTextEditor";
import { truncateWords } from "../../utils/stringUtils";

const AddSubmittal = ({ project, initialData, onSuccess }) => {
  const userDetail = useSelector((state) => state.userInfo.userDetail);
  const fabricators = useSelector(
    (state) => state.fabricatorInfo.fabricatorData,
  );
  const staff = useSelector((state) => state.userInfo.staffData);
  const [milestones, setMilestones] = useState([]);
  const [submittedMilestoneIds, setSubmittedMilestoneIds] = useState(new Set());
  const projectId = project?.id;
  const fabricatorId = project?.fabricatorID;

  const fetchMileStone = async () => {
    try {
      const response = await Service.GetPendingSubmittal();
      const allPending = Array.isArray(response) ? response : response?.data || [];
      const projectMilestones = allPending.filter(
        (m) =>
          String(m.projectId || m.project_id || m.project?.id) ===
          String(project.id || project._id),
      );
      setMilestones(projectMilestones);

      if (projectId) {
        const submittalsRes = await Service.GetSubmittalByProjectId(projectId);
        const submittalsList = Array.isArray(submittalsRes) ? submittalsRes : [];
        const submittedIds = new Set();
        submittalsList.forEach((sub) => {
          // Check all possible milestone link fields
          if (sub.mileStoneId) submittedIds.add(String(sub.mileStoneId));
          if (sub.mileStoneBelongsTo) {
            const id = sub.mileStoneBelongsTo.id || sub.mileStoneBelongsTo._id;
            if (id) submittedIds.add(String(id));
          }
          if (Array.isArray(sub.mileStones)) {
            sub.mileStones.forEach((m) => {
              const id = m.id || m._id;
              if (id) submittedIds.add(String(id));
            });
          }
          // mileStoneIds is the primary link field
          if (Array.isArray(sub.mileStoneIds)) {
            sub.mileStoneIds.forEach((link) => {
              const id = typeof link === "string" ? link : (link?.id || link?.mileStoneId || link?.milestoneId);
              if (id) submittedIds.add(String(id));
            });
          }
        });
        setSubmittedMilestoneIds(submittedIds);
      }
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    fetchMileStone();
  }, [project.id, project._id]);

  const { register, handleSubmit, control, setValue, reset } = useForm({
    defaultValues: {
      subject: initialData?.subject || "",
      stage: initialData?.stage || "",
      mileStoneIds: [],   // array of milestone IDs
      isConnectionDesign: false,
    },
  });
  const [description, setDescription] = useState(
    initialData?.description || "",
  );
  const [files, setFiles] = useState([]);
  const [cdEngineers, setCdEngineers] = useState([]);
  const [fetchingEngineers, setFetchingEngineers] = useState(false);
  const [isCDMode, setIsCDMode] = useState(false);

  const connectionDesignerID = project?.connectionDesignerID;

  useEffect(() => {
    const fetchEngineers = async () => {
      if (connectionDesignerID) {
        try {
          setFetchingEngineers(true);
          const res = await Service.FetchConnectionDesignerByID(connectionDesignerID);
          setCdEngineers(res?.data?.CDEngineers || []);
        } catch (err) {
          console.error("Failed to fetch engineers", err);
          setCdEngineers([]);
        } finally {
          setFetchingEngineers(false);
        }
      } else {
        setCdEngineers([]);
      }
    };
    fetchEngineers();
  }, [connectionDesignerID]);

  const selectedFabricator = fabricators?.find(
    (f) => String(f.id) === String(fabricatorId),
  );

  const pocOptions =
    selectedFabricator?.pointOfContact?.map((p) => ({
      label: `${p.firstName} ${p.middleName ?? ""} ${p.lastName}`,
      value: p.id,
    })) ?? [];

  const cdEngineerOptions =
    cdEngineers?.map((e) => ({
      label: `${e.firstName} ${e.lastName} (CD Engineer)`,
      value: e.id,
    })) ?? [];

  const recipientOptions =
    staff
      ?.filter((s) => s && ["ADMIN", "SALES"].includes(s.role))
      .map((s) => ({
        label: `${s.firstName} ${s.lastName}`,
        value: s.id,
      })) ?? [];

  const activeRecipientOptions = isCDMode ? cdEngineerOptions : pocOptions;

  const filteredMilestones =
    milestones?.filter((m) => {
      if (isCDMode) {
        return !!m.isConnectionDesign;
      } else {
        return !m.isConnectionDesign;
      }
    }) ?? [];

  const mileStoneOptions =
    filteredMilestones.map((m) => {
      const labelParts = [];
      if (m.subject) {
        labelParts.push(m.subject);
      } else if (m.description) {
        // Strip HTML tags from description for label
        const plainDesc = truncateWords(m.description, 10);
        labelParts.push(plainDesc);
      }

      if (m.subSubject) {
        labelParts.push(m.subSubject);
      }

      if (m.stage) {
        labelParts.push(m.stage);
      }

      const mId = m.id || m._id;
      const isAlreadySubmitted = submittedMilestoneIds.has(String(mId));
      let label = labelParts.join(" - ") || "Unnamed Milestone";
      if (isAlreadySubmitted) {
        label += " (Already Submitted)";
      }

      return {
        label,
        value: mId,
        isDisabled: isAlreadySubmitted,
      };
    }) ?? [];

  useEffect(() => {
    setValue("sender_id", String(userDetail?.id));
  }, []);

  useEffect(() => {
    register("isConnectionDesign");
  }, [register]);

  const [loading, setLoading] = useState(false);

  const onSubmit = async (data) => {
    try {
      setLoading(true);
      const payload = {
        ...data,
        fabricator_id: fabricatorId,
        project_id: projectId,

        description,
        files,
      };

      const formData = new FormData();
      Object.entries(payload).forEach(([key, value]) => {
        if (key === "multipleRecipients" && Array.isArray(value)) {
          value.forEach((v) => formData.append("multipleRecipients[]", v));
        } else if (key === "mileStoneIds") {
          // Send as mileStoneIds[] array
          const links = Array.isArray(value) ? value : (value ? [value] : []);
          links.forEach((v) => formData.append("mileStoneIds[]", v));
        } else if (Array.isArray(value)) {
          value.forEach((v) => formData.append(key, v));
        } else if (value !== null && value !== undefined) {
          formData.append(key, value);
        }
      });

      await Service.AddSubmittal(formData);
      toast.success("Submittal Created Successfully!");

      reset();
      await fetchMileStone();
      setDescription("");
      setFiles([]);
      onSuccess?.();
    } catch (err) {
      console.error(err);
      toast.error("Failed to create Submittal");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const currentFiltered = milestones?.filter((m) => {
      if (isCDMode) {
        return !!m.isConnectionDesign;
      } else {
        return !m.isConnectionDesign;
      }
    }) ?? [];

    const availableMilestones = currentFiltered.filter(
      (m) => !submittedMilestoneIds.has(String(m.id || m._id))
    );

    if (availableMilestones.length > 0) {
      const firstMilestone = availableMilestones[0];
      const firstId = firstMilestone.id || firstMilestone._id;
      if (firstId) {
        setValue("mileStoneIds", [String(firstId)]);
        setValue("stage", firstMilestone.stage || "");
      }
    } else {
      setValue("mileStoneIds", []);
      setValue("stage", "");
    }
  }, [milestones, isCDMode, submittedMilestoneIds]);

  return (
    <div className="w-full mx-auto bg-white p-4 rounded-xl shadow">
      {/* Recipient Category Toggle */}
      <div className="flex bg-gray-100/50 p-1 rounded-lg gap-1 mb-4">
        <button
          type="button"
          onClick={() => {
            setIsCDMode(false);
            setValue("multipleRecipients", []); // Clear selection when switching modes
            setValue("isConnectionDesign", false);
          }}
          className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all ${!isCDMode
            ? "bg-white text-black shadow-sm"
            : "text-gray-500 hover:text-gray-700"
            }`}
        >
          CLIENT
        </button>
        <button
          type="button"
          onClick={() => {
            setIsCDMode(true);
            setValue("multipleRecipients", []); // Clear selection when switching modes
            setValue("isConnectionDesign", true);
          }}
          className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all ${isCDMode
            ? "bg-white text-black shadow-sm"
            : "text-gray-500 hover:text-gray-700"
            }`}
        >
          CONNECTION DESIGNER
        </button>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

        <div className="space-y-1">
          <label className="text-sm font-medium text-gray-700">
            Select {isCDMode ? "CD Engineer" : "Client"} Recipients *
          </label>
          <Controller
            name="multipleRecipients"
            control={control}
            rules={{ required: "Recipient required" }}
            render={({ field }) => (
              <Select
                isMulti
                placeholder={
                  fetchingEngineers
                    ? "Fetching engineers..."
                    : `Select ${isCDMode ? "engineers" : "POCs"}...`
                }
                options={activeRecipientOptions}
                isLoading={fetchingEngineers}
                value={
                  activeRecipientOptions.filter((o) => (field.value || []).includes(o.value))
                }
                onChange={(options) => {
                  field.onChange(options ? options.map((o) => o.value) : []);
                  if (options && options.length > 0) {
                    const names = options.map((o) => o.label.split(" (")[0]).join(", ");
                    setDescription(`<p>Dear ${names},</p><br/>`);
                  } else {
                    setDescription("");
                  }
                }}
                className="text-sm"
              />
            )}
          />
        </div>
        <label className="text-sm font-medium text-gray-700">
          Select Milestone
        </label>
        <Controller
          name="mileStoneIds"
          control={control}
          render={({ field }) => {
            // field.value is an array; display the first selected milestone
            const selectedId = Array.isArray(field.value) ? field.value[0] : field.value;
            return (
              <Select
                placeholder="Select Project Milestone"
                options={mileStoneOptions}
                value={
                  mileStoneOptions.find((o) => String(o.value) === String(selectedId)) || null
                }
                onChange={(option) => {
                  const selectedVal = option ? option.value : "";
                  // store as array
                  field.onChange(selectedVal ? [String(selectedVal)] : []);
                  if (selectedVal) {
                    const selectedMilestone = milestones.find(
                      (m) => String(m.id || m._id) === String(selectedVal),
                    );
                    if (selectedMilestone) {
                      setValue("stage", selectedMilestone.stage || "");
                    }
                  } else {
                    setValue("stage", "");
                  }
                }}
              />
            );
          }}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Stage"
            placeholder="Stage"
            {...register("stage", { required: true })}
          />
          <Input
            label="Subject"
            placeholder="Enter Submittal Subject"
            {...register("subject", { required: true })}
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium text-gray-700">
            Description
          </label>
          <RichTextEditor
            value={description}
            onChange={setDescription}
            placeholder="Enter submittal description..."
          />
        </div>


        <MultipleFileUpload onFilesChange={setFiles} initialFiles={files} />

        <div className="flex justify-center w-full mt-6">
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Submitting..." : "Submit Submittal"}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default AddSubmittal;
