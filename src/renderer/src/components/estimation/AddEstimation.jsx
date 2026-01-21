import React, { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { toast } from "react-toastify";
import { useDispatch, useSelector } from "react-redux";
import {
  FileText,
  Hash,
  Layout,
  User,
  Calendar,
  Tool,
  Clock,
  TrendingUp,
  DollarSign,
  CheckCircle2,
  AlertCircle,
  Paperclip
} from "lucide-react";

import Input from "../fields/input";
import Select from "../fields/Select";
import Button from "../fields/Button";
import MultipleFileUpload from "../fields/MultipleFileUpload";
import SectionTitle from "../ui/SectionTitle";
import Service from "../../api/Service";
import { setRFQData } from "../../store/rfqSlice";

const EstimationStatusOptions = [
  { label: "Pending", value: "PENDING" },
  { label: "In Progress", value: "IN_PROGRESS" },
  { label: "Completed", value: "COMPLETED" },
  { label: "Approved", value: "APPROVED" },
];

const AddEstimation = ({ initialRfqId, onSuccess, initialData, isEdit }) => {
  const dispatch = useDispatch();
  const [files, setFiles] = useState([]);

  const rfqData = useSelector((state) => state.RFQInfos.RFQData || []);
  const fabricators = useSelector((state) => state.fabricatorInfo?.fabricatorData || []);

  const userType = sessionStorage.getItem("userRole");

  useEffect(() => {
    const fetchRFQs = async () => {
      if (rfqData.length === 0) {
        try {
          let rfqDetail;
          if (userType === "CLIENT") {
            rfqDetail = await Service.RfqSent();
          } else {
            rfqDetail = await Service.RFQRecieved();
          }
          if (rfqDetail?.data) {
            dispatch(setRFQData(rfqDetail.data));
          }
        } catch (error) {
          console.error("Error fetching RFQs:", error);
        }
      }
    };
    fetchRFQs();
  }, [dispatch, rfqData.length, userType]);

  const {
    register,
    handleSubmit,
    control,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: isEdit ? {
      ...initialData,
      rfqId: String(initialData?.rfqId || ""),
      fabricatorId: String(initialData?.fabricatorId || ""),
      estimateDate: initialData?.estimateDate ? initialData.estimateDate.split("T")[0] : "",
    } : {
      status: "PENDING",
    },
  });

  const selectedRfqId = watch("rfqId");

  useEffect(() => {
    if (isEdit) return;
    if (!selectedRfqId || rfqData.length === 0) return;

    const rfq = rfqData.find((r) => String(r.id) === String(selectedRfqId));
    if (!rfq) return;

    setValue("projectName", rfq.projectName || "");
    setValue("description", rfq.description || "");
    setValue("fabricatorId", String(rfq.fabricatorId || ""));
    setValue("tools", rfq.tools || "");
    if (rfq.estimationDate) {
      setValue("estimateDate", rfq.estimationDate.split("T")[0]);
    }
  }, [selectedRfqId, rfqData, setValue, isEdit]);

  useEffect(() => {
    if (isEdit) return;
    if (initialRfqId && rfqData.length > 0 && !selectedRfqId) {
      const rfqIdStr = String(initialRfqId);
      setValue("rfqId", rfqIdStr);
    }
  }, [initialRfqId, rfqData, selectedRfqId, setValue, isEdit]);

  const rfqOptions = rfqData
    .filter((rfq) => rfq.wbtStatus === "RECEIVED")
    .map((rfq) => ({
      label: `${rfq.projectName} - ${rfq.fabricator?.fabName || "N/A"}`,
      value: String(rfq.id),
    }));

  const fabricatorOptions = fabricators.map((fab) => ({
    label: fab.fabName,
    value: String(fab.id),
  }));

  const onSubmit = async (data) => {
    try {
      const payload = {
        ...data,
        files,
        status: isEdit ? data.status : "DRAFT",
        estimateDate: data.estimateDate ? new Date(data.estimateDate).toISOString() : null,
      };

      const formData = new FormData();
      Object.entries(payload).forEach(([key, value]) => {
        if (key === "files" && Array.isArray(value)) {
          value.forEach((file) => formData.append("files", file));
        } else if (value !== null && value !== undefined && value !== "") {
          formData.append(key, value);
        }
      });

      if (isEdit) {
        await Service.UpdateEstimationById(initialData.id, formData);
        toast.success("Estimation updated successfully!");
      } else {
        await Service.AddEstimation(formData);
        toast.success("Estimation created successfully!");
      }
      onSuccess?.();
      reset();
      setFiles([]);
    } catch (error) {
      toast.error(error?.message || `Failed to ${isEdit ? "update" : "create"} estimation`);
    }
  };

  const isRfqLocked = !!initialRfqId || isEdit;

  return (
    <div className="w-full max-w-5xl mx-auto bg-white rounded-[2.5rem] shadow-2xl shadow-gray-200/50 border border-gray-100 p-8 md:p-12 transition-all duration-500">
      <div className="flex flex-col items-center mb-10">
        <div className="flex items-center gap-3 mb-3">
          <div className="h-px w-8 bg-[#6bbd45]/40"></div>
          <span className="text-[10px] font-black text-[#6bbd45] uppercase tracking-[0.3em]">Estimation Module</span>
          <div className="h-px w-8 bg-[#6bbd45]/40"></div>
        </div>
        <h2 className="text-3xl font-black text-center text-gray-900 tracking-tighter">
          {isEdit ? "Edit Estimation" : isRfqLocked ? "Create from RFQ" : "New Estimation"}
        </h2>
        <p className="text-gray-400 text-xs font-medium mt-2">Refine and finalize project estimation details.</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-10">
        {/* RFQ Selection */}
        <div className="bg-gray-50/50 rounded-3xl p-6 border border-gray-100/80">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-4 h-4 text-[#6bbd45]" />
            <SectionTitle title="RFQ Context" />
          </div>
          <div className="mt-2">
            <Controller
              name="rfqId"
              control={control}
              rules={{ required: "RFQ is required" }}
              render={({ field }) => (
                <Select
                  label="Select RFQ *"
                  placeholder={isRfqLocked ? "RFQ pre-selected" : "Search and select an RFQ..."}
                  options={rfqOptions}
                  value={field.value}
                  onChange={(_, val) => field.onChange(val ?? "")}
                  disabled={isEdit}
                />
              )}
            />
            {errors.rfqId && <p className="text-rose-500 text-[10px] font-bold uppercase tracking-tight mt-2 ml-1">{errors.rfqId.message}</p>}
          </div>
        </div>

        {/* Estimation Details */}
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Layout className="w-4 h-4 text-[#6bbd45]" />
              <SectionTitle title="Core Details" />
            </div>
            <div className="h-px flex-1 bg-gray-100"></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-[11px] font-black text-gray-400 uppercase tracking-wider ml-1">
                <Hash className="w-3 h-3" /> Estimation Number *
              </label>
              <Input
                {...register("estimationNumber", { required: "Required" })}
                placeholder="e.g. EST-2025-089"
                className="rounded-2xl border-gray-200 focus:ring-[#6bbd45] focus:border-[#6bbd45]"
              />
              {errors.estimationNumber && <p className="text-rose-500 text-[10px] font-bold uppercase tracking-tight ml-1">{errors.estimationNumber.message}</p>}
            </div>

            <div className="space-y-2">
              <label className="flex items-center gap-2 text-[11px] font-black text-gray-400 uppercase tracking-wider ml-1">
                <FileText className="w-3 h-3" /> Project Name
              </label>
              <Input
                {...register("projectName")}
                placeholder="Auto-filled from RFQ"
                disabled={!!selectedRfqId || isEdit}
                className="rounded-2xl border-gray-200 bg-gray-50/50"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="flex items-center gap-2 text-[11px] font-black text-gray-400 uppercase tracking-wider ml-1">
              <User className="w-3 h-3" /> Fabricator *
            </label>
            <Controller
              name="fabricatorId"
              control={control}
              rules={{ required: "Fabricator is required" }}
              render={({ field }) => (
                <Select
                  options={fabricatorOptions}
                  value={field.value}
                  onChange={(_, val) => field.onChange(val ?? "")}
                  disabled={isEdit}
                />
              )}
            />
            {errors.fabricatorId && <p className="text-rose-500 text-[10px] font-bold uppercase tracking-tight ml-1">{errors.fabricatorId.message}</p>}
          </div>
        </div>

        {/* Final Metrics - New Section */}
        {isEdit && (
          <div className="space-y-6 bg-[#6bbd45]/5 p-6 rounded-3xl border border-[#6bbd45]/10">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-[#6bbd45]" />
                <SectionTitle title="Final Metrics" />
              </div>
              <div className="h-px flex-1 bg-[#6bbd45]/10"></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-[11px] font-black text-gray-400 uppercase tracking-wider ml-1">
                  <Clock className="w-3 h-3" /> Final Hours
                </label>
                <Input
                  {...register("finalHours")}
                  placeholder="e.g. 120"
                  className="rounded-2xl border-gray-200"
                />
              </div>
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-[11px] font-black text-gray-400 uppercase tracking-wider ml-1">
                  <Calendar className="w-3 h-3" /> Final Weeks
                </label>
                <Input
                  {...register("finalWeeks")}
                  placeholder="e.g. 4"
                  className="rounded-2xl border-gray-200"
                />
              </div>
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-[11px] font-black text-gray-400 uppercase tracking-wider ml-1">
                  <DollarSign className="w-3 h-3" /> Final Price
                </label>
                <Input
                  type="number"
                  {...register("finalPrice")}
                  placeholder="e.g. 5000"
                  className="rounded-2xl border-gray-200"
                />
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          <div className="space-y-6">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-[#6bbd45]" />
              <SectionTitle title="Scope & Description" />
            </div>
            <textarea
              {...register("description")}
              rows={6}
              className="w-full px-6 py-4 bg-gray-50/30 border border-gray-200 rounded-[2rem] focus:ring-4 focus:ring-[#6bbd45]/10 focus:border-[#6bbd45] focus:bg-white transition-all duration-300 resize-none text-gray-700 placeholder:text-gray-300"
              placeholder="Detailed project scope and technical notes..."
              disabled={!!selectedRfqId || isEdit}
            />
          </div>

          <div className="space-y-8">
            <div className="space-y-6">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-[#6bbd45]" />
                <SectionTitle title="Timeline & Tools" />
              </div>
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-2">
                  <label className="text-[11px] font-black text-gray-400 uppercase tracking-wider ml-1">Estimate Date *</label>
                  <Input
                    type="date"
                    {...register("estimateDate", { required: "Required" })}
                    className="rounded-2xl border-gray-200"
                  />
                </div>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-[11px] font-black text-gray-400 uppercase tracking-wider ml-1">
                    <Tool className="w-3 h-3" /> Tools / Software
                  </label>
                  <Input
                    {...register("tools")}
                    placeholder="TEKLA, SDS/2, AutoCAD..."
                    disabled={!!selectedRfqId || isEdit}
                    className="rounded-2xl border-gray-200"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#6bbd45]" />
                <SectionTitle title="Status" />
              </div>
              <Controller
                name="status"
                control={control}
                render={({ field }) => (
                  <Select
                    options={EstimationStatusOptions}
                    value={field.value || "PENDING"}
                    onChange={(_, val) => field.onChange(val ?? "PENDING")}
                  />
                )}
              />
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Paperclip className="w-4 h-4 text-[#6bbd45]" />
              <SectionTitle title="Supporting Documents" />
            </div>
            <div className="h-px flex-1 bg-gray-100"></div>
          </div>
          <div className="bg-emerald-50/20 border-2 border-dashed border-emerald-100 rounded-[2.5rem] p-8 transition-colors hover:bg-emerald-50/40">
            <MultipleFileUpload onFilesChange={setFiles} />
            {files.length > 0 && (
              <div className="flex items-center gap-2 mt-4 px-4 py-2 bg-white rounded-xl border border-emerald-100 w-fit shadow-sm">
                <div className="w-2 h-2 bg-[#6bbd45] rounded-full animate-pulse"></div>
                <p className="text-[10px] font-black text-gray-600 uppercase tracking-widest">{files.length} file(s) ready</p>
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col md:flex-row justify-end gap-4 pt-8 border-t border-gray-100">
          <button
            type="button"
            onClick={() => { reset(); setFiles([]); onSuccess?.(); }}
            className="px-8 py-4 text-gray-400 text-[11px] font-black uppercase tracking-widest hover:text-gray-600 hover:bg-gray-50 rounded-2xl transition-all"
          >
            Discard
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-12 py-4 bg-gray-900 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-xl shadow-gray-900/10 hover:bg-black hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:translate-y-0 transition-all duration-300"
          >
            {isSubmitting ? "Processing..." : (isEdit ? "Update Estimation" : "Initialize Estimation")}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddEstimation;   