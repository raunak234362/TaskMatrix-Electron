import { useState } from "react";
import { Controller, useForm } from "react-hook-form";

import Service from "../../../api/Service";
import { toast } from "react-toastify";
import Input from "../../fields/input";
import Button from "../../fields/Button";
import MultipleFileUpload from "../../fields/MultipleFileUpload";
import { useDispatch } from "react-redux";
import { addFabricator } from "../../../store/fabricatorSlice";
import AddBranch from "../branches/AddBranch";

const AddFabricator = () => {
  const dispatch = useDispatch();
  const [addedFabricatorId, setAddedFabricatorId] = useState(
    null,
  );
  const userRole = sessionStorage.getItem("userRole");
  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
    reset,
  } = useForm();

  const onSubmit = async (data) => {
    try {
      const formData = new FormData();
      formData.append("fabName", data.fabName.toUpperCase());
      formData.append("website", data.website || "");
      formData.append("drive", data.drive || "");
      formData.append("fabStage", data.fabStage || "");

      if (data.approvalPercentage !== undefined)
        formData.append(
          "approvalPercentage",
          String(parseFloat(String(data.approvalPercentage))),
        );
      if (data.paymenTDueDate !== undefined)
        formData.append(
          "paymenTDueDate",
          String(parseFloat(String(data.paymenTDueDate))),
        );
      if (data.fabricatPercentage !== undefined)
        formData.append(
          "fabricatPercentage",
          String(parseFloat(String(data.fabricatPercentage))),
        );

      if (Array.isArray(data.files) && data.files.length > 0) {
        // Append each file to the FormData
        // The backend should be set up to receive an array for the 'files' field
        data.files.forEach((file) => {
          formData.append("files", file);
        });
      }

      const response = await Service.AddFabricator(formData);
      dispatch(addFabricator(response?.data));

      const newFabId =
        response?.data?._id ||
        response?.data?.id ||
        response?._id ||
        response?.id;
      if (newFabId) {
        setAddedFabricatorId(newFabId);
      }

      console.log("Fabricator added:", response);
      toast.success("Fabricator created successfully");
      reset(); // Reset form to default values
    } catch (error) {
      console.error(error);
      toast.error("Failed to add the fabricator");
    }
  };

  return (
    <div className="w-full mx-auto bg-white/80 backdrop-blur-lg rounded-2xl shadow-lg p-8 mt-8 border border-gray-200">
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="grid grid-cols-1 md:grid-cols-2 gap-6"
      >
        {/* Fabricator Name */}
        <div>
          <label className="block text-gray-700 font-semibold mb-1">
            Fabricator Name <span className="text-red-500">*</span>
          </label>
          <Input
            label=""
            type="text"
            {...register("fabName", {
              required: "Fabricator name is required",
            })}
            placeholder="Enter Fabricator Name"
            className="w-full border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500"
          />
          {errors.fabName && (
            <p className="text-red-500 text-xs mt-1">
              {String(errors.fabName.message)}
            </p>
          )}
        </div>

        {/* Website */}
        <div>
          <label className="block text-gray-700 font-semibold mb-1">
            Website (optional)
          </label>
          <Input
            label=""
            type="url"
            {...register("website")}
            placeholder="https://example.com"
            className="w-full border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500"
          />
        </div>

        {/* Drive Link */}
        <div>
          <label className="block text-gray-700 font-semibold mb-1">
            Drive Link (optional)
          </label>
          <Input
            label=""
            type="url"
            {...register("drive")}
            placeholder="https://drive.google.com/..."
            className="w-full border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500"
          />
        </div>

        {/* Stage Selection */}
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
        {(userRole === "ADMIN" || userRole === "PROJECT_MANAGER_OFFICER") && (
          <>
            <div>
              <label className="block text-gray-700 font-semibold mb-1">
                Approval Percentage (%)
              </label>
              <Input
                label=""
                type="number"
                {...register("approvalPercentage", { valueAsNumber: true })}
                placeholder="0"
                className="w-full border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500"
              />
            </div>

            <div>
              <label className="block text-gray-700 font-semibold mb-1">
                FabricatION Percentage (%)
              </label>
              <Input
                label=""
                type="number"
                {...register("fabricatPercentage", { valueAsNumber: true })}
                placeholder="0"
                className="w-full border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500"
              />
            </div>
            <div>
              <label className="block text-gray-700 font-semibold mb-1">
                Payment Due Date (Days)
              </label>
              <Input
                label=""
                type="number"
                {...register("paymenTDueDate", { valueAsNumber: true })}
                placeholder="0"
                className="w-full border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500"
              />
            </div>
          </>
        )}

        {/* Payment Due Date */}

        {/* File Upload - FIXED */}
        {/* This container div was missing, and there was a stray </div> */}
        <div className="md:col-span-2">
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
          {errors.files && (
            <p className="text-red-500 text-xs mt-1">
              {String(errors.files.message)}
            </p>
          )}
        </div>
        {/* The stray </div> that was here is now removed */}

        {/* Submit Button */}
        <div className="md:col-span-2 flex justify-center mt-4">
          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-linear-to-r from-green-600 to-emerald-500 text-white px-8 py-2.5 rounded-lg hover:opacity-90 shadow-md transition"
          >
            {isSubmitting ? "Creating..." : "Create Fabricator"}
          </Button>
        </div>
      </form>

      {addedFabricatorId && (
        <div className="mt-12 pt-8 border-t border-gray-200">
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-6 mb-8">
            <h3 className="text-xl font-bold text-emerald-800 mb-2">
              Fabricator Added Successfully!
            </h3>
            <p className="text-emerald-700">
              Required to add branch for this fabricator.
            </p>
          </div>

          <AddBranch
            fabricatorId={addedFabricatorId}
            onClose={() => setAddedFabricatorId(null)}
          />
        </div>
      )}
    </div>
  );
};

export default AddFabricator;
