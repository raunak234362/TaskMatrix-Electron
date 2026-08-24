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
import CoTable from "./CoTable";
import { ArrowLeft } from "lucide-react";


const AddCO = ({ project, onSuccess, changeOrderData }) => {
  const userDetail = useSelector((state) => state.userInfo.userDetail);
  const staff = useSelector((state) => state.userInfo.staffData);
  const fabricators = useSelector(
    (state) => state.fabricatorInfo.fabricatorData,
  );

  const userRoleStr = sessionStorage.getItem('userRole')?.toLowerCase() || "";
  const isAdminRole = ["admin", "deputy_manager", "operation_executive"].includes(userRoleStr);

  const { register, handleSubmit, control, reset, setValue } =
    useForm({
      defaultValues: {
        isAproovedByAdmin: isAdminRole
      }
    });
  const [step, setStep] = useState(1); // 1 = Draft CO Details, 2 = CO Table
  const [coFormData, setCoFormData] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [description, setDescription] = useState("");
  const [files, setFiles] = useState([]);
  const [pocs, setPocs] = React.useState([]);
  const [fetchingPocs, setFetchingPocs] = React.useState(false);

  const fabricatorId = project?.fabricatorID || project?.fabricator?.id || project?.fabricator_id;
  const selectedFabricator = fabricators?.find(
    (f) => String(f.id) === String(fabricatorId),
  );

  React.useEffect(() => {
    const fetchPocs = async () => {
      if (fabricatorId) {
        try {
          setFetchingPocs(true);
          const res = await Service.GetFabricatorPOC(fabricatorId);
          let list = [];
          if (Array.isArray(res)) {
            list = res;
          } else if (res?.data?.pointOfContact && Array.isArray(res.data.pointOfContact)) {
            list = res.data.pointOfContact;
          } else if (res?.pointOfContact && Array.isArray(res.pointOfContact)) {
            list = res.pointOfContact;
          } else if (res?.data && Array.isArray(res.data)) {
            list = res.data;
          } else if (res?.pocs && Array.isArray(res.pocs)) {
            list = res.pocs;
          }

          setPocs(list);
        } catch (err) {
          console.error("Failed to fetch fabricator POCs", err);
          setPocs([]);
        } finally {
          setFetchingPocs(false);
        }
      } else {
        setPocs([]);
      }
    };
    fetchPocs();
  }, [fabricatorId]);

  React.useEffect(() => {
    let maxNum = 0;
    const coList = changeOrderData || project?.changeOrders || [];
    
    if (coList && coList.length > 0) {
      coList.forEach((co) => {
        const match = co.changeOrderNumber?.match(/CO#(\d+)/i);
        if (match) {
          const num = parseInt(match[1], 10);
          if (num > maxNum) maxNum = num;
        }
      });
    }
    
    const nextNum = maxNum > 0 ? maxNum + 1 : (coList.length || 0) + 1;
    const prefilledCO = `CO#${String(nextNum).padStart(3, "0")} `;
    setValue("changeOrderNumber", prefilledCO);

    if (isAdminRole) {
      setValue("isAproovedByAdmin", true);
    }
  }, [project, changeOrderData, setValue, userDetail, isAdminRole]);

  const fetchedPocOptions = pocs.map((p) => ({
    label: `${p.firstName || ""} ${p.middleName ? p.middleName + " " : ""}${p.lastName || ""}`.trim() || p.email || p.name || "Unnamed POC",
    value: p.id || p._id,
  }));

  const pocOptions = fetchedPocOptions.length > 0 ? fetchedPocOptions : (
    selectedFabricator?.pointOfContact?.map((p) => ({
      label: `${p.firstName} ${p.middleName ?? ""} ${p.lastName}`.trim(),
      value: p.id,
    })) ?? []
  );

  const recipientOptions =
    staff
      ?.filter((s) => s && ["ADMIN", "SALES"].includes(s.role))
      .map((s) => ({
        label: `${s.firstName} ${s.lastName}`,
        value: s.id,
      })) ?? [];

  // Step 1: Save CO details in state draft and proceed to table
  const onProceedToTable = (data) => {
    setCoFormData(data);
    setStep(2);
    toast.info("CO details saved as draft. Please fill the table and click submit.");
  };

  // Step 2: Final Submit - hits ChangeOrder first, then addCOTable with created CO ID
  const handleFinalSubmit = async (formattedRows) => {
    const data = coFormData;
    if (!data) {
      toast.error("Draft CO details missing. Please go back and fill CO details.");
      setStep(1);
      return;
    }

    try {
      setIsSubmitting(true);
      const formData = new FormData();
      formData.append("project", project?.id);
      formData.append("sender", userDetail?.id);
      
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
      
      const isApproved = data.isAproovedByAdmin !== undefined ? data.isAproovedByAdmin : isAdminRole;
      formData.append("isAproovedByAdmin", isApproved);

      files.forEach((file) => formData.append("files", file));

      const fabricatorName = selectedFabricator?.fabName || project?.fabricatorName || project?.fabricator?.fabName || "";
      const projectName = project?.projectName || project?.name || "";
      
      // 1st: Hit ChangeOrder API
      const response = await Service.ChangeOrder(formData, fabricatorName, projectName);
      const createdCO = response.data?.data ?? response.data;
      const createdCoId = createdCO?.id || createdCO?._id;

      if (!createdCoId) {
        throw new Error("Failed to retrieve Created Change Order ID");
      }

      // 2nd: Hit addCOTable API using the newly created changeOrder ID
      if (formattedRows && formattedRows.length > 0) {
        await Service.addCOTable(formattedRows, createdCoId);
      }

      toast.success("Change Order & Table created successfully!");

      reset();
      setDescription("");
      setFiles([]);
      setCoFormData(null);
      setStep(1);

      if (typeof onSuccess === "function") {
        onSuccess(createdCO);
      }
    } catch (err) {
      console.error(err);
      toast.error(err?.response?.data?.message || err?.message || "Failed to create Change Order");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (step === 2) {
    return (
      <div className="w-full bg-white p-6 rounded-xl shadow-lg border border-gray-100 space-y-4">
        <div className="flex justify-between items-center border-b pb-3 mb-2">
          <div>
            <h3 className="text-lg font-bold text-gray-800">
              Step 2 of 2: Fill Change Order Table Data
            </h3>
            <p className="text-xs text-gray-500">
              Draft CO Number: <span className="font-semibold text-green-700">{coFormData?.changeOrderNumber}</span> | Subject: <span className="font-semibold text-gray-700">{coFormData?.remarks}</span>
            </p>
          </div>
          <button
            type="button"
            disabled={isSubmitting}
            onClick={() => setStep(1)}
            className="flex items-center gap-1 text-sm font-semibold text-gray-600 hover:text-green-700 transition-colors cursor-pointer disabled:opacity-50"
          >
            <ArrowLeft size={16} /> Back to CO Details
          </button>
        </div>

        <CoTable
          isDraft={true}
          onDraftSubmit={handleFinalSubmit}
          isSubmitting={isSubmitting}
        />
      </div>
    );
  }

  return (
    <div className="w-full bg-white p-6 rounded-xl shadow-lg border border-gray-100">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-base font-bold text-gray-700 uppercase tracking-wide">
          Step 1 of 2: Change Order Details (Draft)
        </h3>
      </div>
      <form onSubmit={handleSubmit(onProceedToTable)} className="space-y-4">
        <SectionTitle title="Fabrication & Routing" />

        {/* Fabricator Contact */}
        <Controller
          name="recipients"
          control={control}
          render={({ field }) => (
            <Select
              isMulti
              placeholder={fetchingPocs ? "Fetching POCs..." : "Fabricator Contact"}
              isLoading={fetchingPocs}
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
            label="Subject *"
            {...register("remarks", { required: true })}
          />
          {isAdminRole && (
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
          )}
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
        <MultipleFileUpload onFilesChange={setFiles} initialFiles={files} />

        <div className="flex justify-center w-full pt-4">
          <Button
            type="submit"
            className="w-full bg-green-600 hover:bg-green-700 text-white px-8 py-2 rounded-lg transition-all font-bold text-sm tracking-wide shadow-md"
          >
            Save Draft & Fill Table →
          </Button>
        </div>
      </form>
    </div>
  );
};

export default AddCO;
