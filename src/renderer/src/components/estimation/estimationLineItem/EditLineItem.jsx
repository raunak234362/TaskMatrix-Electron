/* eslint-disable react/prop-types */
import { useEffect } from 'react'
import { useForm, Controller } from 'react-hook-form'
import RichTextEditor from '../../fields/RichTextEditor'

import Service from '../../../api/Service'
import { toast } from 'react-toastify'
import { Loader2, X } from 'lucide-react'
import Input from '../../fields/input'

const EditLineItem = ({ lineItem, onClose, onUpdate }) => {
  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
    reset,
    watch,
    setValue
  } = useForm({
    defaultValues: {
      scopeOfWork: '',
      quantity: 0,
      hoursPerQty: 0,
      totalHours: 0
    }
  })

  useEffect(() => {
    if (lineItem) {
      reset({
        scopeOfWork: lineItem.scopeOfWork || '',
        quantity: lineItem.quantity || 0,
        hoursPerQty: lineItem.hoursPerQty || 0,
        totalHours: lineItem.totalHours || 0
      })
    }
  }, [lineItem, reset])

  const onSubmit = async (data) => {
    if (!lineItem) return
    try {
      await Service.UpdateLineItemById(lineItem.id, data)
      toast.success('Line item updated successfully')
      onUpdate()
      onClose()
    } catch (error) {
      console.error('Error updating line item:', error)
      toast.error('Failed to update line item')
    }
  }

  if (!lineItem) return null

  return (
    <div className="fixed inset-0 z-index-[60] flex items-center justify-center bg-black/50">
      <div className="bg-white w-full max-w-md rounded-xl shadow-2xl overflow-hidden">
        <div className="flex justify-between items-center p-4 border-b bg-gray-50">
          <h3 className="text-lg font-semibold text-gray-700">Edit Line Item</h3>
          <button onClick={onClose} className="text-gray-700 hover:text-gray-700 transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Scope of Work <span className="text-red-500">*</span>
            </label>
            <Controller
              name="scopeOfWork"
              control={control}
              rules={{ required: 'Scope of work is required' }}
              render={({ field }) => (
                <RichTextEditor
                  value={field.value || ''}
                  onChange={field.onChange}
                  placeholder="Enter scope of work"
                />
              )}
            />
            {errors.scopeOfWork && (
              <p className="text-red-500 text-xs mt-1">{errors.scopeOfWork.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
              <Input
                type="number"
                step="any"
                {...register('quantity', {
                  min: { value: 0, message: 'Quantity must be positive' },
                  onChange: (e) => {
                    const hours = watch('hoursPerQty')
                    const qty = parseFloat(e.target.value) || 0
                    setValue('totalHours', qty * hours)
                  }
                })}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 outline-none transition-all ${
                  errors.quantity ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.quantity && (
                <p className="text-red-500 text-xs mt-1">{errors.quantity.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Hours / Qty</label>
              <Input
                type="number"
                step="any"
                {...register('hoursPerQty', {
                  min: {
                    value: 0,
                    message: 'Hours per quantity must be positive'
                  },
                  onChange: (e) => {
                    const qty = watch('quantity')
                    const hours = parseFloat(e.target.value) || 0
                    setValue('totalHours', qty * hours)
                  }
                })}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 outline-none transition-all ${
                  errors.hoursPerQty ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.hoursPerQty && (
                <p className="text-red-500 text-xs mt-1">{errors.hoursPerQty.message}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Total Hours</label>
              <Input
                type="number"
                step="any"
                {...register('totalHours', {
                  min: { value: 0, message: 'Total hours must be positive' }
                })}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 outline-none transition-all ${
                  errors.totalHours ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.totalHours && (
                <p className="text-red-500 text-xs mt-1">{errors.totalHours.message}</p>
              )}
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors shadow-sm"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="animate-spin w-4 h-4" />
                  Updating...
                </>
              ) : (
                'Update'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default EditLineItem
