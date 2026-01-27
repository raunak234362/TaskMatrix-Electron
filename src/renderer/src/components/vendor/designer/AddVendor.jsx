/* eslint-disable react-hooks/exhaustive-deps */
import React from "react";
import { useForm } from "react-hook-form";
import Input from "../../fields/input";
// import Select from "react-select";
// import { State, City } from "country-state-city";
// import Service from "../../../api/Service";
import Button from "../../fields/Button";

import { toast } from "react-toastify";
import Service from "../../../api/Service";

const AddVendor = () => {
  // const [stateOptions, setStateOptions] = useState<
  //   { label; value }
  // >();
  // const [cityOptions, setCityOptions] = useState<
  //   { label; value }
  // >();

  // const countryMap<string, string> = {
  //   "United States": "US",
  //   Canada: "CA",
  //   India: "IN",
  // };

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm();

  // const country = watch("headquater.country");
  // const selectedStates = watch("headquater.states");

  // --- Load states when country changes ---
  // useEffect(() => {
  //   if (country && countryMap[country]) {
  //     const countryCode = countryMap[country];
  //     const statesData = State.getStatesOfCountry(countryCode) || []
  //     setStateOptions(
  //       statesData.map((s) => ({ label: s.name, value: s.name }))
  //     );

  //     setValue("headquater.states", );
  //     setValue("headquater.city", "");
  //     setCityOptions();
  //   } else {
  //     setStateOptions();
  //     setCityOptions();
  //     setValue("headquater.states", );
  //     setValue("headquater.city", "");
  //   }
  // }, [country, setValue]);
  // --- Load cities for all selected states ---
  // useEffect(() => {
  //   if (selectedStates.length > 0 && country && countryMap[country]) {
  //     const countryCode = countryMap[country];
  //     const allCities: { label; value } = ;

  //     selectedStates.forEach((stateName) => {
  //       const stateObj = State.getStatesOfCountry(countryCode).find(
  //         (s) => s.name === stateName
  //       );
  //       if (stateObj) {
  //         const cities =
  //           City.getCitiesOfState(countryCode, stateObj.isoCode) || []
  //         allCities.push(
  //           ...cities.map((c) => ({ label: c.name, value: c.name }))
  //         );
  //       }
  //     });

  //     setCityOptions(allCities);
  //   } else {
  //     setCityOptions();
  //   }
  // }, [selectedStates, country]);

  // --- Submit Form ---
  const onSubmit = async (data) => {
    try {
      const formData = new FormData();
      formData.append("name", data.name.trim());
      formData.append("contactInfo", data.contactInfo || "");
      formData.append("websiteLink", data.website || "");
      formData.append("email", data.email || "");
      // formData.append("insurenceLiability", data.insuranceLiability || "");

      // Append states  string if backend expects it that way,
      // or multiple appends if it expects multiple values with same key.
      // Given the previous payload was { state: data.headquater.states },
      // and it w, I'll stringify it if it's not handled by FormData automatically.
      // formData.append("state", JSON.stringify(data.headquater.states));

      // const location = data.headquater.city
      //   ? `${data.headquater.city}, ${data.headquater.country}`
      //   : data.headquater.country;
      // formData.append("location", location);

      // if (data.certificate && data.certificate.length > 0) {
      //   Array.from(data.certificate).forEach((file) => {
      //     formData.append("files", file);
      //   });
      // }

      console.log("🚀 FormData to send:", formData);
      await Service.AddVendor(formData); // ✅ Send to backend
      toast.success("Vendor created successfully!");
      // reset();
    } catch (error) {
      console.error("❌ Failed to create vendor:", error);
      toast.error("Failed to create Vendor");
    }
  };

  return (
    <div className="w-full h-auto mx-auto bg-white/80 backdrop-blur-lg rounded-2xl shadow-lg p-8 mt-8 border border-gray-200 overflow-visible">
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        {/* Connection Designer Name */}
        <Input
          label="Vendor Organization Name *"
          type="text"
          {...register("name", {
            required: "Vendor Oraganization name is required",
          })}
          placeholder="Enter Vendor Organization Name"
        />
        {errors.name && (
          <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>
        )}

        {/* Contact Info & Email */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Input
            label="Contact Info (optional)"
            type="text"
            {...register("contactInfo")}
            placeholder="Please enter contact number with extension"
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
          {/* <Input
            label="Insurance Liability (optional)"
            type="text"
            {...register("insuranceLiability")}
            placeholder="Enter Insurance Liability"
          /> */}
          {/* <div className="flex flex-col gap-1">
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
          </div> */}
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
          {/* <Controller
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
          /> */}

          {/* Multi-State */}
          {/* <Controller
            name="headquater.states"
            control={control}
            rules={{ required: "Select at least one state" }}
            render={({ field }) => (
              <Select
                isMulti
                placeholder="Select State(s)"
                options={stateOptions}
                value={stateOptions.filter((opt) =>
                  field.value.includes(opt.value)
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
          /> */}

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
        <div className="flex justify-center mt-6">
          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-linear-to-r from-green-600 to-emerald-500 text-white px-8 py-2.5 rounded-lg hover:opacity-90 shadow-md transition"
          >
            {isSubmitting ? "Creating..." : "Create Connection Designer"}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default AddVendor;
