/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { useSelector, useDispatch } from "react-redux";
import { toast } from "react-toastify";
import Input from "../fields/input";
import MultipleFileUpload from "../fields/MultipleFileUpload";
import Service from "../../api/Service";

import { 
  Loader2, 
  Layers, 
  Globe, 
  Percent, 
  Calendar, 
  Sparkles, 
  Building2, 
  User, 
  Hash, 
  Mail, 
  FileText, 
  Wrench, 
  DollarSign, 
  Layout, 
  Flag 
} from "lucide-react";

import Select from "../fields/Select";
import Toggle from "../fields/Toggle";
import RichTextEditor from "../fields/RichTextEditor";
import { addRFQ } from "../../store/rfqSlice";
import { motion } from "framer-motion";

const STATES = {
  "USA": [
    "Alabama", "Alaska", "Arizona", "Arkansas", "California", "Colorado", "Connecticut", "Delaware", "Florida", "Georgia", 
    "Hawaii", "Idaho", "Illinois", "Indiana", "Iowa", "Kansas", "Kentucky", "Louisiana", "Maine", "Maryland", 
    "Massachusetts", "Michigan", "Minnesota", "Mississippi", "Missouri", "Montana", "Nebraska", "Nevada", "New Hampshire", "New Jersey", 
    "New Mexico", "New York", "North Carolina", "North Dakota", "Ohio", "Oklahoma", "Oregon", "Pennsylvania", "Rhode Island", "South Carolina", 
    "South Dakota", "Tennessee", "Texas", "Utah", "Vermont", "Virginia", "Washington", "West Virginia", "Wisconsin", "Wyoming"
  ],
  "US": [
    "Alabama", "Alaska", "Arizona", "Arkansas", "California", "Colorado", "Connecticut", "Delaware", "Florida", "Georgia", 
    "Hawaii", "Idaho", "Illinois", "Indiana", "Iowa", "Kansas", "Kentucky", "Louisiana", "Maine", "Maryland", 
    "Massachusetts", "Michigan", "Minnesota", "Mississippi", "Missouri", "Montana", "Nebraska", "Nevada", "New Hampshire", "New Jersey", 
    "New Mexico", "New York", "North Carolina", "North Dakota", "Ohio", "Oklahoma", "Oregon", "Pennsylvania", "Rhode Island", "South Carolina", 
    "South Dakota", "Tennessee", "Texas", "Utah", "Vermont", "Virginia", "Washington", "West Virginia", "Wisconsin", "Wyoming"
  ],
  "UNITED STATES": [
    "Alabama", "Alaska", "Arizona", "Arkansas", "California", "Colorado", "Connecticut", "Delaware", "Florida", "Georgia", 
    "Hawaii", "Idaho", "Illinois", "Indiana", "Iowa", "Kansas", "Kentucky", "Louisiana", "Maine", "Maryland", 
    "Massachusetts", "Michigan", "Minnesota", "Mississippi", "Missouri", "Montana", "Nebraska", "Nevada", "New Hampshire", "New Jersey", 
    "New Mexico", "New York", "North Carolina", "North Dakota", "Ohio", "Oklahoma", "Oregon", "Pennsylvania", "Rhode Island", "South Carolina", 
    "South Dakota", "Tennessee", "Texas", "Utah", "Vermont", "Virginia", "Washington", "West Virginia", "Wisconsin", "Wyoming"
  ],
  "CANADA": [
    "Alberta", "British Columbia", "Manitoba", "New Brunswick", "Newfoundland and Labrador", "Nova Scotia", "Ontario", "Prince Edward Island", "Quebec", "Saskatchewan", 
    "Northwest Territories", "Nunavut", "Yukon"
  ],
  "INDIA": [
    "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", 
    "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab", 
    "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal"
  ]
};

