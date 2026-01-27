/* eslint-disable @typescript-eslint/no-explicit-any */
import { X } from "lucide-react";
import Service from "../../api/Service";
import { useForm, Controller } from "react-hook-form";
import Select from "react-select";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";

}


const VQuotationRaise = ({
  rfqId,
  onClose,
  onSuccess,
}: {
  rfqId;
  onClose: () => void;
  onSuccess: () => void;
}) => {
  const { handleSubmit, control, watch } = useForm();



  const selectedDesignerIds = watch("ConnectionDesignerIds");
  const [connectionDesigners, setConnectionDesigners] = useState<
    ConnectionDesigner
  >();
  const [filteredDesigners, setFilteredDesigners] = useState<
    ConnectionDesigner
  >();
  const [selectedStates, setSelectedStates] = useState([]);

  // Fetch all Connection Designers
  const fetchCD = async () => {
    try {
      const response = await Service.FetchAllConnectionDesigner();
      const rawData = response?.data || []

      // Parse 'state' safely
      const parsedData = rawData.map((cd) => {
        let parsedState = ;
        if (Array.isArray(cd.state)) {
          parsedState = cd.state;
        } else if (typeof cd.state === "string") {
          try {
            const parsed = JSON.parse(cd.state);
            parsedState = Array.isArray(parsed) ? parsed : []
          } catch (e) {
            console.warn("Failed to parse state for CD:", cd.name, e);
            parsedState = ;
          }
        }
        return { ...cd, state: parsedState };
      });

      setConnectionDesigners(parsedData);
      setFilteredDesigners(parsedData);
    } catch (error) {
      console.error("Error fetching connection designers:", error);
      toast.error("Failed to load connection designers");
    }
  };

  useEffect(() => {
    fetchCD();
  }, []);

  // Extract unique states from all designers
  const allStates = Array.from(
    new Set(
      connectionDesigners.flatMap((cd) =>
        Array.isArray(cd.state) ? cd.state : 
      )
    )
  ).map((state) => ({ label: state, value: state }));

  // Filter designers when states are selected
  useEffect(() => {
    if (selectedStates.length === 0) {
      setFilteredDesigners(connectionDesigners);
    } else {
      const filtered = connectionDesigners.filter((cd) =>
        Array.isArray(cd.state) && cd.state.some((state) => selectedStates.includes(state))
      );
      setFilteredDesigners(filtered);
    }
  }, [selectedStates, connectionDesigners]);

  // Derive available engineers from selected designers
  const availableEngineers = filteredDesigners
    .filter((cd) => Array.isArray(selectedDesignerIds) && selectedDesignerIds.some((item) => item.value === cd.id))
    .flatMap((cd) => cd.CDEngineers || [])
    .map((eng) => ({
      label: eng.username,
      value: eng.id,
      designerName: connectionDesigners.find((cd) => cd.CDEngineers?.some(e => e.id === eng.id))?.name
    }));

  // Submit — send IDs
  const RaiseForQuotation = async (data) => {
    try {
      const payload = {
        ConnectionDesignerIds: data.ConnectionDesignerIds?.map(
          (cd) => cd.value
        ) || []
        connectionEngineerIds: data.EngineerIds?.map((eng) => eng.value) || []
      };

      console.log("📦 Final Payload:", payload);

      const response = await Service.UpdateRFQById(rfqId, payload);
      console.log("Quotation raised successfully:", response);

      toast.success("Quotation raised successfully!");
      onSuccess();
      onClose();
    } catch (error) {
      console.error("Error raising quotation:", error);
      toast.error("Failed to raise quotation");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-4xl bg-white rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b bg-gray-50 rounded-t-2xl">
          <h2 className="text-xl font-semibold text-gray-700">
            Raise Connection Designer Quotation
          </h2>
          <button
            onClick={onClose}
            className="text-gray-700 hover:text-gray-700 transition"
            aria-label="Close"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit(RaiseForQuotation)}
          className="p-6 space-y-6 overflow-y-auto"
        >
          {/* Multi-State Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Filter by States
            </label>
            <Select
              options={allStates}
              isMulti
              placeholder="Search or select multiple states..."
              onChange={(selected) =>
                setSelectedStates(selected.map((s) => s.value))
              }
              classNamePrefix="react-select"
              styles={{
                control: (base) => ({
                  ...base,
                  borderColor: "#cbd5e1",
                  boxShadow: "none",
                  "&:hover": { borderColor: "#0d9488" },
                }),
                multiValue: (base) => ({
                  ...base,
                  backgroundColor: "rgba(13,148,136,0.1)",
                  borderRadius: "0.5rem",
                  padding: "0 4px",
                }),
                multiValueLabel: (base) => ({
                  ...base,
                  color: "#0f766e",
                  fontWeight: 500,
                }),
              }}
            />
          </div>

          {/* Connection Designer Select */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Connection Designers
            </label>
            <Controller
              name="ConnectionDesignerIds"
              control={control}
              rules={{
                required: "Please select at least one connection designer",
              }}
              render={({ field }) => (
                <Select
                  {...field}
                  isMulti
                  isSearchable
                  placeholder="Search or select connection designers..."
                  options={filteredDesigners.map((cd) => ({
                    label: `${cd.name} (${cd.location})`,
                    value: cd.id,
                    states: cd.state,
                  }))}
                  styles={{
                    control: (base) => ({
                      ...base,
                      borderColor: "#cbd5e1",
                      boxShadow: "none",
                      "&:hover": { borderColor: "#0d9488" },
                    }),
                    option: (base, state) => ({
                      ...base,
                      backgroundColor: state.isFocused
                        ? "rgba(13,148,136,0.1)"
                        : "white",
                      color: "black",
                    }),
                  }}
                  formatOptionLabel={(option) => (
                    <div>
                      <p className="font-medium text-gray-700">{option.label}</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {Array.isArray(option.states) && option.states.map((s) => (
                          <span
                            key={s}
                            className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full"
                          >
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                />
              )}
            />
          </div>

          {/* Engineer Select (Dependent) */}
          {availableEngineers.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Select Engineers (Optional)
              </label>
              <Controller
                name="EngineerIds"
                control={control}
                render={({ field }) => (
                  <Select
                    {...field}
                    isMulti
                    isSearchable
                    placeholder="Select engineers..."
                    options={availableEngineers}
                    styles={{
                      control: (base) => ({
                        ...base,
                        borderColor: "#cbd5e1",
                        boxShadow: "none",
                        "&:hover": { borderColor: "#0d9488" },
                      }),
                      option: (base, state) => ({
                        ...base,
                        backgroundColor: state.isFocused
                          ? "rgba(13,148,136,0.1)"
                          : "white",
                        color: "black",
                      }),
                    }}
                    formatOptionLabel={(option) => (
                      <div className="flex flex-col">
                        <span className="font-medium text-gray-800">{option.label}</span>
                        {option.designerName && (
                          <span className="text-xs text-gray-500">from {option.designerName}</span>
                        )}
                      </div>
                    )}
                  />
                )}
              />
            </div>
          )}

          {/* Submit */}
          <div className="flex justify-end pt-4 border-t border-gray-200">
            <button
              type="submit"
              className="bg-green-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-green-700 transition-all duration-200"
            >
              Raise for Quotation
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default VQuotationRaise;
