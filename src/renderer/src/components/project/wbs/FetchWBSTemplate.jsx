import { useEffect, useState } from "react";
import Service from "../../../api/Service";
import { Check, Loader2, Search, ChevronDown, ChevronUp, Plus } from "lucide-react";
import { Button } from "../../ui/button";
import AddNewWBSItem from "./AddNewWBSItem";
import AddNewLineItemModal from "./AddNewLineItemModal";


const FetchWBSTemplate = ({ id, onSelect, onClose }) => {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedId, setExpandedId] = useState(null);
  const [newItemName, setNewItemName] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [activeBundleKey, setActiveBundleKey] = useState("");
  const [lineItemModalData, setLineItemModalData] = useState(null);

  const fetchWbsTemplate = async () => {
      try {
        setLoading(true);
        const response = await Service.GetWBSTemplate();

        const sortOrder = [
          "MAIN_STEEL_PLACEMENT",
          "MAIN_STEEL_CONNECTION",
          "MISC.STEEL_PLACEMENT_&_CONNECTION",
          "ERECTION_OF_MAIN_STEEL",
          "ERECTION_OF_MISC_STEEL",
          "DETAILING_OF_MAIN_STEEL",
          "DETAILING_OF_MISC_STEEL",
          "OTHERS"
        ];

        const sortedData = (response.data || []).sort((a, b) => {
          let indexA = sortOrder.indexOf(a.bundleKey);
          let indexB = sortOrder.indexOf(b.bundleKey);
          if (indexA === -1) indexA = sortOrder.length;
          if (indexB === -1) indexB = sortOrder.length;
          return indexA - indexB;
        });

        setTemplates(sortedData);
      } catch (error) {
        console.error("Error fetching WBS templates:", error);
      } finally {
        setLoading(false);
      }
    };

  useEffect(() => {
    fetchWbsTemplate();
  }, []);

  const handleAddItem = async (template, e) => {
    e.stopPropagation();
    if (!newItemName.trim()) return;

    try {
      setIsAdding(true);
      const payload = {
        name: newItemName,
        templateKey: newItemName.trim().replace(/\s+/g, "_").toUpperCase(),
        bundleKey: template.bundleKey || "",
        discipline: template.discipline || "EXECUTION"
      };

      await Service.AddWBSTemplateItem(payload);
      setNewItemName("");
      // Refresh the templates silently
      await fetchWbsTemplate();
    } catch (error) {
      console.error("Error adding template item:", error);
    } finally {
      setIsAdding(false);
    }
  };

  const toggleSelection = (id) => {
    const newSelectedIds = new Set(selectedIds);
    if (newSelectedIds.has(id)) {
      newSelectedIds.delete(id);
    } else {
      newSelectedIds.add(id);
    }
    setSelectedIds(newSelectedIds);
  };

  const handleSelectAll = () => {
    if (selectedIds.size === filteredTemplates.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredTemplates.map((t) => t.id)));
    }
  };

  const handleSubmit = async () => {
    if (!id) {
      console.error("Project ID is missing");
      return;
    }
    const selectedTemplates = templates.filter((t) => selectedIds.has(t.id));
    const bundleKeys = selectedTemplates.map((t) => t.bundleKey);

    if (onSelect) {
      onSelect(bundleKeys.join(","));
    }
    const response = await Service.AddWBSFromTemplate(id, { bundleKeys });
    console.log("Selected Bundle Keys:", bundleKeys);
    console.log("Response:", response);
  };

  const filteredTemplates = templates.filter(
    (template) =>
      template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 space-y-4">
        <Loader2 className="w-8 h-8 text-green-600 animate-spin" />
        <p className="text-gray-700 font-medium animate-pulse">
          Fetching WBS Templates...
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden mx-auto animate-in fade-in zoom-in duration-300">
      <div className="p-5 h-[90vh] overflow-y-auto custom-scrollbar">
        {/* Search and Select All */}
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="relative w-full sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search templates..."
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all text-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            
            <Button
              variant="ghost"
              onClick={handleSelectAll}
              className="text-sm font-semibold bg-green-200 border border-green-600 cursor-pointer text-black hover:text-green-700 transition-colors px-4 py-2 hover:bg-green-50"
            >
              {selectedIds.size === filteredTemplates.length
                ? "Deselect All"
                : "Select All"}
            </Button>
            {onClose && (
              <Button
                variant="ghost"
                onClick={onClose}
                className="text-sm bg-red-200 border border-red-600 cursor-pointer font-semibold text-black hover:text-gray-800 transition-colors px-4 py-2 hover:bg-gray-100"
              >
                Cancel
              </Button>
            )}
          </div>
        </div>

        {/* Template List */}
        <div className="grid grid-cols-1 gap-3 pr-2 custom-scrollbar">
          {filteredTemplates.length > 0 ? (
            filteredTemplates.map((template) => (
              <div key={template.id} className={`h-auto flex flex-col border-2 rounded-2xl transition-all duration-200 bg-white overflow-hidden ${selectedIds.has(template.id) ? "border-green-500 shadow-sm" : "border-gray-100 hover:border-green-200"}`}>
                <div
                  onClick={() => {
                    toggleSelection(template.id);
                    setExpandedId(expandedId === template.id ? null : template.id);
                    setNewItemName("");
                  }}
                  className={`group relative flex items-center p-4 cursor-pointer transition-all duration-200 ${selectedIds.has(template.id)
                    ? "bg-green-50/50"
                    : "hover:bg-gray-50"
                    }`}
                >
                  <div
                    className={`shrink-0 w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${selectedIds.has(template.id)
                      ? "bg-green-500 border-green-500"
                      : "border-gray-300 group-hover:border-green-400"
                      }`}
                  >
                    {selectedIds.has(template.id) && (
                      <Check className="w-4 h-4 text-white" />
                    )}
                  </div>

                  <div className="ml-4 grow">
                    <h3
                      className={` transition-colors ${selectedIds.has(template.id)
                        ? "text-green-900"
                        : "text-gray-700"
                        }`}
                    >
                      {template.name}
                    </h3>
                    
                    <div className="flex items-center mt-1 space-x-3">
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-gray-200 text-gray-700 uppercase tracking-wider">
                        {template.category}
                      </span>
                      <span className="text-xs text-gray-400">
                        {template.wbsTemplates?.length || 0} Line Items
                      </span>
                    </div>
                  </div>

                  {selectedIds.has(template.id) && (
                    <div className="absolute right-14 top-1/2 -translate-y-1/2">
                      <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    </div>
                  )}

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleSelection(template.id);
                      setExpandedId(expandedId === template.id ? null : template.id);
                      setNewItemName(""); // reset input when toggling
                    }}
                    className="p-2 ml-2 shrink-0 rounded-full hover:bg-gray-200 transition-colors z-10"
                  >
                    {expandedId === template.id ? (
                      <ChevronUp className="w-5 h-5 text-gray-500" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-500" />
                    )}
                  </button>
                </div>

                {expandedId === template.id && (
                  <div className="p-4 bg-gray-50/50 border-t border-gray-100">
                    <h4 className="text-xs text-green-600 uppercase tracking-widest mb-2 font-semibold">
                      Existing Items
                    </h4>
                    <ul className="space-y-1 mb-4 max-h-40 overflow-y-auto custom-scrollbar pr-2">
                      {template.wbsTemplates?.map((item, index) => (
                        <li
                          key={index}
                          className="text-sm text-gray-700 flex items-center justify-between border-l-2 border-green-300 pl-3 py-1 group hover:bg-green-50 transition-colors"
                        >
                          <div className="flex items-center">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-400 mr-2 shrink-0"></span>
                            {item.name || item.title || "Unnamed Item"}
                          </div>
                          <button
                            onClick={(e) => {
                                e.stopPropagation();
                                setLineItemModalData(item);
                            }}
                            className="hidden group-hover:flex items-center justify-center p-1 bg-green-200 text-green-700 rounded-md hover:bg-green-300 transition-colors"
                            title="Add Line Item"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </li>
                      ))}
                      {(!template.wbsTemplates || template.wbsTemplates.length === 0) && (
                        <li className="text-sm text-gray-400 italic pl-3">No existing items.</li>
                      )}
                    </ul>

                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center mt-2 space-y-2 sm:space-y-0 sm:space-x-2 bg-white rounded-lg border border-gray-200 p-1 pl-3 shadow-sm">
                      <input
                        type="text"
                        placeholder="Quick add new template item..."
                        className="flex-grow bg-transparent outline-none text-sm py-1.5"
                        value={newItemName}
                        onChange={(e) => setNewItemName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleAddItem(template, e);
                        }}
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={!newItemName.trim() || isAdding}
                        onClick={(e) => handleAddItem(template, e)}
                        className="bg-green-100 hover:bg-green-200 text-green-700 px-4 py-1.5 rounded-md h-auto transition-colors font-semibold shadow-sm shrink-0"
                      >
                        {isAdding ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Plus className="w-4 h-4 mr-1" />}
                        {isAdding ? "Adding..." : "Add Item"}
                      </Button>
                    </div>

                    <div className="mt-3 flex justify-end">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveBundleKey(template.bundleKey);
                          setIsAddModalOpen(true);
                        }}
                        className="text-xs font-semibold text-green-700 border-green-600 hover:bg-green-50 transition-colors px-4 py-1.5 shadow-sm rounded-md uppercase tracking-wider"
                      >
                        + Add Custom Template Item
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-400 italic">
                No templates found matching your search.
              </p>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="pt-4 flex items-center justify-between border-t border-gray-100">
          <p className="text-sm text-gray-700">
            <span className=" text-green-600">{selectedIds.size}</span>{" "}
            templates selected
          </p>
          <div className="flex space-x-3">
            <Button
              onClick={handleSubmit}
              disabled={selectedIds.size === 0}
              className={`px-8 py-2.5  transition-all ${selectedIds.size > 0
                ? "bg-green-600 text-white hover:bg-green-700 shadow-lg shadow-green-200"
                : "bg-gray-200 text-gray-400 cursor-not-allowed"
                }`}
            >
              Add Selected Templates
            </Button>
          </div>
        </div>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
      `}</style>

      <AddNewWBSItem
        isOpen={isAddModalOpen}
        bundleKey={activeBundleKey}
        projectId={id}
        onClose={() => {
          setIsAddModalOpen(false);
          setActiveBundleKey("");
          fetchWbsTemplate();
        }}
      />

      <AddNewLineItemModal
        isOpen={!!lineItemModalData}
        wbsTemplate={lineItemModalData}
        onClose={() => {
          setLineItemModalData(null);
          fetchWbsTemplate();
        }}
      />
    </div>
  );
};

export default FetchWBSTemplate;
