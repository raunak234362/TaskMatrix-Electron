import React, { useEffect, useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { useSelector } from 'react-redux'
import { toast } from 'react-toastify'
import Select from 'react-select'
import { Loader2, AlertCircle } from 'lucide-react'
import Service from '../../api/Service'
import Input from '../fields/input'
import Button from '../fields/Button'
import MultipleFileUpload from '../fields/MultipleFileUpload'
import RichTextEditor from '../fields/RichTextEditor'

const EditRFI = ({ id, onSuccess }) => {
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const [rfi, setRfi] = useState(null)
  const [description, setDescription] = useState('')
  const [files, setFiles] = useState([])
  const [cdEngineers, setCdEngineers] = useState([])
  const [fetchingEngineers, setFetchingEngineers] = useState(false)
  const [isCDMode, setIsCDMode] = useState(false)

  const fabricators = useSelector((state) => state.fabricatorInfo.fabricatorData)
  const staff = useSelector((state) => state.userInfo.staffData)
  const userDetail = useSelector((state) => state.userInfo.userDetail)

  const { register, setValue, handleSubmit, control, reset } = useForm()

  const fetchRfi = async () => {
    try {
      setLoading(true)
      const response = await Service.GetRFIbyId(id)
      const data = response.data
      setRfi(data)
      setDescription(data.description || '')
      
      // Initialize form values
      reset({
        subject: data.subject,
        multipleRecipients: data.multipleRecipients?.map(r => r.id) || []
      })

      // Determine if it was CD Mode based on recipients if possible, 
      // or just default to false. Usually, it depends on which list the recipients belong to.
      // For now, we'll try to fetch CD engineers if there's a connectionDesignerID
      if (data.project?.connectionDesignerID) {
        fetchCDEngineers(data.project.connectionDesignerID)
      }
    } catch (err) {
      setError('Failed to load RFI details')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const fetchCDEngineers = async (cdID) => {
    try {
      setFetchingEngineers(true)
      const res = await Service.FetchConnectionDesignerByID(cdID)
      setCdEngineers(res?.data?.CDEngineers || [])
    } catch (err) {
      console.error('Failed to fetch engineers', err)
    } finally {
      setFetchingEngineers(false)
    }
  }

  useEffect(() => {
    if (id) fetchRfi()
  }, [id])

  const selectedFabricator = fabricators?.find(
    (f) => String(f.id) === String(rfi?.fabricator_id || rfi?.fabricatorID)
  )

  const pocOptions =
    selectedFabricator?.pointOfContact?.map((p) => ({
      label: `${p.firstName} ${p.middleName ?? ''} ${p.lastName}`,
      value: p.id
    })) ?? []

  const cdEngineerOptions =
    cdEngineers?.map((e) => ({
      label: `${e.firstName} ${e.lastName} (CD Engineer)`,
      value: e.id
    })) ?? []

  const activeRecipientOptions = isCDMode ? cdEngineerOptions : pocOptions

  const onSubmit = async (data) => {
    try {
      setSubmitting(true)
      const payload = {
        ...data,
        description,
        project_id: rfi.project_id || rfi.project?.id,
        fabricator_id: rfi.fabricator_id || rfi.fabricator?.id,
        sender_id: userDetail?.id
      }

      const formData = new FormData()
      Object.entries(payload).forEach(([key, value]) => {
        if (key === 'multipleRecipients' && Array.isArray(value)) {
          value.forEach((v) => formData.append('multipleRecipients[]', v))
        } else if (Array.isArray(value)) {
          value.forEach((v) => formData.append(key, v))
        } else if (value !== null && value !== undefined) {
          formData.append(key, value)
        }
      })

      if (Array.isArray(files)) {
        files.forEach((f) => formData.append('files', f))
      }

      await Service.EditRFIByID(id, formData)
      toast.success('RFI Updated Successfully')
      onSuccess?.()
    } catch (err) {
      console.error(err)
      toast.error(err?.response?.data?.message || 'Failed to update RFI')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12 text-gray-700">
        <Loader2 className="w-6 h-6 animate-spin mr-2 text-[#6bbd45]" />
        Loading RFI details...
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-12 text-red-600 bg-red-50 rounded-xl border border-red-100">
        <AlertCircle className="w-6 h-6 mr-2" />
        {error}
      </div>
    )
  }

  return (
    <div className="w-full mx-auto bg-white p-4 rounded-xl shadow-sm border border-gray-100">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900">Edit RFI</h2>
        <p className="text-sm text-gray-500">Update Request for Information details and recipients.</p>
      </div>

      {/* Recipient Category Toggle */}
      <div className="flex bg-gray-100/80 p-1.5 rounded-xl gap-2 mb-6 border border-gray-200">
        <button
          type="button"
          onClick={() => {
            setIsCDMode(false)
            setValue('multipleRecipients', [])
          }}
          className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all duration-200 ${
            !isCDMode
              ? 'bg-white text-black shadow-md border border-gray-100'
              : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/50'
          }`}
        >
          CLIENT POCs
        </button>
        <button
          type="button"
          onClick={() => {
            setIsCDMode(true)
            setValue('multipleRecipients', [])
          }}
          className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all duration-200 ${
            isCDMode
              ? 'bg-white text-black shadow-md border border-gray-100'
              : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/50'
          }`}
        >
          CONNECTION DESIGNER
        </button>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Recipients */}
        <div className="space-y-2">
          <label className="text-sm font-bold text-gray-800 flex justify-between items-center">
            <span>Select {isCDMode ? 'CD Engineer' : 'Client'} Recipients *</span>
            <span className="text-[10px] font-normal text-gray-400 uppercase tracking-wider bg-gray-50 px-2 py-0.5 rounded border border-gray-100">Required</span>
          </label>
          <Controller
            name="multipleRecipients"
            control={control}
            rules={{ required: 'At least one recipient is required' }}
            render={({ field, fieldState }) => (
              <div className="space-y-1">
                <Select
                  isMulti
                  placeholder={
                    fetchingEngineers
                      ? 'Fetching engineers...'
                      : `Select ${isCDMode ? 'engineers' : 'Point of Contacts'}...`
                  }
                  options={activeRecipientOptions}
                  isLoading={fetchingEngineers}
                  value={activeRecipientOptions.filter((o) => (field.value || []).includes(o.value))}
                  onChange={(options) => {
                    field.onChange(options ? options.map((o) => o.value) : [])
                    if (options && options.length > 0) {
                      const names = options.map((o) => o.label.split(' (')[0]).join(', ')
                      setDescription(`<p>Dear ${names},</p><br/>`)
                    } else {
                      setDescription('')
                    }
                  }}
                  className="text-sm"
                  styles={{
                    control: (base) => ({
                      ...base,
                      borderRadius: '10px',
                      padding: '2px',
                      borderColor: fieldState.error ? '#ef4444' : '#e5e7eb',
                      '&:hover': {
                        borderColor: fieldState.error ? '#ef4444' : '#6bbd45'
                      }
                    }),
                    multiValue: (base) => ({
                      ...base,
                      backgroundColor: '#f0fdf4',
                      borderRadius: '6px',
                      border: '1px solid #dcfce7'
                    }),
                    multiValueLabel: (base) => ({
                      ...base,
                      color: '#166534',
                      fontSize: '12px',
                      fontWeight: '500'
                    }),
                    multiValueRemove: (base) => ({
                      ...base,
                      color: '#166534',
                      '&:hover': {
                        backgroundColor: '#dcfce7',
                        color: '#14532d'
                      }
                    })
                  }}
                />
                {fieldState.error && (
                  <p className="text-xs text-red-500 font-medium">{fieldState.error.message}</p>
                )}
              </div>
            )}
          />
        </div>

        {/* Subject */}
        <Input
          label="Subject"
          placeholder="Enter the subject of this RFI"
          {...register('subject', { required: 'Subject is required' })}
          className="rounded-xl border-gray-200 focus:border-[#6bbd45] focus:ring-[#6bbd45]/20"
        />

        {/* Description */}
        <div className="space-y-2">
          <label className="text-sm font-bold text-gray-800">
            Description
          </label>
          <div className="rounded-xl overflow-hidden border border-gray-200 focus-within:border-[#6bbd45] focus-within:ring-2 focus-within:ring-[#6bbd45]/10 transition-all duration-200">
            <RichTextEditor
              value={description}
              onChange={setDescription}
              placeholder="Provide detailed information about the RFI..."
            />
          </div>
        </div>

        {/* Files */}
        <div className="space-y-2">
          <label className="text-sm font-bold text-gray-800">
            Attachments
          </label>
          <MultipleFileUpload onFilesChange={setFiles} initialFiles={files} />
          <p className="text-[10px] text-gray-400">Supported formats: PDF, DWG, Images. Max size 20MB per file.</p>
        </div>

        {/* Submit Buttons */}
        <div className="flex gap-3 pt-4 border-t border-gray-50">
          <Button
            type="button"
            onClick={() => onSuccess?.()}
            className="flex-1 bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 font-semibold"
          >
            Close
          </Button>
          <Button 
            type="submit" 
            className="flex-[2] bg-[#6bbd45] text-white hover:bg-[#5aa83a] shadow-lg shadow-[#6bbd45]/20 font-bold" 
            disabled={submitting}
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2 inline" />
                Updating RFI...
              </>
            ) : (
              'Update RFI'
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}

export default EditRFI