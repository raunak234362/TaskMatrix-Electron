import { useEffect, useState } from "react";
import {
  Loader2,
  AlertCircle,
  Layers,
  ListChecks,
  Clock,
  X,
  Pencil,
  Check,
  XCircle,
} from "lucide-react";
import Service from "../../../api/Service";


const GetWBSByID = ({ id, onClose }) => {
  const [wbs, setWbs] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editValues, setEditValues] = useState({
    QtyNo: 0,
    unitTime: 0,
    CheckUnitTime: 0,
  });

  const userRole = sessionStorage.getItem("userRole")?.toLowerCase() || "";
  const canEditTime =
    userRole === "admin" || userRole === "deputy_manager";

  useEffect(() => {
    if (id) fetchWBSById(id);
  }, [id]);

  const fetchWBSById = async (id) => {
    try {
      setLoading(true);
      const response = await Service.GetWBSById(id);
      console.log(response);
      setWbs(response || null);
    } catch (err) {
      console.error("Error fetching WBS:", err);
      setError("Failed to load WBS details");
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (item) => {
    setEditingId(item.id);
    setEditValues({
      QtyNo: item.QtyNo || 0,
      unitTime: item.unitTime || 0,
      CheckUnitTime: item.CheckUnitTime || 0,
    });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditValues({ QtyNo: 0, unitTime: 0, CheckUnitTime: 0 });
  };

  const handleSaveLineItem = async (lineItemId) => {
    if (!wbs) return;
    const item = wbs.LineItems?.find((i) => i.id === lineItemId);
    if (!item) return;

    const { QtyNo, unitTime, CheckUnitTime } = editValues;
    const checkHr = CheckUnitTime * QtyNo;
    const execHr = unitTime * QtyNo;

    try {
      await Service.UpdateWBSLineItem(wbs.projectId, wbs.id, lineItemId, {
        QtyNo,
        unitTime,
        CheckUnitTime,
        checkHr,
        execHr,
      });
      // Refresh data
      const response = await Service.GetWBSById(wbs.id);
      setWbs(response || null);
      setEditingId(null);
    } catch (err) {
      console.error("Error updating line item:", err);
      // You might want to show a toast error here
    }
  };

  const formatDate = (date) =>
    date
      ? new Date(date).toLocaleString("en-IN", {
        dateStyle: "medium",
        timeStyle: "short",
      })
      : "—";

  if (loading)
    return (
      <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="bg-white rounded-xl p-6 shadow-md flex items-center gap-2">
          <Loader2 className="w-5 h-5 animate-spin text-teal-600" />
          <p>Loading WBS details...</p>
        </div>
      </div>
    );

  if (error || !wbs)
    return (
      <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="bg-white rounded-xl p-6 shadow-md flex items-center gap-2 text-red-600">
          <AlertCircle className="w-5 h-5" />
          {error || "WBS not found"}
          <button
            onClick={onClose}
            className="ml-4 px-3 py-1 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
          >
            Close
          </button>
        </div>
      </div>
    );

  return (
    <div
      className="fixed inset-0 bg-black/20 backdrop-blur-sm flex justify-center items-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-white w-11/12 md:w-8/12 max-h-[90vh] overflow-y-auto rounded-xl shadow-lg p-6 border border-gray-100 relative"
        onClick={(e) => e.stopPropagation()} // prevent closing when clicking inside modal
      >
        {/* Header */}
        <div className="flex justify-between items-center border-b pb-3 mb-5">
          <div>
            <h2 className="text-2xl font-semibold text-teal-700 flex items-center gap-2">
              <Layers className="w-5 h-5 text-teal-600" /> {wbs.name}
            </h2>
            <p className="text-sm text-gray-500">
              WBS ID: <span className="text-gray-800">{wbs.id}</span>
            </p>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-gray-100 text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Summary */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-sm mb-6">
          <InfoRow label="Type" value={wbs.type} />
          <InfoRow label="Stage" value={wbs.stage} />
          <InfoRow label="Template Key" value={wbs.templateKey} />
          <InfoRow label="Project ID" value={wbs.projectId} />
          <InfoRow label="Created On" value={formatDate(wbs.createdAt)} />
          <InfoRow label="Updated On" value={formatDate(wbs.updatedAt)} />
        </div>

        {/* Totals */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
          <h4 className="text-teal-700 font-semibold mb-3 flex items-center gap-2">
            <Clock className="w-4 h-4" /> Total Hours Overview
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
            <Stat label="Total Check Hours" value={wbs.totalCheckHr} />
            <Stat label="Check Hours with Rework" value={wbs.checkHrWithRework} />
            <Stat label="Total Exec Hours" value={wbs.totalExecHr} />
            <Stat label="Exec Hours with Rework" value={wbs.execHrWithRework} />
            <Stat label="Total Quantity No" value={wbs.totalQtyNo} />
          </div>
        </div>

        {/* Line Items */}
        <div className="border-t pt-4">
          <h3 className="text-lg font-semibold text-teal-700 flex items-center gap-2 mb-2">
            <ListChecks className="w-5 h-5" /> Line Items (
            {wbs.LineItems?.length || 0})
          </h3>

          {wbs.LineItems && wbs.LineItems.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full border border-gray-200 rounded-lg text-sm">
                <thead className="bg-gray-100 text-gray-700 text-left">
                  <tr>
                    <th className="p-3 border-b">#</th>
                    <th className="p-3 border-b">Description</th>
                    <th className="p-3 border-b text-center">Quantity</th>
                    {canEditTime && (
                      <>
                        <th className="p-3 border-b text-center">UnitTime</th>
                        <th className="p-3 border-b text-center">
                          Checking UnitTime
                        </th>
                      </>
                    )}
                    <th className="p-3 border-b text-center">
                      Total Exec Hours
                    </th>
                    <th className="p-3 border-b text-center">
                      Total Check Hours
                    </th>
                    <th className="p-3 border-b">Updated At</th>
                    <th className="p-3 border-b text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {wbs.LineItems.map((item, index) => (
                    <tr
                      key={item.id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="p-3 border-b">{index + 1}</td>
                      <td className="p-3 border-b text-gray-800">
                        {item.description}
                      </td>
                      <td className="p-3 border-b text-center text-teal-700 font-medium">
                        {editingId === item.id ? (
                          <input
                            type="number"
                            value={editValues.QtyNo}
                            onChange={(e) =>
                              setEditValues({
                                ...editValues,
                                QtyNo: Number(e.target.value),
                              })
                            }
                            className="w-20 p-1 border rounded text-center"
                            autoFocus
                          />
                        ) : (
                          item.QtyNo ?? 0
                        )}
                      </td>
                      {canEditTime && (
                        <>
                          <td className="p-3 border-b text-center text-teal-700 font-medium">
                            {editingId === item.id ? (
                              <input
                                type="number"
                                value={editValues.unitTime}
                                onChange={(e) =>
                                  setEditValues({
                                    ...editValues,
                                    unitTime: Number(e.target.value),
                                  })
                                }
                                className="w-20 p-1 border rounded text-center"
                              />
                            ) : (
                              item.unitTime ?? 0
                            )}
                          </td>
                          <td className="p-3 border-b text-center text-teal-700 font-medium">
                            {editingId === item.id ? (
                              <input
                                type="number"
                                value={editValues.CheckUnitTime}
                                onChange={(e) =>
                                  setEditValues({
                                    ...editValues,
                                    CheckUnitTime: Number(e.target.value),
                                  })
                                }
                                className="w-20 p-1 border rounded text-center"
                              />
                            ) : (
                              item.CheckUnitTime ?? 0
                            )}
                          </td>
                        </>
                      )}
                      <td className="p-3 border-b text-center text-teal-700 font-medium">
                        {item.execHr ?? 0}
                      </td>
                      <td className="p-3 border-b text-center text-teal-700 font-medium">
                        {item.checkHr ?? 0}
                      </td>
                      <td className="p-3 border-b text-gray-600">
                        {item.updatedAt ? formatDate(item.updatedAt) : "—"}
                      </td>
                      <td className="p-3 border-b text-center">
                        {editingId === item.id ? (
                          <div className="flex justify-center gap-2">
                            <button
                              onClick={() => handleSaveLineItem(item.id)}
                              className="text-green-600 hover:text-green-800"
                              title="Save"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                            <button
                              onClick={handleCancelEdit}
                              className="text-red-600 hover:text-red-800"
                              title="Cancel"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleEditClick(item)}
                            className="text-gray-500 hover:text-teal-600"
                            title="Edit"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-500 italic text-center py-3">
              No line items found for this WBS.
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="mt-6 pt-4 border-t flex justify-end gap-3">
          <button className="px-4 py-2 bg-teal-600 text-white rounded-lg text-sm hover:bg-teal-700">
            Add Quantity
          </button>
          <button className="px-4 py-2 bg-red-100 text-red-700 rounded-lg text-sm hover:bg-red-200">
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};

const InfoRow = ({ label, value }) => (
  <div className="flex justify-between items-center border-b border-gray-100 pb-1">
    <span className="font-medium text-gray-600">{label}:</span>
    <span className="text-gray-900">{value || "—"}</span>
  </div>
);

const Stat = ({ label, value }) => (
  <div className="bg-white border border-gray-200 rounded-lg p-3 shadow-sm">
    <p className="text-xs text-gray-500">{label}</p>
    <p className="text-sm font-semibold text-teal-700">{value ?? 0}</p>
  </div>
);

export default GetWBSByID;
