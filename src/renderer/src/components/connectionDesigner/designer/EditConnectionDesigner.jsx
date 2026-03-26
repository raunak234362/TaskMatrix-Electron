import { Controller, useForm } from "react-hook-form";

import { useEffect, useRef, useState } from "react";
import Input from "../../fields/input";
import { Check, Loader2, X } from "lucide-react";
import Button from "../../fields/Button";
import { State, City } from "country-state-city";
import Select from "react-select";
import Service from "../../../api/Service";
import { toast } from "react-toastify";



const COUNTRY_MAP = {
  "United States": "US",
  Canada: "CA",
  India: "IN",
};

const parseLocation = (
  location
) => {
  if (!location) {
    return { country: "", city: "" };
  }
  const parts = location
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);

  if (parts.length === 0) {
    return { country: "", city: "" };
  }

  if (parts.length === 1) {
    return { country: parts[0] || "", city: "" };
  }

  const country = parts.pop() || "";
  const city = parts.join(", ");

  return { country, city };
};

const normalizeStates = (states) => {
  if (Array.isArray(states)) {
    return states;
  }
  if (typeof states === "string") {
    try {
      const parsed = JSON.parse(states);
      return Array.isArray(parsed) ? parsed : [states];
    } catch {
      return [states];
    }
  }
  return [];
};

