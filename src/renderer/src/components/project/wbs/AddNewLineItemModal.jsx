import React, { useState, useEffect } from "react";
import { Loader2, Save, Plus, Trash2 } from "lucide-react";
import Service from "../../../api/Service";

const AddNewLineItemModal = ({ isOpen, onClose, wbsTemplate }) => {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen && wbsTemplate) {
      setRows([
        {
          id: Date.now(),
          description: "",
          unitTime: 0,
          checkUnitTime: 0,
          templateKey: "",
        },
      ]);
      setError(null);
    }
  }, [isOpen, wbsTemplate]);

  if (!isOpen) return null;

  const handleAddRow = () => {
    setRows([
      ...rows,
      {
        id: Date.now(),
        description: "",
        unitTime: 0,
        checkUnitTime: 0,
        templateKey: "",
      },
    ]);
  };

  const handleRemoveRow = (id) => {
    if (rows.length > 1) {
      setRows(rows.filter((r) => r.id !== id));
    }
  };

  const handleChange = (id, field, value) => {
    setRows(
      rows.map((row) => {
        if (row.id === id) {
          const updatedRow = { ...row, [field]: value };
          if (field === "description") {
            updatedRow.templateKey = value.trim().replace(/\s+/g, "_").toUpperCase();
          }
          return updatedRow;
        }
        return row;
      })
    );
  };

  const handleSaveAll = async () => {
    try {
      // Validate
      const invalidRow = rows.find((r) => !r.description.trim() || !r.templateKey.trim());
      if (invalidRow) {
        setError("Please fill all required fields (Description) for all rows.");
        return;
      }

      setLoading(true);
      setError(null);

      // Send multiple requests via Promise.all
      const promises = rows.map((row) => {
        const payload = {
          wbsTemplateId: wbsTemplate.id,
          description: row.description,
          unitTime: Number(row.unitTime) || 0,
          checkUnitTime: Number(row.checkUnitTime) || 0,
          templateKey: row.templateKey,
        };
        return Service.AddNewWBSLineItems(payload);
      });

      await Promise.all(promises);

      onClose();
    } catch (err) {
      console.error("Error adding line items:", err);
      setError("Failed to add some line items. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="bg-white w-full max-w-4xl rounded-none shadow-2xl overflow-hidden border border-black animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-4 border-b border-black flex justify-between items-center bg-green-100 shrink-0">
          <div>
            <h3 className="text-xl font-semibold text-black uppercase tracking-tight">
              Add Line Items
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

        <div className="p-6 overflow-y-auto flex-grow custom-scrollbar">
          {error && <p className="text-sm text-red-600 font-semibold mb-4">{error}</p>}
          
          <div className="border border-black overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-100 border-b border-black">
                  <th className="p-3 text-xs font-semibold text-black uppercase tracking-wider border-r border-black w-2/5">
                    Description *
                  </th>
                  <th className="p-3 text-xs font-semibold text-black uppercase tracking-wider border-r border-black w-1/4">
                    Template Key *
                  </th>
                  <th className="p-3 text-xs font-semibold text-black uppercase tracking-wider border-r border-black w-24 text-center">
                    Unit Time
                  </th>
                  <th className="p-3 text-xs font-semibold text-black uppercase tracking-wider border-r border-black w-32 text-center">
                    Check Unit Time
                  </th>
                  <th className="p-3 text-xs font-semibold text-black uppercase tracking-wider w-16 text-center">
                    Act
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, index) => (
                  <tr key={row.id} className="border-b border-gray-300 last:border-b-0 hover:bg-gray-50 transition-colors">
                    <td className="p-2 border-r border-gray-300">
                      <input
                        type="text"
                        value={row.description}
                        onChange={(e) => handleChange(row.id, "description", e.target.value)}
                        className="w-full px-2 py-1.5 bg-transparent border-b border-transparent focus:border-green-500 outline-none transition-all text-sm font-medium text-black"
                        placeholder="Enter description"
                        autoFocus={index === rows.length - 1}
                      />
                    </td>
                    <td className="p-2 border-r border-gray-300">
                      <input
                        type="text"
                        value={row.templateKey}
                        onChange={(e) => handleChange(row.id, "templateKey", e.target.value)}
                        className="w-full px-2 py-1.5 bg-transparent border-b border-transparent focus:border-green-500 outline-none transition-all text-sm text-gray-700"
                        placeholder="Generated key"
                      />
                    </td>
                    <td className="p-2 border-r border-gray-300">
                      <input
                        type="number"
                        min="0"
                        step="0.1"
                        value={row.unitTime}
                        onChange={(e) => handleChange(row.id, "unitTime", e.target.value)}
                        className="w-full px-2 py-1.5 bg-transparent border-b border-transparent focus:border-green-500 outline-none transition-all text-sm text-center font-medium text-black"
                      />
                    </td>
                    <td className="p-2 border-r border-gray-300">
                      <input
                        type="number"
                        min="0"
                        step="0.1"
                        value={row.checkUnitTime}
                        onChange={(e) => handleChange(row.id, "checkUnitTime", e.target.value)}
                        className="w-full px-2 py-1.5 bg-transparent border-b border-transparent focus:border-green-500 outline-none transition-all text-sm text-center font-medium text-black"
                      />
                    </td>
                    <td className="p-2 text-center">
                      <button
                        onClick={() => handleRemoveRow(row.id)}
                        disabled={rows.length === 1}
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed mx-auto block"
                        title="Remove Row"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-4 flex justify-start">
            <button
              onClick={handleAddRow}
              className="px-4 py-2 bg-gray-100 text-black border border-black hover:bg-gray-200 transition-all font-semibold text-xs uppercase tracking-wider inline-flex items-center"
            >
              <Plus className="w-4 h-4 mr-1" />
              Add Row
            </button>
          </div>
        </div>

        <div className="px-6 py-4 bg-white border-t border-black flex gap-3 shrink-0">
          <button
            onClick={handleSaveAll}
            disabled={loading}
            className="w-full px-6 py-3 bg-green-50 text-black border-2 border-green-700/80 rounded-none hover:bg-green-100 transition-all font-semibold text-sm uppercase tracking-tight shadow-sm inline-flex items-center justify-center cursor-pointer"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <Save className="w-5 h-5 mr-2" />
                Save All Line Items
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddNewLineItemModal;
