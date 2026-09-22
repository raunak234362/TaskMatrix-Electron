import { useEffect, useState } from 'react'
import { Check, Loader2, Trash2 } from 'lucide-react'
import Service from '../../api/Service'
import RichTextEditor from '../fields/RichTextEditor'
import Select from 'react-select'
import MultipleFileUpload from '../fields/MultipleFileUpload'
import { useSelector } from 'react-redux'
import { toast } from 'react-toastify'

const UpdateSubmittalById = ({ submittal, onClose, onSuccess }) => {
  const subject = submittal?.subject || ''
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
  const [isAproovedByAdmin, setIsAproovedByAdmin] = useState(
    submittal?.isAproovedByAdmin ?? false
  )

  const userRole = sessionStorage.getItem('userRole')?.toUpperCase()
  const canUpdateMilestone = ['ADMIN', 'OPERATION_EXECUTIVE', 'DEPUTY_MANAGER'].includes(userRole)
  const canApprove = [
    'PROJECT_MANAGER',
    'OPERATION_EXECUTIVE',
    'DEPT_MANAGER',
    'DEPUTY_MANAGER',
    'ADMIN'
  ].includes((sessionStorage.getItem('userRole') || '').toUpperCase().trim())
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
                  await Service.DeleteSubmittalById(submittalId)
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

  const fabricators = useSelector(
    (state) => state.fabricatorInfo?.fabricatorData || state.fabricatorData?.fabricatorData || []
  )
  const fabricatorId =
    submittal?.fabricator_id ||
    submittal?.fabricator?.id ||
    submittal?.fabricator?._id ||
    submittal?.fabricatorId ||
    submittal?.project?.fabricatorID ||
    submittal?.project?.fabricator_id ||
    submittal?.project?.fabricator?.id ||
    submittal?.project?.fabricator?._id

  const targetFabricatorID = fabricatorId

  const projectId =
    submittal?.project_id ||
    submittal?.projectId ||
    submittal?.project?.id ||
    submittal?.project?._id

  const [fabricatorDetails, setFabricatorDetails] = useState(
    typeof submittal?.fabricator === 'object' ? submittal?.fabricator : null
  )

  useEffect(() => {
    const loadFabricator = async () => {
      if (fabricatorId && (!fabricatorDetails || !fabricatorDetails.fabName)) {
        try {
          const res = await Service.GetFabricatorByID(fabricatorId)
          const fab = res?.data || res
          if (fab) setFabricatorDetails(fab)
        } catch (e) {
          console.error('Error fetching fabricator details:', e)
        }
      }
    }
    loadFabricator()
  }, [fabricatorId])

  const selectedFabricator =
    fabricatorDetails ||
    fabricators?.find(
      (f) => String(f.id || f._id) === String(targetFabricatorID)
    ) ||
    (typeof submittal?.fabricator === 'object' ? submittal?.fabricator : null) ||
    (typeof submittal?.project?.fabricator === 'object' ? submittal?.project?.fabricator : null)

  const submittalId = submittal?.id || submittal?._id
  const connectionDesignerID = submittal?.project?.connectionDesignerID

  const [pocs, setPocs] = useState([])
  const [fetchingPocs, setFetchingPocs] = useState(false)

  // Fetch Fabricator POCs via API if targetFabricatorID exists
  useEffect(() => {
    const fetchPocs = async () => {
      if (targetFabricatorID) {
        try {
          setFetchingPocs(true)
          const res = await Service.GetFabricatorPOC(targetFabricatorID)
          let list = []
          if (Array.isArray(res)) {
            list = res
          } else if (res?.data?.pointOfContact && Array.isArray(res.data.pointOfContact)) {
            list = res.data.pointOfContact
          } else if (res?.pointOfContact && Array.isArray(res.pointOfContact)) {
            list = res.pointOfContact
          } else if (res?.data && Array.isArray(res.data)) {
            list = res.data
          } else if (res?.pocs && Array.isArray(res.pocs)) {
            list = res.pocs
          }
          setPocs(list)
        } catch (err) {
          console.error('Failed to fetch fabricator POCs', err)
          setPocs([])
        } finally {
          setFetchingPocs(false)
        }
      } else {
        setPocs([])
      }
    }
    fetchPocs()
  }, [targetFabricatorID])

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

  const projectClientPMs =
    submittal?.project?.clientProjectManagers ||
    submittal?.project?.data?.clientProjectManagers

  const clientPMOptions =
    Array.isArray(projectClientPMs) && projectClientPMs.length > 0
      ? projectClientPMs.map((m) => {
          if (typeof m === 'object' && m !== null) {
            const name = `${m.firstName || ''} ${m.middleName ? m.middleName + ' ' : ''}${m.lastName || ''}`.trim()
            return {
              label: name || m.username || m.email || 'Unnamed Client PM',
              value: m.id || m._id
            }
          }
          return { label: String(m), value: String(m) }
        })
      : []

  const fetchedPocOptions = pocs.map((p) => ({
    label:
      `${p.firstName || ''} ${p.middleName ? p.middleName + ' ' : ''}${p.lastName || ''}`.trim() ||
      p.email ||
      p.name ||
      'Unnamed POC',
    value: p.id || p._id
  }))

  const pocOptions =
    clientPMOptions.length > 0
      ? clientPMOptions
      : fetchedPocOptions.length > 0
      ? fetchedPocOptions
      : (selectedFabricator?.pointOfContact?.map((p) => ({
          label: `${p.firstName} ${p.middleName ?? ''} ${p.lastName}`.trim(),
          value: p.id
        })) ?? [])

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
    submittal?.multipleRecipients?.map((r) =>
      typeof r === 'object' && r !== null ? r.id || r._id : r
    ) || []
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
        (m) => !selectedMileStoneIds.includes(m.id) && m.status?.toUpperCase() === 'COMPLETE'
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
      await Service.updateSubmittalById(submittalId, { mileStoneIds: selectedMileStoneIds })

      toast.success('Milestone updated successfully!')
      onSuccess?.()
      onClose()
    } catch (err) {
      console.error('Save milestone failed:', err)
      setError(err?.response?.data?.message || err?.message || 'Failed to update milestone. Please try again.')
    } finally {
      setSavingMilestone(false)
    }
  }

  const handleApprove = async (targetState = true) => {
    try {
      setApproving(true)
      setError(null)
      setIsAproovedByAdmin(targetState)
      await Service.updateSubmittalById(submittalId, { isAproovedByAdmin: targetState })
      toast.success(
        targetState ? 'Submittal approved successfully!' : 'Submittal approval updated!'
      )
      onSuccess?.()
    } catch (err) {
      console.error('Approve submittal failed:', err)
      setIsAproovedByAdmin(!targetState)
      setError(err?.response?.data?.message || err?.message || 'Failed to approve submittal. Please try again.')
    } finally {
      setApproving(false)
    }
  }

  const handleSubmit = async () => {
    if (!files || files.length === 0) {
      toast.error('File is required')
      return
    }

    if (!submittalId) {
      setError('Submittal ID is missing.')
      return
    }

    try {
      setSubmitting(true)
      setError(null)

      const formData = new FormData()
      formData.append('subject', subject)
      formData.append('description', description)
      formData.append('isConnectionDesign', String(isCDMode))

      if (canApprove) {
        formData.append('isAproovedByAdmin', String(isAproovedByAdmin))
      }
      if (files && files.length > 0) {
        files.forEach((f) => formData.append('files', f))
      }
      if (multipleRecipients.length > 0) {
        multipleRecipients.forEach((id) => formData.append('multipleRecipients[]', id))
      }
      if (canUpdateMilestone) {
        selectedMileStoneIds.forEach((id) => {
          formData.append('mileStoneId[]', id)
          formData.append('mileStoneIds[]', id)
        })
        if (selectedMileStoneIds.length > 0) {
          formData.append('mileStoneId', selectedMileStoneIds[0])
        }
      }

      if (fabricatorId) {
        formData.append('fabricator_id', fabricatorId)
        formData.append('fabricatorId', fabricatorId)
      }
      if (projectId) {
        formData.append('project_id', projectId)
        formData.append('projectId', projectId)
      }

      let fabricatorName =
        selectedFabricator?.fabName ||
        selectedFabricator?.fabricatorName ||
        selectedFabricator?.name ||
        selectedFabricator?.companyName ||
        selectedFabricator?.fab_name ||
        fabricatorDetails?.fabName ||
        fabricatorDetails?.fabricatorName ||
        fabricatorDetails?.name ||
        submittal?.fabricator?.fabName ||
        submittal?.fabricator?.fabricatorName ||
        submittal?.fabricator?.name ||
        submittal?.fabricatorName ||
        submittal?.project?.fabricatorName ||
        submittal?.project?.fabricator?.fabName ||
        submittal?.project?.fabricator?.name ||
        submittal?.project?.fabricator?.companyName ||
        (typeof submittal?.fabricator === 'string' ? submittal.fabricator : '') ||
        ''

      if (!fabricatorName && fabricatorId) {
        try {
          const res = await Service.GetFabricatorByID(fabricatorId)
          const fab = res?.data || res
          fabricatorName = fab?.fabName || fab?.fabricatorName || fab?.name || fab?.companyName || ''
        } catch (e) {
          console.error('Error fetching fabricator name:', e)
        }
      }

      let projectName =
        submittal?.project?.projectName ||
        submittal?.project?.name ||
        submittal?.projectName ||
        (typeof submittal?.project === 'string' ? submittal.project : '') ||
        ''

      if (!projectName && projectId) {
        try {
          const pRes = await Service.GetProjectById(projectId)
          const p = pRes?.data?.data || pRes?.data || pRes
          projectName = p?.projectName || p?.name || ''
        } catch (e) {
          console.error('Error fetching project name:', e)
        }
      }

      formData.append('fabricatorName', fabricatorName)
      formData.append('projectName', projectName)

      await Service.updateSubmittalVersionById(submittalId, formData, fabricatorName, projectName)

      toast.success('Submittal updated successfully!')
      onSuccess?.()
      onClose()
    } catch (err) {
      console.error('Update submittal failed:', err)
      setError(err?.response?.data?.message || err?.message || 'Failed to update submittal. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden animate-in fade-in zoom-in duration-200 w-11/12 max-w-7xl flex flex-col max-h-[90vh]">
        {/* ── Header ── */}
        <header className="flex items-center justify-between p-6 border-b border-gray-200 bg-white shrink-0">
          <div>
            <h2 className="text-xl font-semibold text-black tracking-tight uppercase">
              Update Submittal
            </h2>
         
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
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => {
                setIsCDMode(false)
                setMultipleRecipients([]) // Clear selection when switching modes
                setSelectedMileStoneIds([]) // Clear milestone selection when switching modes
              }}
              className={`flex-1 px-6 py-1.5 font-bold text-sm uppercase tracking-tight shadow-sm rounded-lg transition-all border-2 ${
                !isCDMode ? 'bg-green-50 text-black border-green-700/80 hover:bg-green-100' : 'bg-gray-50 text-gray-500 border-gray-300 hover:bg-gray-100'
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
              className={`flex-1 px-6 py-1.5 font-bold text-sm uppercase tracking-tight shadow-sm rounded-lg transition-all border-2 ${
                isCDMode ? 'bg-green-50 text-black border-green-700/80 hover:bg-green-100' : 'bg-gray-50 text-gray-500 border-gray-300 hover:bg-gray-100'
              }`}
            >
              Connection Designer
            </button>
          </div>


          {/* Description */}
          <div className="space-y-2">
            <label className="block text-md font-black text-black uppercase ml-1">
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
            <label className="block text-md font-black text-black uppercase ml-1">
              {isCDMode ? 'CD Engineer' : 'Client'} Recipients
            </label>
            <Select
              isMulti
              options={activeRecipientOptions}
              isLoading={isCDMode ? fetchingEngineers : fetchingPocs}
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
              placeholder={
                isCDMode
                  ? fetchingEngineers
                    ? 'Fetching engineers...'
                    : 'Assign recipients...'
                  : fetchingPocs
                    ? 'Fetching POCs...'
                    : 'Assign recipients...'
              }
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
              <label className="block text-md font-black text-black uppercase ml-1">
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
              <div className="flex justify-end pt-1">
                <button
                  type="button"
                  onClick={handleSaveMilestoneOnly}
                  disabled={savingMilestone || submitting || approving}
                  className={`px-6 py-1.5 font-bold text-sm uppercase tracking-tight shadow-sm rounded-lg transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50 ${
                    savingMilestone || submitting || approving
                      ? 'bg-gray-100 text-black/20 cursor-not-allowed border-2 border-gray-200'
                      : 'bg-green-50 text-black border-2 border-green-700/80 hover:bg-green-100 active:scale-95'
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
              </div>
            </div>
          )}

          {/* Approval Field */}
          {canApprove && (
            <div className="flex items-center justify-between p-3.5 bg-gray-50 border border-gray-300 rounded-xl hover:border-gray-400 transition-all">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="isAproovedByAdmin"
                  checked={isAproovedByAdmin}
                  disabled={approving || submitting}
                  onChange={(e) => handleApprove(e.target.checked)}
                  className="w-4 h-4 text-[#6bbd45] border-gray-300 rounded focus:ring-[#6bbd45]/20 cursor-pointer accent-[#6bbd45] disabled:opacity-50"
                />
                <label
                  htmlFor="isAproovedByAdmin"
                  className="text-sm font-black text-black uppercase cursor-pointer select-none"
                >
                  Approve Submittal
                </label>
              </div>
              {approving && <Loader2 className="w-4 h-4 animate-spin text-[#6bbd45]" />}
            </div>
          )}

          {/* File Upload (new version) */}
          <div className="space-y-2">
            <label className="block text-md font-black text-black uppercase ml-1">
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
                className="px-6 py-1.5 bg-red-50 text-black border-2 border-red-700/80 rounded-lg hover:bg-red-100 transition-all font-bold text-sm uppercase tracking-tight shadow-sm flex items-center gap-2 active:scale-95 cursor-pointer"
              >
                
                Delete
              </button>
            )}
          </div>
          <div className="flex gap-3">

            {canApprove && !submittal?.isAproovedByAdmin && (
              <button
                type="button"
                onClick={handleApprove}
                disabled={approving || submitting || savingMilestone}
                className={`px-6 py-1.5 font-bold text-sm uppercase tracking-tight shadow-sm rounded-lg transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50 ${
                  approving || submitting || savingMilestone
                    ? 'bg-gray-100 text-black/20 cursor-not-allowed border-2 border-gray-200'
                    : 'bg-green-50 text-black border-2 border-green-700/80 hover:bg-green-100 active:scale-95'
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
              className={`px-6 py-1.5 font-bold text-sm uppercase tracking-tight shadow-sm rounded-lg transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50 ${
                submitting || savingMilestone || approving
                  ? 'bg-gray-100 text-black/20 cursor-not-allowed border-2 border-gray-200'
                  : 'bg-green-50 text-black border-2 border-green-700/80 hover:bg-green-100 active:scale-95'
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
