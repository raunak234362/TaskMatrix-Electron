import React, { useState } from "react";
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


const AddCO = ({ project, onSuccess }) => {
  const userDetail = useSelector((state) => state.userInfo.userDetail);
  const staff = useSelector((state) => state.userInfo.staffData);
  const fabricators = useSelector(
    (state) => state.fabricatorInfo.fabricatorData,
  );

  const { register, handleSubmit, control, reset, setValue } =
    useForm();
  const [description, setDescription] = useState("");
  const [files, setFiles] = useState([]);

  const fabricatorId = project?.fabricatorID;
  const selectedFabricator = fabricators?.find(
    (f) => String(f.id) === String(fabricatorId),
  );

  React.useEffect(() => {
    if (project && selectedFabricator) {
      const year = new Date().getFullYear();
      const initials = selectedFabricator.fabName
        ? selectedFabricator.fabName
          .split(" ")
          .map((n) => n[0])
          .join("")
          .toUpperCase()
        : "";
      const nextNumber = (project.changeOrders?.length || 0) + 1;
      const formattedNumber = nextNumber.toString().padStart(2, "0");
      const prefilledCO = `CO#-${year}-${initials}-${formattedNumber}`;
      setValue("changeOrderNumber", prefilledCO);
    }
  }, [project, selectedFabricator, setValue]);

  const pocOptions =
    selectedFabricator?.pointOfContact?.map((p) => ({
      label: `${p.firstName} ${p.middleName ?? ""} ${p.lastName}`,
      value: p.id,
    })) ?? [];

  const recipientOptions =
    staff
      ?.filter((s) => s && ["ADMIN", "SALES"].includes(s.role))
      .map((s) => ({
        label: `${s.firstName} ${s.lastName}`,
        value: s.id,
      })) ?? [];

  const onSubmit = async (data) => {
    try {
      const formData = new FormData();
      formData.append("project", project?.id);
      formData.append("sender", userDetail.id);
      
      // Handle multiple recipients
      if (Array.isArray(data.recipients) && data.recipients.length > 0) {
        if (data.recipients.length > 1) {
          data.recipients.forEach((r) => formData.append("multipleRecipients[]", r));
        } else {
          formData.append("recipients", data.recipients[0]);
        }
      } else if (data.recipients) {
        formData.append("recipients", data.recipients);
      }

      formData.append("changeOrderNumber", data.changeOrderNumber);
      formData.append("remarks", data.remarks);
      formData.append("reason", data.reason || "");
      formData.append("link", data.link || "");
      formData.append("description", description);
      formData.append("sentOn", new Date().toISOString());
      formData.append("isAproovedByAdmin", data.isAproovedByAdmin || false);

      files.forEach((file) => formData.append("files", file));

      const response = await Service.ChangeOrder(formData);
      const createdCO = response.data?.data ?? response.data;

      if (createdCO) {
        toast.success("Change Order Created!");

        // This is where your error happened because onSuccess was undefined
        if (typeof onSuccess === "function") {
          onSuccess(createdCO);
        } else {
          console.error("onSuccess prop was not passed to AddCO component");
        }
      }
      reset();
    } catch (err) {
      console.error(err);
      toast.error("Failed to create Change Order");
    }
  };

  return (
    <div className="w-full bg-white p-6 rounded-xl shadow-lg border border-gray-100">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <SectionTitle title="Fabrication & Routing" />

        {/* Fabricator Contact */}
        <Controller
          name="recipients"
          control={control}
          render={({ field }) => (
            <Select
              isMulti
              placeholder="Fabricator Contact"
              options={pocOptions}
              value={pocOptions.filter((o) => (field.value || []).includes(o.value))}
              onChange={(options) => {
                field.onChange(options ? options.map((o) => o.value) : []);
                if (options && options.length > 0) {
                  const names = options.map((o) => o.label.split(" (")[0]).join(", ");
                  setDescription(`<p>Dear ${names},</p><br/>`);
                } else {
                  setDescription("");
                }
              }}
            />
          )}
        />

       

        <SectionTitle title="Details" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="CO Number *"
            {...register("changeOrderNumber", { required: true })}
          />
          <Input
            label="Remarks *"
            {...register("remarks", { required: true })}
          />
          <Input label="Reason" {...register("reason")} />
          <Input label="Reference Link" {...register("link")} />
          <div className="flex items-center gap-2 pt-6">
            <input
              type="checkbox"
              id="isAproovedByAdmin"
              {...register("isAproovedByAdmin")}
              className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
            />
            <label htmlFor="isAproovedByAdmin" className="text-sm font-medium text-gray-700">
              Approved By Admin
            </label>
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium text-gray-700">
            Description
          </label>
          <RichTextEditor
            value={description}
            onChange={setDescription}
            placeholder="Detailed description..."
          />
        </div>

        <SectionTitle title="Files" />
        <MultipleFileUpload onFilesChange={setFiles} />

        <div className="flex justify-center w-full pt-4">
          <Button
            type="submit"
            className="w-full bg-green-600 hover:bg-green-700 text-white px-8 py-2 rounded-lg transition-all"
          >
            Save & Continue
          </Button>
        </div>
      </form>
    </div>
  );
};

export default AddCO;
