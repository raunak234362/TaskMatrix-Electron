import { useEffect, useState } from "react";
import Service from "../../../api/Service";
import DataTable from "../../ui/table";
import { X, Clock, Layers, AlignLeft, Edit2, Save, Calculator } from "lucide-react";

const LineItemList = ({ id, onClose }) => {
    const [lineItem, setLineItem] = useState([]);
    const [groupData, setGroupData] = useState([]);
    const [loading, setLoading] = useState(false);
    const groupId = groupData?.group?.id

    const fetchGroupById = async () => {
        const response = await Service.FetchGroupById(id);
        console.log(response.data);

        setGroupData(response.data);
    }
    const fetchLineItem = async () => {
        setLoading(true);
        try {
            const response = await Service.FetchLineItemGroupList(groupId);
            console.log(response.data);
            setLineItem(response.data);
        } catch (error) {
            console.log(error);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        fetchGroupById();
    }, [id]);

    useEffect(() => {
        if (groupId) {
            fetchLineItem();
        }
    }, [groupId]);

    const [editingRowId, setEditingRowId] = useState(null);
    const [editFormData, setEditFormData] = useState({});

    // Group Editing State
    const [isEditingGroup, setIsEditingGroup] = useState(false);
    const [groupFormData, setGroupFormData] = useState({});

    const handleGroupEditClick = () => {
        setIsEditingGroup(true);
        setGroupFormData({
            name: groupData?.group?.name || "",
            description: groupData?.group?.description || "",
            totalHours: groupData?.totalHours || 0,
            divisor: groupData?.group?.divisor || 0,
        });
    };

    const handleGroupCancelClick = () => {
        setIsEditingGroup(false);
        setGroupFormData({});
    };

    const handleGroupSaveClick = async () => {
        try {
            const payload = {
                name: groupFormData.name,
                description: groupFormData.description,
                totalHours: Number(groupFormData.totalHours),
                divisor: Number(groupFormData.divisor)
            };
            await Service.UpdateGroupById(id, payload);

            // Real-time update of local state
            setGroupData(prev => ({
                ...prev,
                group: {
                    ...prev.group,
                    name: payload.name,
                    description: payload.description,
                    divisor: payload.divisor
                },
                totalHours: payload.totalHours
            }));

            setIsEditingGroup(false);
            // fetchGroupById(); // Optional: still fetch to ensure sync, but local update handles immediate UI
        } catch (error) {
            console.error("Error updating group:", error);
        }
    };

    const handleGroupInputChange = (e, field) => {
        setGroupFormData({ ...groupFormData, [field]: e.target.value });
    };

    const handleEditClick = (row) => {
        setEditingRowId(row.id);
        setEditFormData({
            scopeOfWork: row.scopeOfWork,
            quantity: row.quantity,
            hoursPerQty: row.hoursPerQty,
            totalHours: row.totalHours,
        });
    };

    const handleCancelClick = () => {
        setEditingRowId(null);
        setEditFormData({});
    };

    const handleSaveClick = async (rowId) => {
        try {
            const payload = {
                ...editFormData,
                quantity: Number(editFormData.quantity),
                hoursPerQty: Number(editFormData.hoursPerQty),
                totalHours: Number(editFormData.totalHours)
            };
            await Service.UpdateLineItemById(rowId, payload);
            setEditingRowId(null);
            fetchLineItem();
            fetchGroupById();
        } catch (error) {
            console.error("Error updating line item:", error);
        }
    };

    const handleInputChange = (e, field) => {
        const value = e.target.value;
        const newData = { ...editFormData, [field]: value };

        if (field === "quantity" || field === "hoursPerQty") {
            const qty = parseFloat(field === "quantity" ? value : newData.quantity) || 0;
            const hours = parseFloat(field === "hoursPerQty" ? value : newData.hoursPerQty) || 0;
            newData.totalHours = qty * hours;
        }

        setEditFormData(newData);
    };


    const formatDecimalHours = (decimalHours) => {
        const num = Number(decimalHours);
        if (isNaN(num)) return "0h 0m";
        const hours = Math.floor(num);
        const minutes = Math.round((num - hours) * 60);
        return `${hours}h ${minutes}m`;
    };

    const columns = [
        {
            accessorKey: "scopeOfWork",
            header: "Scope of Work",
            cell: ({ row }) => {
                const isEditing = editingRowId === row.original.id;
                return isEditing ? (
                    <textarea
                        value={editFormData.scopeOfWork}
                        onChange={(e) => handleInputChange(e, "scopeOfWork")}
                        className="w-full border rounded p-1"
                    />
                ) : (
                    row.original.scopeOfWork
                );
            },
        },
        {
            accessorKey: "quantity",
            header: "Quantity",
            cell: ({ row }) => {
                const isEditing = editingRowId === row.original.id;
                return isEditing ? (
                    <input
                        type="number"
                        value={editFormData.quantity}
                        onChange={(e) => handleInputChange(e, "quantity")}
                        className="w-full border rounded p-1"
                    />
                ) : (
                    row.original.quantity
                );
            },
        },
        {
            accessorKey: "hoursPerQty",
            header: "Hours/Qty",
            cell: ({ row }) => {
                const isEditing = editingRowId === row.original.id;
                return isEditing ? (
                    <input
                        type="number"
                        value={editFormData.hoursPerQty}
                        onChange={(e) => handleInputChange(e, "hoursPerQty")}
                        className="w-full border rounded p-1"
                    />
                ) : (
                    row.original.hoursPerQty
                );
            },
        },
        {
            accessorKey: "totalHours",
            header: "Total Hours",
            cell: ({ row }) => {
                const isEditing = editingRowId === row.original.id;
                return isEditing ? (
                    <input
                        type="number"
                        value={editFormData.totalHours}
                        onChange={(e) => handleInputChange(e, "totalHours")}
                        className="w-full border rounded p-1"
                    />
                ) : (
                    row.original.totalHours
                );
            }
        },
        {
            id: "actions",
            header: "Actions",
            cell: ({ row }) => {
                const isEditing = editingRowId === row.original.id;
                return isEditing ? (
                    <div className="flex gap-2">
                        <button
                            onClick={() => handleSaveClick(row.original.id)}
                            className="text-green-600 hover:text-green-800 font-medium"
                        >
                            Save
                        </button>
                        <button
                            onClick={handleCancelClick}
                            className="text-red-600 hover:text-red-800 font-medium"
                        >
                            Cancel
                        </button>
                    </div>
                ) : (
                    <button
                        onClick={() => handleEditClick(row.original)}
                        className="text-blue-600 hover:text-blue-800 font-medium"
                    >
                        Edit
                    </button>
                );
            },
        },
    ];

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"

        >  <div
            className="bg-white w-full max-w-5xl rounded-xl shadow-2xl overflow-hidden p-5 max-h-[90vh] flex flex-col"

        >
                <div className="flex justify-between items-center mb-6 border-b pb-4 sticky top-0 bg-white z-10">
                    <h2 className="text-2xl font-bold text-gray-800">Line Items</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-500 hover:text-gray-700"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>
                <div className="mb-6 bg-gray-50 rounded-xl p-5 border border-gray-200 shadow-sm relative group">
                    {!isEditingGroup && (
                        <button
                            onClick={handleGroupEditClick}
                            className="absolute top-4 right-4 p-2 text-gray-400 hover:text-teal-600 hover:bg-white rounded-full transition-all opacity-0 group-hover:opacity-100"
                            title="Edit Group Details"
                        >
                            <Edit2 className="w-4 h-4" />
                        </button>
                    )}

                    <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                        <div className="flex-1 w-full">
                            {isEditingGroup ? (
                                <div className="space-y-3">
                                    <div>
                                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1 block">Group Name</label>
                                        <input
                                            type="text"
                                            value={groupFormData.name}
                                            onChange={(e) => handleGroupInputChange(e, "name")}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none"
                                            placeholder="Group Name"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1 block">Description</label>
                                        <textarea
                                            value={groupFormData.description}
                                            onChange={(e) => handleGroupInputChange(e, "description")}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none"
                                            placeholder="Description"
                                            rows="2"
                                        />
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2 mb-2">
                                        <Layers className="w-5 h-5 text-teal-600" />
                                        {groupData?.group?.name || "Unnamed Group"}
                                    </h3>
                                    <div className="flex items-start gap-2 text-gray-600">
                                        <AlignLeft className="w-4 h-4 mt-1 shrink-0 text-gray-400" />
                                        <p className="text-sm leading-relaxed">
                                            {groupData?.group?.description || "No description available."}
                                        </p>
                                    </div>
                                </>
                            )}
                        </div>

                        <div className="flex flex-col items-end gap-3">
                            <div className="flex gap-3">
                                <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-lg border border-gray-200 shadow-sm">
                                    <div className="p-2 bg-purple-100 rounded-full">
                                        <Calculator className="w-5 h-5 text-purple-600" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Weeks</p>
                                        {isEditingGroup ? (
                                            <div className="flex items-center gap-2">
                                                <input
                                                    type="number"
                                                    value={groupFormData.divisor}
                                                    onChange={(e) => handleGroupInputChange(e, "divisor")}
                                                    className="w-16 px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-teal-500 outline-none text-right font-bold text-gray-800"
                                                    placeholder="Div"
                                                />
                                                <span className="text-gray-400 text-sm">=</span>
                                                <span className="text-sm font-bold text-gray-600">
                                                    {groupFormData.divisor > 0 ? (groupFormData.totalHours / groupFormData.divisor).toFixed(2) : "0.00"}
                                                </span>
                                            </div>
                                        ) : (
                                            <div className="flex flex-col items-end">
                                                <span className="text-lg font-bold text-gray-800">
                                                    {groupData?.group?.divisor ? (groupData?.totalHours / groupData?.group?.divisor).toFixed(2) : "0.00"}
                                                </span>
                                                <span className="text-[10px] text-gray-400">
                                                    (Div: {groupData?.group?.divisor || 0})
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-lg border border-gray-200 shadow-sm">
                                    <div className="p-2 bg-orange-100 rounded-full">
                                        <Clock className="w-5 h-5 text-orange-600" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Total Hours</p>
                                        {isEditingGroup ? (
                                            <input
                                                type="number"
                                                value={groupFormData.totalHours}
                                                onChange={(e) => handleGroupInputChange(e, "totalHours")}
                                                className="w-24 px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-teal-500 outline-none text-right font-bold text-gray-800"
                                            />
                                        ) : (
                                            <span className="text-lg font-bold text-gray-800">
                                                {formatDecimalHours(groupData?.totalHours)}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {isEditingGroup && (
                                <div className="flex gap-2 mt-2">
                                    <button
                                        onClick={handleGroupSaveClick}
                                        className="flex items-center gap-1 px-3 py-1.5 bg-teal-600 text-white text-sm font-medium rounded-lg hover:bg-teal-700 transition-colors"
                                    >
                                        <Save className="w-3 h-3" />
                                        Save
                                    </button>
                                    <button
                                        onClick={handleGroupCancelClick}
                                        className="px-3 py-1.5 bg-gray-100 text-gray-600 text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
                <DataTable
                    columns={columns}
                    data={lineItem}
                    searchPlaceholder="Search line items..."
                    pageSizeOptions={[10, 20, 40]}
                />
            </div>
        </div>
    );
};

export default LineItemList;