const EditConnectionDesigner = ({
  designerData,
  onClose,
  onSuccess,
}) => {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [stateOptions, setStateOptions] = useState([]);
  const [cityOptions, setCityOptions] = useState([]);

  const { country: initialCountry, city: initialCity } = parseLocation(
    designerData.location
  );

  const lastCountryRef = useRef(null);

  const {
    register,
    handleSubmit,
    control,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: {
      connectionDesignerName: designerData?.name || "",
      contactInfo: designerData?.contactInfo || "",
      website: designerData?.websiteLink || "",
      email: designerData?.email || "",
      headquater: {
        country: initialCountry,
        city: initialCity,
        states: normalizeStates(designerData?.state),
      },
    },
  });

  useEffect(() => {
    reset({
      connectionDesignerName: designerData?.name || "",
      contactInfo: designerData?.contactInfo || "",
      website: designerData?.websiteLink || "",
      email: designerData?.email || "",
      headquater: {
        country: initialCountry,
        city: initialCity,
        states: normalizeStates(designerData?.state),
      },
    });
    lastCountryRef.current = initialCountry || null;
  }, [designerData, initialCountry, initialCity, reset]);

  const country = watch("headquater.country");
  const selectedStates = watch("headquater.states");
  const selectedCity = watch("headquater.city");

  // --- Load states when country changes ---
  useEffect(() => {
    if (country && COUNTRY_MAP[country]) {
      const countryCode = COUNTRY_MAP[country];
      const statesData = State.getStatesOfCountry(countryCode) || [];
      setStateOptions(
        statesData.map((s) => ({ label: s.name, value: s.name }))
      );

      if (lastCountryRef.current && lastCountryRef.current !== country) {
        setValue("headquater.states", []);
        setValue("headquater.city", "");
        setCityOptions([]);
      }
      lastCountryRef.current = country;
    } else {
      setStateOptions([]);
      setCityOptions([]);
      if (lastCountryRef.current) {
        setValue("headquater.states", []);
        setValue("headquater.city", "");
      }
      lastCountryRef.current = country || null;
    }
  }, [country, setValue]);

  // --- Load cities for all selected states ---
  useEffect(() => {
    const normalizedStates = normalizeStates(selectedStates);
    const normalizedCity = selectedCity ?? "";

    if (normalizedStates.length > 0 && country && COUNTRY_MAP[country]) {
      const countryCode = COUNTRY_MAP[country];
      const allCities = [];
      const statesOfCountry = State.getStatesOfCountry(countryCode) || [];

      normalizedStates.forEach((stateName) => {
        const stateObj = statesOfCountry.find((s) => s.name === stateName);
        if (stateObj) {
          const cities =
            City.getCitiesOfState(countryCode, stateObj.isoCode) || [];
          allCities.push(
            ...cities.map((c) => ({ label: c.name, value: c.name }))
          );
        }
      });

      setCityOptions(allCities);
      if (
        normalizedCity &&
        !allCities.some((opt) => opt.value === normalizedCity)
      ) {
        setValue("headquater.city", "");
      }
    } else {
      setCityOptions([]);
      if (normalizedCity) {
        setValue("headquater.city", "");
      }
    }
  }, [selectedStates, country, selectedCity, setValue]);

  const onSubmit = async (data) => {
    try {
      setSubmitting(true);
      setError(null);

      const payload = {
        name: data.connectionDesignerName.trim(),
        state: data.headquater.states,
        contactInfo: data.contactInfo || "",
        websiteLink: data.website || "",
        email: data.email || "",
        location: data.headquater.city
          ? `${data.headquater.city}, ${data.headquater.country}`
          : data.headquater.country,
      };

      await Service.UpdateConnectionDesignerByID(designerData.id, payload);
      toast.success("Connection Designer updated successfully!");
      onSuccess?.();
      onClose();
    } catch (submissionError) {
      const apiMessage =
        (submissionError)
          ?.response?.data?.message || "";
      const message = apiMessage || "Failed to update Connection Designer";
      setError(message);
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col border border-gray-200 animate-in fade-in zoom-in duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200 shrink-0 bg-white">
          <div>
            <h2 className="text-xl font-black text-black tracking-tight">
              Edit Connection Designer
            </h2>
          
          </div>
          <button
            onClick={onClose}
            className="px-6 py-1.5 bg-red-50 text-black border-2 border-red-700/80 rounded-lg hover:bg-red-100 transition-all font-bold text-sm uppercase tracking-tight shadow-sm"
          >
            Close
          </button>
        </div>

        {/* Body (Scrollable form) */}
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="p-6 space-y-5 overflow-y-auto flex-1 custom-scrollbar"
        >
          {error && (
            <div className="p-3 bg-red-50 border border-red-300 text-black rounded-lg text-sm font-bold">
              {error}
            </div>
          )}

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

          {/* Website */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input
              label="Website (optional)"
              type="url"
              {...register("website")}
              placeholder="https://example.com"
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
                  options={Object.keys(COUNTRY_MAP).map((c) => ({
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
            {errors.headquater?.country && (
              <p className="text-red-500 text-xs mt-1">
                {errors.headquater.country.message}
              </p>
            )}

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
                  value={
                    Array.isArray(field.value)
                      ? stateOptions.filter((opt) =>
                        field.value.includes(opt.value)
                      )
                      : []
                  }
                  onChange={(options) => {
                    const selected = options
                      ? options.map((opt) => opt.value)
                      : [];
                    field.onChange(selected);
                    setValue("headquater.city", "");
                  }}
                  menuPortalTarget={document.body}
                  styles={{ menuPortal: (base) => ({ ...base, zIndex: 9999 }) }}
                />
              )}
            />
            {errors.headquater?.states && (
              <p className="text-red-500 text-xs mt-1">
                {errors.headquater.states.message}
              </p>
            )}

            {/* City (Optional) */}
            <Controller
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
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 shrink-0">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-8 py-3 bg-gray-50 border border-gray-300 hover:bg-gray-100 text-black rounded-lg text-[10px] font-black uppercase tracking-[0.2em] transition-all disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-8 py-3 bg-[#6bbd45]/15 hover:bg-[#6bbd45]/30 text-black border border-black rounded-lgn-200 text-[10px] font-black uppercase tracking-[0.2em] shadow-sm disabled:opacity-50 transition-all flex items-center gap-3 active:scale-95"
            >
              {submitting ? (
                <><Loader2 className="w-4 h-4 animate-spin" />Saving...</>
              ) : (
                <><Check className="w-4 h-4" />Save Changes</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditConnectionDesigner;
