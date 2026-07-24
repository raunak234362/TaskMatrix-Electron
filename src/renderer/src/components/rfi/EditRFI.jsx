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

  const canDelete = ['admin', 'operation_executive', 'deputy_manager'].includes(
    sessionStorage.getItem('userRole')?.toLowerCase() || ''
  )

  const handleDelete = () => {
    toast.info(
      ({ closeToast }) => (
        <div className="flex flex-col gap-3 p-1">
          <p className="font-bold text-gray-800 text-sm">Are you sure you want to delete?</p>
          <p className="text-xs text-gray-600 font-medium">This action cannot be undone.</p>
          <div className="flex gap-4 items-center mt-2">
            <button
              onClick={async () => {
                closeToast()
                try {
                  setSubmitting(true)
                  await Service.DeleteRFIById(id)
                  toast.success('RFI deleted successfully!', {
                    position: 'bottom-right'
                  })
                  if (onSuccess) await onSuccess(true)
                } catch (error) {
                  console.error(error)
                  toast.error('Failed to delete RFI')
                } finally {
                  setSubmitting(false)
                }
              }}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-1.5 rounded-none text-xs font-bold transition-all shadow-md active:scale-95 cursor-pointer"
            >
              Confirm Delete
            </button>
            <button
              onClick={closeToast}
              className="text-gray-500 hover:text-gray-800 text-xs font-bold transition-colors cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </div>
      ),
      {
        autoClose: false,
        closeOnClick: false,
        draggable: false,
        closeButton: false,
        position: 'top-center',
        className: 'shadow-2xl rounded-none border border-gray-100',
        style: { width: '320px' }
      }
    )
  }

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
        multipleRecipients: data.multipleRecipients?.map(r => r.id) || [],
        isAproovedByAdmin: data.isAproovedByAdmin || false
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

      const fabricatorName = selectedFabricator?.fabName || rfi?.fabricatorName || rfi?.fabricator?.fabName || "";
      const projectName = rfi?.project?.projectName || rfi?.project?.name || "";

      await Service.EditRFIByID(id, formData, fabricatorName, projectName)
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
    <div className="w-full h-full flex flex-col bg-white rounded-none overflow-hidden max-h-[90vh]">
      {/* Fixed Header */}
      <div className="p-6 border-b border-gray-200 flex justify-between items-center bg-white shrink-0">
        <div>
          <h2 className="text-lg font-semibold text-black uppercase tracking-normal">Edit RFI</h2>
        </div>
        <div className="w-36">
          <button
            type="button"
            onClick={() => onSuccess?.()}
            className="w-full py-2 bg-red-50 text-black border-2 border-red-700/80 rounded-none hover:bg-red-100 transition-all font-semibold text-sm uppercase tracking-normal cursor-pointer shadow-sm"
          >
            Close
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="flex-1 flex flex-col overflow-hidden">
        {/* Scrollable Form Body */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">
          {/* Recipient Category Toggle */}
          <div className="flex bg-gray-100/50 p-1 rounded-none gap-1 mb-4">
            <button
              type="button"
              onClick={() => {
                setIsCDMode(false)
                setValue('multipleRecipients', [])
              }}
              className={`flex-1 py-1.5 text-sm font-semibold rounded-none transition-all ${
                !isCDMode
                  ? 'bg-white text-black shadow-none border border-gray-200'
                  : 'text-gray-500 hover:text-gray-700'
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
              className={`flex-1 py-1.5 text-sm font-semibold rounded-none transition-all ${
                isCDMode
                  ? 'bg-white text-black shadow-none border border-gray-200'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              CONNECTION DESIGNER
            </button>
          </div>

          {/* Recipients */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-black uppercase tracking-normal flex justify-between items-center">
              <span>Select {isCDMode ? 'CD Engineer' : 'Client'} Recipients *</span>
              <span className="text-xs font-semibold text-red-700 uppercase tracking-normal bg-red-50 px-2 py-0.5 rounded-none border border-red-200">Required</span>
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
                        borderRadius: '0px',
                        padding: '2px',
                        borderColor: fieldState.error ? '#ef4444' : '#e5e7eb',
                        '&:hover': {
                          borderColor: fieldState.error ? '#ef4444' : '#6bbd45'
                        }
                      }),
                      multiValue: (base) => ({
                        ...base,
                        backgroundColor: '#f0fdf4',
                        borderRadius: '0px',
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
            className="rounded-none border-gray-200 focus:border-black focus:ring-0"
          />

          {/* Description */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-black uppercase tracking-normal">
              Description
            </label>
            <div className="rounded-none overflow-hidden border border-gray-200 focus-within:border-black transition-all duration-200">
              <RichTextEditor
                value={description}
                onChange={setDescription}
                placeholder="Provide detailed information about the RFI..."
              />
            </div>
          </div>

          {/* Approval Checkbox */}
          {['project_manager', 'operation_executive', 'dept_manager', 'deputy_manager', 'admin'].includes(sessionStorage.getItem('userRole')?.toLowerCase() || '') && (
            <div className="flex items-center gap-3 p-3 bg-gray-50 border border-gray-200">
              <input
                type="checkbox"
                id="isAproovedByAdmin"
                {...register('isAproovedByAdmin')}
                className="w-4 h-4 text-green-600 border-gray-300 rounded-none focus:ring-green-500 cursor-pointer"
              />
              <label htmlFor="isAproovedByAdmin" className="text-sm font-bold text-black uppercase tracking-normal cursor-pointer select-none">
                Approve RFI
              </label>
            </div>
          )}

          {/* Files */}
          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-800">
              Attachments
            </label>
            <MultipleFileUpload onFilesChange={setFiles} initialFiles={files} />
            <p className="text-[10px] text-gray-400">Supported formats: PDF, DWG, Images. Max size 20MB per file.</p>
          </div>
        </div>

        {/* Fixed Footer */}
        <div className="p-6 border-t border-gray-200 flex gap-3 bg-white shrink-0">
          {canDelete && (
            <button
              type="button"
              onClick={handleDelete}
              disabled={submitting}
              className="flex-1 py-2 bg-red-600 hover:bg-red-700 text-white border-2 border-red-800 hover:border-red-900 transition-all font-semibold text-sm uppercase tracking-normal cursor-pointer rounded-none shadow-sm"
            >
              Delete RFI
            </button>
          )}
          <button 
            type="submit" 
            className="flex-[2] py-2 bg-green-50 text-black border-2 border-green-700/80 hover:bg-green-100 transition-all font-semibold text-sm uppercase tracking-normal cursor-pointer rounded-none shadow-sm" 
            disabled={submitting}
          >
            {submitting ? 'Updating RFI...' : 'Update RFI'}
          </button>
        </div>
      </form>
    </div>
  )
}

export default EditRFI