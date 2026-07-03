/* eslint-disable react/prop-types */
import { useEffect, useState, useMemo, useCallback } from 'react'
import Service from '../../../api/Service'
import DataTable from '../../ui/table'
import { X, Layers, AlignLeft, Clock, CheckCircle2, Search } from 'lucide-react'
import RichTextEditor from '../../fields/RichTextEditor'

const LineItemList = ({ id, onClose }) => {
  // --- States ---
  const [lineItem, setLineItem] = useState([])
  const [groupData, setGroupData] = useState(null)
  const [editingRowId, setEditingRowId] = useState(null)
  const [editFormData, setEditFormData] = useState({})
  const [isEditingGroup, setIsEditingGroup] = useState(false)
  const [groupFormData, setGroupFormData] = useState({})
  const [scopeSearch, setScopeSearch] = useState('')
  const [pendingChanges, setPendingChanges] = useState({})
  const [isBulkSaving, setIsBulkSaving] = useState(false)

  const groupId = groupData?.group?.id

  // --- API Integrations ---

  // Fetches the line item group metadata by group/estimation ID
  const fetchGroupById = useCallback(async () => {
    try {
      const response = await Service.FetchGroupById(id)
      setGroupData(response.data)
    } catch (error) {
      console.error('Error fetching group details:', error)
    }
  }, [id])

  // Fetches individual line items belonging to the current group
  const fetchLineItem = useCallback(async () => {
    if (!groupId) return
    try {
      const response = await Service.FetchLineItemGroupList(groupId)
      setLineItem(response.data)
    } catch (error) {
      console.error('Error fetching line items:', error)
    }
  }, [groupId])

  useEffect(() => {
    fetchGroupById()
  }, [fetchGroupById])

  useEffect(() => {
    if (groupId) {
      fetchLineItem()
    }
  }, [groupId, fetchLineItem])

  // --- Metrics Resolving Helper ---

  /**
   * Safe metric extractor to handle schema shapes of different endpoints:
   * - GET endpoint returns values at the root response level.
   * - PUT endpoint returns values nested under data.group.
   */
  const getGroupMetrics = () => {
    if (!groupData) {
      return { divisor: 0, displayHours: 0, displayWeeks: 0, displayDays: 0 }
    }

    const divisor = groupData?.group?.divisor !== null && groupData?.group?.divisor !== undefined
      ? Number(groupData.group.divisor)
      : (groupData?.divisor !== null && groupData?.divisor !== undefined
          ? Number(groupData.divisor)
          : 0)

    const tableHours = Number(groupData?.totalHours || 0)

    const savedHours = groupData?.group?.totalHours !== null && groupData?.group?.totalHours !== undefined
      ? Number(groupData.group.totalHours)
      : null

    const savedWeeks = groupData?.group?.totalWeeks !== null && groupData?.group?.totalWeeks !== undefined
      ? Number(groupData.group.totalWeeks)
      : (groupData?.totalWeeks !== null && groupData?.totalWeeks !== undefined
          ? Number(groupData.totalWeeks)
          : null)

    const savedDays = groupData?.group?.totalDays !== null && groupData?.group?.totalDays !== undefined
      ? Number(groupData.group.totalDays)
      : (groupData?.totalDays !== null && groupData?.totalDays !== undefined
          ? Number(groupData.totalDays)
          : null)

    const displayHours = savedHours !== null ? savedHours : tableHours

    const displayWeeks = savedWeeks !== null
      ? savedWeeks
      : (divisor > 0 ? (tableHours / divisor) : 0)

    const displayDays = savedDays !== null
      ? savedDays
      : (savedWeeks !== null ? (savedWeeks * 5) : (displayWeeks * 5))

    return {
      divisor,
      displayHours,
      displayWeeks,
      displayDays
    }
  }

  // --- Group Detail Handlers ---

  const handleGroupEditClick = () => {
    const metrics = getGroupMetrics()
    setIsEditingGroup(true)
    setGroupFormData({
      name: groupData?.group?.name || '',
      description: groupData?.group?.description || '',
      totalHours: metrics.displayHours.toFixed(2),
      divisor: metrics.divisor.toFixed(2),
      weeks: metrics.displayWeeks.toFixed(2),
      days: metrics.displayDays.toFixed(2)
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
        totalHours: Number(groupFormData.totalHours),
        divisor: Number(groupFormData.divisor),
        totalWeeks: Number(groupFormData.weeks),
        weeks: Number(groupFormData.weeks),
        totalDays: Number(groupFormData.days)
      }
      await Service.UpdateGroupById(id, payload)

      // Sync updated group state locally
      setGroupData((prev) =>
        prev
          ? {
              ...prev,
              group: {
                ...prev.group,
                name: payload.name,
                description: payload.description,
                divisor: payload.divisor,
                totalHours: payload.totalHours,
                totalWeeks: payload.totalWeeks,
                totalDays: payload.totalDays
              }
            }
          : null
      )
      setIsEditingGroup(false)
    } catch (error) {
      console.error('Error updating group details:', error)
    }
  }

  const handleGroupInputChange = (value, field) => {
    setGroupFormData({ ...groupFormData, [field]: value })
  }

  const handleGroupInputRawChange = (e, field) => {
    setGroupFormData({ ...groupFormData, [field]: e.target.value })
  }

  const handleMetricChange = (val, field) => {
    setGroupFormData((prev) => ({
      ...prev,
      [field]: val
    }))
  }

  // --- Inline Single Row Edit Handlers ---

  const handleEditClick = useCallback((row) => {
    setEditingRowId(row.id)
    setEditFormData({
      scopeOfWork: row.scopeOfWork,
      quantity: row.quantity,
      hoursPerQty: row.hoursPerQty,
      totalHours: row.totalHours
    })
  }, [])

  const handleCancelClick = useCallback(() => {
    setEditingRowId(null)
    setEditFormData({})
  }, [])

  const handleSaveClickCorrect = useCallback(async (rowId) => {
    try {
      const payload = {
        ...editFormData,
        quantity: Number(editFormData.quantity),
        hoursPerQty: Number(editFormData.hoursPerQty),
        totalHours: Number(editFormData.totalHours)
      }
      await Service.UpdateLineItemById(rowId, payload)
      setEditingRowId(null)
      fetchLineItem()
      fetchGroupById()
    } catch (error) {
      console.error('Error updating line item:', error)
    }
  }, [editFormData, fetchLineItem, fetchGroupById])

  const handleInputChange = useCallback((value, field) => {
    setEditFormData(prev => ({ ...prev, [field]: value }))
  }, [])

  const handleInputRawChange = useCallback((e, field) => {
    const value = e.target.value
    setEditFormData(prev => {
      const newData = { ...prev, [field]: value }

      if (field === 'quantity' || field === 'hoursPerQty') {
        const qty = parseFloat(field === 'quantity' ? value : (prev.quantity || 0)) || 0
        const hours = parseFloat(field === 'hoursPerQty' ? value : (prev.hoursPerQty || 0)) || 0
        newData.totalHours = qty * hours
      }
      return newData
    })
  }, [])

  // --- Bulk Quantity Handlers ---

  const handleQuantityChange = useCallback((id, newQuantity, hoursPerQty) => {
    const qty = newQuantity === '' ? 0 : parseFloat(newQuantity) || 0
    const hours = parseFloat(hoursPerQty) || 0
    const totalHours = qty * hours

    setPendingChanges(prev => ({
      ...prev,
      [id]: {
        quantity: newQuantity,
        totalHours: totalHours
      }
    }))
  }, [])

  const handleBulkSave = async () => {
    setIsBulkSaving(true)
    try {
      const promises = Object.entries(pendingChanges).map(([id, data]) => {
        return Service.UpdateLineItemById(id, {
          quantity: Number(data.quantity),
          totalHours: data.totalHours
        })
      })

      await Promise.all(promises)
      setPendingChanges({})
      fetchLineItem()
      fetchGroupById()
    } catch (error) {
      console.error("Bulk save failed:", error)
    } finally {
      setIsBulkSaving(false)
    }
  }

  // --- Data Sorting & Memoization ---

  // Sort line items based on original data to prevent row shifting while editing
  const sortedLineItems = useMemo(() => {
    return [...lineItem].sort((a, b) => {
      const aQty = Number(a.quantity)
      const bQty = Number(b.quantity)
      const aFilled = !isNaN(aQty) && a.quantity !== null && a.quantity !== undefined && String(a.quantity).trim() !== '' && aQty > 0
      const bFilled = !isNaN(bQty) && b.quantity !== null && b.quantity !== undefined && String(b.quantity).trim() !== '' && bQty > 0

      if (aFilled && !bFilled) return -1
      if (!aFilled && bFilled) return 1
      if (aFilled && bFilled) return bQty - aQty
      return 0
    })
  }, [lineItem])

  // Merges bulk unsaved user input changes into display data
  const mergedLineItems = useMemo(() => {
    return sortedLineItems.map(item => {
      const pending = pendingChanges[item.id]
      if (pending) {
        return {
          ...item,
          quantity: pending.quantity,
          totalHours: pending.totalHours,
          isPending: true
        }
      }
      return item
    })
  }, [sortedLineItems, pendingChanges])

  // Filters items by plain text matching the search query
  const filteredLineItems = useMemo(() => {
    const query = scopeSearch.trim().toLowerCase()
    if (!query) return mergedLineItems
    return mergedLineItems.filter((item) => {
      const plain = (item.scopeOfWork || '').replace(/<[^>]*>/g, '').toLowerCase()
      return plain.includes(query)
    })
  }, [mergedLineItems, scopeSearch])

  // --- Table Column Definitions ---

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
            onChange={(e) => handleInputChange(e.target.value, 'scopeOfWork')}
            placeholder="Enter scope of work"
            className="w-full border border-gray-300 rounded-none px-2 py-1 focus:outline-none focus:border-green-700 bg-white text-black font-medium text-sm"
          />
        ) : (
          <div
            className="prose prose-sm max-w-none text-black"
            dangerouslySetInnerHTML={{ __html: row.original.scopeOfWork }}
          />
        )
      }
    },
    {
      accessorKey: 'quantity',
      header: 'Quantity',
      cell: ({ row }) => {
        const isEditing = editingRowId === row.original.id
        const val = isEditing ? (editFormData.quantity ?? '') : (row.original.quantity ?? '')
        const isPending = row.original.isPending

        if (isEditing) {
          return (
            <input
              type="number"
              value={val}
              onChange={(e) => handleInputRawChange(e, 'quantity')}
              className="w-full border border-gray-300 rounded-none p-1 focus:outline-none focus:border-green-700 bg-white text-black font-medium text-sm"
            />
          )
        }

        return (
          <div className="relative">
            <input
              type="number"
              value={val}
              onChange={(e) => handleQuantityChange(row.original.id, e.target.value, row.original.hoursPerQty)}
              className={`w-full border p-1 transition-colors rounded-none focus:outline-none focus:border-green-700 bg-white text-black font-medium text-sm ${isPending ? 'border-green-700 bg-green-50/20' : 'border-gray-300'}`}
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
            className="w-full border border-gray-300 rounded-none p-1 focus:outline-none focus:border-green-700 bg-white text-black font-medium text-sm"
          />
        ) : (
          <span className="text-black text-sm font-medium">{row.original.hoursPerQty}</span>
        )
      }
    },
    {
      accessorKey: 'totalHours',
      header: 'Total Hours',
      cell: ({ row }) => {
        const isEditing = editingRowId === row.original.id
        const val = isEditing ? editFormData.totalHours : row.original.totalHours
        const isPending = row.original.isPending

        if (isEditing) {
          return (
            <input
              type="number"
              value={val || 0}
              onChange={(e) => handleInputRawChange(e, 'totalHours')}
              className="w-full border border-gray-300 rounded-none p-1 focus:outline-none focus:border-green-700 bg-white text-black font-medium text-sm"
            />
          )
        }

        return (
          <span className={isPending ? "font-bold text-green-700 text-sm" : "text-black text-sm"}>
            {Number(val).toFixed(2)}
          </span>
        )
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
              className="text-green-700 hover:text-green-900 font-bold uppercase tracking-wider text-xs"
            >
              Save
            </button>
            <button
              onClick={handleCancelClick}
              className="text-black hover:text-gray-600 font-bold uppercase tracking-wider text-xs"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            onClick={() => handleEditClick(row.original)}
            className="text-green-700 hover:text-green-900 font-bold uppercase tracking-wider text-xs"
          >
            Edit
          </button>
        )
      }
    }
  ], [editingRowId, editFormData, handleQuantityChange, handleInputRawChange, handleInputChange, handleEditClick, handleCancelClick, handleSaveClickCorrect])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white w-full max-w-5xl rounded-none border border-gray-300 shadow-2xl overflow-hidden p-6 h-[90vh] flex flex-col">
        {/* Header and Controls */}
        <div className="flex flex-col gap-3 mb-6 sticky top-0 bg-white z-10">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-black text-black uppercase tracking-tight">Line Items</h2>
            <div className="flex items-center gap-4">
              {Object.keys(pendingChanges).length > 0 && (
                <button
                  onClick={handleBulkSave}
                  disabled={isBulkSaving}
                  className="flex items-center gap-2 px-6 py-1.5 bg-green-50 text-black border-2 border-green-700/80 rounded-none hover:bg-green-100 transition-all font-bold text-sm uppercase tracking-tight shadow-sm"
                >
                  {isBulkSaving ? (
                    <Clock className="w-4 h-4 animate-spin text-green-700" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4 text-green-700" />
                  )}
                  Save Changes ({Object.keys(pendingChanges).length})
                </button>
              )}
              <button onClick={onClose} className="px-6 py-1.5 bg-red-50 text-black border-2 border-red-700/80 rounded-none hover:bg-red-100 transition-all font-bold text-sm uppercase tracking-tight shadow-sm">
                Close
              </button>
            </div>
          </div>

          {/* Scope of Work Search */}
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-black pointer-events-none" />
            <input
              type="text"
              value={scopeSearch}
              onChange={(e) => setScopeSearch(e.target.value)}
              placeholder="Search scope of work..."
              className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-none bg-white focus:outline-none focus:border-green-700 transition-all placeholder:text-gray-400 text-black font-medium"
            />
            {scopeSearch && (
              <button
                onClick={() => setScopeSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-black hover:text-gray-600 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          {scopeSearch && (
            <p className="text-xs text-black font-medium">
              Showing <span className="font-bold text-green-700">{filteredLineItems.length}</span> of{' '}
              <span className="font-bold text-black">{mergedLineItems.length}</span> items
            </p>
          )}
        </div>

        {/* Group Details (Read/Edit mode) */}
        <div className="mb-6 bg-white p-6 border border-gray-300 flex flex-col gap-4 relative">
          {isEditingGroup ? (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-bold text-black uppercase tracking-wider mb-1 block">
                  Group Name
                </label>
                <input
                  type="text"
                  value={groupFormData.name}
                  onChange={(e) => handleGroupInputRawChange(e, 'name')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-none focus:outline-none focus:border-green-700 bg-white text-black text-sm font-medium"
                  placeholder="Group Name"
                />
              </div>
              <div>
                <label className="text-sm font-bold text-black uppercase tracking-wider mb-1 block">
                  Description
                </label>
                <RichTextEditor
                  value={groupFormData.description}
                  onChange={(val) => handleGroupInputChange(val, 'description')}
                  placeholder="Description"
                />
              </div>

              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 pt-4 border-t border-gray-200">
                <div className="flex flex-wrap gap-4">
                  <div className="flex flex-col gap-1">
                    <label className="text-sm text-black font-bold uppercase tracking-wider">
                      Weeks
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={groupFormData.weeks || ''}
                      onChange={(e) => handleMetricChange(e.target.value, 'weeks')}
                      className="w-24 px-3 py-1.5 border border-gray-300 rounded-none focus:outline-none focus:border-green-700 bg-white text-black text-sm font-medium"
                      placeholder="Weeks"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-sm text-black font-bold uppercase tracking-wider">
                      Days
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={groupFormData.days || ''}
                      onChange={(e) => handleMetricChange(e.target.value, 'days')}
                      className="w-24 px-3 py-1.5 border border-gray-300 rounded-none focus:outline-none focus:border-green-700 bg-white text-black text-sm font-medium"
                      placeholder="Days"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-sm text-black font-bold uppercase tracking-wider">
                      Total Hours
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={groupFormData.totalHours || ''}
                      onChange={(e) => handleMetricChange(e.target.value, 'totalHours')}
                      className="w-28 px-3 py-1.5 border border-gray-300 rounded-none focus:outline-none focus:border-green-700 bg-white text-black text-sm font-medium"
                      placeholder="Total Hours"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-sm text-black font-bold uppercase tracking-wider">
                      Hours / Week (Div)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={groupFormData.divisor || ''}
                      onChange={(e) => handleMetricChange(e.target.value, 'divisor')}
                      className="w-28 px-3 py-1.5 border border-gray-300 rounded-none focus:outline-none focus:border-green-700 bg-white text-black text-sm font-medium"
                      placeholder="Divisor"
                    />
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={handleGroupSaveClick}
                    className="px-4 py-2 bg-green-50 text-black border-2 border-green-700/80 hover:bg-green-100 transition-all font-bold text-xs uppercase tracking-wider rounded-none shadow-sm cursor-pointer"
                  >
                    Save
                  </button>
                  <button
                    onClick={handleGroupCancelClick}
                    className="px-4 py-2 bg-red-50 text-black border-2 border-red-700/80 hover:bg-red-100 transition-all font-bold text-xs uppercase tracking-wider rounded-none shadow-sm cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <>
              <h3 className="text-lg font-bold text-black uppercase tracking-wider flex items-center gap-2 mb-2">
                <Layers className="w-5 h-5 text-green-700" />
                {groupData?.group?.name || 'Unnamed Group'}
              </h3>
              <div className="flex items-start gap-2 text-black mb-4">
                <AlignLeft className="w-4.5 h-4.5 mt-1 shrink-0 text-black" />
                <div
                  className="text-sm leading-relaxed prose prose-sm max-w-none text-black"
                  dangerouslySetInnerHTML={{
                    __html: groupData?.group?.description || 'No description available.'
                  }}
                />
              </div>

              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pt-4 border-t border-gray-200">
                <div className="flex flex-wrap gap-4">
                  {/* WEEKS Card */}
                  <div className="flex items-center gap-3 bg-white px-4 py-2 border border-gray-300">
                    <Clock className="w-5 h-5 text-green-700" />
                    <div>
                      <p className="text-sm text-black font-medium uppercase tracking-wider">
                        Weeks
                      </p>
                      <span className="text-sm font-bold text-black">
                        {Number(getGroupMetrics().displayWeeks).toFixed(2)}
                      </span>
                    </div>
                  </div>

                  {/* DAYS Card */}
                  <div className="flex items-center gap-3 bg-white px-4 py-2 border border-gray-300">
                    <Clock className="w-5 h-5 text-green-700" />
                    <div>
                      <p className="text-sm text-black font-medium uppercase tracking-wider">
                        Days
                      </p>
                      <span className="text-sm font-bold text-black">
                        {Number(getGroupMetrics().displayDays).toFixed(2)}
                      </span>
                    </div>
                  </div>

                  {/* TOTAL HOURS Card */}
                  <div className="flex items-center gap-3 bg-white px-4 py-2 border border-gray-300">
                    <Clock className="w-5 h-5 text-green-700" />
                    <div>
                      <p className="text-sm text-black font-medium uppercase tracking-wider">
                        Total Hours
                      </p>
                      <span className="text-sm font-bold text-black">
                        {Number(getGroupMetrics().displayHours).toFixed(2)} hrs
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <button
                    onClick={handleGroupEditClick}
                    className="px-4 py-2 bg-green-50 text-black border-2 border-green-700/80 hover:bg-green-100 transition-all font-bold text-xs uppercase tracking-wider rounded-none shadow-sm cursor-pointer"
                  >
                    Edit Details
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Line Items Table */}
        <div className="flex-1 overflow-y-auto">
          <DataTable
            columns={columns}
            data={filteredLineItems}
            searchPlaceholder="Search line items..."
          />
        </div>
      </div>
    </div>
  )
}

export default LineItemList
