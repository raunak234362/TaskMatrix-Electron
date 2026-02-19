/* eslint-disable react/prop-types */
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
  "Canada": "CA",
  "India": "IN"
};

const parseLocation = (location) => {
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
    designerData?.location
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
    lastCountryRef.current = initialCountry;
  }, [designerData, initialCountry, initialCity, reset]);

  const country = watch("headquater.country");
  const selectedStates = watch("headquater.states");
  const selectedCity = watch("headquater.city");

  // Load states when country changes
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
      lastCountryRef.current = country;
    }
  }, [country, setValue]);

  // Load cities for all selected states
  useEffect(() => {
    const normalizedStates = normalizeStates(selectedStates);
    const normalizedCity = selectedCity ?? "";

    if (normalizedStates.length > 0 && country && COUNTRY_MAP[country]) {
      const countryCode = COUNTRY_MAP[country];
      const allCitiesList = [];
      const statesOfCountry = State.getStatesOfCountry(countryCode) || [];

      normalizedStates.forEach((stateName) => {
        const stateObj = statesOfCountry.find((s) => s.name === stateName);
        if (stateObj) {
          const cities =
            City.getCitiesOfState(countryCode, stateObj.isoCode) || [];
          allCitiesList.push(
            ...cities.map((c) => ({ label: c.name, value: c.name }))
          );
        }
      });

      setCityOptions(allCitiesList);
      if (
        normalizedCity &&
        !allCitiesList.some((opt) => opt.value === normalizedCity)
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
      const apiMessage = submissionError?.response?.data?.message || "";
      const message = apiMessage || "Failed to update Connection Designer";
      setError(message);
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white max-w-4xl rounded-xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col w-full"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center p-5 border-b bg-gray-50 shrink-0">
          <h2 className="text-xl font-semibold text-gray-700">
            Edit Connection Designer
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 transition p-2 hover:bg-gray-100 rounded-full"
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

          <Input
            label="Website (optional)"
            type="url"
            {...register("website")}
            placeholder="https://example.com"
          />

          {/* Location details */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Country */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Country *</label>
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
            </div>

            {/* Multi-State */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">State(s) *</label>
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
            </div>

            {/* City (Optional) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">City (Optional)</label>
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
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-3 border-t shrink-0">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium"
            >
              Cancel
            </button>
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

export default EditConnectionDesigner;