const AddRFQ = ({ onSuccess }) => {
  const dispatch = useDispatch();
  const fabricators = useSelector(
    (state) => state.fabricatorInfo?.fabricatorData,
  ) || [];

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
  const mtoStickModelEnabled = watch("mtoStickModelEnabled");

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

  // --- FABRICATOR OPTIONS ---
  const fabOptions =
    fabricators?.map((fab) => ({
      label: fab.fabName,
      value: String(fab.id),
    })) ?? [];

  const selectedFabricator = fabricators?.find(
    (fab) => String(fab.id) === String(selectedFabricatorId),
  );

  const fabricatorCountry = selectedFabricator?.branches?.find(b => b.isHeadquarters)?.country || selectedFabricator?.branches?.[0]?.country;

  const countryOptions = React.useMemo(() => [
    { label: "US", value: "US" },
    { label: "Canada", value: "CANADA" },
    { label: "India", value: "INDIA" },
  ], []);

  const selectedCountry = watch("country");
  const selectedState = watch("state");

  const stateOptions = React.useMemo(() => {
    const countryToUse = selectedCountry || fabricatorCountry;
    if (!countryToUse) return [];
    const countryKey = countryToUse.toUpperCase();
    const states = STATES[countryKey];
    if (states) {
      return states.map((s) => ({ label: s, value: s }));
    }
    return [];
  }, [selectedCountry, fabricatorCountry]);

  // Sync country from fabricator if available
  useEffect(() => {
    if (fabricatorCountry) {
      setValue("country", fabricatorCountry.toUpperCase());
    }
  }, [fabricatorCountry, setValue]);

  // Combine state and country into location
  useEffect(() => {
    if (stateOptions.length > 0) {
      if (selectedCountry && selectedState) {
        setValue("location", `${selectedState}, ${selectedCountry}`);
      } else if (selectedCountry) {
        setValue("location", selectedCountry);
      }
    }
  }, [selectedCountry, selectedState, setValue, stateOptions.length]);

  const clientOptions =
    selectedFabricator?.pointOfContact?.map((client) => ({
      label: `${client.firstName} ${client.middleName ?? ""} ${client.lastName
        }`,
      value: String(client.id),
    })) ?? [];

  const userDetail = useSelector((state) => state.userInfo?.userDetail);
  const userRole = userDetail?.role;

  // Auto-populate form fields for client roles
  useEffect(() => {
    if (userDetail && (userRole === "CLIENT" || userRole === "CLIENT_ADMIN" || userRole === "CLIENT_ESTIMATOR")) {
      if (userDetail.country && !selectedCountry) {
        setValue("country", userDetail.country.toUpperCase());
      }
      
      const clientFabId = userDetail?.FabricatorPointOfContacts?.[0]?.fabricatorId || userDetail?.FabricatorPointOfContacts?.[0]?.id;
      if (clientFabId) {
        setValue("fabricatorId", String(clientFabId));
      }
      
      if (userDetail.id) {
        setValue("senderId", userDetail.id);
      }
    }
  }, [userDetail, userRole, selectedCountry, setValue]);

  // --- REAL-TIME MTO DESCRIPTION SYNC ---
  const mainSteel = watch("mainSteel");
  const mainSteelMiscAttachments = watch("mainSteelMiscAttachments");
  const mainSteelConnections = watch("mainSteelConnections");
  const miscSteel = watch("miscSteel");
  const miscSteelConnection = watch("miscSteelConnection");
  const miscSteelAttachments = watch("miscSteelAttachments");
  const mto3dModel = watch("mto3dModel");
  const mtoTeklaSDS2 = watch("mtoTeklaSDS2");
  const mtoIFC = watch("mtoIFC");
  const mtoEJE = watch("mtoEJE");
  const mtoKss = watch("mtoKss");
  const mtoBoltList = watch("mtoBoltList");
  const mtoMaterialSummary = watch("mtoMaterialSummary");

  useEffect(() => {
    if (!mtoStickModelEnabled) return;

    const sections = [];

    const mainSteelList = [];
    if (mainSteel) mainSteelList.push("Main Steel");
    if (mainSteelMiscAttachments) mainSteelList.push("Main steel Misc Attachments");
    if (mainSteelConnections) mainSteelList.push("Main Steel Connections");
    if (mainSteelList.length > 0) {
      sections.push(`<p><strong>Main Steel Scope:</strong></p><ul>${mainSteelList.map(item => `<li>${item}</li>`).join("")}</ul>`);
    }

    const miscSteelList = [];
    if (miscSteel) miscSteelList.push("Misc steel");
    if (miscSteelConnection) miscSteelList.push("Misc Steel Connection");
    if (miscSteelAttachments) miscSteelList.push("Misc steel attachments");
    if (miscSteelList.length > 0) {
      sections.push(`<p><strong>Miscellaneous Steel Scope:</strong></p><ul>${miscSteelList.map(item => `<li>${item}</li>`).join("")}</ul>`);
    }

    const mtoFileList = [];
    if (mto3dModel) mtoFileList.push("3d Model");
    if (mtoTeklaSDS2) mtoFileList.push("Tekla/SDS-2");
    if (mtoIFC) mtoFileList.push("IFC files");
    if (mtoEJE) mtoFileList.push("EJE files");
    if (mtoKss) mtoFileList.push("Kss files");
    if (mtoBoltList) mtoFileList.push("bolt List");
    if (mtoMaterialSummary) mtoFileList.push("Material Summary Report");
    if (mtoFileList.length > 0) {
      sections.push(`<p><strong>MTO Files Requirements:</strong></p><ul>${mtoFileList.map(item => `<li>${item}</li>`).join("")}</ul>`);
    }

    setValue("MTOStickModel", sections.join(""));
  }, [
    mtoStickModelEnabled,
    mainSteel, mainSteelMiscAttachments, mainSteelConnections,
    miscSteel, miscSteelConnection, miscSteelAttachments,
    mto3dModel, mtoTeklaSDS2, mtoIFC, mtoEJE, mtoKss, mtoBoltList, mtoMaterialSummary,
    setValue
  ]);

  // --- SUBMIT ---
  const onSubmit = async (data) => {
    try {
      const basePayload = {
        projectNumber: data.projectNumber || "",
        projectName: data.projectName,
        subject: data.subject || "",
        description,
        tools: data.tools,
        location: data.location,
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
        MTOManual: !!data.MTOManual,
        MTOStickModel: data.mtoStickModelEnabled ? (data.MTOStickModel || "") : "",
        mainSteel: !!data.mainSteel,
        mainSteelMiscAttachments: !!data.mainSteelMiscAttachments,
        mainSteelConnections: !!data.mainSteelConnections,
        miscSteel: !!data.miscSteel,
        miscSteelConnection: !!data.miscSteelConnection,
        miscSteelAttachments: !!data.miscSteelAttachments,
        mto3dModel: !!data.mto3dModel,
        mtoTeklaSDS2: !!data.mtoTeklaSDS2,
        mtoIFC: !!data.mtoIFC,
        mtoEJE: !!data.mtoEJE,
        mtoKss: !!data.mtoKss,
        mtoBoltList: !!data.mtoBoltList,
        mtoMaterialSummary: !!data.mtoMaterialSummary,

        files: data.files ?? [],
      };

      let payload;

      if (userRole === "CLIENT" || userRole === "CLIENT_ADMIN" || userRole === "CLIENT_ESTIMATOR") {
        payload = {
          ...basePayload,
          senderId: userDetail?.id,
          fabricatorId: data.fabricatorId || (userDetail?.FabricatorPointOfContacts?.[0]?.fabricatorId || userDetail?.FabricatorPointOfContacts?.[0]?.id),
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

      const formData = new FormData();
      for (const [key, value] of Object.entries(payload)) {
        if (value === undefined || value === null) continue;
        if (key === "files" && Array.isArray(value)) {
          value.forEach((file) => formData.append("files", file));
        } else if (typeof value === "boolean") {
          formData.append(key, value ? "true" : "false");
        } else {
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
          id: createdRFQ.id || createdRFQ._id,
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
    <div className="w-full mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="overflow-hidden rounded-2xl md:rounded-[2.5rem] bg-white transition-all duration-500"
      >
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="p-4 sm:p-5 md:p-6 space-y-4 md:space-y-6"
        >
          {/* Identity & Presence */}
          <section className="space-y-3 md:space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              {/* FABRICATOR (HIDDEN FOR CLIENTS) */}
              {userRole !== "CLIENT" && userRole !== "CLIENT_ADMIN" && userRole !== "CLIENT_ESTIMATOR" && (
                <>
                  <div className="space-y-2">
                    <label className="block text-xs text-black font-black uppercase tracking-widest flex items-center gap-2">
                      <Building2 size={14} className="text-black/40" />
                      Fabricator Partner{" "}
                      <span className="text-rose-500">*</span>
                    </label>

                    <Controller
                      name="fabricatorId"
                      control={control}
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
                            className="border-black rounded-2xl h-14"
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
                      <p className="text-[10px] text-rose-600 uppercase tracking-widest">
                        {errors.fabricatorId.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="block text-xs text-black font-black uppercase tracking-widest flex items-center gap-2">
                      <User size={14} className="text-black/40" />
                      Fabricator Contact{" "}
                      <span className="text-rose-500">*</span>
                    </label>
                    <Controller
                      name="senderId"
                      control={control}
                      rules={{ required: "Fabricator contact is required" }}
                      render={({ field }) => (
                        <Select
                          name={field.name}
                          options={clientOptions}
                          className="border-black rounded-2xl h-14"
                          value={field.value ? String(field.value) : undefined}
                          onChange={(_, value) => field.onChange(value ?? "")}
                        />
                      )}
                    />

                    {errors.senderId && (
                      <p className="text-[10px] text-rose-600 uppercase tracking-widest">
                        {errors.senderId.message}
                      </p>
                    )}
                  </div>
                </>
              )}

              <div className="md:col-span-2 space-y-2">
                <label className="text-sm text-black font-black uppercase tracking-widest flex items-center gap-2">
                  <Layers size={14} className="text-black/40" />
                  Project Name <span className="text-rose-500">*</span>
                </label>
                <Input
                  {...register("projectName", {
                    required: "Project name is required",
                  })}
                  placeholder=""
                  className="w-full bg-white border-black rounded-2xl focus:bg-white h-14 text-sm font-black placeholder:text-black/20"
                />
                {errors.projectName && (
                  <p className="text-[10px] text-rose-600 uppercase tracking-widest">
                    {errors.projectName.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <label className="block text-sm text-black font-black uppercase tracking-widest flex items-center gap-2">
                  <Hash size={14} className="text-black/40" />
                  Project Number
                </label>
                <Input
                  {...register("projectNumber")}
                  placeholder=""
                  className="w-full bg-white border-black rounded-2xl focus:bg-white h-14 text-sm font-black placeholder:text-black/20"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm text-black font-black uppercase tracking-widest flex items-center gap-2">
                  <Globe size={14} className="text-black/40" />
                  Location
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Controller
                    name="country"
                    control={control}
                    render={({ field }) => (
                      <div className="space-y-1">
                       
                        <Select
                          name={field.name}
                          options={countryOptions}
                          value={field.value}
                          placeholder="Select Country"
                          className="border-black rounded-2xl h-14"
                          onChange={(_, value) => {
                            field.onChange(value ?? "");
                            setValue("state", ""); // Reset state when country changes
                          }}
                        />
                      </div>
                    )}
                  />
                  {stateOptions.length > 0 ? (
                    <Controller
                      name="state"
                      control={control}
                      render={({ field }) => (
                        <div className="space-y-1">
                          <label className="text-[10px] font-black text-black/40 uppercase tracking-widest flex items-center gap-1">
                            <Globe size={10} /> State
                          </label>
                          <Select
                            name={field.name}
                            options={stateOptions}
                            value={field.value}
                            placeholder="Select State"
                            className="border-black rounded-2xl h-14"
                            disabled={!selectedCountry}
                            onChange={(_, value) => field.onChange(value ?? "")}
                          />
                        </div>
                      )}
                    />
                  ) : (
                    <Input
                      {...register("location")}
                      placeholder="Enter Location"
                      className="w-full bg-white border-black rounded-2xl focus:bg-white h-14 text-sm font-black placeholder:text-black/20"
                    />
                  )}
                </div>
              </div>
            </div>
          </section>

          {/* Technical Specs Section */}
          <section className="space-y-3 md:space-y-4">
            <div className="space-y-3">
              <div className="space-y-2">
                <label className="block text-sm text-black font-black uppercase tracking-widest flex items-center gap-2">
                  <Mail size={14} className="text-black/40" />
                  Subject
                </label>
                <Input
                  {...register("subject")}
                  placeholder=""
                  className="w-full bg-white border-black rounded-2xl focus:bg-white h-14 text-sm font-black"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm text-black font-black uppercase tracking-widest flex items-center gap-2">
                  <FileText size={14} className="text-black/40" />
                  Project Scope & Detailed Description
                </label>
                <div className="border border-black rounded-2xl overflow-hidden min-h-[200px] bg-white">
                  <RichTextEditor
                    value={description}
                    onChange={setDescription}
                    placeholder=""
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
                <div className="space-y-2">
                  <label className="block text-sm text-black font-black uppercase tracking-widest flex items-center gap-2">
                    <Wrench size={14} className="text-black/40" />
                    Tools{" "}
                    <span className="text-rose-500">*</span>
                  </label>
                  <Controller
                    name="tools"
                    control={control}
                    rules={{ required: "Tools selection is required" }}
                    render={({ field }) => (
                      <Select
                        name={field.name}
                        options={[
                          { label: "TEKLA", value: "TEKLA" },
                          { label: "SDS2", value: "SDS2" },
                          { label: "BOTH", value: "BOTH" },
                          { label: "NO PREFERENCE", value: "NO_PREFERENCE" },
                          { label: "OTHER", value: "OTHER" },
                        ]}
                        className="border-black rounded-2xl h-14"
                        value={field.value}
                        onChange={(_, value) => field.onChange(value ?? "")}
                      />
                    )}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm text-black font-black uppercase tracking-widest flex items-center gap-2">
                    <DollarSign size={14} className="text-black/40" />
                    Bid Price ({selectedFabricator?.currencyType || "USD"})
                  </label>
                  <Input
                    type="number"
                    {...register("bidPrice")}
                    placeholder="0.00"
                    className="w-full bg-white border-black rounded-2xl focus:bg-white h-14 text-sm font-black"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm text-black font-black uppercase tracking-widest flex items-center gap-2">
                    <Calendar size={14} className="text-black/40" />
                    Due Date <span className="text-rose-500">*</span>
                  </label>
                  <Input
                    type="date"
                    {...register("estimationDate", {
                      required: "Due date is required",
                    })}
                    className="w-full bg-white border-black rounded-2xl focus:bg-white h-14 text-sm font-black"
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Service Matrix Section */}
          <section className="space-y-3 md:space-y-4 pt-4 md:pt-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              <div className="space-y-3 border border-black p-4 md:p-6 rounded-[2rem]">
                <h3 className="text-sm text-black font-black uppercase tracking-[0.2em] flex items-center gap-2">
                  <Layers size={16} className="text-black/60" />
                  Connection Design Scope
                </h3>
                <div className="grid grid-cols-1 gap-y-4">
                  <Toggle
                    label="Main Design"
                    {...register("connectionDesign")}
                  />
                  <Toggle label="Misc Design" {...register("miscDesign")} />
                  <Toggle
                    label="Customer Design"
                    {...register("customerDesign")}
                  />
                </div>
              </div>

              <div className="space-y-3 border border-black p-4 md:p-6 rounded-[2rem]">
                <h3 className="text-sm text-black font-black uppercase tracking-[0.2em] flex items-center gap-2">
                  <Wrench size={16} className="text-black/60" />
                  Detailing Scope
                </h3>
                <div className="grid grid-cols-1 gap-y-4">
                  <Toggle label="Main Steel" {...register("detailingMain")} />
                  <Toggle label="Misc Steel" {...register("detailingMisc")} />
                </div>
              </div>

            </div>
              <div className="space-y-3 border border-black p-4 md:p-6 rounded-[2rem]">
                <h3 className="text-sm text-black font-black uppercase tracking-[0.2em] flex items-center gap-2">
                  <Layout size={16} className="text-black/60" />
                  Material Take off
                </h3>
                <div className="grid grid-cols-1 gap-y-4">
                  <Toggle label="MTO - Manual" {...register("MTOManual")} />
                  <Toggle
                    label="MTO - Stick Model"
                    {...register("mtoStickModelEnabled")}
                  />
                </div>
                {mtoStickModelEnabled && (
                  <div className="mt-6 space-y-6 animate-in fade-in slide-in-from-top-2 duration-300">
                    {/* Main Steel Scope */}
                    <div className="space-y-3 p-4 bg-gray-50 rounded-2xl border border-black/5">
                      <h4 className="text-[10px] font-black text-black uppercase tracking-widest flex items-center gap-2">
                        Main Steel Scope
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        <Toggle label="Main Steel" {...register("mainSteel")} />
                        <Toggle label="Main Steel Misc Attachments" {...register("mainSteelMiscAttachments")} />
                        <Toggle label="Main Steel Connections" {...register("mainSteelConnections")} />
                      </div>
                    </div>

                    {/* Miscellaneous Steel Scope */}
                    <div className="space-y-3 p-4 bg-gray-50 rounded-2xl border border-black/5">
                      <h4 className="text-[10px] font-black text-black uppercase tracking-widest flex items-center gap-2">
                        Miscellaneous Steel Scope
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        <Toggle label="Misc Steel" {...register("miscSteel")} />
                        <Toggle label="Misc Steel Connection" {...register("miscSteelConnection")} />
                        <Toggle label="Misc Steel Attachments" {...register("miscSteelAttachments")} />
                      </div>
                    </div>

                    {/* MTO Files Requirements */}
                    <div className="space-y-3 p-4 bg-gray-50 rounded-2xl border border-black/5">
                      <h4 className="text-[10px] font-black text-black uppercase tracking-widest flex items-center gap-2">
                        MTO Files Requirements
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        <Toggle label="3d Model" {...register("mto3dModel")} />
                        <Toggle label="Tekla/SDS-2" {...register("mtoTeklaSDS2")} />
                        <Toggle label="IFC files" {...register("mtoIFC")} />
                        <Toggle label="EJE files" {...register("mtoEJE")} />
                        <Toggle label="Kss files" {...register("mtoKss")} />
                        <Toggle label="bolt List" {...register("mtoBoltList")} />
                        <Toggle label="Material Summary Report" {...register("mtoMaterialSummary")} />
                      </div>
                    </div>

                    <div className="mt-3 space-y-2">
                      <label className="block text-xs font-black text-black uppercase tracking-widest opacity-40">
                        MTO Stick Model Details (Real-time Preview)
                      </label>
                      <div className="border border-black rounded-xl overflow-hidden min-h-[200px] bg-white">
                        <Controller
                          name="MTOStickModel"
                          control={control}
                          render={({ field }) => (
                            <RichTextEditor
                              value={field.value || ""}
                              onChange={field.onChange}
                              placeholder="MTO details will appear here as you toggle options..."
                            />
                          )}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
          </section>

          {/* Assets Section */}
          <section className="space-y-3 md:space-y-4 pt-4 md:pt-5">
            <h3 className="text-sm text-black font-black uppercase tracking-[0.2em] flex items-center gap-2">
              Project Attachments
            </h3>
            <div className="bg-white p-3 sm:p-4 md:p-5 rounded-2xl md:rounded-3xl border border-black shadow-sm">
              <Controller
                name="files"
                control={control}
                render={({ field }) => (
                  <MultipleFileUpload
                    onFilesChange={(files) => {
                      field.onChange(files);
                    }}
                  />
                )}
              />
            </div>
          </section>

          {/* Action Footer */}
          <div className="pt-5 flex flex-col md:flex-row items-center justify-between gap-4 border-t border-black/10">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full md:w-auto px-12 py-5 bg-green-200 text-black border border-black font-black text-xs uppercase tracking-[0.2em] rounded-2xl hover:bg-green-300 transition-all shadow-md active:scale-95 flex items-center justify-center gap-3 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Synchronizing RFQ Data...
                </>
              ) : (
                "Initiate rfq"
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default AddRFQ;
