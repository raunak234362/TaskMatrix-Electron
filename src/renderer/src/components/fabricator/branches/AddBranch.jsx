import { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";

import Button from "../../fields/Button";
import Service from "../../../api/Service";
import Input from "../../fields/input";
import { toast } from "react-toastify";
import Select from "react-select";
import { Country, State, City } from "country-state-city";
import axios from "axios";

const AddBranch = ({ fabricatorId, onClose }) => {
  const [stateOptions, setStateOptions] = useState([]);
  const [cityOptions, setCityOptions] = useState([]);

  const {
    register,
    handleSubmit,
    control,
    setValue,
    watch,
    formState: { errors, isSubmitting },
    reset,
  } = useForm({
    defaultValues: {
      fabricatorId,
      isHeadquarters: false,
      country: "IN", // Default to India
    },
  });

  const selectedCountry = watch("country");
  const selectedState = watch("state");
  const zipCode = watch("zipCode");

  // --- Load states when country changes ---
  useEffect(() => {
    if (selectedCountry) {
      const statesData = State.getStatesOfCountry(selectedCountry) || [];
      setStateOptions(
        statesData.map((s) => ({ label: s.name, value: s.isoCode }))
      );
      // Only reset if the country actually changed and it's not the initial load
      // But for simplicity, we'll let the user re-select
    } else {
      setStateOptions([]);
    }
  }, [selectedCountry]);

  // --- Load cities when state changes ---
  useEffect(() => {
    if (selectedCountry && selectedState) {
      const citiesData =
        City.getCitiesOfState(selectedCountry, selectedState) || [];
      setCityOptions(citiesData.map((c) => ({ label: c.name, value: c.name })));
    } else {
      setCityOptions([]);
    }
  }, [selectedCountry, selectedState]);

  // --- Pincode Fetching ---
  const handleZipCodeBlur = async () => {
    if (zipCode && zipCode.length === 6 && selectedCountry === "IN") {
      try {
        const response = await axios.get(
          `https://api.postalpincode.in/pincode/${zipCode}`
        );
        const data = response.data[0];
        if (data.Status === "Success") {
          const postOffice = data.PostOffice[0];
          const stateName = postOffice.State;
          const cityName = postOffice.District;

          // Find state code
          const states = State.getStatesOfCountry("IN");
          const stateObj = states.find(
            (s) => s.name.toLowerCase() === stateName.toLowerCase()
          );

          if (stateObj) {
            setValue("state", stateObj.isoCode);
            // City options will update via useEffect, but we can set the value after a short delay or manually
            setTimeout(() => {
              setValue("city", cityName);
            }, 100);
          }
          toast.success("Address details fetched from pincode");
        }
      } catch (error) {
        console.error("Pincode fetch failed:", error);
      }
    }
  };

  const onSubmit = async (data) => {
    try {
      console.log("Branch Form Submitted:", data);
      const response = await Service.AddBranchByFabricator(data);
      console.log(response);
      toast.success("Branch added successfully");
      reset();
      if (onClose) onClose();

      // API Request Example ⬇
      // const response = await Service.AddBranchToFabricator(data);
      // if (response.success) onSubmitSuccess?.(data);

      // reset();
    } catch (err) {
      console.error("Failed to add branch:", err);
      toast.error("Failed to add branch");
    }
  };

  return (
    <>
      <Button onClick={onClose}>Close</Button>
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-white shadow rounded"
      >
        {/* Hidden fabricatorId */}
        <input
          type="hidden"
          value={fabricatorId}
          {...register("fabricatorId")}
        />
        {/* Name */}
        <div>
          <Input
            label="Headquater/ Branches"
            type="text"
            {...register("name", { required: "Branch name is required" })}
            className="input"
            placeholder="Headquater/ Branches"
          />
          {errors.name && (
            <p className="text-red-500 text-xs">{errors.name.message}</p>
          )}
        </div>

        {/* Email */}
        <div>
          <Input
            label="email"
            type="email"
            {...register("email", {
              required: "Email required",
              pattern: { value: /\S+@\S+\.\S+/, message: "Invalid email" },
            })}
            className="input"
            placeholder="branch@company.com"
          />
          {errors.email && (
            <p className="text-red-500 text-xs">{errors.email.message}</p>
          )}
        </div>

        {/* Phone & Extension */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Input
              label="Phone"
              type="text"
              {...register("phone", { required: "Phone required" })}
              className="input"
              placeholder="+91XXXXXXXXXX"
            />
            {errors.phone && (
              <p className="text-red-500 text-xs">{errors.phone.message}</p>
            )}
          </div>
          <div>
            <Input
              label="Extension"
              type="text"
              {...register("extension")}
              className="input"
              placeholder="Ext"
            />
          </div>
        </div>

        {/* Address */}
        <div className="md:col-span-2">
          <Input
            label="Address"
            type="text"
            {...register("address", { required: "Address required" })}
            className="input"
            placeholder="123 Industrial Area"
          />
          {errors.address && (
            <p className="text-red-500 text-xs">{errors.address.message}</p>
          )}
        </div>

        {/* Country */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Country
          </label>
          <Controller
            name="country"
            control={control}
            rules={{ required: "Country is required" }}
            render={({ field }) => (
              <Select
                placeholder="Select Country"
                options={Country.getAllCountries().map((c) => ({
                  label: c.name,
                  value: c.isoCode,
                }))}
                value={
                  Country.getAllCountries()
                    .filter((c) => c.isoCode === field.value)
                    .map((c) => ({ label: c.name, value: c.isoCode }))[0] ||
                  null
                }
                onChange={(option) => {
                  field.onChange(option?.value || "");
                  setValue("state", "");
                  setValue("city", "");
                }}
                menuPortalTarget={document.body}
                styles={{ menuPortal: (base) => ({ ...base, zIndex: 9999 }) }}
              />
            )}
          />
          {errors.country && (
            <p className="text-red-500 text-xs">{errors.country.message}</p>
          )}
        </div>

        {/* State */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            State
          </label>
          <Controller
            name="state"
            control={control}
            rules={{ required: "State is required" }}
            render={({ field }) => (
              <Select
                placeholder="Select State"
                options={stateOptions}
                value={
                  stateOptions.find((opt) => opt.value === field.value) || null
                }
                onChange={(option) => {
                  field.onChange(option?.value || "");
                  setValue("city", "");
                }}
                isDisabled={!selectedCountry}
                menuPortalTarget={document.body}
                styles={{ menuPortal: (base) => ({ ...base, zIndex: 9999 }) }}
              />
            )}
          />
          {errors.state && (
            <p className="text-red-500 text-xs">{errors.state.message}</p>
          )}
        </div>

        {/* City */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            City
          </label>
          <Controller
            name="city"
            control={control}
            rules={{ required: "City is required" }}
            render={({ field }) => (
              <Select
                placeholder="Select City"
                options={cityOptions}
                value={
                  cityOptions.find((opt) => opt.value === field.value) || null
                }
                onChange={(option) => field.onChange(option?.value || "")}
                isDisabled={!selectedState}
                menuPortalTarget={document.body}
                styles={{ menuPortal: (base) => ({ ...base, zIndex: 9999 }) }}
              />
            )}
          />
          {errors.city && (
            <p className="text-red-500 text-xs">{errors.city.message}</p>
          )}
        </div>

        {/* ZipCode */}
        <div>
          <Input
            label="Zipcode"
            type="text"
            {...register("zipCode", {
              required: "Zip Code required",
              onBlur: handleZipCodeBlur,
            })}
            className="input"
            placeholder="560001"
          />
          {errors.zipCode && (
            <p className="text-red-500 text-xs">{errors.zipCode.message}</p>
          )}
        </div>

        {/* Is Headquarters */}
        <div className=" flex items-center gap-2 mt-2">
          <Input
            label="Headquater"
            type="checkbox"
            {...register("isHeadquarters")}
          />
        </div>

        {/* Submit */}
        <div className="md:col-span-2">
          <Button type="submit" disabled={isSubmitting} className="w-full">
            {isSubmitting ? "Saving..." : "Add Branch"}
          </Button>
        </div>
      </form>
    </>
  );
};

export default AddBranch;
