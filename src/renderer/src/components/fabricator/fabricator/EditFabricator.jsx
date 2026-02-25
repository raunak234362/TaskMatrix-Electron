/* eslint-disable no-useless-escape */
/* eslint-disable @typescript-eslint/no-explicit-any */
// src/components/fabricator/EditFabricator.jsx
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { Loader2, X, Check, Trash2, Paperclip } from "lucide-react";
import { motion } from "framer-motion";
import Service from "../../../api/Service";
import Input from "../../fields/input";
import Button from "../../fields/Button";
import MultipleFileUpload from "../../fields/MultipleFileUpload";
import Select from "../../fields/Select";
import { toast } from "react-toastify";

const EditFabricator = ({
  fabricatorData,
  onClose,
  onSuccess,
}) => {
  const userRole = sessionStorage.getItem("userRole");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [accounts, setAccounts] = useState([]);
  const [fetchingAccounts, setFetchingAccounts] = useState(false);
  const [wbtContactOptions, setWbtContactOptions] = useState();
  console.log(wbtContactOptions);

  // State to manage existing files that the user decides to KEEP
  const [filesToKeep, setFilesToKeep] = useState(
    fabricatorData.files || []
  );

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    reset,
  } = useForm({
    defaultValues: {
      fabName: "",
      website: "",
      drive: "",
      fabStage: "",
      accountId: "",
      SAC: "",
      fabricatPercentage: 0,
      approvalPercentage: 0,
      paymenTDueDate: 0,
      currencyType: "",
      wbtFabricatorPointOfContact: "",
      files: null, // Initialize new files to null
    },
  });

  // Fetch accounts on mount
  useEffect(() => {
    const fetchAccounts = async () => {
      setFetchingAccounts(true);
      try {
        const response = await Service.GetBankAccounts();
        const data = response?.data || response || [];
        setAccounts(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Error fetching accounts:", err);
      } finally {
        setFetchingAccounts(false);
      }
    };

    const fetchWBTContacts = async () => {
      try {
        const [admins, sales] = await Promise.all([
          Service.FetchEmployeeByRole("ADMIN"),
          Service.FetchEmployeeByRole("SALES_MANAGER"),
        ]);
        console.log(admins, sales);
        const allContacts = [
          ...(Array.isArray(admins?.data?.employees)
            ? admins.data.employees
            : []),
          ...(Array.isArray(sales?.data?.employees)
            ? sales.data.employees
            : [])
        ];

        // Remove duplicates if any
        const uniqueContacts = Array.from(
          new Map(allContacts.map((item) => [item.id || item._id, item])).values()
        );

        const options = uniqueContacts.map((u) => ({
          label: `${u.firstName} ${u.lastName} (${u.role})`,
          value: u.id || u._id,
        }));

        setWbtContactOptions(options);
      } catch (error) {
        console.error("Failed to fetch WBT contacts", error);
      }
    };

    fetchAccounts();
    fetchWBTContacts();
  }, []);

  // Pre‑fill form with fabricator data and initialize filesToKeep
  useEffect(() => {
    reset({
      fabName: fabricatorData.fabName || "",
      website: fabricatorData.website || "",
      drive: fabricatorData.drive || "",
      fabStage: fabricatorData.fabStage || "",
      accountId: fabricatorData.accountId || "",
      SAC: fabricatorData.SAC || "",
      fabricatPercentage: fabricatorData.fabricatPercentage || 0,
      approvalPercentage: fabricatorData.approvalPercentage || 0,
      paymenTDueDate: fabricatorData.paymenTDueDate || 0,
      currencyType: fabricatorData.currencyType || "",
      wbtFabricatorPointOfContact: Array.isArray(fabricatorData.wbtFabricatorPointOfContact)
        ? fabricatorData.wbtFabricatorPointOfContact[0] || ""
        : fabricatorData.wbtFabricatorPointOfContact || "",
      files: null,
    });
    setFilesToKeep(fabricatorData.files || []);
  }, [fabricatorData, reset]);

  // Handler to remove an existing file from the 'filesToKeep' list
  const handleRemoveExistingFile = (fileId, fileName) => {
    if (
      window.confirm(
        `Are you sure you want to delete the file: ${fileName}? This change will take effect on save.`
      )
    ) {
      setFilesToKeep((prev) => prev.filter((file) => (file.id || file._id) !== fileId));
      toast.info(`File '${fileName}' marked for deletion.`);
    }
  };

  // Submit handler
  const onSubmit = async (data) => {
    try {
      setSubmitting(true);
      setError(null);

      const formData = new FormData();

      // 1. Append Text Fields (only if they have values)
      if (data.fabName) formData.append("fabName", data.fabName);
      if (data.website) formData.append("website", data.website);
      if (data.drive) formData.append("drive", data.drive);
      if (data.wbtFabricatorPointOfContact)
        formData.append(
          "wbtFabricatorPointOfContact",
          JSON.stringify(Array.isArray(data.wbtFabricatorPointOfContact) ? data.wbtFabricatorPointOfContact : [data.wbtFabricatorPointOfContact])
        );
      if (data.fabStage) formData.append("fabStage", data.fabStage);
      if (data.accountId) formData.append("accountId", data.accountId);
      if (data.SAC) formData.append("SAC", data.SAC);
      if (data.fabricatPercentage !== undefined)
        formData.append(
          "fabricatPercentage",
          String(parseFloat(String(data.fabricatPercentage)))
        );
      if (data.approvalPercentage !== undefined)
        formData.append(
          "approvalPercentage",
          String(parseFloat(String(data.approvalPercentage)))
        );
      if (data.paymenTDueDate !== undefined)
        formData.append(
          "paymenTDueDate",
          String(parseFloat(String(data.paymenTDueDate)))
        );
      if (data.currencyType) formData.append("currencyType", data.currencyType);

      // 2. Append IDs of files to KEEP (only if not empty)
      const fileIdsToKeep = filesToKeep.map((file) => file.id || file._id);
      if (fileIdsToKeep.length > 0) {
        formData.append("files", JSON.stringify(fileIdsToKeep));
      }

      // 3. Append New Files (only if not empty)
      if (Array.isArray(data.files) && data.files.length > 0) {
        data.files.forEach((file) => {
          formData.append("files", file);
        });
      }

      // API Call
      const response = await Service.EditFabricatorByID(
        fabricatorData.id || fabricatorData._id,
        formData
      );
      console.log(response);

      toast.success("Fabricator updated successfully!");
      onSuccess?.(); // Refresh parent
      onClose();
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to update fabricator");
      console.error(err);
      toast.error(
        err?.response?.data?.message || "Failed to update fabricator"
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-10001 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 30 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 30 }}
        className="bg-white w-full max-w-5xl rounded-[40px] shadow-2xl overflow-hidden max-h-[90vh] flex flex-col relative border border-white/20"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center px-10 py-8 border-b border-slate-100 shrink-0 bg-slate-50/50">
          <div>
            <h2 className="text-3xl text-slate-900 tracking-tight leading-none mb-2 flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-green-100 flex items-center justify-center text-green-600">
                <Check className="w-6 h-6" />
              </div>
              Edit Engineering Partner
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-3 bg-white shadow-sm border border-slate-100 rounded-2xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all active:scale-90"
            aria-label="Close"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Body (Scrollable form) */}
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="px-10 py-8 space-y-10 overflow-y-auto flex-1 custom-scrollbar"
        >
          {error && (
            <div className="p-4 bg-rose-50 border border-rose-100 text-rose-700 rounded-2xl text-sm animate-in slide-in-from-top-2">
              Error: {error}
            </div>
          )}

          {/* Section 1: Identity */}
          <section className="space-y-6">
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <label className="block text-xs text-black font-bold uppercase tracking-widest mb-2">
                  Partner Name
                </label>
                <Input
                  label=""
                  {...register("fabName", {
                    required: "Fabricator name is required",
                  })}
                  placeholder="e.g. SteelWorks Global"
                  className="w-full bg-slate-50 border-slate-200 rounded-2xl focus:bg-white transition-all font-bold"
                />
                {errors.fabName && (
                  <p className="mt-2 text-[10px] text-rose-600 uppercase tracking-wider">
                    {errors.fabName.message}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-xs text-black font-bold uppercase tracking-widest mb-2">
                  Partner Stage
                </label>
                <select
                  {...register("fabStage", { required: "Stage is required" })}
                  className="w-full h-[46px] border border-slate-200 bg-slate-50 rounded-2xl px-4 py-2 focus:ring-4 focus:ring-green-500/10 focus:border-green-500 focus:bg-white outline-none transition-all shadow-sm text-slate-800 font-bold"
                >
                  <option value="">Select Stage</option>
                  <option value="RFQ">RFQ Analysis</option>
                  <option value="PRODUCTION">Full Production</option>
                </select>
              </div>
            </div>
            <div className="space-y-4 font-bold">
              <label className="block text-xs text-slate-700 uppercase tracking-widest mb-2">
                WBT Point of Contact
              </label>
              <Controller
                name="wbtFabricatorPointOfContact"
                control={control}
                render={({ field }) => (
                  <Select
                    name="wbtFabricatorPointOfContact"
                    options={wbtContactOptions}
                    label=""
                    value={field.value}
                    onChange={(_, val) => field.onChange(val)}
                  />
                )}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 font-bold">
              <div>
                <label className="block text-xs text-slate-700 uppercase tracking-widest mb-2">
                  Digital Hub (URL)
                </label>
                <Input
                  label=""
                  {...register("website")}
                  type="url"
                  placeholder="https://engineering.hub"
                  className="w-full bg-slate-50 border-slate-200 rounded-2xl"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-700 uppercase tracking-widest mb-2">
                  Shared Repository (Cloud)
                </label>
                <Input
                  label=""
                  {...register("drive")}
                  type="url"
                  placeholder="https://drive.repository"
                  className="w-full bg-slate-50 border-slate-200 rounded-2xl"
                />
              </div>
            </div>
          </section>

          {/* Section 2: Financials & Compliance */}
          {(userRole === "ADMIN" || userRole === "PROJECT_MANAGER_OFFICER") && (
            <section className="space-y-6 pt-10 border-t border-slate-100">
              <h3 className="text-[10px] text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                Financial Compliance & Policy
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div>
                  <label className="block text-xs text-slate-700 uppercase tracking-widest mb-2">
                    SAC Code
                  </label>
                  <Input
                    label=""
                    {...register("SAC")}
                    placeholder="e.g. 998311"
                    className="w-full bg-slate-50 border-slate-200 rounded-2xl font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-700 uppercase tracking-widest mb-2">
                    Primary Currency
                  </label>
                  <select
                    {...register("currencyType")}
                    className="w-full h-[46px] border border-slate-200 bg-slate-50 rounded-2xl px-4 py-2 focus:ring-4 focus:ring-green-500/10 focus:border-green-500 focus:bg-white outline-none transition-all shadow-sm text-slate-800 font-bold"
                  >
                    <option value="">Select Currency</option>
                    <option value="USD">USD (Dollar)</option>
                    <option value="CAD">CAD (Dollar)</option>
                    <option value="INR">INR (Rupee)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-slate-700 uppercase tracking-widest mb-2">
                    Vault Settlement
                  </label>
                  <select
                    {...register("accountId")}
                    className="w-full h-[46px] border border-slate-200 bg-slate-50 rounded-2xl px-4 py-2 focus:ring-4 focus:ring-green-500/10 focus:border-green-500 focus:bg-white outline-none transition-all shadow-sm text-slate-800 font-bold"
                    disabled={fetchingAccounts}
                  >
                    <option value="">Select Account</option>
                    {accounts.map((account) => (
                      <option
                        key={account._id || account.id}
                        value={account._id || account.id}
                      >
                        {account.accountName}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                <div>
                  <label className="block text-xs text-slate-700 uppercase tracking-widest mb-2">
                    Approval %
                  </label>
                  <Input
                    label=""
                    type="number"
                    {...register("approvalPercentage", { valueAsNumber: true })}
                    className="w-full bg-slate-50 border-slate-200 rounded-2xl font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-700 uppercase tracking-widest mb-2">
                    Fabrication %
                  </label>
                  <Input
                    label=""
                    type="number"
                    {...register("fabricatPercentage", { valueAsNumber: true })}
                    className="w-full bg-slate-50 border-slate-200 rounded-2xl font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-700 uppercase tracking-widest mb-2">
                    Settlement Cycle
                  </label>
                  <div className="relative">
                    <Input
                      label=""
                      type="number"
                      {...register("paymenTDueDate", { valueAsNumber: true })}
                      className="w-full bg-slate-50 border-slate-200 rounded-2xl pr-12 font-bold"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 font-bold">
                      DAYS
                    </span>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* Section 3: Assets */}
          <section className="space-y-6 pt-10 border-t border-slate-100">
           

            {/* Existing Files */}
            {filesToKeep.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {filesToKeep.map((file) => (
                  <div
                    key={file.id || file._id}
                    className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 group transition-all hover:bg-white hover:shadow-lg hover:shadow-slate-500/5"
                  >
                    <div className="flex items-center gap-3 truncate">
                      <Paperclip className="w-4 h-4 text-slate-400 group-hover:text-green-500 transition-colors" />
                      <span className="text-xs text-slate-700 truncate font-bold">
                        {file?.filename}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        handleRemoveExistingFile(file.id || file._id, file.filename)
                      }
                      className="p-2 bg-white rounded-xl text-slate-300 hover:text-rose-600 hover:shadow-sm transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* New Upload Area */}
            <div className="md:col-span-2">
              <Controller
                name="files"
                control={control}
                render={({ field }) => (
                  <MultipleFileUpload
                    onFilesChange={(files) => field.onChange(files)}
                  />
                )}
              />
            </div>
          </section>

          {/* Actions */}
          <div className="flex items-center justify-end gap-4 pt-10 border-t border-slate-100 sticky bottom-0 bg-white pb-6 mt-10">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-8 py-3 text-[10px] uppercase tracking-widest text-black border border-black rounded-2xl hover:text-slate-600 transition-all active:scale-95 font-bold"
            >
              Cancel Edit
            </button>
            <Button
              type="submit"
              disabled={submitting}
              className="px-10 py-3 bg-green-200 hover:bg-green-300 text-black  text-[10px] uppercase tracking-widest rounded-2xl shadow-xl shadow-green-100 transition-all active:scale-95 flex items-center gap-3 border-none font-bold border-black "
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Updating Intel...
                </>
              ) : (
                <>
                  <Check className="w-5 h-5 border " />
                  Commit Changes
                </>
              )}
            </Button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default EditFabricator;
