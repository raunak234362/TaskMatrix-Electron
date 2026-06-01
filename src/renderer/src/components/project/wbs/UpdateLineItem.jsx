/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from "react";
import { X, Save, Loader2, Calculator } from "lucide-react";
import { Button } from "../../ui/button";
import Service from "../../../api/Service";


const UpdateLineItem = ({
  isOpen,
  onClose,
  lineItem,
  onUpdate,
}) => {
  const [formData, setFormData] = useState({
    qtyNo: 0,
    unitTime: 0,
    checkUnitTime: 0,
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (lineItem) {
      setFormData({
        qtyNo: lineItem.qtyNo || lineItem.totalQtyNo || 0,
        unitTime: lineItem.unitTime || 0,
        checkUnitTime: lineItem.checkUnitTime || 0,
      });
    }
  }, [lineItem]);

  if (!isOpen || !lineItem) return null;

  const handleSave = async () => {
    try {
      setLoading(true);
      const { qtyNo, unitTime, checkUnitTime } = formData;
      const payload = {
        qtyNo,
        unitTime,
        checkUnitTime,
        execHr: qtyNo * unitTime,
        checkHr: qtyNo * checkUnitTime,
      };
      await Service.UpdateLineItem(lineItem.id, payload);
      onUpdate();
      onClose();
    } catch (error) {
      console.error("Error updating line item:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-md rounded-none shadow-2xl overflow-hidden border border-black animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-black flex justify-between items-center bg-green-100">
          <div className="flex items-center gap-2">

            <div>
              <h3 className="text-xl font-semibold text-black uppercase tracking-tight">
                Edit Line Item
              </h3>
              <p className="text-sm text-black font-normal uppercase tracking-wider">
                {lineItem.discipline || "General"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="px-6 py-1.5 bg-red-50 text-black border-2 border-red-700/80 rounded-none hover:bg-red-100 transition-all font-semibold text-sm uppercase tracking-tight shadow-sm inline-flex items-center justify-center cursor-pointer"
          >
            Close
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          <div className="bg-white p-4 rounded-none border border-black">
            <p className="text-sm text-black font-normal uppercase tracking-wider mb-1.5">
              Description
            </p>
            <p className="text-base font-normal text-black line-clamp-2">
              {lineItem.name ||
                lineItem.wbsTemplate?.name ||
                lineItem.description ||
                "—"}
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-normal text-black uppercase tracking-wider ml-1">
                Quantity
              </label>
              <input
                type="number"
                value={formData.qtyNo}
                onChange={(e) =>
                  setFormData({ ...formData, qtyNo: Number(e.target.value) })
                }
                className="w-full px-4 py-3 bg-white border border-black rounded-none text-base focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all font-normal text-black"
                placeholder="0"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-normal text-black uppercase tracking-wider ml-1">
                  Exec Unit Time (h)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.unitTime}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      unitTime: Number(e.target.value),
                    })
                  }
                  className="w-full px-4 py-3 bg-white border border-black rounded-none text-base focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all font-normal text-black"
                  placeholder="0.0"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-normal text-black uppercase tracking-wider ml-1">
                  Check Unit Time (h)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.checkUnitTime}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      checkUnitTime: Number(e.target.value),
                    })
                  }
                  className="w-full px-4 py-3 bg-white border border-black rounded-none text-base focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all font-normal text-black"
                  placeholder="0.0"
                />
              </div>
            </div>
          </div>

          {/* Totals Preview */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <div className="bg-green-50/50 p-3 rounded-none border border-black">
              <p className="text-sm text-green-600 uppercase tracking-wider font-normal">
                Total Exec
              </p>
              <p className="text-xl text-green-700 font-semibold">
                {(formData.qtyNo * formData.unitTime / 60).toFixed(1)}h
              </p>
            </div>
            <div className="bg-blue-50/50 p-3 rounded-none border border-black">
              <p className="text-sm text-blue-600 uppercase tracking-wider font-normal">
                Total Check
              </p>
              <p className="text-xl text-blue-700 font-semibold">
                {(formData.qtyNo * formData.checkUnitTime / 60).toFixed(1)}h
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
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
                Save Changes
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default UpdateLineItem;
