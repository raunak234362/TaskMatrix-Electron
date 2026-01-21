/* eslint-disable react/prop-types */
import { useEffect, useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { toast } from 'react-toastify'
import { useSelector } from 'react-redux'
import { Loader2, X } from 'lucide-react'
import ReactSelect from 'react-select' // Use react-select for better modal support

import Input from '../fields/input'
import Button from '../fields/Button'
import SectionTitle from '../ui/SectionTitle'
import Service from '../../api/Service'
import RichTextEditor from '../fields/RichTextEditor'

const EstimationStatusOptions = [
  { label: 'Pending', value: 'PENDING' },
  { label: 'In Progress', value: 'IN_PROGRESS' },
  { label: 'Completed', value: 'COMPLETED' },
  { label: 'Approved', value: 'APPROVED' },
  { label: 'Draft', value: 'DRAFT' }
]

const EditEstimation = ({ id, onSuccess, onCancel }) => {
  const [loading, setLoading] = useState(true)

  const fabricators = useSelector((state) => state.fabricatorInfo?.fabricatorData || [])

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting }
  } = useForm()

  useEffect(() => {
    const fetchEstimation = async () => {
      try {
        const res = await Service.GetEstimationById(id)
        if (res?.data) {
          const d = res.data
          reset({
            estimationNumber: d.estimationNumber,
            projectName: d.projectName,
            fabricatorId: String(d.fabricatorId || ''),
            description: d.description,
            estimateDate: d.estimateDate ? String(d.estimateDate).split('T')[0] : '',
            tools: d.tools,
            status: d.status
          })
        }
      } catch (error) {
        console.error('Fetch error:', error)
        toast.error('Failed to load estimation')
      } finally {
        setLoading(false)
      }
    }

    if (id) fetchEstimation()
  }, [id, reset])

  const fabricatorOptions = fabricators.map((f) => ({
    label: f.fabName,
    value: String(f.id)
  }))

  const onSubmit = async (data) => {
    try {
      await Service.UpdateEstimationById(id, {
        ...data,
        estimateDate: data.estimateDate ? new Date(data.estimateDate).toISOString() : null
      })
      toast.success('Estimation updated successfully')
      onSuccess?.()
    } catch (error) {
      console.error('Update error:', error)
      toast.error('Failed to update estimation')
    }
  }

  // Custom styles for react-select to match the design
  const selectStyles = {
    control: (base, state) => ({
      ...base,
      borderColor: state.isFocused ? '#3b82f6' : '#d1d5db', // blue-500 : gray-300
      boxShadow: state.isFocused ? '0 0 0 1px #3b82f6' : 'none',
      '&:hover': {
        borderColor: '#3b82f6'
      },
      padding: '2px',
      borderRadius: '0.375rem' // rounded-md
    }),
    menuPortal: (base) => ({ ...base, zIndex: 9999 }) // Ensure it renders above modal
  }

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 backdrop-blur-sm">
        <Loader2 className="w-8 h-8 animate-spin text-green-600" />
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm transition-all duration-300">
      <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* HEADER */}
        <div className="flex items-center justify-between px-8 py-5 border-b border-gray-100 bg-gray-50/80 backdrop-blur">
          <div>
            <h2 className="text-xl font-bold text-gray-800">Edit Estimation</h2>
            <p className="text-sm text-gray-500 mt-1">Update estimation details and status</p>
          </div>
          <button
            onClick={onCancel}
            className="p-2 rounded-full hover:bg-gray-200 text-gray-500 hover:text-gray-700 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* BODY */}
        <div className="flex-1 overflow-y-auto p-8 space-y-8 bg-gray-50/30 font-sans">
          <form id="edit-estimation-form" onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Card 1: Details */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 space-y-6">
              <SectionTitle title="Estimation Details" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input
                  label="Estimation Number *"
                  {...register('estimationNumber', { required: 'Required' })}
                  placeholder="EST-2025-089"
                />
                <Input
                  label="Project Name"
                  {...register('projectName')}
                  placeholder="Project Name"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700">Fabricator *</label>
                <Controller
                  name="fabricatorId"
                  control={control}
                  rules={{ required: 'Fabricator is required' }}
                  render={({ field }) => (
                    <ReactSelect
                      {...field}
                      options={fabricatorOptions}
                      value={fabricatorOptions.find((op) => op.value === field.value) || null}
                      onChange={(val) => field.onChange(val ? val.value : '')}
                      placeholder="Select Fabricator..."
                      styles={selectStyles}
                      menuPortalTarget={document.body}
                      className="text-sm"
                    />
                  )}
                />
                {errors.fabricatorId && (
                  <p className="text-red-500 text-xs">{errors.fabricatorId.message}</p>
                )}
              </div>
            </div>

            {/* Card 2: Description */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 space-y-4">
              <SectionTitle title="Description" />
              <Controller
                name="description"
                control={control}
                render={({ field }) => (
                  <RichTextEditor
                    value={field.value || ''}
                    onChange={field.onChange}
                    placeholder="Project scope, special requirements..."
                  />
                )}
              />
            </div>

            {/* Card 3: Timeline & Tools */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 space-y-6">
              <SectionTitle title="Timeline & Tools" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input
                  label="Estimate Date *"
                  type="date"
                  {...register('estimateDate', { required: 'Required' })}
                />
                <Input
                  label="Tools / Software"
                  {...register('tools')}
                  placeholder="TEKLA, SDS/2, AutoCAD..."
                />
              </div>
            </div>

            {/* Card 4: Status */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 space-y-4">
              <SectionTitle title="Status" />

              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700">Status</label>
                <Controller
                  name="status"
                  control={control}
                  render={({ field }) => (
                    <ReactSelect
                      {...field}
                      options={EstimationStatusOptions}
                      value={
                        EstimationStatusOptions.find((op) => op.value === field.value) ||
                        EstimationStatusOptions.find((op) => op.value === 'PENDING')
                      }
                      onChange={(val) => field.onChange(val ? val.value : 'PENDING')}
                      styles={selectStyles}
                      menuPortalTarget={document.body}
                      className="text-sm w-full md:w-1/2"
                    />
                  )}
                />
              </div>
            </div>
          </form>
        </div>

        {/* FOOTER */}
        <div className="px-8 py-5 border-t border-gray-100 bg-white flex justify-end gap-3 z-10">
          <Button
            variant="outline"
            onClick={onCancel}
            className="border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </Button>
          <Button
            form="edit-estimation-form"
            type="submit"
            disabled={isSubmitting}
            className="bg-green-600 hover:bg-green-700 text-white min-w-[140px] shadow-lg shadow-green-100"
          >
            {isSubmitting ? (
              <div className="flex items-center gap-2">
                <Loader2 className="animate-spin w-4 h-4" />
                <span>Updating...</span>
              </div>
            ) : (
              'Update Estimation'
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}

export default EditEstimation
