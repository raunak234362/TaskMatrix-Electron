/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { useSelector, useDispatch } from "react-redux";
import { toast } from "react-toastify";
import Input from "../fields/input";
import Button from "../fields/Button";
import MultipleFileUpload from "../fields/MultipleFileUpload";
import Service from "../../api/Service";



import SectionTitle from "../ui/SectionTitle";
import Select from "../fields/Select";
import Toggle from "../fields/Toggle";
import RichTextEditor from "../fields/RichTextEditor";
import { addRFQ } from "../../store/rfqSlice";


const AddRFQ = ({ onSuccess }) => {
  const dispatch = useDispatch();
  const fabricators = useSelector(
    (state) => state.fabricatorInfo?.fabricatorData,
  ) || [];

  const staffData = useSelector((state) => state.userInfo?.staffData);

  // const userType =
  typeof window !== "undefined" ? sessionStorage.getItem("userType") : null;

  const {
    register,
    handleSubmit,
    control,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      tools: "NO_PREFERENCE",
    },
  });

  const selectedFabricatorId = watch("fabricatorId");

  const [description, setDescription] = useState("");

  // --- FETCH STAFF ONCE ---
  useEffect(() => {
    const loadStaff = async () => {
      try {
        await Service.FetchEmployeeByRole("CLIENT");
      } catch (err) {
        console.error("Staff Fetch Failed:", err);
      }
    };
    loadStaff();
  }, []);

  // --- WBT RECIPIENT OPTIONS ---
  const recipientOption =
    staffData
      ?.filter(
        (u) => u.role === "SALES_MANAGER" || u.role === "ADMIN",
      )
      .map(
        (u) => ({
          label: `${u.firstName} ${u.middleName ?? ""} ${u.lastName}`,
          value: u.id,
        }),
      ) ?? [];
  // useEffect(() => {
  //   if (tools !== "OTHER") setValue("otherTool", "");
  // }, [tools, setValue]);

  // --- FABRICATOR OPTIONS ---
  const fabOptions =
    fabricators?.map((fab) => ({
      label: fab.fabName,
      value: fab.id,
    })) ?? [];

  const selectedFabricator = fabricators?.find(
    (fab) => String(fab.id) === String(selectedFabricatorId),
  );

  const clientOptions =
    selectedFabricator?.pointOfContact?.map((client) => ({
      label: `${client.firstName} ${client.middleName ?? ""} ${client.lastName
        }`,
      value: client.id,
    })) ?? [];

  // selector for the user

  const userDetail = useSelector((state) => state.userInfo?.userDetail);
  const userRole = userDetail?.role;
  const fabricatorId = userDetail?.FabricatorPointOfContacts[0]?.id;
  console.log(userDetail);

  // --- SUBMIT ---
  const onSubmit = async (data) => {
    try {
      const basePayload = {
        projectNumber: data.projectNumber || "",
        projectName: data.projectName,
        subject: data.subject || "",
        description,
        tools: data.tools,
        bidPrice: data.bidPrice,
        estimationDate: data.estimationDate
          ? new Date(data.estimationDate).toISOString()
          : null,
        status: "IN_REVIEW",
        wbtStatus: "RECEIVED",
        connectionDesign: data.connectionDesign,
        miscDesign: data.miscDesign,
        customerDesign: data.customerDesign,
        detailingMain: data.detailingMain,
        detailingMisc: data.detailingMisc,

        files: data.files ?? [],
      };

      let payload;

      if (userRole === "CLIENT") {
        payload = {
          ...basePayload,
          senderId: userDetail?.id,
          fabricatorId: fabricatorId,
          recipientId: data.recipientId || "", // must exist
          salesPersonId: null, // client doesn't assign
        };
      } else {
        payload = {
          ...basePayload,
          senderId: data.senderId,
          recipientId: data.recipientId,
          fabricatorId: data.fabricatorId,
          salesPersonId: data.salesPersonId ?? null,
        };
      }

      // Convert to FormData
      const formData = new FormData();
      for (const [key, value] of Object.entries(payload)) {
        if (key === "files" && Array.isArray(value)) {
          value.forEach((file) => formData.append("files", file));
        } else if (value !== undefined && value !== null) {
          formData.append(key, value);
        }
      }

      const response = await Service.addRFQ(formData);
      const createdRFQ = response.data || response.rfq || response;

      if (createdRFQ) {
        // Enrich with form data for immediate display in the table
        const selectedFab = fabricators?.find(
          (f) => String(f.id) === String(data.fabricatorId),
        );
        const selectedSender = clientOptions?.find(
          (c) => String(c.value) === String(data.senderId),
        );

        const enrichedRFQ = {
          ...createdRFQ,
          projectName: data.projectName,
          projectNumber: data.projectNumber,
          status: "IN_REVIEW",
          estimationDate: data.estimationDate,
          tools: data.tools,
          fabricator: selectedFab || createdRFQ.fabricator,
          sender: selectedSender
            ? {
              firstName: selectedSender.label.split(" ")[0],
              lastName: selectedSender.label.split(" ").slice(1).join(" "),
            }
            : userDetail,
        };
        dispatch(addRFQ(enrichedRFQ));
      }
      toast.success("RFQ Created Successfully");
      setDescription("");
      reset();
      onSuccess?.();
    } catch (err) {
      console.error(err);
      toast.error("Failed to create RFQ");
    }
  };

  const selectedFabricatorOption =
    fabOptions.find((opt) => opt.value === selectedFabricatorId) || null;

  return (
    <div className="w-full mx-auto bg-white/80 backdrop-blur-lg rounded-xl shadow-lg p-3 md:p-5">
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-4 md:space-y-8"
      >
        <SectionTitle title="Project Information" />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          {/* FABRICATOR (HIDDEN FOR CLIENTS) */}
          {userRole !== "CLIENT" && (
            <>
              <div>
                <label className="font-semibold text-gray-700 mb-1 block">
                  Fabricator *
                </label>

                <Controller
                  name="fabricatorId"
                  control={control}
                  disabled={userRole === "CLIENT"}
                  rules={{ required: "Fabricator is required" }}
                  render={({ field }) => {
                    const normalizedValue =
                      field.value ??
                      selectedFabricatorOption?.value ??
                      undefined;
                    const stringValue =
                      typeof normalizedValue === "number"
                        ? String(normalizedValue)
                        : normalizedValue;
                    return (
                      <Select
                        name={field.name}
                        options={fabOptions}
                        value={stringValue}
                        onChange={(_, value) => {
                          const sanitized = value ?? "";
                          field.onChange(sanitized);
                          setValue("fabricatorId", sanitized);
                        }}
                      />
                    );
                  }}
                />
                {errors.fabricatorId && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.fabricatorId.message}
                  </p>
                )}
              </div>

              <div>
                <label className="font-semibold text-gray-700 mb-1 block">
                  Fabricator Contact *
                </label>
                <Controller
                  name="senderId"
                  control={control}
                  disabled={userRole === "CLIENT"}
                  rules={{ required: "Fabricator contact is required" }}
                  render={({ field }) => (
                    <Select
                      name={field.name}
                      options={clientOptions}
                      value={field.value ? String(field.value) : undefined}
                      onChange={(_, value) => field.onChange(value ?? "")}
                    />
                  )}
                />

                {errors.senderId && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.senderId.message}
                  </p>
                )}
              </div>
            </>
          )}

          {/* CONTACT */}
          <div className="md:col-span-2">
            <label className="font-semibold text-gray-700 mb-1 block">
              WBT Point of Contact *
            </label>

            <Controller
              name="recipientId"
              control={control}
              rules={{ required: "WBT contact is required" }}
              render={({ field }) => (
                <Select
                  name={field.name}
                  options={recipientOption}
                  value={field.value ? String(field.value) : undefined}
                  onChange={(_, value) => field.onChange(value ?? "")}
                />
              )}
            />

            {errors.recipientId && (
              <p className="text-red-500 text-xs mt-1">
                {errors.recipientId.message}
              </p>
            )}
          </div>

          {/* PROJECT NAME */}
          <div className="md:col-span-2">
            <Input
              label="Project Name *"
              {...register("projectName", {
                required: "Project name is required",
              })}
              placeholder="Enter project name"
            />
          </div>

          <Input
            label="Project Number"
            {...register("projectNumber")}
            placeholder="Optional"
          />
        </div>

        {/* DETAILS */}
        <SectionTitle title="Details" />

        <Input label="Subject" {...register("subject")} />

        <div className="space-y-1">
          <label className="text-sm font-medium text-gray-700">
            Description
          </label>
          <RichTextEditor
            value={description}
            onChange={setDescription}
            placeholder="Enter description..."
          />
        </div>

        {/* TOOLS */}
        <div>
          <label className="font-semibold text-gray-700 mb-1 block">
            Tools *
          </label>

          <Controller
            name="tools"
            control={control}
            rules={{ required: "Tools selection is required" }}
            render={({ field }) => (
              <Select
                name={field.name}
                options={[
                  "TEKLA",
                  "SDS2",
                  "BOTH",
                  "NO_PREFERENCE",
                  "OTHER",
                ].map((t) => ({ label: t, value: t }))}
                value={field.value}
                onChange={(_, value) => field.onChange(value ?? "")}
              />
            )}
          />
        </div>

        <Input
          label={`Bid Price (${selectedFabricator?.currencyType || "USD"})`}
          type="number"
          {...register("bidPrice")}
        />

        <Input
          label="Due Date *"
          type="date"
          {...register("estimationDate", { required: "Due date is required" })}
        />

        {/* SCOPES */}
        <SectionTitle title="Connection Design Scope" />

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <Toggle label="Main Design" {...register("connectionDesign")} />
          <Toggle label="Misc Design" {...register("miscDesign")} />
          <Toggle label="Customer Design" {...register("customerDesign")} />
        </div>

        <SectionTitle title="Detailing Scope" />

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <Toggle label="Main Steel" {...register("detailingMain")} />
          <Toggle label="Misc Steel" {...register("detailingMisc")} />
        </div>

        {/* FILES */}
        <SectionTitle title="Attach Files" />

        <Controller
          name="files"
          control={control}
          render={({ field }) => (
            <MultipleFileUpload
              // When files change, update RHF's state
              onFilesChange={(files) => {
                field.onChange(files);
              }}
            />
          )}
        />

        <div className="flex justify-center w-full mt-6">
          <Button type="submit" disabled={isSubmitting} className="w-full">
            {isSubmitting ? "Creating..." : "Create RFQ"}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default AddRFQ;
