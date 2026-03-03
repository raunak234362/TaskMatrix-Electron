/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import Input from "../../fields/input";
import Select from "react-select";
import Button from "../../fields/Button";
import { State } from "country-state-city";
import { toast } from "react-toastify";
import Service from "../../../api/Service";

const AddVendor = () => {
  const [stateOptions, setStateOptions] = useState([]);

  const countryMap = {
    "United States": "US",
    "Canada": "CA",
    "India": "IN"
  };

  const {
    register,
    handleSubmit,
    control,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting }
  } = useForm({
    defaultValues: {
      headquater: {
        country: "",
        states: [],
        city: ""
      }
    }
  });

  const country = watch("headquater.country");

  useEffect(() => {
    if (country && countryMap[country]) {
      const countryCode = countryMap[country];
      const statesData = State.getStatesOfCountry(countryCode) || [];
      setStateOptions(
        statesData.map((s) => ({ label: s.name, value: s.name }))
      );
      setValue("headquater.states", []);
      setValue("headquater.city", "");
    } else {
      setStateOptions([]);
      setValue("headquater.states", []);
      setValue("headquater.city", "");
    }
  }, [country, setValue]);

  const onSubmit = async (data) => {
    try {
      const location = data.headquater.city
        ? `${data.headquater.city}, ${data.headquater.country}`
        : data.headquater.country;

      const statesArray = Array.isArray(data.headquater.states) ? data.headquater.states : [];
      const hasFiles = data.files && data.files.length > 0;
      const hasCerts = data.certificates && data.certificates.length > 0;

      let response;

      if (hasFiles || hasCerts) {
        // Use multipart/form-data when there are actual file uploads
        const formData = new FormData();
        formData.append("name", data.name.trim());
        formData.append("contactInfo", data.contactInfo || "");
        formData.append("websiteLink", data.websiteLink || "");
        formData.append("email", data.email || "");
        formData.append("insurenceLiability", data.insurenceLiability || "");
        formData.append("location", location || "");

        // Append each state as state[] so backend parses as array
        statesArray.forEach((s) => formData.append("state[]", s));

        if (hasFiles) {
          Array.from(data.files).forEach((file) => formData.append("files", file));
        }
        if (hasCerts) {
          Array.from(data.certificates).forEach((file) => formData.append("certificates", file));
        }

        response = await Service.AddVendorWithFiles(formData);
      } else {
        // No files — send clean JSON so state arrives as a proper array
        const payload = {
          name: data.name.trim(),
          contactInfo: data.contactInfo || "",
          websiteLink: data.websiteLink || "",
          email: data.email || "",
          insurenceLiability: data.insurenceLiability || "",
          location: location || "",
          state: statesArray,
          files: [],
          certificates: [],
        };
        response = await Service.AddVendor(payload);
      }

      console.log("✅ Vendor created:", response);
      toast.success("Vendor added successfully!");
      reset();
    } catch (error) {
      console.error("❌ Failed to add vendor:", error);
      toast.error("Failed to add Vendor");
    }
  };

  return (
    <div className="w-full h-auto mx-auto bg-white/80 backdrop-blur-lg rounded-2xl shadow-lg p-8 mt-4 border border-gray-200 overflow-visible">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Add New Vendor</h2>
        <p className="text-gray-500">Provide vendor details to register them in the system.</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
        <Input
          label="Vendor Name *"
          type="text"
          {...register("name", { required: "Vendor name is required" })}
          placeholder="Enter Vendor Name"
        />
        {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Input
            label="Contact Info"
            type="text"
            {...register("contactInfo")}
            placeholder="+1 234 567 890"
          />
          <Input
            label="Email Address"
            type="email"
            {...register("email")}
            placeholder="vendor@example.com"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Input
            label="Website Link"
            type="url"
            {...register("websiteLink")}
            placeholder="https://example.com"
          />
          <Input
            label="Insurance Liability"
            type="text"
            {...register("insurenceLiability")}
            placeholder="Insurance Details"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Files</label>
            <input
              type="file"
              multiple
              className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100 border border-gray-300 rounded-lg p-1"
              onChange={(e) => {
                if (e.target.files) {
                  setValue("files", Array.from(e.target.files));
                }
              }}
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Certificates</label>
            <input
              type="file"
              multiple
              className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100 border border-gray-300 rounded-lg p-1"
              onChange={(e) => {
                if (e.target.files) {
                  setValue("certificates", Array.from(e.target.files));
                }
              }}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Controller
            name="headquater.country"
            control={control}
            rules={{ required: "Country is required" }}
            render={({ field }) => (
              <Select
                placeholder="Select Country"
                options={Object.keys(countryMap).map((c) => ({ label: c, value: c }))}
                value={field.value ? { label: field.value, value: field.value } : null}
                onChange={(option) => field.onChange(option?.value || "")}
                menuPortalTarget={document.body}
                styles={{ menuPortal: (base) => ({ ...base, zIndex: 9999 }) }}
              />
            )}
          />

          <Controller
            name="headquater.states"
            control={control}
            rules={{ required: "Select at least one state" }}
            render={({ field }) => (
              <Select
                isMulti
                placeholder="Select State(s)"
                options={stateOptions}
                value={(stateOptions || []).filter((opt) => field.value.includes(opt.value))}
                onChange={(options) => {
                  const selected = options ? options.map((opt) => opt.value) : [];
                  field.onChange(selected);
                }}
                menuPortalTarget={document.body}
                styles={{ menuPortal: (base) => ({ ...base, zIndex: 9999 }) }}
              />
            )}
          />

          <Input
            label="Location / City"
            type="text"
            {...register("headquater.city")}
            placeholder="Enter City"
          />
        </div>

        <div className="flex justify-end mt-6">
          <Button
            type="submit"
            disabled={isSubmitting}
            className="bg-green-200 text-black px-12 py-3 rounded-xl font-bold hover:bg-green-300 shadow-lg transition-all"
          >
            {isSubmitting ? "Processing..." : "ADD VENDOR"}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default AddVendor;

