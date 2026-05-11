/* eslint-disable react/prop-types */
'use client'

import { useState, useEffect } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { toast } from 'react-toastify'
import Select from 'react-select'
import Input from '../../fields/input'
import Button from '../../fields/Button'
import SectionTitle from '../../ui/SectionTitle'
import Service from '../../../api/Service'
import { useSelector } from 'react-redux'
import RichTextEditor from '../../fields/RichTextEditor'
import { Loader2, X } from 'lucide-react'

const EditEstimationTaskByID = ({ task, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false)
  const staffData = useSelector((state) => state.userInfo.staffData)

  const staffOptions =
    staffData
      ?.filter((staff) => staff && ['STAFF', 'ESTIMATOR', 'ESTIMATION_HEAD'].includes(staff.role))
      .map((staff) => ({
        label: `${staff.firstName} ${staff.lastName}`,
        value: staff.id
      })) ?? []

  const statusOptions = [
    { label: 'Assigned', value: 'ASSIGNED' },
    { label: 'In Progress', value: 'IN_PROGRESS' },
    { label: 'On Break', value: 'BREAK' },
    { label: 'Completed', value: 'COMPLETED' }
  ]

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting }
  } = useForm({
    defaultValues: {
      assignedToId: task?.assignedToId || '',
      startDate: task?.startDate ? new Date(task.startDate).toISOString().split('T')[0] : '',
      endDate: task?.endDate ? new Date(task.endDate).toISOString().split('T')[0] : '',
      notes: task?.notes || '',
      status: task?.status || 'ASSIGNED'
    }
  })

  useEffect(() => {
    if (task) {
      reset({
        assignedToId: task?.assignedToId || '',
        startDate: task?.startDate ? new Date(task.startDate).toISOString().split('T')[0] : '',
        endDate: task?.endDate ? new Date(task.endDate).toISOString().split('T')[0] : '',
        notes: task?.notes || '',
        status: task?.status || 'ASSIGNED'
      })
    }
  }, [task, reset])

  const onUpdateTask = async (data) => {
    try {
      setLoading(true)
      const payload = {
        ...data,
        startDate: data.startDate ? new Date(data.startDate).toISOString() : null,
        endDate: data.endDate ? new Date(data.endDate).toISOString() : null
      }
      await Service.UpdateEstimationTaskById(task.id, payload)
      toast.success('Task updated successfully!')
      onSuccess?.()
      onClose()
    } catch (error) {
      console.error('Error updating task:', error)
      toast.error('Failed to update task')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <h3 className="text-xl font-bold text-gray-800">Edit Estimation Task</h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-200 rounded-full transition-colors text-gray-500"
          >
            <X size={20} />
          </button>
        </div>

        {/* Scrollable Form */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          <form onSubmit={handleSubmit(onUpdateTask)} className="space-y-8">
            {/* Task Info Section */}
            <div className="space-y-6">
              <SectionTitle title="Task Details" />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Assigned To */}
                <div className="flex flex-col">
                  <label className="text-sm font-medium text-gray-700 mb-1 ml-1">Assigned To</label>
                  <Controller
                    name="assignedToId"
                    control={control}
                    rules={{ required: 'Assigned To is required' }}
                    render={({ field }) => (
                      <Select
                        placeholder="Select Staff"
                        options={staffOptions}
                        value={staffOptions.find((opt) => opt.value === field.value)}
                        onChange={(option) => field.onChange(option?.value)}
                        menuPortalTarget={document.body}
                        styles={{
                          menuPortal: (base) => ({ ...base, zIndex: 9999 }),
                          control: (base) => ({
                            ...base,
                            borderRadius: '0.75rem',
                            padding: '2px',
                            borderColor: '#e5e7eb',
                            '&:hover': { borderColor: '#0d9488' }
                          })
                        }}
                      />
                    )}
                  />
                  {errors.assignedToId && (
                    <p className="text-red-500 text-xs mt-1 ml-1">{errors.assignedToId.message}</p>
                  )}
                </div>
                
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex flex-col">
                  <Input
                    label="Start Date *"
                    type="date"
                    {...register('startDate', { required: 'Start Date is required' })}
                    className="rounded-xl"
                  />
                  {errors.startDate && (
                    <p className="text-red-500 text-xs mt-1 ml-1">{errors.startDate.message}</p>
                  )}
                </div>

                <div className="flex flex-col">
                  <Input
                    label="End Date *"
                    type="date"
                    {...register('endDate', { required: 'End Date is required' })}
                    className="rounded-xl"
                  />
                  {errors.endDate && (
                    <p className="text-red-500 text-xs mt-1 ml-1">{errors.endDate.message}</p>
                  )}
                </div>
              </div>

              <div className="flex flex-col">
                <label className="text-sm font-medium text-gray-700 mb-2 ml-1">Notes</label>
                <Controller
                  name="notes"
                  control={control}
                  render={({ field }) => (
                    <RichTextEditor
                      value={field.value || ''}
                      onChange={field.onChange}
                      placeholder="Add notes..."
                    />
                  )}
                />
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="flex justify-end gap-4 pt-6 border-t border-gray-100">
              <Button
                type="button"
                onClick={onClose}
                className="bg-gray-100 text-gray-700 hover:bg-gray-200 px-8 rounded-xl transition-all"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || loading}
                className="bg-green-600 text-white hover:bg-green-700 px-8 rounded-xl shadow-lg shadow-green-200 transition-all flex items-center gap-2"
              >
                {(isSubmitting || loading) && <Loader2 size={18} className="animate-spin" />}
                Update Task
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default EditEstimationTaskByID