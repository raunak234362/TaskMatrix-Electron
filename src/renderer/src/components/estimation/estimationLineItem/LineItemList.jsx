/* eslint-disable react/prop-types */
import { useEffect, useState, useMemo, useCallback } from 'react'
import Service from '../../../api/Service'
import DataTable from '../../ui/table'
import { X, Edit2, Save, Layers, AlignLeft, Calculator, Clock, CheckCircle2 } from 'lucide-react'
import RichTextEditor from '../../fields/RichTextEditor'

const LineItemList = ({ id, onClose }) => {
  const [lineItem, setLineItem] = useState([])
  const [groupData, setGroupData] = useState(null)
  // eslint-disable-next-line no-unused-vars
  const [, setLoading] = useState(false)

  const groupId = groupData?.group?.id

  const fetchGroupById = useCallback(async () => {
    const response = await Service.FetchGroupById(id)
    console.log(response.data)

    setGroupData(response.data)
  }, [id])

  const fetchLineItem = useCallback(async () => {
    if (!groupId) return
    setLoading(true)
    try {
      const response = await Service.FetchLineItemGroupList(groupId)
      console.log(response.data)
      setLineItem(response.data)
    } catch (error) {
      console.log(error)
    } finally {
      setLoading(false)
    }
  }, [groupId]) // setLoading is a stable setter, Service is stable, setLineItem is stable

  useEffect(() => {
    fetchGroupById()
  }, [fetchGroupById])

  useEffect(() => {
    if (groupId) {
      fetchLineItem()
    }
  }, [groupId, fetchLineItem])

  const [editingRowId, setEditingRowId] = useState(null)
  const [editFormData, setEditFormData] = useState({})

  // Group Editing State
  const [isEditingGroup, setIsEditingGroup] = useState(false)
  const [groupFormData, setGroupFormData] = useState({})

  // Bulk Quantity Edit State
  const [pendingChanges, setPendingChanges] = useState({})
  const [isBulkSaving, setIsBulkSaving] = useState(false)

  const handleGroupEditClick = () => {
    setIsEditingGroup(true)
    setGroupFormData({
      name: groupData?.group?.name || '',
      description: groupData?.group?.description || '',
      totalHours: groupData?.totalHours || 0,
      divisor: groupData?.group?.divisor || 0
    })
  }

  const handleGroupCancelClick = () => {
    setIsEditingGroup(false)
    setGroupFormData({})
  }

  const handleGroupSaveClick = async () => {
    try {
      const payload = {
        name: groupFormData.name,
        description: groupFormData.description,
        totalHours: groupFormData.totalHours,
        divisor: groupFormData.divisor
      }
      await Service.UpdateGroupById(id, payload)

      // Real-time update of local state
      setGroupData((prev) =>
        prev
          ? {
            ...prev,
            group: {
              ...prev.group,
              name: payload.name,
              description: payload.description,
              divisor: payload.divisor
            },
            totalHours: payload.totalHours
          }
          : null
      )

      setIsEditingGroup(false)
      // fetchGroupById(); // Optional: still fetch to ensure sync, but local update handles immediate UI
    } catch (error) {
      console.error('Error updating group:', error)
    }
  }

  const handleGroupInputChange = (value, field) => {
    setGroupFormData({ ...groupFormData, [field]: value })
  }

  const handleGroupInputRawChange = (e, field) => {
    setGroupFormData({ ...groupFormData, [field]: e.target.value })
  }

  // Stabilize handlers with useCallback
  const handleEditClick = useCallback((row) => {
    setEditingRowId(row.id)
    setEditFormData({
      scopeOfWork: row.scopeOfWork,
      quantity: row.quantity,
      hoursPerQty: row.hoursPerQty,
      totalHours: row.totalHours
    })
  }, []) // setEditingRowId and setEditFormData are stable setters

  const handleCancelClick = useCallback(() => {
    setEditingRowId(null)
    setEditFormData({})
  }, []) // setEditingRowId and setEditFormData are stable setters

  const handleSaveClickCorrect = useCallback(async (rowId) => {
    try {
      const payload = {
        ...editFormData,
        quantity: editFormData.quantity,
        hoursPerQty: editFormData.hoursPerQty,
        totalHours: editFormData.totalHours
      }
      await Service.UpdateLineItemById(rowId, payload)
      setEditingRowId(null)
      fetchLineItem()
      fetchGroupById()
    } catch (error) {
      console.error('Error updating line item:', error)
    }
  }, [editFormData, fetchLineItem, fetchGroupById]) // editFormData, fetchLineItem, fetchGroupById can change

  const handleInputChange = useCallback((value, field) => {
    setEditFormData(prev => ({ ...prev, [field]: value }))
  }, []) // setEditFormData is a stable setter

  const handleInputRawChange = useCallback((e, field) => {
    const value = e.target.value
    setEditFormData(prev => {
      const newData = { ...prev, [field]: value }

      if (field === 'quantity' || field === 'hoursPerQty') {
        const qty = parseFloat(field === 'quantity' ? value : (newData.quantity || 0)) || 0
        const hours =
          parseFloat(field === 'hoursPerQty' ? value : (newData.hoursPerQty || 0)) || 0
        newData.totalHours = qty * hours
      }
      return newData
    })
  }, []) // setEditFormData is a stable setter

  // --- Bulk Quantity Logic ---
  const handleQuantityChange = useCallback((id, newQuantity, hoursPerQty) => {
    const qty = parseFloat(newQuantity) || 0;
    const hours = parseFloat(hoursPerQty) || 0;
    const totalHours = qty * hours;

    setPendingChanges(prev => ({
      ...prev,
      [id]: {
        quantity: qty,
        totalHours: totalHours
      }
    }));
  }, []) // setPendingChanges is a stable setter

  const handleBulkSave = async () => {
    setIsBulkSaving(true);
    try {
      const promises = Object.entries(pendingChanges).map(([id, data]) => {
        return Service.UpdateLineItemById(id, {
          quantity: data.quantity,
          totalHours: data.totalHours
        });
      });

      await Promise.all(promises);
      setPendingChanges({});
      fetchLineItem();
      fetchGroupById();
    } catch (error) {
      console.error("Bulk save failed", error);
    } finally {
      setIsBulkSaving(false);
    }
  }

  const formatDecimalHours = (decimalHours) => {
    const num = Number(decimalHours)
    if (isNaN(num)) return '0h 0m'
    const hours = Math.floor(num)
    const minutes = Math.round((num - hours) * 60)
    return `${hours}h ${minutes}m`
  }

  // Merge pending changes into data so columns can be pure
  const mergedLineItems = useMemo(() => {
    return lineItem.map(item => {
      const pending = pendingChanges[item.id];
      if (pending) {
        return {
          ...item,
          quantity: pending.quantity,
          totalHours: pending.totalHours,
          isPending: true
        };
      }
      return item;
    })
  }, [lineItem, pendingChanges]);

  // Memoize columns to prevent regeneration on every render
  const columns = useMemo(() => [
    {
      accessorKey: 'scopeOfWork',
      header: 'Scope of Work',
      cell: ({ row }) => {
        const isEditing = editingRowId === row.original.id
        return isEditing ? (
          <input
            type="text"
            value={editFormData.scopeOfWork || ''}
            onChange={(val) => handleInputChange(val, 'scopeOfWork')}
            placeholder="Enter scope of work"
          />
        ) : (
          <div
            className="prose prose-sm max-w-none"
            dangerouslySetInnerHTML={{ __html: row.original.scopeOfWork }}
          />
        )
      }
    },
    {
      accessorKey: 'quantity',
      header: 'Quantity',
      cell: ({ row }) => {
        const isEditing = editingRowId === row.original.id;
        // Use merged value from row.original
        const val = isEditing ? (editFormData.quantity || 0) : row.original.quantity;
        const isPending = row.original.isPending;

        if (isEditing) {
          return (
            <input
              type="number"
              value={val}
              onChange={(e) => handleInputRawChange(e, 'quantity')}
              className="w-full border rounded p-1"
            />
          );
        }

        return (
          <div className="relative">
            <input
              type="number"
              value={val}
              onChange={(e) => handleQuantityChange(row.original.id, e.target.value, row.original.hoursPerQty)}
              className={`w-full border rounded p-1 transition-colors ${isPending ? 'border-orange-400 bg-orange-50' : 'border-gray-200'}`}
            />
          </div>
        )
      }
    },
    {
      accessorKey: 'hoursPerQty',
      header: 'Hours/Qty',
      cell: ({ row }) => {
        const isEditing = editingRowId === row.original.id
        return isEditing ? (
          <input
            type="number"
            value={editFormData.hoursPerQty || 0}
            onChange={(e) => handleInputRawChange(e, 'hoursPerQty')}
            className="w-full border rounded p-1"
          />
        ) : (
          row.original.hoursPerQty
        )
      }
    },
    {
      accessorKey: 'totalHours',
      header: 'Total Hours',
      cell: ({ row }) => {
        const isEditing = editingRowId === row.original.id;
        // Use merged value from row.original
        const val = isEditing ? editFormData.totalHours : row.original.totalHours;
        const isPending = row.original.isPending;

        if (isEditing) {
          return (
            <input
              type="number"
              value={val || 0}
              onChange={(e) => handleInputRawChange(e, 'totalHours')}
              className="w-full border rounded p-1"
            />
          )
        }

        return (
          <span className={isPending ? "font-bold text-orange-600" : ""}>
            {Number(val).toFixed(2)}
          </span>
        );
      }
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => {
        const isEditing = editingRowId === row.original.id
        return isEditing ? (
          <div className="flex gap-2">
            <button
              onClick={() => handleSaveClickCorrect(row.original.id)}
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
        )
      }
    }
  ], [editingRowId, editFormData, handleQuantityChange, handleInputRawChange, handleInputChange, handleEditClick, handleCancelClick, handleSaveClickCorrect]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      {' '}
      <div className="bg-white w-full max-w-5xl rounded-xl shadow-2xl overflow-hidden p-5 max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center mb-6 border-b pb-4 sticky top-0 bg-white z-10">
          <h2 className="text-2xl  text-gray-700">Line Items</h2>
          <div className="flex items-center gap-4">
            {Object.keys(pendingChanges).length > 0 && (
              <button
                onClick={handleBulkSave}
                disabled={isBulkSaving}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all font-medium animate-in fade-in"
              >
                {isBulkSaving ? (
                  <Clock className="w-4 h-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="w-4 h-4" />
                )}
                Save Changes ({Object.keys(pendingChanges).length})
              </button>
            )}
            <button onClick={onClose} className="text-gray-700 hover:text-gray-700">
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>
        <div className="mb-6 bg-gray-50 rounded-xl p-5 border border-gray-200 shadow-sm relative group">
          {!isEditingGroup && (
            <button
              onClick={handleGroupEditClick}
              className="absolute top-4 right-4 p-2 text-gray-400 hover:text-green-600 hover:bg-white rounded-full transition-all opacity-0 group-hover:opacity-100"
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
                    <label className="text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1 block">
                      Group Name
                    </label>
                    <input
                      type="text"
                      value={groupFormData.name}
                      onChange={(e) => handleGroupInputRawChange(e, 'name')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                      placeholder="Group Name"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1 block">
                      Description
                    </label>
                    <RichTextEditor
                      value={groupFormData.description}
                      onChange={(val) => handleGroupInputChange(val, 'description')}
                      placeholder="Description"
                    />
                  </div>
                </div>
              ) : (
                <>
                  <h3 className="text-lg  text-gray-700 flex items-center gap-2 mb-2">
                    <Layers className="w-5 h-5 text-green-600" />
                    {groupData?.group?.name || 'Unnamed Group'}
                  </h3>
                  <div className="flex items-start gap-2 text-gray-700">
                    <AlignLeft className="w-4 h-4 mt-1 shrink-0 text-gray-400" />
                    <div
                      className="text-sm leading-relaxed prose prose-sm max-w-none"
                      dangerouslySetInnerHTML={{
                        __html: groupData?.group?.description || 'No description available.'
                      }}
                    />
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
                    <p className="text-xs text-gray-700 font-medium uppercase tracking-wide">
                      Weeks
                    </p>
                    {isEditingGroup ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          value={groupFormData.divisor}
                          onChange={(e) => handleGroupInputRawChange(e, 'divisor')}
                          className="w-16 px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-green-500 outline-none text-right  text-gray-700"
                          placeholder="Div"
                        />
                        <span className="text-gray-400 text-sm">=</span>
                        <span className="text-sm  text-gray-700">
                          {groupFormData.divisor > 0
                            ? (groupFormData.totalHours / groupFormData.divisor).toFixed(2)
                            : '0.00'}
                        </span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-end">
                        <span className="text-lg  text-gray-700">
                          {groupData?.group?.divisor
                            ? (groupData?.totalHours / groupData?.group?.divisor).toFixed(2)
                            : '0.00'}
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
                    <p className="text-xs text-gray-700 font-medium uppercase tracking-wide">
                      Total Hours
                    </p>
                    {isEditingGroup ? (
                      <input
                        type="number"
                        value={groupFormData.totalHours}
                        onChange={(e) => handleGroupInputRawChange(e, 'totalHours')}
                        className="w-24 px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-green-500 outline-none text-right  text-gray-700"
                      />
                    ) : (
                      <span className="text-lg  text-gray-700">
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
                    className="flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors"
                  >
                    <Save className="w-3 h-3" />
                    Save
                  </button>
                  <button
                    onClick={handleGroupCancelClick}
                    className="px-3 py-1.5 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors"
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
          data={mergedLineItems}
          searchPlaceholder="Search line items..."

        />
      </div>
    </div>
  )
}

export default LineItemList
