import { useEffect, useState, useMemo } from 'react'
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
import { loadFabricator } from '../../store/fabricatorSlice'
import RichTextEditor from '../fields/RichTextEditor'

const EstimationStatusOptions = [
  { label: 'Pending', value: 'PENDING' },
  { label: 'In Progress', value: 'IN_PROGRESS' },
  { label: 'Completed', value: 'COMPLETED' },
  { label: 'Approved', value: 'APPROVED' }
]

const AddEstimation = ({ initialRfqId = null, onClose, onSuccess = () => { } }) => {
  const dispatch = useDispatch()
  const [files, setFiles] = useState([])
  const [estimations, setEstimations] = useState([])

  const rfqData = useSelector((state) => state.RFQInfos?.RFQData || [])
  const fabricators = useSelector((state) => state.fabricatorInfo?.fabricatorData || [])

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [rfqRes, fabRes, estRes] = await Promise.all([
          Service.FetchAllRFQ(1, 100),
          Service.GetAllFabricators(1, 100),
          Service.AllEstimation()
        ])

        const rfqList = Array.isArray(rfqRes)
          ? rfqRes
          : (rfqRes?.data ? (Array.isArray(rfqRes.data) ? rfqRes.data : (rfqRes.data.data || [])) : [])
        if (rfqList.length > 0 || rfqData.length === 0) {
          dispatch(setRFQData(rfqList))
        }

        const fabList = Array.isArray(fabRes)
          ? fabRes
          : (fabRes?.data ? (Array.isArray(fabRes.data) ? fabRes.data : (fabRes.data.data || [])) : [])
        if (fabList.length > 0 || fabricators.length === 0) {
          dispatch(loadFabricator(fabList))
        }

        const estList = Array.isArray(estRes)
          ? estRes
          : (estRes?.data ? (Array.isArray(estRes.data) ? estRes.data : (estRes.data.data || [])) : [])
        setEstimations(estList)
      } catch (error) {
        console.error('Error fetching RFQs, Fabricators, or Estimations:', error)
      }
    }
    fetchData()
  }, [dispatch])

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

    const rfq = rfqData.find((r) => String(r.id || r._id) === String(selectedRfqId))
    if (!rfq) return

    // Auto-fill all fields from selected RFQ
    setValue('projectName', rfq.projectName || '')
    setValue('description', rfq.description || '')
    setValue('estimationNumber', rfq.projectNumber || '')
    setValue('fabricatorId', String(rfq.fabricatorId || rfq.fabricator?.id || rfq.fabricator?._id || ''))
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

  const estimatedRfqIds = useMemo(() => {
    const ids = new Set()
    estimations.forEach((est) => {
      const id = est.rfqId || est.rfq_id || est.rfq?.id || est.rfq?._id
      if (id) ids.add(String(id))
    })
    return ids
  }, [estimations])

  const rfqOptions = useMemo(() => {
    return rfqData
      .filter((rfq) => {
        const id = String(rfq.id || rfq._id || '')
        if (initialRfqId && String(initialRfqId) === id) return true
        return !estimatedRfqIds.has(id)
      })
      .map((rfq) => {
        const fabName = rfq.sender?.fabricator?.fabName || rfq.fabricator?.fabName || 'N/A'
        return {
          label: `${rfq.projectName || 'Unnamed RFQ'} - ${fabName}`,
          value: rfq.id || rfq._id
        }
      })
  }, [rfqData, estimatedRfqIds, initialRfqId])

  const fabricatorOptions = fabricators.map((fab) => ({
    label: fab.fabName,
    value: fab.id || fab._id
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
      if (onClose) onClose()
      reset()
      setFiles([])
    } catch (error) {
      toast.error(error?.message || 'Failed to create estimation')
    }
  }

  const isRfqLocked = !!initialRfqId

  return (
    <div className="w-full mx-auto bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden animate-in fade-in zoom-in duration-200">
      {/* Header */}
    

      <div className="p-8">
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
          <MultipleFileUpload onFilesChange={setFiles} initialFiles={files} />
          {files.length > 0 && (
            <p className="text-sm text-black font-bold mt-2 uppercase tracking-widest text-[10px]">{files.length} file(s) attached</p>
          )}

          <div className="pt-6 border-t border-gray-200 flex justify-center">
            <button
              type="submit"
              onClick={handleSubmit(onSubmit)}
              disabled={isSubmitting}
              className="w-full max-w-md px-8 py-2.5 bg-green-50 text-black border-2 border-green-700/80 rounded-lg hover:bg-green-100 transition-all font-bold text-sm uppercase tracking-tight shadow-sm text-center disabled:opacity-50 active:scale-95"
            >
              {isSubmitting ? 'Creating...' : 'Create Estimation'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default AddEstimation
