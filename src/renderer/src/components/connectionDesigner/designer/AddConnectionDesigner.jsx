/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import Input from "../../fields/input";
import Select from "react-select";
import Button from "../../fields/Button";
import { State } from "country-state-city";

import { toast } from "react-toastify";
import Service from "../../../api/Service";
// import Service from "../../../api/Service";

const AddConnectionDesigner = () => {
  const [stateOptions, setStateOptions] = useState([]);

  const countryMap = {
    "United States": "US",
    Canada: "CA",
    India: "IN",
  };

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
      headquater: {
        country: "",
        states: [],
        city: "",
      },
    },
  });

  const country = watch("headquater.country");

  // --- Load states when country changes ---
  useEffect(() => {
    if (country && countryMap[country]) {
      const countryCode = countryMap[country];
      const statesData = State.getStatesOfCountry(countryCode) || []
      setStateOptions(
        statesData.map((s) => ({ label: s.name, value: s.name })),
      );

      setValue("headquater.states", []);
      setValue("headquater.city", "");
    } else {
      setStateOptions([]);

      setValue("headquater.states", []);
      setValue("headquater.city", "");
    }
  }, [country, setValue]);

  // --- Submit Form ---
  const onSubmit = async (data) => {
    try {
      const formData = new FormData();
      formData.append("name", data.connectionDesignerName.trim());
      formData.append("contactInfo", data.contactInfo || "");
      formData.append("websiteLink", data.website || "");
      formData.append("email", data.email || "");
      formData.append("insurenceLiability", data.insuranceLiability || "");

      // Append states individually to ensure backend treats it as an array/list
      if (data.headquater.states && Array.isArray(data.headquater.states)) {
        data.headquater.states.forEach((s) => {
          formData.append("state", s);
        });
      }

      const location = data.headquater.city
        ? `${data.headquater.city}, ${data.headquater.country}`
        : data.headquater.country;
      formData.append("location", location);

      if (data.certificate && data.certificate.length > 0) {
        Array.from(data.certificate).forEach((file) => {
          formData.append("files", file);
        });
      }

      console.log("🚀 FormData to send:", formData);
      await Service.AddConnectionDesigner(formData); // ✅ Send to backend
      toast.success("Connection Designer created successfully!");
      reset();
    } catch (error) {
      console.error("❌ Failed to create designer:", error);
      toast.error("Failed to create Connection Designer");
    }
  };

  return (
    <div className="w-full h-auto mx-auto bg-white/80 backdrop-blur-lg rounded-2xl shadow-lg p-8 mt-8 border border-gray-200 overflow-visible">
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        {/* Connection Designer Name */}
        <Input
          label="Connection Designer Name *"
          type="text"
          {...register("connectionDesignerName", {
            required: "Connection Designer name is required",
          })}
          placeholder="Enter Connection Designer Name"
        />
        {errors.connectionDesignerName && (
          <p className="text-red-500 text-xs mt-1">
            {errors.connectionDesignerName.message}
          </p>
        )}

        {/* Contact Info & Email */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Input
            label="Contact Info (optional)"
            type="text"
            {...register("contactInfo")}
            placeholder="+91 9876543210"
          />
          <Input
            label="Email (optional)"
            type="email"
            {...register("email")}
            placeholder="info@example.com"
          />
        </div>

        {/* Insurance Liability & Certificate */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Input
            label="Insurance Liability (optional)"
            type="text"
            {...register("insuranceLiability")}
            placeholder="Enter Insurance Liability"
          />
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">
              Certificate (optional)
            </label>
            <input
              type="file"
              multiple
              className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100 border border-gray-300 rounded-lg p-1"
              onChange={(e) => {
                if (e.target.files) {
                  setValue("certificate", Array.from(e.target.files));
                }
              }}
            />
          </div>
        </div>

        {/* Website & Drive Link */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Input
            label="Website (optional)"
            type="url"
            {...register("website")}
            placeholder="https://example.com"
          />
          <Input
            label="Drive Link (optional)"
            type="url"
            {...register("drive")}
            placeholder="https://drive.google.com/..."
          />
        </div>

        {/* Country, Multi-State, City */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Country */}
          <Controller
            name="headquater.country"
            control={control}
            rules={{ required: "Country is required" }}
            render={({ field }) => (
              <Select
                placeholder="Select Country"
                options={Object.keys(countryMap).map((c) => ({
                  label: c,
                  value: c,
                }))}
                value={
                  field.value
                    ? { label: field.value, value: field.value }
                    : null
                }
                onChange={(option) => field.onChange(option?.value || "")}
                menuPortalTarget={document.body}
                styles={{ menuPortal: (base) => ({ ...base, zIndex: 9999 }) }}
              />
            )}
          />

          {/* Multi-State */}
          <Controller
            name="headquater.states"
            control={control}
            rules={{ required: "Select at least one state" }}
            render={({ field }) => (
              <Select
                isMulti
                placeholder="Select State(s)"
                options={stateOptions}
                value={(stateOptions || []).filter((opt) =>
                  field.value.includes(opt.value),
                )}
                onChange={(options) => {
                  const selected = options
                    ? options.map((opt) => opt.value)
                    : []
                  field.onChange(selected);
                  setValue("headquater.city", "");
                }}
                menuPortalTarget={document.body}
                styles={{ menuPortal: (base) => ({ ...base, zIndex: 9999 }) }}
              />
            )}
          />

          {/* City (Optional) */}
          {/* <Controller
            name="headquater.city"
            control={control}
            render={({ field }) => (
              <Select
                placeholder="Select City (Optional)"
                options={cityOptions}
                value={
                  field.value
                    ? { label: field.value, value: field.value }
                    : null
                }
                onChange={(option) => field.onChange(option?.value || "")}
                menuPortalTarget={document.body}
                styles={{ menuPortal: (base) => ({ ...base, zIndex: 9999 }) }}
              />
            )}
          /> */}
        </div>

        {/* Submit Button */}
        <div className="flex justify-end mt-6">
          <Button
            type="submit"
            disabled={isSubmitting}
            className="bg-linear-to-r from-green-600 to-emerald-500 text-white px-8 py-2.5 rounded-lg hover:opacity-90 shadow-md transition"
          >
            {isSubmitting ? "Creating..." : "Create Connection Designer"}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default AddConnectionDesigner;
