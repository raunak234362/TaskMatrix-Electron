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

const AddSubmittal = ({ project, initialData, onSuccess }) => {
  const userDetail = useSelector((state) => state.userInfo.userDetail);
  const fabricators = useSelector(
    (state) => state.fabricatorInfo.fabricatorData,
  );
  const staff = useSelector((state) => state.userInfo.staffData);
  const [milestones, setMilestones] = useState([]);
  const projectId = project?.id;
  const fabricatorId = project?.fabricatorID;

  const fetchMileStone = async () => {
    try {
      const response = await Service.GetProjectMilestoneById(project.id);
      if (response && response.data) {
        setMilestones(response.data);
      }
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    fetchMileStone();
  }, [project.id]);

  const { register, handleSubmit, control, setValue, reset } = useForm({
    defaultValues: {
      subject: initialData?.subject || "",
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
      ?.filter((s) => ["ADMIN", "SALES"].includes(s.role))
      .map((s) => ({
        label: `${s.firstName} ${s.lastName}`,
        value: s.id,
      })) ?? [];

  const activeRecipientOptions = isCDMode ? cdEngineerOptions : pocOptions;

  const mileStoneOptions =
    milestones?.map((m) => ({
      label: m.subject || m.description || "Unnamed Milestone",
      value: m.id,
    })) ?? [];

  useEffect(() => {
    setValue("sender_id", String(userDetail?.id));
  }, []);

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
        } else if (Array.isArray(value)) {
          value.forEach((v) => formData.append(key, v));
        } else if (value !== null && value !== undefined) {
          formData.append(key, value);
        }
      });

      await Service.AddSubmittal(formData);
      toast.success("Submittal Created Successfully!");

      reset();
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
    if (milestones.length > 0) {
      setValue("mileStoneId", String(milestones[0].id));
    }
  }, [milestones]);

  return (
    <div className="w-full mx-auto bg-white p-4 rounded-xl shadow">
      {/* Recipient Category Toggle */}
      <div className="flex bg-gray-100/50 p-1 rounded-lg gap-1 mb-4">
        <button
          type="button"
          onClick={() => {
            setIsCDMode(false);
            setValue("multipleRecipients", []); // Clear selection when switching modes
          }}
          className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all ${
            !isCDMode
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
          }}
          className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all ${
            isCDMode
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
                onChange={(options) =>
                  field.onChange(options ? options.map((o) => o.value) : [])
                }
                className="text-sm"
              />
            )}
          />
        </div>
<label className="text-sm font-medium text-gray-700">
          Select Milestone
        </label>
        <Controller
          name="mileStoneId"
          control={control}
          render={({ field }) => (
            <Select
              placeholder="Select Project Milestone"
              options={mileStoneOptions}
              value={
                mileStoneOptions.find((o) => o.value === field.value) ?? null
              }
              onChange={(option) => field.onChange(option?.value || null)}
            />
          )}
        />

        <Input
          label="Subject"
          placeholder="Enter Submittal Subject"
          {...register("subject", { required: true })}
        />

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


        <MultipleFileUpload onFilesChange={setFiles} />

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
