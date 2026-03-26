import { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";
import Input from "../fields/input";
import Button from "../fields/Button";
import MultipleFileUpload from "../fields/MultipleFileUpload";
import Service from "../../api/Service";

import SectionTitle from "../ui/SectionTitle";
import Select from "react-select";
import RichTextEditor from "../fields/RichTextEditor";

const AddRFI = ({
  project,
  onSuccess,
}) => {
  console.log(project);

  const userDetail = useSelector((state) => state.userInfo.userDetail);
  const userRole = userDetail?.role; // CLIENT | ADMIN | STAFF etc.
  const fabricators = useSelector(
    (state) => state.fabricatorInfo.fabricatorData,
  );
  const staff = useSelector((state) => state.userInfo.staffData);
  const project_id = project?.id;
  const fabricatorID = project?.fabricatorID;
  console.log("Fabricators from Redux:", fabricators);

  const { register, setValue, handleSubmit, control, reset } =
    useForm();
  const [description, setDescription] = useState("");
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [cdEngineers, setCdEngineers] = useState([]);
  const [fetchingEngineers, setFetchingEngineers] = useState(false);

  const connectionDesignerID = project?.connectionDesignerID;

  // Match selected fabricator
  const selectedFabricator = fabricators?.find(
    (f) => String(f.id) === String(fabricatorID),
  );
  // Correct POC mapping
  const pocOptions =
    selectedFabricator?.pointOfContact?.map((p) => ({
      label: `${p.firstName} ${p.middleName ?? ""} ${p.lastName}`,

      value: p.id,
    })) ?? [];

  const projectOptions =
    selectedFabricator?.project?.map((p) => ({
      label: p.projectName || p.name,
      value: p.id,
    })) ?? [];

  const recipientOptions =
    staff
      ?.filter((s) => ["ADMIN", "SALES"].includes(s.role))
      .map((s) => ({
        label: `${s.firstName} ${s.lastName}`,
        value: s.id,
      })) ?? [];

  const cdEngineerOptions =
    cdEngineers?.map((e) => ({
      label: `${e.firstName} ${e.lastName} (CD Engineer)`,
      value: e.id,
    })) ?? [];

  const combinedRecipientOptions = [...pocOptions, ...cdEngineerOptions];

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

  const onSubmit = async (data) => {
    try {
      setLoading(true);
      const payload = {
        ...data,
        project_id: project_id,
        fabricator_id: fabricatorID,
        sender_id: userDetail?.id,
        status: true,
        isAproovedByAdmin: "PENDING",
        description,
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

      if (Array.isArray(files)) {
        files.forEach((f) => formData.append("files", f));
      }

      await Service.addRFI(formData);
      toast.success("RFI Submitted Successfully");
      reset();
      setDescription("");
      setFiles([]);
      onSuccess?.();
    } catch (err) {
      console.error(err);
      toast.error(err?.response?.data?.message || "Failed to create RFI");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userRole === "CLIENT") {
      setValue("sender_id", String(userDetail?.id)); // auto-select logged-in client
    }
  }, [userRole]);
  useEffect(() => {
    if (userRole === "CLIENT" && selectedFabricator) {
      setValue("fabricator_id", String(selectedFabricator.id));
      setValue("sender_id", String(userDetail?.id));
    }
  }, [userRole, selectedFabricator]);
  useEffect(() => {
    if (userRole === "CLIENT" && projectOptions.length > 0) {
      setValue("project_id", String(projectOptions[0].value));
    }
  }, [userRole, projectOptions]);

  return (
    <div className="w-full mx-auto bg-white p-2 rounded-xl shadow">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">


        {/* WBT RECIPIENT */}
        <div className="space-y-1">
          <label className="text-sm font-medium text-gray-700">
            Select Recipients *
          </label>
          <Controller
            name="multipleRecipients"
            control={control}
            rules={{ required: "Recipient required" }}
            render={({ field }) => (
              <Select
                isMulti
                placeholder={fetchingEngineers ? "Fetching engineers..." : "Select recipients..."}
                options={combinedRecipientOptions}
                isLoading={fetchingEngineers}
                value={
                  combinedRecipientOptions.filter((o) => (field.value || []).includes(o.value))
                }
                onChange={(options) =>
                  field.onChange(options ? options.map((o) => o.value) : [])
                }
                className="text-sm"
              />
            )}
          />
        </div>

        {/* <SectionTitle title="Details" /> */}

        <Input
          label="Subject"
          placeholder="Enter subject"
          {...register("subject", { required: true })}
        />

        <div className="space-y-1">
          <label className="text-sm font-medium text-gray-700">
            Description
          </label>
          <RichTextEditor
            value={description}
            onChange={setDescription}
            placeholder="Enter RFI description..."
          />
        </div>

        {/* <SectionTitle title="Files" /> */}

        <MultipleFileUpload onFilesChange={setFiles} />

        <div className="flex justify-center w-full mt-6">
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Submitting RFI..." : "Submit RFI"}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default AddRFI;
