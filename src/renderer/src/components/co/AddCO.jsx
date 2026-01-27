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

  const { register, handleSubmit, control, reset } =
    useForm();
  const [description, setDescription] = useState("");
  const [files, setFiles] = useState([]);

  const recipientOptions =
    staff
      ?.filter((s) => ["ADMIN", "SALES"].includes(s.role))
      .map((s) => ({
        label: `${s.firstName} ${s.lastName}`,
        value: s.id,
      })) ?? [];

  const onSubmit = async (data) => {
    try {
      const formData = new FormData();
      formData.append("project", project?.id);
      formData.append("sender", userDetail.id);
      formData.append("recipients", data.recipients);
      formData.append("changeOrderNumber", data.changeOrderNumber);
      formData.append("remarks", data.remarks);
      formData.append("reason", data.reason || "");
      formData.append("link", data.link || "");
      formData.append("description", description);
      formData.append("sentOn", new Date().toISOString());
      formData.append("isAproovedByAdmin", "PENDING");

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
        <Controller
          name="recipients"
          control={control}
          rules={{ required: "Recipient is required" }}
          render={({ field }) => (
            <Select
              placeholder="Select Recipient *"
              options={recipientOptions}
              value={recipientOptions.find((o) => o.value === field.value)}
              onChange={(option) => field.onChange(option?.value)}
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
