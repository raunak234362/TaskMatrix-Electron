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

  const dynamicEditorHeight = React.useMemo(() => {
    let h = 300; // Base height when nothing is selected
    if (isDetailing || isMTO) h += 150; // Attachments & Requirements offset
    if (isDetailing) h += 150; // Service Matrix offset
    if (isMTO) {
      h += 100; // Material Takeoff base offset
    }
    return h;
  }, [isDetailing, isMTO]);

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
      label: `${client.firstName} ${client.middleName ?? ""} ${client.lastName}`,
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
          className="p-4 sm:p-5 md:p-8 grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12"
        >
          {/* Left Column */}
          <div className="space-y-8">
            {/* Identity Section */}
            <section className="space-y-6">
              <div className="flex items-center gap-4 border-b border-black/10 pb-4">
                <div className="w-2 h-8 bg-[#6bbd45] rounded-full" />
                <h3 className="text-xl text-black font-black uppercase tracking-tight">
                  Project Details
                </h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                            className="border-black rounded-lg h-14 bg-white"
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
                            className="border-black rounded-lg h-14 bg-white"
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

              <div className="md:col-span-2 space-y-2 w-full mt-4 h-full flex flex-col">
                <label className="block text-sm text-black font-black uppercase tracking-widest">Project Scope & Detailed Description</label>
                <div className="border border-black rounded-lg overflow-hidden bg-white flex-1 transition-all duration-500 ease-in-out">
                  <RichTextEditor value={description} onChange={setDescription} height={dynamicEditorHeight} />
                </div>
              </div>

            </div>
          </section>
          </div>

          {/* Right Column */}
          <div className="space-y-8">
            {/* Estimation Type Selection */}
            <section className="space-y-6">
              <div className="flex items-center gap-4 border-b border-black/10 pb-4">
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
            <section className="space-y-6 animate-in fade-in zoom-in duration-300">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="text-sm text-black font-black uppercase tracking-[0.2em] flex items-center gap-2">
                    <div className="w-1.5 h-6 bg-[#6bbd45] rounded-full" />
                    Connection Design Scope
                  </h3>
                  <div className="grid grid-cols-1 gap-4">
                    <Toggle label="Main Design" {...register("connectionDesign")} />
                    <Toggle label="Misc Design" {...register("miscDesign")} />
                    <Toggle label="Customer Design" {...register("customerDesign")} />
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-sm text-black font-black uppercase tracking-[0.2em] flex items-center gap-2">
                    <div className="w-1.5 h-6 bg-[#6bbd45] rounded-full" />
                    Detailing Scope
                  </h3>
                  <div className="grid grid-cols-1 gap-4">
                    <Toggle label="Main Steel" {...register("detailingMain")} />
                    <Toggle label="Misc Steel" {...register("detailingMisc")} />
                  </div>
                </div>
              </div>
            </section>
          )}

          {isMTO && (
            <section className="space-y-6 animate-in fade-in zoom-in duration-300">
              <div className="space-y-6">
                <div className="flex items-center gap-4 border-b border-black/10 pb-4">
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
              </div>
            </section>
          )}



          {/* Project Requirements & Assets - Visible only after estimation type selection */}
          {(isDetailing || isMTO) && (
            <>
              {/* Project Requirements Section */}
              <section className="space-y-6 animate-in fade-in zoom-in duration-300">
                <div className="flex items-center gap-4 border-b border-black/10 pb-4">
                  <div className="w-2 h-8 bg-[#6bbd45] rounded-full" />
                  <h3 className="text-xl text-black font-black uppercase tracking-tight">
                    Project Requirements
                  </h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm text-black font-black uppercase tracking-widest flex items-center gap-2">
                      <Calendar size={14} className="text-black/40" />
                      Due Date <span className="text-rose-500">*</span>
                    </label>
                    <Input {...register("estimationDate", { required: "Due date is required" })} type="date" className="w-full bg-white border-black rounded-lg h-14 text-sm font-black" />
                  </div>
                  {isDetailing && (
                    <>
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
                              className="border-black rounded-lg h-14 bg-white"
                              value={field.value}
                              onChange={(_, value) => field.onChange(value ?? "")}
                            />
                          )}
                        />
                      </div>
                      <div className="space-y-2 animate-in fade-in duration-300">
                        <label className="text-sm text-black font-black uppercase tracking-widest flex items-center gap-2">
                          <Percent size={14} className="text-black/40" />
                          Bid Price
                        </label>
                        <Input {...register("bidPrice")} type="number" className="w-full bg-white border-black rounded-lg h-14 text-sm font-black" />
                      </div>
                    </>
                  )}
                </div>
              </section>

              {/* Assets Section */}
              <section className="space-y-6 animate-in fade-in slide-in-from-top-4 duration-500">
                <div className="flex items-center gap-4 border-b border-black/10 pb-4">
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

            </>
          )}
          </div>

          {/* Full Width Action Footer */}
          {(isDetailing || isMTO) && (
            <div className="lg:col-span-2 pt-6 flex justify-center animate-in fade-in slide-in-from-bottom-4 duration-500">
              <button
                type="submit"
                disabled={isSubmitting}
                className="group relative px-22 py-4 w-full justify-center bg-[#6bbd45]/50 text-black border-2 border-black rounded-lg font-black text-sm uppercase tracking-[0.3em] hover:opacity-90 transition-all duration-500 shadow-2xl active:scale-95 flex items-center gap-4 disabled:opacity-50"
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
          )}
        </form>
      </motion.div>
    </div>
  );
};

export default AddRFQ;
