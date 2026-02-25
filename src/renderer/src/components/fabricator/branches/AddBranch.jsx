import { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import Service from "../../../api/Service";
import Input from "../../fields/input";
import { toast } from "react-toastify";
import Select from "react-select";
import { Country, State, City } from "country-state-city";
import axios from "axios";
import { X, PlusCircle, MapPin, Loader2 } from "lucide-react";

const AddBranch = ({ fabricatorId, onClose, fabricatorName }) => {
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
      country: "US", // Changed default to US for the visual context if needed, or keep IN
    },
  });

  const selectedCountry = watch("country");
  const selectedState = watch("state");
  const zipCode = watch("zipCode");

  useEffect(() => {
    if (selectedCountry) {
      const statesData = State.getStatesOfCountry(selectedCountry) || [];
      setStateOptions(
        statesData.map((s) => ({ label: s.name, value: s.isoCode }))
      );
    } else {
      setStateOptions([]);
    }
  }, [selectedCountry]);

  useEffect(() => {
    if (selectedCountry && selectedState) {
      const citiesData =
        City.getCitiesOfState(selectedCountry, selectedState) || [];
      setCityOptions(citiesData.map((c) => ({ label: c.name, value: c.name })));
    } else {
      setCityOptions([]);
    }
  }, [selectedCountry, selectedState]);

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

          const states = State.getStatesOfCountry("IN");
          const stateObj = states.find(
            (s) => s.name.toLowerCase() === stateName.toLowerCase()
          );

          if (stateObj) {
            setValue("state", stateObj.isoCode);
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
      await Service.AddBranchByFabricator(data);
      toast.success("Branch added successfully");
      reset();
      if (onClose) onClose();
    } catch (err) {
      console.error("Failed to add branch:", err);
      toast.error("Failed to add branch");
    }
  };

  return (
    <div className="fixed inset-0 z-[11000] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-4xl bg-white rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden relative border border-white/20 animate-in fade-in zoom-in duration-200">

        {/* Header Section */}
        <div className="p-8 border-b border-gray-100 flex items-center justify-between bg-white">
          <div>
            <h2 className="text-2xl font-black text-gray-800 tracking-tight flex items-center gap-3">
              <PlusCircle className="text-[#6bbd45]" size={28} />
              Add New Branch
            </h2>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mt-1">
              ESTABLISH GEOGRAPHIC HUB FOR {fabricatorName}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-3 bg-gray-50 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-xl transition-all active:scale-95 shadow-sm border border-gray-100"
          >
            <X size={20} strokeWidth={2.5} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">

              {/* Name */}
              <div className="space-y-1">
                <Input
                  label="Branch Identity"
                  type="text"
                  {...register("name", { required: "Branch name is required" })}
                  placeholder="Official Branch Name / HQ"
                />
                {errors.name && (
                  <p className="text-red-500 text-[10px] font-black uppercase tracking-widest mt-1">
                    {errors.name.message}
                  </p>
                )}
              </div>

              {/* Email */}
              <div className="space-y-1">
                <Input
                  label="Operational Email"
                  type="email"
                  {...register("email", {
                    required: "Email required",
                    pattern: { value: /\S+@\S+\.\S+/, message: "Invalid email" },
                  })}
                  placeholder="branch@company.com"
                />
                {errors.email && (
                  <p className="text-red-500 text-[10px] font-black uppercase tracking-widest mt-1">{errors.email.message}</p>
                )}
              </div>

              {/* Phone & Extension */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Input
                    label="Contact Phone"
                    type="text"
                    {...register("phone", { required: "Phone required" })}
                    placeholder="+1 XXX XXX XXXX"
                  />
                  {errors.phone && (
                    <p className="text-red-500 text-[10px] font-black uppercase tracking-widest mt-1">
                      {errors.phone.message}
                    </p>
                  )}
                </div>
                <div className="space-y-1">
                  <Input
                    label="Extension"
                    type="text"
                    {...register("extension")}
                    placeholder="Ext"
                  />
                </div>
              </div>

              {/* ZipCode */}
              <div className="space-y-1">
                <Input
                  label="Postal / Zip Code"
                  type="text"
                  {...register("zipCode", {
                    required: "Zip Code required",
                    onBlur: handleZipCodeBlur,
                  })}
                  placeholder="6-digit code"
                />
                {errors.zipCode && (
                  <p className="text-red-500 text-[10px] font-black uppercase tracking-widest mt-1">{errors.zipCode.message}</p>
                )}
              </div>

              {/* Address */}
              <div className="md:col-span-2 space-y-1">
                <Input
                  label="Stree Address"
                  type="text"
                  {...register("address", { required: "Address required" })}
                  placeholder="123 Industrial Complex, Suite 500"
                />
                {errors.address && (
                  <p className="text-red-500 text-[10px] font-black uppercase tracking-widest mt-1">{errors.address.message}</p>
                )}
              </div>

              {/* Country */}
              <div className="space-y-1">
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">
                  Country Region
                </label>
                <Controller
                  name="country"
                  control={control}
                  rules={{ required: "Country is required" }}
                  render={({ field }) => (
                    <Select
                      placeholder="Select Country..."
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
                      styles={customSelectStyles}
                    />
                  )}
                />
              </div>

              {/* State */}
              <div className="space-y-1">
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">
                  State / Province
                </label>
                <Controller
                  name="state"
                  control={control}
                  rules={{ required: "State is required" }}
                  render={({ field }) => (
                    <Select
                      placeholder="Select State..."
                      options={stateOptions}
                      value={
                        stateOptions.find((opt) => opt.value === field.value) || null
                      }
                      onChange={(option) => {
                        field.onChange(option?.value || "");
                        setValue("city", "");
                      }}
                      isDisabled={!selectedCountry}
                      styles={customSelectStyles}
                    />
                  )}
                />
              </div>

              {/* City */}
              <div className="space-y-1">
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">
                  Municipal City
                </label>
                <Controller
                  name="city"
                  control={control}
                  rules={{ required: "City is required" }}
                  render={({ field }) => (
                    <Select
                      placeholder="Select City..."
                      options={cityOptions}
                      value={
                        cityOptions.find((opt) => opt.value === field.value) || null
                      }
                      onChange={(option) => field.onChange(option?.value || "")}
                      isDisabled={!selectedState}
                      styles={customSelectStyles}
                    />
                  )}
                />
              </div>

              {/* Is Headquarters */}
              <div className="flex items-center gap-4 bg-gray-50/50 p-4 rounded-2xl border border-gray-100 self-end h-[50px]">
                <input
                  type="checkbox"
                  id="hq"
                  {...register("isHeadquarters")}
                  className="w-5 h-5 rounded-lg border-gray-200 text-[#6bbd45] focus:ring-[#6bbd45]/20 cursor-pointer"
                />
                <label htmlFor="hq" className="text-[10px] font-black text-gray-600 uppercase tracking-widest cursor-pointer select-none">
                  Mark as Global Headquarters
                </label>
              </div>
            </div>

            {/* Submit Container */}
            <div className="flex justify-end gap-3 pt-6 border-t border-gray-50 bg-white">
              <button
                type="button"
                onClick={onClose}
                className="px-8 py-3.5 bg-gray-50 hover:bg-gray-100 text-gray-500 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-10 py-3.5 bg-[#6bbd45]/15 hover:bg-[#6bbd45]/30 text-black border border-black rounded-xl text-[10px] font-black uppercase tracking-[0.2em] shadow-sm disabled:opacity-50 transition-all flex items-center gap-3 active:scale-95"
              >
                {isSubmitting ? (
                  <Loader2 className="animate-spin w-4 h-4" />
                ) : (
                  "Create Geographic Hub"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

const customSelectStyles = {
  control: (base, state) => ({
    ...base,
    borderRadius: "0.75rem",
    padding: "0.2rem",
    borderColor: state.isFocused ? "#000" : "#e5e7eb",
    boxShadow: "none",
    "&:hover": {
      borderColor: "#000",
    },
  }),
  placeholder: (base) => ({
    ...base,
    fontSize: "13px",
    color: "#9ca3af",
  }),
  singleValue: (base) => ({
    ...base,
    fontSize: "13px",
    color: "#000",
    fontWeight: "600",
  }),
  menu: (base) => ({
    ...base,
    borderRadius: "1rem",
    overflow: "hidden",
    boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
    border: "1px border-gray-100",
    zIndex: 9999,
  }),
  option: (base, state) => ({
    ...base,
    backgroundColor: state.isSelected ? "#6bbd45/10" : state.isFocused ? "#f9fafb" : "#fff",
    color: state.isSelected ? "#6bbd45" : "#4b5563",
    fontSize: "13px",
    fontWeight: "600",
    cursor: "pointer",
  }),
};

export default AddBranch;
