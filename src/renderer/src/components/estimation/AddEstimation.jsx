import { useEffect, useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { toast } from 'react-toastify'
import { useDispatch, useSelector } from 'react-redux'

import Input from '../fields/input'
import Select from '../fields/Select'
import Button from '../fields/Button'
import MultipleFileUpload from '../fields/MultipleFileUpload'
import SectionTitle from '../ui/SectionTitle'
import Service from '../../api/Service'
import { setRFQData } from '../../store/rfqSlice'
import RichTextEditor from '../fields/RichTextEditor'

const EstimationStatusOptions = [
  { label: 'Pending', value: 'PENDING' },
  { label: 'In Progress', value: 'IN_PROGRESS' },
  { label: 'Completed', value: 'COMPLETED' },
  { label: 'Approved', value: 'APPROVED' }
]

const AddEstimation = ({ initialRfqId = null, onSuccess = () => { } }) => {
  const dispatch = useDispatch()
  const [files, setFiles] = useState([])

  const rfqData = useSelector((state) => state.RFQInfos?.RFQData || [])
  const fabricators = useSelector((state) => state.fabricatorInfo?.fabricatorData || [])

  const userType = sessionStorage.getItem('userRole')

  useEffect(() => {
    const fetchRFQs = async () => {
      if (rfqData.length === 0) {
        try {
          let rfqDetail
          if (userType === 'CLIENT') {
            rfqDetail = await Service.RfqSent()
          } else {
            rfqDetail = await Service.RFQRecieved()
          }
          if (rfqDetail?.data) {
            dispatch(setRFQData(rfqDetail.data))
          }
        } catch (error) {
          console.error('Error fetching RFQs:', error)
        }
      }
    }
    fetchRFQs()
  }, [dispatch, rfqData.length, userType])

  const {
    register,
    handleSubmit,
    control,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting }
  } = useForm({
    defaultValues: {
      status: 'PENDING'
    }
  })

  const selectedRfqId = watch('rfqId')

  // Auto-fill logic — works for BOTH initialRfqId and manual selection
  useEffect(() => {
    if (!selectedRfqId || rfqData.length === 0) return

    const rfq = rfqData.find((r) => String(r.id) === String(selectedRfqId))
    if (!rfq) return

    // Auto-fill all fields from selected RFQ
    setValue('projectName', rfq.projectName || '')
    setValue('description', rfq.description || '')
    setValue('fabricatorId', String(rfq.fabricatorId || ''))
    setValue('tools', rfq.tools || '')
    if (rfq.estimationDate) {
      setValue('estimateDate', String(rfq.estimationDate).split('T')[0])
    }
  }, [selectedRfqId, rfqData, setValue])

  // Pre-select RFQ if initialRfqId is passed (runs once on mount)
  useEffect(() => {
    if (initialRfqId && rfqData.length > 0 && !selectedRfqId) {
      const rfqIdStr = String(initialRfqId)
      setValue('rfqId', rfqIdStr)
      // Auto-fill will trigger via the effect above
    }
  }, [initialRfqId, rfqData, selectedRfqId, setValue])

  const rfqOptions = rfqData
    .filter((rfq) => rfq.wbtStatus === 'RECEIVED')
    .map((rfq) => ({
      label: `${rfq.projectName} - ${rfq.sender?.fabricator?.fabName || 'N/A'}`,
      value: rfq.id
    }))

  const fabricatorOptions = fabricators.map((fab) => ({
    label: fab.fabName,
    value: fab.id
  }))

  const onSubmit = async (data) => {
    try {
      const payload = {
        ...data,
        files,
        status: 'DRAFT',
        estimateDate: data.estimateDate ? new Date(data.estimateDate).toISOString() : null
      }

      const formData = new FormData()
      Object.entries(payload).forEach(([key, value]) => {
        if (key === 'files' && Array.isArray(value)) {
          value.forEach((file) => formData.append('files', file))
        } else if (value !== null && value !== undefined && value !== '') {
          formData.append(key, value)
        }
      })

      await Service.AddEstimation(formData)
      toast.success('Estimation created successfully!')
      onSuccess?.()
      reset()
      setFiles([])
    } catch (error) {
      toast.error(error?.message || 'Failed to create estimation')
    }
  }

  const isRfqLocked = !!initialRfqId

  return (
    <div className="w-full mx-auto bg-white rounded-2xl shadow-xl border border-gray-100 p-8 my-8">
      <h2 className="text-3xl font-bold text-center mb-8 text-gray-700">
        {isRfqLocked ? 'Create Estimation from RFQ' : 'Create New Estimation'}
      </h2>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        {/* RFQ Selection */}
        <SectionTitle title="Select RFQ" />
        <Controller
          name="rfqId"
          control={control}
          rules={{ required: 'RFQ is required' }}
          render={({ field }) => (
            <Select
              label="RFQ *"
              placeholder={isRfqLocked ? 'RFQ pre-selected' : 'Search and select an RFQ...'}
              options={rfqOptions}
              value={field.value}
              onChange={(_, val) => field.onChange(val ?? '')}
            />
          )}
        />
        {errors.rfqId && <p className="text-red-600 text-sm -mt-6">{errors.rfqId.message}</p>}

        {/* Estimation Details */}
        <SectionTitle title="Estimation Details" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Input
            label="Estimation Number *"
            {...register('estimationNumber', { required: 'Required' })}
            placeholder="e.g. EST-2025-089"
          />
          {errors.estimationNumber && (
            <p className="text-red-500 text-xs">{errors.estimationNumber.message}</p>
          )}

          <Input
            label="Project Name"
            {...register('projectName')}
            placeholder="Auto-filled from RFQ"
            disabled={!!selectedRfqId}
          />
        </div>

        <Controller
          name="fabricatorId"
          control={control}
          rules={{ required: 'Fabricator is required' }}
          render={({ field }) => (
            <Select
              label="Fabricator *"
              options={fabricatorOptions}
              value={field.value}
              onChange={(_, val) => field.onChange(val ?? '')}
            />
          )}
        />
        {errors.fabricatorId && (
          <p className="text-red-500 text-xs">{errors.fabricatorId.message}</p>
        )}

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
            disabled={!!selectedRfqId}
          />
        </div>

        <SectionTitle title="Status" />
        <Controller
          name="status"
          control={control}
          render={({ field }) => (
            <Select
              options={EstimationStatusOptions}
              value={field.value || 'PENDING'}
              onChange={(_, val) => field.onChange(val ?? 'PENDING')}
            />
          )}
        />

        <SectionTitle title="Attach Files" />
        <MultipleFileUpload onFilesChange={setFiles} />
        {files.length > 0 && (
          <p className="text-sm text-gray-700 mt-2">{files.length} file(s) attached</p>
        )}

        <div className="flex justify-end gap-4 pt-8 border-t border-gray-200">
          <Button
            type="button"
            onClick={() => {
              reset()
              setFiles([])
            }}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Creating...' : 'Create Estimation'}
          </Button>
        </div>
      </form>
    </div>
  )
}

export default AddEstimation
