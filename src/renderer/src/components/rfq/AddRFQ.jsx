import React, { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { useSelector, useDispatch } from "react-redux";
import { toast } from "react-toastify";
import Input from "../fields/input";
import MultipleFileUpload from "../fields/MultipleFileUpload";
import Service from "../../api/Service";

import { motion } from "framer-motion";
import { Settings2, Loader2, Layers, Globe, Percent, Calendar } from "lucide-react";

import Select from "../fields/Select";
import Toggle from "../fields/Toggle";
import RichTextEditor from "../fields/RichTextEditor";
import { addRFQ } from "../../store/rfqSlice";


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

  // const staffData = useSelector((state) => state.userInfo.staffData);

  // const userType = typeof window !== "undefined" ? sessionStorage.getItem("userType") : null;

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
      mtoStickModelEnabled: false,
      MTOManual: false,
      mainSteel: false,
      mainSteelMiscAttachments: false,
      mainSteelConnections: false,
      miscSteel: false,
      miscSteelConnection: false,
      miscSteelAttachments: false,
      mto3dModel: false,
      mtoTeklaSDS2: false,
      mtoIFC: false,
      mtoEJE: false,
      mtoKss: false,
      mtoBoltList: false,
      mtoMaterialSummary: false,
      manualMainSteel: false,
      manualMainSteelMiscAttachments: false,
      manualMainSteelConnections: false,
      manualMiscSteel: false,
      manualMiscSteelConnection: false,
      manualMiscSteelAttachments: false,
      manualMaterialSummary: false,
    },
  });

  const selectedFabricatorId = watch("fabricatorId");
  const mtoStickModelEnabled = watch("mtoStickModelEnabled");
  const mtoManualEnabled = watch("MTOManual");


  const [description, setDescription] = useState("");
  const [isDetailing, setIsDetailing] = useState(false);
  const [isMTO, setIsMTO] = useState(false);

  // Sync tools and reset fields when estimation type changes
  useEffect(() => {
    if (isMTO && !isDetailing) {
      setValue("tools", "NO_PREFERENCE");
    }
    if (!isMTO) {
      setValue("MTOManual", false);
      setValue("mtoStickModelEnabled", false);
    }
    if (!isDetailing) {
      setValue("connectionDesign", false);
      setValue("miscDesign", false);
      setValue("customerDesign", false);
      setValue("detailingMain", false);
      setValue("detailingMisc", false);
    }
  }, [isDetailing, isMTO, setValue]);

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

  // selector for the user

  const userDetail = useSelector((state) => state.userInfo.userDetail);
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
  const mtoFields = watch();
  
  const isScopeSelected = 
    mtoFields.connectionDesign || 
    mtoFields.miscDesign || 
    mtoFields.customerDesign || 
    mtoFields.detailingMain || 
    mtoFields.detailingMisc || 
    mtoFields.MTOManual || 
    mtoFields.mtoStickModelEnabled;

  useEffect(() => {
    const sections = [];

    // --- Stick Model Processing ---
    if (mtoStickModelEnabled) {
      sections.push(`<p style="font-size: 16px; margin-bottom: 8px; color: #000;"><strong>STICK MODEL SCOPE:</strong></p>`);
      const stickMain = [];
      if (mtoFields.mainSteel) stickMain.push("MAIN STEEL");
      if (mtoFields.mainSteelMiscAttachments) stickMain.push("MAIN STEEL MISC ATTACHMENTS");
      if (mtoFields.mainSteelConnections) stickMain.push("MAIN STEEL CONNECTIONS");
      if (stickMain.length > 0) {
        sections.push(`<p><strong>MAIN STEEL SCOPE:</strong></p><ul>${stickMain.map(item => `<li>${item}</li>`).join("")}</ul>`);
      }

      const stickMisc = [];
      if (mtoFields.miscSteel) stickMisc.push("MISC STEEL");
      if (mtoFields.miscSteelConnection) stickMisc.push("MISC STEEL CONNECTIONS");
      if (mtoFields.miscSteelAttachments) stickMisc.push("MISC STEEL ATTACHMENTS");
      if (stickMisc.length > 0) {
        sections.push(`<p><strong>MISCELLANEOUS STEEL SCOPE:</strong></p><ul>${stickMisc.map(item => `<li>${item}</li>`).join("")}</ul>`);
      }

      const stickFiles = [];
      if (mtoFields.mto3dModel) stickFiles.push("3D MODEL");
      if (mtoFields.mtoTeklaSDS2) stickFiles.push("TEKLA/SDS-2");
      if (mtoFields.mtoIFC) stickFiles.push("IFC FILES");
      if (mtoFields.mtoEJE) stickFiles.push("EJE FILES");
      if (mtoFields.mtoKss) stickFiles.push("KSS FILES");
      if (mtoFields.mtoBoltList) stickFiles.push("BOLT LIST");
      if (mtoFields.mtoMaterialSummary) stickFiles.push("MATERIAL SUMMARY REPORT");
      if (stickFiles.length > 0) {
        sections.push(`<p><strong>MTO FILES REQUIREMENTS:</strong></p><ul>${stickFiles.map(item => `<li>${item}</li>`).join("")}</ul>`);
      }
      sections.push(`<br/>`);
    }

    // --- Manual Model Processing ---
    if (mtoManualEnabled) {
      sections.push(`<p style="font-size: 16px; margin-bottom: 8px; color: #000;"><strong>MANUAL TAKEOFF SCOPE:</strong></p>`);
      const manualMain = [];
      if (mtoFields.manualMainSteel) manualMain.push(`MAIN STEEL`);
      if (mtoFields.manualMainSteelMiscAttachments) manualMain.push(`MAIN STEEL MISC ATTACHMENTS`);
      if (mtoFields.manualMainSteelConnections) manualMain.push(`MAIN STEEL CONNECTIONS`);
      if (manualMain.length > 0) {
        sections.push(`<p><strong>MAIN STEEL SCOPE:</strong></p><ul>${manualMain.map(item => `<li>${item}</li>`).join("")}</ul>`);
      }

      const manualMisc = [];
      if (mtoFields.manualMiscSteel) manualMisc.push(`MISC STEEL`);
      if (mtoFields.manualMiscSteelConnection) manualMisc.push(`MISC STEEL CONNECTIONS - ${mtoFields.manualMiscSteelConnectionPercentage || 0}%`);
      if (mtoFields.manualMiscSteelAttachments) manualMisc.push(`MISC STEEL ATTACHMENTS`);
      if (manualMisc.length > 0) {
        sections.push(`<p><strong>MISCELLANEOUS STEEL SCOPE:</strong></p><ul>${manualMisc.map(item => `<li>${item}</li>`).join("")}</ul>`);
      }

      const manualFiles = [];
      if (mtoFields.manualMaterialSummary) manualFiles.push(`MATERIAL SUMMARY REPORT`);
      if (manualFiles.length > 0) {
        sections.push(`<p><strong>MTO FILES REQUIREMENTS:</strong></p><ul>${manualFiles.map(item => `<li>${item}</li>`).join("")}</ul>`);
      }
    }

    if (mtoStickModelEnabled || mtoManualEnabled) {
      const consolidated = sections.join("");
      setValue("MTOStickModel", consolidated);
      setValue("MTOManualModel", consolidated);
      setValue("MTOValue", consolidated);
    } else {
      setValue("MTOStickModel", "");
      setValue("MTOManualModel", "");
      setValue("MTOValue", "");
    }
  }, [
    mtoStickModelEnabled,
    mtoManualEnabled,
    mtoFields.mainSteel, mtoFields.mainSteelMiscAttachments, mtoFields.mainSteelConnections,
    mtoFields.miscSteel, mtoFields.miscSteelConnection, mtoFields.miscSteelAttachments,
    mtoFields.mto3dModel, mtoFields.mtoTeklaSDS2, mtoFields.mtoIFC, mtoFields.mtoEJE, mtoFields.mtoKss, mtoFields.mtoBoltList, mtoFields.mtoMaterialSummary,
    mtoFields.manualMainSteel,
    mtoFields.manualMainSteelMiscAttachments,
    mtoFields.manualMainSteelConnections,
    mtoFields.manualMiscSteel,
    mtoFields.manualMiscSteelConnection, mtoFields.manualMiscSteelConnectionPercentage,
    mtoFields.manualMiscSteelAttachments,
    mtoFields.manualMaterialSummary,
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
        MTOManualModel: data.MTOManual ? (data.MTOManualModel || "") : "",
        MTOValue: data.MTOValue || "",
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

      if (createdRFQ && !createdRFQ.error) {
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
        toast.success("RFQ Created Successfully");
        setDescription("");
        reset();
        onSuccess?.();
      } else {
        toast.error(createdRFQ?.error || "Failed to create RFQ");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to create RFQ");
    }
  };


  return (
    <div className="w-full mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="overflow-hidden rounded-lg bg-white transition-all duration-500"
      >
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="p-4 sm:p-5 md:p-6 space-y-4 md:space-y-6"
        >
          {/* Identity Section */}
          <section className="space-y-6 bg-gray-50 p-8 md:p-10 rounded-lg shadow-sm border border-black/5">
            <div className="flex items-center gap-4 border-b border-black/5 pb-6">
              <div className="w-2 h-8 bg-[#6bbd45] rounded-full" />
              <h3 className="text-xl text-black font-black uppercase tracking-tight">
                Project Identity
              </h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {userRole !== "CLIENT" &&
                userRole !== "CLIENT_ADMIN" &&
                userRole !== "CLIENT_ESTIMATOR" && (
                  <>
                    <div className="space-y-2">
                      <label className="block text-xs text-black font-black uppercase tracking-widest opacity-60">
                        Fabricator Partner
                      </label>
                      <Controller
                        name="fabricatorId"
                        control={control}
                        render={({ field }) => (
                          <Select
                            name={field.name}
                            options={fabOptions}
                            value={
                              field.value ? String(field.value) : undefined
                            }
                            className="border-black rounded-lg h-14"
                            onChange={(_, value) => field.onChange(value ?? "")}
                          />
                        )}
                      />
                      {errors.fabricatorId && (
                        <p className="text-[10px] text-rose-600 uppercase tracking-widest">
                          {errors.fabricatorId.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <label className="block text-xs text-black font-black uppercase tracking-widest opacity-60">
                        Fabricator Contact
                      </label>
                      <Controller
                        name="senderId"
                        control={control}
                        render={({ field }) => (
                          <Select
                            name={field.name}
                            options={clientOptions}
                            className="border-black rounded-lg h-14"
                            value={
                              field.value ? String(field.value) : undefined
                            }
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
                  {...register("projectName", { required: "Project name is required" })}
                  className="w-full bg-white border-black rounded-lg h-14 text-sm font-black"
                />
                {errors.projectName && (
                  <p className="text-[10px] text-rose-600 uppercase tracking-widest">
                    {errors.projectName.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm text-black font-black uppercase tracking-widest flex items-center gap-2">
                  <Settings2 size={14} className="text-black/40" />
                  Project Number
                </label>
                <Input
                  {...register("projectNumber")}
                  className="w-full bg-white border-black rounded-lg h-14 text-sm font-black"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm text-black font-black uppercase tracking-widest flex items-center gap-2">
                  <Globe size={14} className="text-black/40" />
                  Location
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <Controller
                    name="country"
                    control={control}
                    render={({ field }) => (
                      <Select
                        name={field.name}
                        options={countryOptions}
                        value={field.value}
                        className="border-black rounded-lg h-14"
                        onChange={(_, value) => {
                          field.onChange(value ?? "");
                          setValue("state", "");
                        }}
                      />
                    )}
                  />
                  <Controller
                    name="state"
                    control={control}
                    render={({ field }) => (
                      <Select
                        name={field.name}
                        options={stateOptions}
                        value={field.value}
                        className="border-black rounded-lg h-14"
                        onChange={(_, value) => field.onChange(value ?? "")}
                      />
                    )}
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Estimation Type Selection */}
          <section className="space-y-6 bg-gray-50 p-8 md:p-10 rounded-lg shadow-sm border border-black/5">
            <div className="flex items-center gap-4 border-b border-black/5 pb-6">
              <div className="w-2 h-8 bg-[#6bbd45] rounded-full" />
              <h3 className="text-xl text-black font-black uppercase tracking-tight">
                Select Estimation Type
              </h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <button
                type="button"
                onClick={() => setIsDetailing(!isDetailing)}
                className={`p-6 rounded-xl border-2 transition-all flex flex-col items-center gap-4 group ${
                  isDetailing
                    ? "bg-[#6bbd45]/10 border-[#6bbd45] text-black"
                    : "bg-white border-black/10 text-gray-400 hover:border-black/20"
                }`}
              >
                <div className={`p-4 rounded-full transition-colors ${isDetailing ? "bg-[#6bbd45] text-white" : "bg-gray-100 text-gray-400"}`}>
                  <Layers size={32} />
                </div>
                <span className="font-black uppercase tracking-widest text-sm">Detailing Estimation</span>
              </button>
              <button
                type="button"
                onClick={() => setIsMTO(!isMTO)}
                className={`p-6 rounded-xl border-2 transition-all flex flex-col items-center gap-4 group ${
                  isMTO
                    ? "bg-[#6bbd45]/10 border-[#6bbd45] text-black"
                    : "bg-white border-black/10 text-gray-400 hover:border-black/20"
                }`}
              >
                <div className={`p-4 rounded-full transition-colors ${isMTO ? "bg-[#6bbd45] text-white" : "bg-gray-100 text-gray-400"}`}>
                  <Settings2 size={32} />
                </div>
                <span className="font-black uppercase tracking-widest text-sm">Material Take-off</span>
              </button>
            </div>
          </section>



          {/* Service Matrix Section */}
          {isDetailing && (
            <section className="space-y-3 md:space-y-4 pt-4 md:pt-5 border-gray-200 animate-in fade-in zoom-in duration-300">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6 bg-gray-50 p-8 rounded-lg shadow-sm border border-black/5">
                  <h3 className="text-sm text-black font-black uppercase tracking-[0.2em] flex items-center gap-2">
                    <div className="w-1.5 h-6 bg-[#6bbd45] rounded-full" />
                    Connection Design Scope
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
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

                <div className="space-y-6 bg-gray-50 p-8 rounded-lg shadow-sm border border-black/5">
                  <h3 className="text-sm text-black font-black uppercase tracking-[0.2em] flex items-center gap-2">
                    <div className="w-1.5 h-6 bg-[#6bbd45] rounded-full" />
                    Detailing Scope
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <Toggle label="Main Steel" {...register("detailingMain")} />
                    <Toggle label="Misc Steel" {...register("detailingMisc")} />
                  </div>
                </div>
              </div>
            </section>
          )}

          {isMTO && (
            <section className="bg-gray-50 p-8 md:p-10 rounded-lg shadow-sm border border-black/5 animate-in fade-in zoom-in duration-300">
              <div className="space-y-8">
                <div className="flex items-center gap-4 border-b border-black/5 pb-6">
                  <div className="w-2 h-8 bg-[#6bbd45] rounded-full" />
                  <h3 className="text-xl text-black font-black uppercase tracking-tight">
                    Material Takeoff
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                  <Toggle
                    label="MTO - Manual"
                    {...register("MTOManual")}
                  />
                  <Toggle
                    label="MTO - Stick Model"
                    {...register("mtoStickModelEnabled")}
                  />
                </div>

                {mtoStickModelEnabled && (
                  <div className="p-8 bg-[#6bbd45]/5 rounded-lg border border-[#6bbd45]/20 animate-in fade-in slide-in-from-top-2 duration-300 space-y-8">
                    <div className="flex items-center gap-3 border-b border-[#6bbd45]/20 pb-4">
                      <div className="w-1.5 h-6 bg-[#6bbd45] rounded-full" />
                      <h4 className="text-xs font-black uppercase tracking-widest text-[#4a8a2d]">Stick Model Configuration</h4>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-12 gap-y-6">
                      <div className="space-y-4">
                        <h5 className="text-[10px] font-black uppercase tracking-widest opacity-40">Main Steel</h5>
                        <Toggle label="Main Steel" {...register("mainSteel")} />
                        <Toggle label="Main Steel Connections" {...register("mainSteelConnections")} />
                        <Toggle label="Main Steel Misc Attachments" {...register("mainSteelMiscAttachments")} />
                      </div>
                      <div className="space-y-4">
                        <h5 className="text-[10px] font-black uppercase tracking-widest opacity-40">Misc Steel</h5>
                        <Toggle label="Misc Steel" {...register("miscSteel")} />
                        <Toggle label="Misc Steel Connections" {...register("miscSteelConnection")} />
                        <Toggle label="Misc Steel Attachments" {...register("miscSteelAttachments")} />
                      </div>
                      <div className="space-y-4">
                        <h5 className="text-[10px] font-black uppercase tracking-widest opacity-40">Requirements</h5>
                        <div className="grid grid-cols-1 gap-2">
                          <Toggle label="3d Model" {...register("mto3dModel")} />
                          <Toggle label="Tekla/SDS-2" {...register("mtoTeklaSDS2")} />
                          <Toggle label="IFC files" {...register("mtoIFC")} />
                          <Toggle label="EJE files" {...register("mtoEJE")} />
                          <Toggle label="Kss files" {...register("mtoKss")} />
                          <Toggle label="Bolt List" {...register("mtoBoltList")} />
                          <Toggle label="Material Summary" {...register("mtoMaterialSummary")} />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {mtoManualEnabled && (
                  <div className="p-8 bg-[#6bbd45]/10 rounded-lg border border-[#6bbd45]/20 animate-in fade-in slide-in-from-top-2 duration-300 space-y-8">
                    <div className="flex items-center gap-3 border-b border-[#6bbd45]/20 pb-4">
                      <div className="w-1.5 h-6 bg-[#6bbd45] rounded-full" />
                      <h4 className="text-xs font-black uppercase tracking-widest text-[#4a8a2d]">Manual Model Configuration</h4>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-12 gap-y-6">
                      <div className="space-y-4">
                        <h5 className="text-[10px] font-black uppercase tracking-widest opacity-40">Main Steel</h5>
                        <Toggle label="Main Steel" {...register("manualMainSteel")} />
                        <Toggle label="Main Steel Connections" {...register("manualMainSteelConnections")} />
                        <Toggle label="Main Steel Misc Attachments" {...register("manualMainSteelMiscAttachments")} />
                      </div>

                      <div className="space-y-4">
                        <h5 className="text-[10px] font-black uppercase tracking-widest opacity-40">Misc Steel</h5>
                        <Toggle label="Misc Steel" {...register("manualMiscSteel")} />
                        <div className="space-y-1">
                           <Toggle label="Misc Steel Connections" {...register("manualMiscSteelConnection")} />
                           {mtoFields.manualMiscSteelConnection && (
                             <div className="pl-4 pt-1 flex flex-col gap-1">
                               <div className="flex justify-between items-center text-[10px] font-black text-[#4a8a2d]">
                                 <span>Percentage</span>
                                 <span>{mtoFields.manualMiscSteelConnectionPercentage || 0}%</span>
                               </div>
                               <input type="range" min="0" max="100" {...register("manualMiscSteelConnectionPercentage")} className="w-full h-1.5 bg-[#6bbd45]/30 rounded-lg appearance-none cursor-pointer accent-black" />
                             </div>
                           )}
                        </div>
                        <Toggle label="Misc Steel Attachments" {...register("manualMiscSteelAttachments")} />
                      </div>

                      <div className="space-y-4">
                        <h5 className="text-[10px] font-black uppercase tracking-widest opacity-40">Requirements</h5>
                        <Toggle label="Material Summary" {...register("manualMaterialSummary")} />
                      </div>
                    </div>
                  </div>
                )}

                {(mtoStickModelEnabled || mtoManualEnabled) && (
                  <div className="space-y-4 pt-4 border-t border-black/5">
                    <label className="text-[10px] font-black uppercase tracking-widest opacity-40 flex items-center gap-2">
                      <div className="w-1 h-1 rounded-full bg-[#6bbd45]" />
                      Live Material Takeoff Generation Preview
                    </label>
                    <div className="border border-black rounded-lg overflow-hidden min-h-[300px] bg-white shadow-inner">
                      <Controller
                        name="MTOValue"
                        control={control}
                        render={({ field }) => (
                          <RichTextEditor value={field.value || ""} onChange={field.onChange} />
                        )}
                      />
                    </div>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* Technical Specs Section - Visible only after scope selection */}
          {isScopeSelected && (
            <section className="space-y-6 bg-gray-50 p-8 md:p-10 rounded-lg shadow-sm border border-black/5 animate-in fade-in slide-in-from-top-4 duration-500">
              <div className="flex items-center gap-4 border-b border-black/5 pb-6">
                <div className="w-2 h-8 bg-[#6bbd45] rounded-full" />
                <h3 className="text-xl text-black font-black uppercase tracking-tight">
                  Technical Specifications
                </h3>
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="block text-sm text-black font-black uppercase tracking-widest">Subject</label>
                  <Input
                    {...register("subject")}
                    className="w-full bg-white border-black rounded-lg h-14 text-sm font-black"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm text-black font-black uppercase tracking-widest">Project Scope & Detailed Description</label>
                  <div className="border border-black rounded-lg overflow-hidden min-h-[200px] bg-white">
                    <RichTextEditor value={description} onChange={setDescription} />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {isDetailing && (
                    <div className="space-y-2 animate-in fade-in duration-300">
                      <label className="block text-sm text-black font-black uppercase tracking-widest">Tools <span className="text-rose-500">*</span></label>
                      <Controller
                        name="tools"
                        control={control}
                        rules={{ required: isDetailing ? "Tools selection is required" : false }}
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
                            className="border-black rounded-lg h-14"
                            value={field.value}
                            onChange={(_, value) => field.onChange(value ?? "")}
                          />
                        )}
                      />
                    </div>
                  )}
                  {!isMTO && (
                    <div className="space-y-2 animate-in fade-in duration-300">
                      <label className="text-sm text-black font-black uppercase tracking-widest flex items-center gap-2">
                        <Percent size={14} className="text-black/40" />
                        Bid Price
                      </label>
                      <Input {...register("bidPrice")} type="number" className="w-full border-black rounded-lg h-14 text-sm font-black" />
                    </div>
                  )}
                  <div className={`space-y-2 ${(!isDetailing || isMTO) ? "md:col-span-2" : ""}`}>
                    <label className="text-sm text-black font-black uppercase tracking-widest flex items-center gap-2">
                      <Calendar size={14} className="text-black/40" />
                      Due Date <span className="text-rose-500">*</span>
                    </label>
                    <Input {...register("estimationDate", { required: "Due date is required" })} type="date" className="w-full border-black rounded-lg h-14 text-sm font-black" />
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* Assets Section */}
          <section className="space-y-6 bg-gray-50 p-8 md:p-10 rounded-lg shadow-sm border border-black/5">
            <div className="flex items-center gap-4 border-b border-black/5 pb-6">
              <div className="w-2 h-8 bg-[#6bbd45] rounded-full" />
              <h3 className="text-xl text-black font-black uppercase tracking-tight">
                Project / Scope Sheet Attachments
              </h3>
            </div>
            <div className="bg-gray-50/50 rounded-lg border border-black/5">
              <Controller
                name="files"
                control={control}
                render={({ field }) => (
                  <MultipleFileUpload onFilesChange={field.onChange} />
                )}
              />
            </div>
          </section>

          {/* Action Footer */}
          <div className="pt-10 flex justify-center">
            <button
              type="submit"
              disabled={isSubmitting}
              className="group relative px-22 py-4 bg-[#6bbd45]/50 text-black border-2 border-black rounded-lg font-black text-sm uppercase tracking-[0.3em] hover:opacity-90 transition-all duration-500 shadow-2xl active:scale-95 flex items-center gap-4 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={20} className="animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  Create RFQ

                </>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default AddRFQ;
