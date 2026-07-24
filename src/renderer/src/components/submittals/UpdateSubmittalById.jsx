import { useEffect, useState } from 'react'
import { X, Check, Loader2, Upload, Trash2 } from 'lucide-react'
import Service from '../../api/Service'
import RichTextEditor from '../fields/RichTextEditor'
import Select from 'react-select'
import MultipleFileUpload from '../fields/MultipleFileUpload'
import { useSelector } from 'react-redux'
import { toast } from 'react-toastify'

const UpdateSubmittalById = ({ submittal, onClose, onSuccess }) => {
  const [subject, setSubject] = useState(submittal?.subject || '')
  const [description, setDescription] = useState(
    submittal?.description || submittal?.currentVersion?.description || ''
  )
  const [files, setFiles] = useState([])
  const [submitting, setSubmitting] = useState(false)
  const [savingMilestone, setSavingMilestone] = useState(false)
  const [error, setError] = useState(null)
  const [cdEngineers, setCdEngineers] = useState([])
  const [fetchingEngineers, setFetchingEngineers] = useState(false)
  const [isCDMode, setIsCDMode] = useState(false)
  const [approving, setApproving] = useState(false)

  const userRole = sessionStorage.getItem('userRole')?.toUpperCase()
  const canUpdateMilestone = ['ADMIN', 'OPERATION_EXECUTIVE', 'DEPUTY_MANAGER'].includes(userRole)
  const canApprove = ['PROJECT_MANAGER', 'OPERATION_EXECUTIVE', 'DEPT_MANAGER', 'DEPUTY_MANAGER', 'ADMIN'].includes((sessionStorage.getItem('userRole') || '').toUpperCase().trim())
  const canDelete = ['ADMIN', 'OPERATION_EXECUTIVE', 'DEPUTY_MANAGER'].includes(userRole)

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
                  await Service.DeleteSubmittalById(submittal.id)
                  toast.success('Submittal deleted successfully!', {
                    position: 'bottom-right'
                  })
                  if (onSuccess) await onSuccess(true)
                  onClose()
                } catch (error) {
                  console.error(error)
                  toast.error('Failed to delete submittal')
                } finally {
                  setSubmitting(false)
                }
              }}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-1.5 rounded-lg text-xs font-bold transition-all shadow-md active:scale-95"
            >
              Confirm Delete
            </button>
            <button
              onClick={closeToast}
              className="text-gray-500 hover:text-gray-800 text-xs font-bold transition-colors"
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
        className: 'shadow-2xl rounded-2xl border border-gray-100',
        style: { width: '320px' }
      }
    )
  }


  const [milestones, setMilestones] = useState([])
  const [fetchingMilestones, setFetchingMilestones] = useState(false)

  // Initialize selected milestone IDs:
  const initialMilestones = (() => {
    const ids = []
    if (submittal?.mileStones) {
      submittal.mileStones.forEach((m) => {
        if (m.id || m._id) ids.push(String(m.id || m._id))
      })
    }
    if (
      submittal?.mileStoneBelongsTo &&
      (submittal.mileStoneBelongsTo.id || submittal.mileStoneBelongsTo._id)
    ) {
      const id = String(submittal.mileStoneBelongsTo.id || submittal.mileStoneBelongsTo._id)
      if (!ids.includes(id)) {
        ids.push(id)
      }
    }
    return ids
  })()

  const [selectedMileStoneIds, setSelectedMileStoneIds] = useState(initialMilestones)

  const fabricators = useSelector((state) => state.fabricatorInfo.fabricatorData)
  const fabricatorID = submittal?.fabricator_id || submittal?.fabricator?.id
  const connectionDesignerID = submittal?.project?.connectionDesignerID

  useEffect(() => {
    const fetchEngineers = async () => {
      if (connectionDesignerID) {
        try {
          setFetchingEngineers(true)
          const res = await Service.FetchConnectionDesignerByID(connectionDesignerID)
          setCdEngineers(res?.data?.CDEngineers || [])
        } catch (err) {
          console.error('Failed to fetch engineers', err)
          setCdEngineers([])
        } finally {
          setFetchingEngineers(false)
        }
      } else {
        setCdEngineers([])
      }
    }
    fetchEngineers()
  }, [connectionDesignerID])

  useEffect(() => {
    const fetchMilestones = async () => {
      const projectId = submittal?.project_id || submittal?.project?.id
      if (projectId && canUpdateMilestone) {
        try {
          setFetchingMilestones(true)
          const response = await Service.GetPendingSubmittal()
          const allPending = Array.isArray(response) ? response : response?.data || []
          const projectMilestones = allPending.filter(
            (m) => String(m.projectId || m.project_id || m.project?.id) === String(projectId)
          )
          setMilestones(projectMilestones)
        } catch (error) {
          console.error('Failed to fetch milestones:', error)
        } finally {
          setFetchingMilestones(false)
        }
      }
    }
    fetchMilestones()
  }, [submittal?.project_id, submittal?.project?.id, canUpdateMilestone])

  const selectedFabricator = fabricators?.find((f) => String(f.id) === String(fabricatorID))
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

  const allMilestonesForSelect = [...milestones]
  if (submittal?.mileStones) {
    submittal.mileStones.forEach((m) => {
      if (!allMilestonesForSelect.some((el) => String(el.id || el._id) === String(m.id || m._id))) {
        allMilestonesForSelect.push(m)
      }
    })
  }
  if (submittal?.mileStoneBelongsTo) {
    const m = submittal.mileStoneBelongsTo
    if (!allMilestonesForSelect.some((el) => String(el.id || el._id) === String(m.id || m._id))) {
      allMilestonesForSelect.push(m)
    }
  }

  const filteredMilestones = allMilestonesForSelect.filter((m) => {
    if (isCDMode) {
      return !!m.isConnectionDesign
    } else {
      return !m.isConnectionDesign
    }
  })

  const mileStoneOptions = filteredMilestones.map((m) => {
    const labelParts = []
    if (m.subject) {
      labelParts.push(m.subject)
    } else if (m.description) {
      const plainDesc = m.description
        .replace(/<[^>]*>/g, ' ')
        .replace(/&nbsp;/g, ' ')
        .trim()
      const words = plainDesc.split(/\s+/)
      const truncated = words.length > 10 ? words.slice(0, 10).join(' ') + '...' : plainDesc
      labelParts.push(truncated)
    }
    if (m.subSubject) {
      labelParts.push(m.subSubject)
    }
    if (m.stage) {
      labelParts.push(m.stage)
    }
    return {
      label: labelParts.join(' - ') || 'Unnamed Milestone',
      value: m.id || m._id
    }
  })

  const [multipleRecipients, setMultipleRecipients] = useState(
    submittal?.multipleRecipients?.map((r) => r.id) || []
  )

  const handleSaveMilestoneOnly = async () => {
    if (!canUpdateMilestone) return
    if (selectedMileStoneIds.length === 0) {
      toast.error('Please select at least one milestone.')
      return
    }
    try {
      setSavingMilestone(true)
      setError(null)

      // Collect all previously linked milestone objects from the submittal
      const previouslyLinked = []
      if (submittal?.mileStones) {
        submittal.mileStones.forEach((m) => {
          const id = String(m.id || m._id)
          if (!previouslyLinked.find((x) => x.id === id)) {
            previouslyLinked.push({ id, status: m.status })
          }
        })
      }
      if (submittal?.mileStoneBelongsTo) {
        const m = submittal.mileStoneBelongsTo
        const id = String(m.id || m._id)
        if (!previouslyLinked.find((x) => x.id === id)) {
          previouslyLinked.push({ id, status: m.status })
        }
      }

      // Find milestones that were removed (not in the new selection) and were COMPLETE
      const removedCompletedMilestones = previouslyLinked.filter(
        (m) =>
          !selectedMileStoneIds.includes(m.id) &&
          m.status?.toUpperCase() === 'COMPLETE'
      )

      // Revert removed COMPLETE milestones back to ACTIVE
      if (removedCompletedMilestones.length > 0) {
        await Promise.all(
          removedCompletedMilestones.map((m) =>
            Service.EditExistingMilestoneByID(m.id, { status: 'ACTIVE' })
          )
        )
      }

      // Update the submittal with the new milestone IDs
      await Service.updateSubmittalById(submittal.id, { mileStoneIds: selectedMileStoneIds })

      toast.success('Milestone updated successfully!')
      onSuccess?.()
      onClose()
    } catch (err) {
      console.error('Save milestone failed:', err)
      setError(err?.response?.data?.message || 'Failed to update milestone. Please try again.')
    } finally {
      setSavingMilestone(false)
    }
  }

  const handleApprove = async () => {
    try {
      setApproving(true)
      setError(null)
      await Service.updateSubmittalById(submittal.id, { isAproovedByAdmin: true })
      toast.success('Submittal approved successfully!')
      onSuccess?.()
      onClose()
    } catch (err) {
      console.error('Approve submittal failed:', err)
      setError(err?.response?.data?.message || 'Failed to approve submittal. Please try again.')
    } finally {
      setApproving(false)
    }
  }

  const handleSubmit = async () => {
    if (!subject.trim()) {
      setError('Subject is required.')
      return
    }

    if (!files || files.length === 0) {
      toast.error('File is required')
      return
    }

    try {
      setSubmitting(true)
      setError(null)

      const formData = new FormData()
      formData.append('subject', subject)
      formData.append('description', description)
      formData.append('isConnectionDesign', String(isCDMode))

      const userRoleStr = sessionStorage.getItem('userRole')?.toLowerCase() || ''
      const autoApproveRoles = [
        'admin',
        'deputy_manager',
        'dept_manager',
        'operation_executive',
        'project_manager'
      ]
      if (autoApproveRoles.includes(userRoleStr)) {
        formData.append('isAproovedByAdmin', 'true')
      }
      if (files && files.length > 0) {
        files.forEach((f) => formData.append('files', f))
      }
      if (multipleRecipients.length > 0) {
        multipleRecipients.forEach((id) => formData.append('multipleRecipients[]', id))
      }
      if (canUpdateMilestone) {
        selectedMileStoneIds.forEach((id) => formData.append('mileStoneId[]', id))
        if (selectedMileStoneIds.length > 0) {
          formData.append('mileStoneId', selectedMileStoneIds[0])
        }
      }

      const fabricatorName = selectedFabricator?.fabName || submittal?.fabricatorName || ''
      const projectName = submittal?.project?.projectName || submittal?.project?.name || ''
      await Service.updateSubmittalVersionById(submittal.id, formData, fabricatorName, projectName)

      onSuccess?.()
      onClose()
    } catch (err) {
      console.error('Update submittal failed:', err)
      setError(err?.response?.data?.message || 'Failed to update submittal. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden animate-in fade-in zoom-in duration-200 w-full max-w-2xl flex flex-col max-h-[90vh]">
        {/* ── Header ── */}
        <header className="flex items-center justify-between p-6 border-b border-gray-200 bg-white shrink-0">
          <div>
            <h2 className="text-xl font-black text-black tracking-tight uppercase">
              Update Submittal
            </h2>
            <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-widest mt-0.5">
              A new version will be created
            </p>
          </div>
          <button
            onClick={onClose}
            className="px-6 py-1.5 bg-red-50 text-black border-2 border-red-700/80 rounded-lg hover:bg-red-100 transition-all font-bold text-sm uppercase tracking-tight shadow-sm"
          >
            Close
          </button>
        </header>

        {/* ── Body ── */}
        <div className="p-6 overflow-y-auto custom-scrollbar flex-1 space-y-6">
          {/* Error */}
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 text-red-600 rounded-xl text-xs font-bold flex items-center gap-3">
              <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse shrink-0" />
              {error}
            </div>
          )}

          {/* Recipient Category Toggle */}
          <div className="flex bg-gray-100/50 p-1 rounded-lg gap-1">
            <button
              type="button"
              onClick={() => {
                setIsCDMode(false)
                setMultipleRecipients([]) // Clear selection when switching modes
                setSelectedMileStoneIds([]) // Clear milestone selection when switching modes
              }}
              className={`flex-1 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-md transition-all ${!isCDMode ? 'bg-white text-black shadow-sm' : 'text-gray-400 hover:text-gray-600'
                }`}
            >
              Client
            </button>
            <button
              type="button"
              onClick={() => {
                setIsCDMode(true)
                setMultipleRecipients([]) // Clear selection when switching modes
                setSelectedMileStoneIds([]) // Clear milestone selection when switching modes
              }}
              className={`flex-1 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-md transition-all ${isCDMode ? 'bg-white text-black shadow-sm' : 'text-gray-400 hover:text-gray-600'
                }`}
            >
              Connection Designer
            </button>
          </div>

          {/* Subject */}
          <div className="space-y-2">
            <label className="block text-[10px] font-black text-black uppercase tracking-[0.15em] ml-1">
              Subject *
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Enter subject"
              className="w-full px-4 py-2.5 text-sm font-medium text-black bg-gray-50 border border-gray-300 rounded-xl focus:outline-none focus:border-[#6bbd45] focus:ring-2 focus:ring-[#6bbd45]/20 hover:border-gray-400 transition-all placeholder:text-gray-400"
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <label className="block text-[10px] font-black text-black uppercase tracking-[0.15em] ml-1">
              Description
            </label>
            <div className="border border-gray-300 rounded-xl overflow-hidden bg-gray-50">
              <RichTextEditor
                value={description}
                onChange={setDescription}
                placeholder="Write the submittal description..."
              />
            </div>
          </div>

          {/* Recipients */}
          <div className="space-y-2">
            <label className="block text-[10px] font-black text-black uppercase tracking-[0.15em] ml-1">
              {isCDMode ? 'CD Engineer' : 'Client'} Recipients
            </label>
            <Select
              isMulti
              options={activeRecipientOptions}
              isLoading={fetchingEngineers}
              value={activeRecipientOptions.filter((opt) => multipleRecipients.includes(opt.value))}
              onChange={(options) => {
                const values = options ? options.map((o) => o.value) : []
                setMultipleRecipients(values)
                if (options && options.length > 0) {
                  const names = options.map((o) => o.label.split(' (')[0]).join(', ')
                  setDescription(`<p>Dear ${names},</p><br/>`)
                } else {
                  setDescription('')
                }
              }}
              placeholder={fetchingEngineers ? 'Fetching engineers...' : 'Assign recipients...'}
              styles={{
                control: (base) => ({
                  ...base,
                  borderRadius: '12px',
                  padding: '2px',
                  borderColor: '#d1d5db',
                  '&:hover': { borderColor: '#6bbd45' }
                })
              }}
            />
          </div>

          {/* Milestones Select (for authorized roles only) */}
          {canUpdateMilestone && (
            <div className="space-y-2">
              <label className="block text-[10px] font-black text-black uppercase tracking-[0.15em] ml-1">
                Milestones
              </label>
              <Select
                isMulti
                options={mileStoneOptions}
                isLoading={fetchingMilestones}
                value={mileStoneOptions.filter((opt) => selectedMileStoneIds.includes(opt.value))}
                onChange={(options) => {
                  const values = options ? options.map((o) => o.value) : []
                  setSelectedMileStoneIds(values)
                }}
                placeholder={fetchingMilestones ? 'Fetching milestones...' : 'Assign milestones...'}
                styles={{
                  control: (base) => ({
                    ...base,
                    borderRadius: '12px',
                    padding: '2px',
                    borderColor: '#d1d5db',
                    '&:hover': { borderColor: '#6bbd45' }
                  })
                }}
              />
            </div>
          )}

          {/* File Upload (new version) */}
          <div className="space-y-2">
            <label className="block text-[10px] font-black text-black uppercase tracking-[0.15em] ml-1">
              New Version File <span className="text-red-500">*</span>
            </label>
            <MultipleFileUpload onFilesChange={setFiles} initialFiles={files} />
          </div>
        </div>

        {/* ── Footer ── */}
        <footer className="p-6 border-t border-gray-200 bg-white flex justify-between items-center gap-3 shrink-0">
          <div>
            {canDelete && (
              <button
                type="button"
                onClick={handleDelete}
                className="px-8 py-3 bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 hover:text-red-700 text-[10px] font-black uppercase tracking-[0.2em] rounded-lg transition-all active:scale-95 flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </button>
            )}
          </div>
          <div className="flex gap-3">
           
          {canUpdateMilestone && (
            <button
              type="button"
              onClick={handleSaveMilestoneOnly}
              disabled={savingMilestone || submitting || approving}
              className={`px-8 py-3 rounded-lg font-black text-[10px] uppercase tracking-[0.2em] transition-all shadow-sm flex items-center gap-2 ${savingMilestone || submitting || approving
                  ? 'bg-gray-100 text-black/20 cursor-not-allowed'
                  : 'bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-400 active:scale-95'
                }`}
            >
              {savingMilestone ? (
                <>
                  <Loader2 className="w-3 h-3 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  Save Milestone
                </>
              )}
            </button>
          )}
          {canApprove && !submittal?.isAproovedByAdmin && (
            <button
              type="button"
              onClick={handleApprove}
              disabled={approving || submitting || savingMilestone}
              className={`px-8 py-3 rounded-lg font-black text-[10px] uppercase tracking-[0.2em] transition-all shadow-sm flex items-center gap-2 ${approving || submitting || savingMilestone
                  ? 'bg-gray-100 text-black/20 cursor-not-allowed'
                  : 'bg-green-50 hover:bg-green-100 text-green-800 border border-green-400 active:scale-95'
                }`}
            >
              {approving ? (
                <>
                  <Loader2 className="w-3 h-3 animate-spin" />
                  Approving...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  Approve
                </>
              )}
            </button>
          )}
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting || savingMilestone || approving}
            className={`px-8 py-3 rounded-lg font-black text-[10px] uppercase tracking-[0.2em] transition-all shadow-sm flex items-center gap-2 ${submitting || savingMilestone
                ? 'bg-gray-100 text-black/20 cursor-not-allowed'
                : 'bg-[#6bbd45]/15 hover:bg-[#6bbd45]/30 text-black border border-black active:scale-95'
              }`}
          >
            {submitting ? (
              <>
                <Loader2 className="w-3 h-3 animate-spin" />
                Updating...
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                Save Update
              </>
            )}
          </button>
          </div>
        </footer>
      </div>
    </div>
  )
}

export default UpdateSubmittalById
