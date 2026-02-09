/* eslint-disable no-useless-escape */
/* eslint-disable @typescript-eslint/no-explicit-any */
// src/components/fabricator/EditFabricator.tsx
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { Loader2, X, Check, Trash2, Paperclip } from "lucide-react"; // Added Trash2, Paperclip

import Service from "../../../api/Service";
import Input from "../../fields/input";
import Button from "../../fields/Button";
import MultipleFileUpload from "../../fields/MultipleFileUpload"; // Component for new file selection
import { toast } from "react-toastify"; // Assume toast is available

// --- File Interfaces (matching your fabricatorData.files structure) ---



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

  // State to manage existing files that the user decides to KEEP
  const [filesToKeep, setFilesToKeep] = useState(
    (fabricatorData.files ?? []) || []
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
      fabStage: undefined,
      accountId: "",
      SAC: "",
      fabricatPercentage: 0,
      approvalPercentage: 0,
      paymenTDueDate: 0,
      currencyType: "",
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
    fetchAccounts();
  }, []);

  // Pre‑fill form with fabricator data and initialize filesToKeep
  useEffect(() => {
    reset({
      fabName: fabricatorData.fabName || "",
      website: fabricatorData.website || "",
      drive: fabricatorData.drive || "",
      fabStage: fabricatorData.fabStage,
      accountId: (fabricatorData).accountId || "",
      SAC: fabricatorData.SAC || "",
      fabricatPercentage: fabricatorData.fabricatPercentage || 0,
      approvalPercentage: fabricatorData.approvalPercentage || 0,
      paymenTDueDate: fabricatorData.paymenTDueDate || 0,
      currencyType: fabricatorData.currencyType || "",
      files: null,
    });
    setFilesToKeep((fabricatorData.files ?? []) || []);
  }, [fabricatorData, reset]);

  // Handler to remove an existing file from the 'filesToKeep' list
  const handleRemoveExistingFile = (fileId, fileName) => {
    if (
      window.confirm(
        `Are you sure you want to delete the file: ${fileName}? This change will take effect on save.`
      )
    ) {
      setFilesToKeep((prev) => prev.filter((file) => file.id !== fileId));
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
      const fileIdsToKeep = filesToKeep.map((file) => file.id);
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
        fabricatorData.id,
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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 bg-opacity-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white w-full max-w-lg rounded-xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center p-5 border-b bg-gray-50 flex-shrink-0">
          <h2 className="text-xl  text-gray-700">Edit Fabricator</h2>
          <button
            onClick={onClose}
            className="text-gray-700 hover:text-gray-700 transition"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body (Scrollable form) */}
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="p-5 space-y-5 overflow-y-auto flex-1"
        >
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Fabricator Name */}
          <div>
            <Input
              label="Fabricator Name"
              {...register("fabName", {
                required: "Fabricator name is required",
              })}
              placeholder="e.g. SteelWorks Inc."
              className="w-full"
            />
            {errors.fabName && (
              <p className="mt-1 text-xs text-red-600">
                {errors.fabName.message}
              </p>
            )}
          </div>


          {/* Website */}
          <div>
            <Input
              label="Website"
              {...register("website", {
                pattern: {
                  value:
                    /^$|^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([\/\w .-]*)*\/?$/i,
                  message: "Please enter a valid URL",
                },
              })}
              type="url"
              placeholder="https://example.com"
              className="w-full"
            />
            {errors.website && (
              <p className="mt-1 text-xs text-red-600">
                {errors.website.message}
              </p>
            )}
          </div>

          {/* Drive Link */}
          <div>
            <Input
              label="Drive Link"
              {...register("drive", {
                pattern: {
                  value:
                    /^$|^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([\/\w .-]*)*\/?$/i,
                  message: "Please enter a valid URL",
                },
              })}
              type="url"
              placeholder="https://drive.google.com/..."
              className="w-full"
            />
            {errors.drive && (
              <p className="mt-1 text-xs text-red-600">
                {errors.drive.message}
              </p>
            )}
          </div>
          {(userRole === "ADMIN" || userRole === "PROJECT_MANAGER_OFFICER") && (
            <>
              <div>
                <Input
                  label="SAC"
                  {...register("SAC")}
                  placeholder="e.g. 1234567890"
                  className="w-full"
                />
                {errors.SAC && (
                  <p className="mt-1 text-xs text-red-600">{errors.SAC.message}</p>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                <div>
                  <Input
                    label="Approval Percentage (%)"
                    type="number"
                    {...register("approvalPercentage", { valueAsNumber: true })}
                    placeholder="0"
                    className="w-full"
                  />
                  {errors.approvalPercentage && (
                    <p className="mt-1 text-xs text-red-600">
                      {errors.approvalPercentage.message}
                    </p>
                  )}
                </div>
                <div>
                  <Input
                    label="Fabrication Percentage (%)"
                    type="number"
                    {...register("fabricatPercentage", { valueAsNumber: true })}
                    placeholder="0"
                    className="w-full"
                  />
                  {errors.fabricatPercentage && (
                    <p className="mt-1 text-xs text-red-600">
                      {errors.fabricatPercentage.message}
                    </p>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Input
                    label="Payment Due Date (Days)"
                    type="number"
                    {...register("paymenTDueDate", { valueAsNumber: true })}
                    placeholder="0"
                    className="w-full"
                  />
                  {errors.paymenTDueDate && (
                    <p className="mt-1 text-xs text-red-600">
                      {errors.paymenTDueDate.message}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Currency Type
                  </label>
                  <select
                    {...register("currencyType")}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all bg-white"
                  >
                    <option value="">-- Select Currency --</option>
                    <option value="USD">USD</option>
                    <option value="CAD">CAD</option>
                    <option value="Rupees">Rupees</option>
                  </select>
                  {errors.currencyType && (
                    <p className="mt-1 text-xs text-red-600">
                      {errors.currencyType.message}
                    </p>
                  )}
                </div>
              </div>
              <div>
                <label className="block text-gray-700 font-semibold mb-1">
                  Stage <span className="text-red-500">*</span>
                </label>
                <select
                  {...register("fabStage", { required: "Stage is required" })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-green-500 focus:border-green-500 outline-none bg-white transition-all shadow-sm"
                >
                  <option value="">Select Stage</option>
                  <option value="RFQ">RFQ</option>
                  <option value="PRODUCTION">PRODUCTION</option>
                </select>
                {errors.fabStage && (
                  <p className="text-red-500 text-xs mt-1">
                    {String(errors.fabStage.message)}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Bank Account
                </label>
                <select
                  {...register("accountId")}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all bg-white"
                  disabled={fetchingAccounts}
                >
                  <option value="">-- Select Bank Account --</option>
                  {accounts.map((account) => (
                    <option
                      key={account._id || account.id}
                      value={account._id || account.id}
                    >
                      {account.accountName} ({account.accountNumber})
                    </option>
                  ))}
                </select>
              </div>
            </>
          )}



          {/* --- Existing Files Display/Deletion --- */}
          {filesToKeep.length > 0 && (
            <div className="p-3 border rounded-lg bg-gray-50">
              <p className="text-sm font-semibold text-gray-700 mb-2">
                Existing Files
              </p>
              <ul className="space-y-2">
                {filesToKeep.map((file) => (
                  <li
                    key={file.id}
                    className="flex items-center justify-between p-2 border bg-white rounded-md"
                  >
                    <a
                      href={file.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center text-blue-600 hover:underline text-sm truncate mr-4"
                    >
                      <Paperclip className="w-4 h-4 mr-2 shrink-0 text-gray-700" />
                      {file?.filename}
                    </a>
                    <button
                      type="button"
                      onClick={() =>
                        handleRemoveExistingFile(file.id, file.filename)
                      }
                      className="text-red-500 hover:text-red-700 p-1 rounded transition"
                      aria-label={`Delete existing file ${file.filename}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* New File Upload (via Controller and MultipleFileUpload) */}
          <div className="md:col-span-2">
            <Controller
              name="files"
              control={control}
              render={({ field }) => (
                <MultipleFileUpload
                  // Assuming MultipleFileUpload takes an onFilesChange prop
                  onFilesChange={(files) => {
                    // Update RHF state with the new File[]
                    field.onChange(files);
                  }}
                // You might need to pass the existing files here if MultipleFileUpload handles both
                // For this structure, we're assuming it only handles *new* selections.
                // existingFiles={filesToKeep}
                />
              )}
            />
            {errors.files && (
              <p className="text-red-500 text-xs mt-1">
                {String(errors.files.message)}
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-3 border-t flex-shrink-0">
            <Button type="button" onClick={onClose} disabled={submitting}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={submitting}
              className="bg-green-600 text-white hover:bg-green-700 flex items-center gap-2 disabled:opacity-70"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditFabricator;
