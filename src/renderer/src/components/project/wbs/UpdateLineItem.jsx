import { useState, useEffect } from 'react'
import { X, Save, Loader2, Calculator } from 'lucide-react'
import { Button } from '../../ui/button'
import Service from '../../../api/Service'

const UpdateLineItem = ({ isOpen, onClose, lineItem, onUpdate }) => {
  const [formData, setFormData] = useState({
    qtyNo: 0,
    unitTime: 0,
    checkUnitTime: 0
  })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (lineItem) {
      setFormData({
        qtyNo: lineItem.qtyNo || lineItem.totalQtyNo || 0,
        unitTime: lineItem.unitTime || 0,
        checkUnitTime: lineItem.checkUnitTime || 0
      })
    }
  }, [lineItem])

  if (!isOpen || !lineItem) return null

  const handleSave = async () => {
    try {
      setLoading(true)
      const { qtyNo, unitTime, checkUnitTime } = formData
      const payload = {
        qtyNo,
        unitTime,
        checkUnitTime,
        execHr: qtyNo * unitTime,
        checkHr: qtyNo * checkUnitTime
      }
      await Service.UpdateLineItem(lineItem.id, payload)
      onUpdate()
      onClose()
    } catch (error) {
      console.error('Error updating line item:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden border border-gray-100 animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
              <Calculator className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-800">Edit Line Item</h3>
              <p className="text-[10px] text-gray-500 font-medium uppercase tracking-wider">
                {lineItem.discipline || 'General'}
              </p>
            </div>
          </div>
          <Button
            onClick={onClose}
            variant="ghost"
            size="icon"
            className="text-gray-400 hover:text-gray-700 rounded-full"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
            <p className="text-xs text-gray-500 font-medium mb-1">Description</p>
            <p className="text-sm font-semibold text-gray-700 line-clamp-2">
              {lineItem.name || lineItem.wbsTemplate?.name || lineItem.description || '—'}
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-600 ml-1">Quantity</label>
              <input
                type="number"
                value={formData.qtyNo}
                onChange={(e) => setFormData({ ...formData, qtyNo: Number(e.target.value) })}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all font-medium"
                placeholder="0"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-600 ml-1">Exec Unit Time (h)</label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.unitTime}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      unitTime: Number(e.target.value)
                    })
                  }
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all font-medium"
                  placeholder="0.0"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-600 ml-1">Check Unit Time (h)</label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.checkUnitTime}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      checkUnitTime: Number(e.target.value)
                    })
                  }
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all font-medium"
                  placeholder="0.0"
                />
              </div>
            </div>
          </div>

          {/* Totals Preview */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <div className="bg-green-50/50 p-3 rounded-xl border border-green-100/50">
              <p className="text-[10px] text-green-600 font-bold uppercase">Total Exec</p>
              <p className="text-lg font-black text-green-700">
                {(formData.qtyNo * formData.unitTime).toFixed(1)}h
              </p>
            </div>
            <div className="bg-blue-50/50 p-3 rounded-xl border border-blue-100/50">
              <p className="text-[10px] text-blue-600 font-bold uppercase">Total Check</p>
              <p className="text-lg font-black text-blue-700">
                {(formData.qtyNo * formData.checkUnitTime).toFixed(1)}h
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50/50 border-t border-gray-100 flex gap-3">
          <Button
            onClick={onClose}
            variant="outline"
            className="flex-1 rounded-xl h-12 font-bold text-gray-600"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={loading}
            className="flex-1 rounded-xl h-12 font-bold bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-200 transition-all"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <Save className="w-5 h-5 mr-2" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}

export default UpdateLineItem
