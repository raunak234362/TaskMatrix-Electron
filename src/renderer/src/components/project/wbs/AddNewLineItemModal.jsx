import React, { useState, useEffect } from "react";
import { Loader2, Save } from "lucide-react";
import Service from "../../../api/Service";

const AddNewLineItemModal = ({ isOpen, onClose, wbsTemplate }) => {
  const [formData, setFormData] = useState({
    wbsTemplateId: "",
    description: "",
    unitTime: 0,
    checkUnitTime: 0,
    templateKey: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen && wbsTemplate) {
      setFormData({
        wbsTemplateId: wbsTemplate.id || "",
        description: "",
        unitTime: 0,
        checkUnitTime: 0,
        templateKey: "",
      });
      setError(null);
    }
  }, [isOpen, wbsTemplate]);

  if (!isOpen) return null;

  const handleDescriptionChange = (e) => {
    const val = e.target.value;
    setFormData({
      ...formData,
      description: val,
      templateKey: val.trim().replace(/\s+/g, "_").toUpperCase(),
    });
  };

  const handleSave = async () => {
    try {
      if (!formData.description || !formData.templateKey) {
         setError("Please fill all required fields");
         return;
      }
      setLoading(true);
      setError(null);
      
      const payload = {
        wbsTemplateId: formData.wbsTemplateId,
        description: formData.description,
        unitTime: Number(formData.unitTime),
        checkUnitTime: Number(formData.checkUnitTime),
        templateKey: formData.templateKey
      };
      
      await Service.AddNewWBSLineItems(payload);
      onClose();
    } catch (err) {
      console.error("Error adding line item:", err);
      setError("Failed to add line item. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-md rounded-none shadow-2xl overflow-hidden border border-black animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
        <div className="px-6 py-4 border-black flex justify-between items-center bg-green-100">
          <div>
            <h3 className="text-xl font-semibold text-black uppercase tracking-tight">
              Add Line Item
            </h3>
            <p className="text-sm text-black font-normal uppercase tracking-wider">
              {wbsTemplate?.name || wbsTemplate?.title || "Template"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="px-6 py-1.5 bg-red-50 text-black border-2 border-red-700/80 rounded-none hover:bg-red-100 transition-all font-semibold text-sm uppercase tracking-tight shadow-sm cursor-pointer"
          >
            Close
          </button>
        </div>

        <div className="p-6 space-y-4">
          {error && <p className="text-sm text-red-600 font-semibold">{error}</p>}
          <div className="space-y-1.5">
            <label className="text-sm font-normal text-black uppercase tracking-wider ml-1">
              Description *
            </label>
            <input
              type="text"
              value={formData.description}
              onChange={handleDescriptionChange}
              className="w-full px-4 py-3 bg-white border border-black rounded-none text-base focus:ring-2 focus:ring-green-500 outline-none transition-all font-normal text-black"
              placeholder="Enter description"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-normal text-black uppercase tracking-wider ml-1">
              Template Key *
            </label>
            <input
              type="text"
              value={formData.templateKey}
              onChange={(e) => setFormData({ ...formData, templateKey: e.target.value })}
              className="w-full px-4 py-3 bg-white border border-black rounded-none text-base focus:ring-2 focus:ring-green-500 outline-none transition-all font-normal text-black"
              placeholder="Generated key"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-normal text-black uppercase tracking-wider ml-1">
                Unit Time
              </label>
              <input
                type="number"
                min="0"
                step="0.1"
                value={formData.unitTime}
                onChange={(e) => setFormData({ ...formData, unitTime: e.target.value })}
                className="w-full px-4 py-3 bg-white border border-black rounded-none text-base focus:ring-2 focus:ring-green-500 outline-none transition-all font-normal text-black"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-normal text-black uppercase tracking-wider ml-1">
                Check Unit Time
              </label>
              <input
                type="number"
                min="0"
                step="0.1"
                value={formData.checkUnitTime}
                onChange={(e) => setFormData({ ...formData, checkUnitTime: e.target.value })}
                className="w-full px-4 py-3 bg-white border border-black rounded-none text-base focus:ring-2 focus:ring-green-500 outline-none transition-all font-normal text-black"
              />
            </div>
          </div>
        </div>

        <div className="px-6 py-4 bg-white border-t border-black flex gap-3">
          <button
            onClick={handleSave}
            disabled={loading}
            className="w-full px-6 py-2.5 bg-green-50 text-black border-2 border-green-700/80 rounded-none hover:bg-green-100 transition-all font-semibold text-sm uppercase tracking-tight shadow-sm inline-flex items-center justify-center cursor-pointer"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <Save className="w-5 h-5 mr-2" />
                Add Line Item
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddNewLineItemModal;
