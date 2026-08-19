import { useState, useEffect } from 'react'
import {
  UploadCloud,
  Loader2,
  X,
  Paperclip,
  CheckCircle2,
  AlertCircle,
  ShieldAlert
} from 'lucide-react'

import Service from '../../../api/Service'
import { toast } from 'react-toastify'

const UploadFabricatorStandard = ({
  fabricatorId: initialFabricatorId = '',
  fabricatorName = '',
  projectId = '',
  initialSourceType = 'FABRICATOR',
  initialDocumentFamilyId = 'ACI-318',
  onClose,
  onSuccess
}) => {
  const [uploadFile, setUploadFile] = useState(null)
  const [sourceType, setSourceType] = useState(initialSourceType)
  const [documentFamilyId, setDocumentFamilyId] = useState(initialDocumentFamilyId)
  const [familyCode, setFamilyCode] = useState('')
  const [edition, setEdition] = useState('')
  const [isDefault, setIsDefault] = useState(false)
  const [selectedFabricatorId, setSelectedFabricatorId] = useState(initialFabricatorId)
  const [fabricators, setFabricators] = useState([])
  const [loadingFabricators, setLoadingFabricators] = useState(false)
  const [existingFamilies, setExistingFamilies] = useState([])

  useEffect(() => {
    const fetchExistingFamilies = async () => {
      try {
        let res = null
        if (sourceType === 'FABRICATOR' && (selectedFabricatorId || initialFabricatorId)) {
          res = await Service.GetFabricatorStandardFamilies(selectedFabricatorId || initialFabricatorId).catch(() => null)
        } else {
          res = await Service.GetAvailableStandardFamilies(sourceType, sourceType === 'PROJECT' ? projectId : undefined).catch(() => null)
        }
        const raw = res?.families || res?.data?.families || res?.standardFamilies || res?.data?.standardFamilies || res?.data || (Array.isArray(res) ? res : [])
        if (Array.isArray(raw)) {
          const list = raw.map((f) => {
            const id = typeof f === 'string' ? f : f.id || f.familyCode || f.name
            const familyCode = typeof f === 'object' ? f.familyCode || f.id || id : id
            const edition = typeof f === 'object' ? f.edition || '' : ''
            const isDefault = typeof f === 'object' ? !!f.isDefault : false
            return { id, familyCode, edition, isDefault, rawObj: f }
          })
          setExistingFamilies(list)
        }
      } catch (err) {
        console.warn('Error fetching existing families in uploader:', err)
      }
    }

    fetchExistingFamilies()
  }, [sourceType, selectedFabricatorId, initialFabricatorId, projectId])

  // Ingestion progress state
  const [isProcessing, setIsProcessing] = useState(false)
  const [progressData, setProgressData] = useState({
    percent: 0,
    status: '',
    processingStage: '',
    pagesProcessed: 0,
    totalPages: 0,
    failureReason: ''
  })

  // Fetch fabricators list if initialFabricatorId not provided
  useEffect(() => {
    if (initialFabricatorId) {
      setSelectedFabricatorId(initialFabricatorId)
      return
    }

    const fetchFabricators = async () => {
      try {
        setLoadingFabricators(true)
        const res = await Service.GetAllFabricators(1, 100)
        let list = []
        if (Array.isArray(res)) {
          list = res
        } else if (res?.data?.data && Array.isArray(res.data.data)) {
          list = res.data.data
        } else if (res?.data && Array.isArray(res.data)) {
          list = res.data
        } else if (res?.fabricators && Array.isArray(res.fabricators)) {
          list = res.fabricators
        }
        setFabricators(list)
      } catch (err) {
        console.error('Failed to fetch fabricators in Uploader:', err)
      } finally {
        setLoadingFabricators(false)
      }
    }

    fetchFabricators()
  }, [initialFabricatorId])

  // Prevent browser window/tab from closing or navigating away while ingestion is in progress (< 100%)
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (isProcessing && progressData.percent < 100 && !progressData.failureReason) {
        e.preventDefault()
        e.returnValue = 'Standard document upload and ingestion is currently processing. Do not close or refresh this tab.'
        return e.returnValue
      }
    }

    if (isProcessing && progressData.percent < 100 && !progressData.failureReason) {
      window.addEventListener('beforeunload', handleBeforeUnload)
    }

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [isProcessing, progressData.percent, progressData.failureReason])

  const handleUploadSubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault()
    if (e && e.stopPropagation) e.stopPropagation()

    const targetFabId = selectedFabricatorId || initialFabricatorId
    console.log('handleUploadSubmit triggered with:', {
      targetFabId,
      uploadFile,
      sourceType,
      documentFamilyId,
      familyCode,
      edition,
      isDefault,
      projectId
    })

    if (!targetFabId && sourceType === 'FABRICATOR') {
      toast.error('Please select or specify a Fabricator')
      return
    }
    if (!uploadFile) {
      toast.error('Please select a PDF standard file')
      return
    }

    try {
      setIsProcessing(true)
      setProgressData({
        percent: 5,
        status: 'UPLOADING',
        processingStage: 'Uploading file to server...',
        pagesProcessed: 0,
        totalPages: 0,
        failureReason: ''
      })

      const formData = new FormData()
      formData.append('file', uploadFile)
      formData.append('sourceType', sourceType || 'FABRICATOR')
      if (projectId) {
        formData.append('projectId', projectId)
      }
      if (targetFabId) {
        formData.append('fabricatorId', targetFabId)
        formData.append('fabricatorID', targetFabId)
      }
      if (documentFamilyId) {
        formData.append('documentFamilyId', documentFamilyId)
      }
      if (familyCode) {
        formData.append('familyCode', familyCode)
      }
      if (edition) {
        formData.append('edition', edition)
      }
      formData.append('isDefault', isDefault)

      // 1. Upload standard document (POST /standards/upload)
      const res = await Service.UploadStandard(formData)
      console.log('UploadStandard response:', res)

      // 2. Also hit Edit Fabricator route if uploading for a fabricator
      if (targetFabId) {
        try {
          const fabFormData = new FormData()
          fabFormData.append('files', uploadFile)
          await Service.EditFabricatorByID(targetFabId, fabFormData)
          console.log('Hit edit fabricator route for fabricator:', targetFabId)
        } catch (editErr) {
          console.warn('EditFabricatorByID call warning:', editErr)
        }
      }



      const docId = res?.documentId || res?.data?.documentId || res?.id || res?.data?.id
      toast.info('File uploaded! Ingestion in progress...')

      if (docId) {
        pollProgress(docId)
      } else {
        // Fallback if no documentId returned
        setProgressData({
          percent: 100,
          status: 'COMPLETED',
          processingStage: 'Ingestion Completed',
          pagesProcessed: 1,
          totalPages: 1,
          failureReason: ''
        })
        toast.success('Fabricator standard uploaded successfully!')
        onSuccess?.()
      }
    } catch (err) {
      console.error('Error uploading fabricator standard:', err)
      const errorMsg = err?.response?.data?.message || 'Failed to upload fabricator standard'
      toast.error(errorMsg)
      setProgressData((prev) => ({
        ...prev,
        status: 'FAILED',
        failureReason: errorMsg
      }))
    }
  }

  const pollProgress = (docId) => {
    const interval = setInterval(async () => {
      try {
        const progRes = await Service.GetDocumentProgress(docId)
        console.log('Document progress poll:', progRes)

        const rawStatus = progRes?.status || progRes?.data?.status || 'PROCESSING'
        const stage = progRes?.processingStage || progRes?.data?.processingStage || 'Processing document...'
        const pagesProcessed = progRes?.pagesProcessed ?? progRes?.data?.pagesProcessed ?? 0
        const totalPages = progRes?.totalPages ?? progRes?.data?.totalPages ?? 0
        const failureReason = progRes?.failureReason || progRes?.data?.failureReason || ''

        // If totalPages is valid (> 0) and pagesProcessed has reached or exceeded totalPages, mark as COMPLETED
        const isPageComplete = totalPages > 0 && pagesProcessed >= totalPages
        const status =
          isPageComplete || rawStatus === 'COMPLETED' || rawStatus === 'SUCCESS'
            ? 'COMPLETED'
            : rawStatus

        let calcPercent = 10
        if (status === 'COMPLETED' || status === 'SUCCESS' || isPageComplete) {
          calcPercent = 100
        } else if (failureReason || status === 'FAILED') {
          calcPercent = progressData.percent || 0
        } else if (totalPages > 0) {
          calcPercent = Math.min(99, Math.max(15, Math.round((pagesProcessed / totalPages) * 100)))
        } else {
          calcPercent = Math.min(95, (progressData.percent || 10) + 10)
        }

        setProgressData({
          percent: calcPercent,
          status,
          processingStage: isPageComplete ? 'Ingestion Completed' : stage,
          pagesProcessed,
          totalPages,
          failureReason
        })

        if (status === 'COMPLETED' || status === 'SUCCESS' || calcPercent >= 100 || isPageComplete) {
          clearInterval(interval)
          toast.success('Fabricator standard ingested and indexed successfully!')
          setTimeout(() => {
            onSuccess?.()
          }, 800)
        } else if (failureReason || status === 'FAILED') {
          clearInterval(interval)
          toast.error(`Ingestion failed: ${failureReason || 'Unknown error'}`)
        }
      } catch (err) {
        console.error('Error fetching progress:', err)
      }
    }, 1500)
  }

  const isLocked = isProcessing && progressData.percent < 100 && !progressData.failureReason

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4"
      onClick={(e) => {
        if (isLocked) {
          e.stopPropagation()
          toast.warning('Upload in progress. You cannot close this tab/modal until ingestion is 100% complete.')
        } else {
          onClose?.()
        }
      }}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl border border-gray-200 max-w-lg w-full overflow-hidden animate-in fade-in zoom-in duration-200 relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 bg-gradient-to-r from-green-900 via-emerald-800 to-green-950 text-white">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/10 rounded-lg backdrop-blur-xs">
              <UploadCloud className="w-6 h-6 text-emerald-300" />
            </div>
            <div>
              <h3 className="font-bold text-lg leading-tight text-white">Upload Fabricator Standard</h3>
              <p className="text-xs text-emerald-200/80">
                {fabricatorName ? `Partner: ${fabricatorName}` : 'Upload PDF standard for vector indexing'}
              </p>
            </div>
          </div>
          <button
            type="button"
            disabled={isLocked}
            onClick={onClose}
            className={`p-1.5 rounded-lg transition-colors ${
              isLocked
                ? 'opacity-30 cursor-not-allowed text-gray-400'
                : 'text-emerald-200 hover:text-white hover:bg-white/10 cursor-pointer'
            }`}
            title={isLocked ? 'Cannot close while ingestion is in progress' : 'Close'}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Lock Banner when processing */}
        {isLocked && (
          <div className="bg-amber-50 border-b border-amber-200 px-6 py-2.5 flex items-center gap-2 text-xs font-semibold text-amber-800 animate-pulse">
            <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
            <span>Ingestion active ({progressData.percent}%). Do not close this modal or navigate away.</span>
          </div>
        )}

        {/* Main Content */}
        <div className="p-6 space-y-6">
          {!isProcessing ? (
            <div className="space-y-4">
              {/* Source Type */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Source Type
                </label>
                <select
                  value={sourceType}
                  onChange={(e) => setSourceType(e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm bg-white focus:ring-2 focus:ring-green-500 focus:outline-none font-medium text-gray-800 font-semibold"
                  required
                >
                  <option value="GENERAL">GENERAL</option>
                  <option value="PROJECT">PROJECT</option>
                </select>
              </div>

              {/* Fabricator Selection (if sourceType is FABRICATOR & not pre-locked) */}
              {sourceType === 'FABRICATOR' && !initialFabricatorId && (
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Select Fabricator *
                  </label>
                  <div className="relative">
                    <select
                      value={selectedFabricatorId}
                      onChange={(e) => setSelectedFabricatorId(e.target.value)}
                      disabled={loadingFabricators}
                      required
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm bg-white focus:ring-2 focus:ring-green-500 focus:outline-none font-medium text-gray-800"
                    >
                      <option value="">-- Select Fabricator --</option>
                      {fabricators.map((fab) => {
                        const id = String(fab.id || fab._id || fab.fabricatorID || '')
                        const name = fab.fabName || fab.name || fab.fabricatorName || 'Unnamed Fabricator'
                        return (
                          <option key={id} value={id}>
                            {name}
                          </option>
                        )
                      })}
                    </select>
                  </div>
                </div>
              )}

              {/* Document Family Metadata Fields */}
              {existingFamilies.length > 0 && (
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Select Existing Standard Family
                  </label>
                  <select
                    onChange={(e) => {
                      const selectedId = e.target.value
                      if (!selectedId) return
                      const fam = existingFamilies.find((f) => f.id === selectedId)
                      if (fam) {
                        setDocumentFamilyId(fam.id)
                        setFamilyCode(fam.familyCode || fam.id)
                        setEdition(fam.edition || '')
                        setIsDefault(fam.isDefault || false)
                      }
                    }}
                    defaultValue=""
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm bg-white focus:ring-2 focus:ring-green-500 focus:outline-none font-medium text-gray-800 mb-2 cursor-pointer"
                  >
                    <option value="">-- Choose Existing Family (Optional) --</option>
                    {existingFamilies.map((fam) => (
                      <option key={fam.id} value={fam.id}>
                        {fam.familyCode || fam.id} {fam.edition ? `(Ed. ${fam.edition})` : ''} {fam.isDefault ? '[Default]' : ''}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Doc Family ID
                  </label>
                  <input
                    type="text"
                    value={documentFamilyId}
                    onChange={(e) => setDocumentFamilyId(e.target.value)}
                    placeholder="e.g. AISC, ACI-318"
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm bg-white focus:ring-2 focus:ring-green-500 focus:outline-none font-medium text-gray-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Family Code
                  </label>
                  <input
                    type="text"
                    value={familyCode}
                    onChange={(e) => setFamilyCode(e.target.value)}
                    placeholder="e.g. AISC, 318"
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm bg-white focus:ring-2 focus:ring-green-500 focus:outline-none font-medium text-gray-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Edition
                  </label>
                  <input
                    type="text"
                    value={edition}
                    onChange={(e) => setEdition(e.target.value)}
                    placeholder="e.g. 14, 2024"
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm bg-white focus:ring-2 focus:ring-green-500 focus:outline-none font-medium text-gray-800"
                  />
                </div>
              </div>

              {/* Is Default Checkbox */}
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isDefaultCheckbox"
                  checked={isDefault}
                  onChange={(e) => setIsDefault(e.target.checked)}
                  className="w-4 h-4 text-green-600 rounded focus:ring-green-500 border-gray-300 cursor-pointer"
                />
                <label htmlFor="isDefaultCheckbox" className="text-xs font-semibold text-gray-700 cursor-pointer select-none">
                  Set as default standard family
                </label>
              </div>


              {/* PDF Standard File Dropzone */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Fabricator Standard PDF File *
                </label>
                <div className="border-2 border-dashed border-gray-300 hover:border-emerald-500 rounded-2xl p-6 text-center bg-slate-50/50 hover:bg-emerald-50/30 transition-all cursor-pointer relative">
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={(e) => setUploadFile(e.target.files[0] || null)}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    required
                  />
                  <Paperclip className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
                  {uploadFile ? (
                    <div>
                      <p className="text-xs font-bold text-emerald-800 truncate">{uploadFile.name}</p>
                      <p className="text-[10px] text-gray-500 mt-0.5">
                        {(uploadFile.size / (1024 * 1024)).toFixed(2)} MB
                      </p>
                    </div>
                  ) : (
                    <div>
                      <p className="text-xs font-semibold text-gray-700">Click or drop Fabricator Standard PDF</p>
                      <p className="text-[10px] text-gray-400 mt-1">Accepts PDF documents up to 50MB</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Form Action Buttons */}
              <div className="pt-4 flex justify-end gap-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2.5 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-xl transition-all uppercase tracking-wider cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleUploadSubmit}
                  disabled={!uploadFile || (sourceType === 'FABRICATOR' && !selectedFabricatorId && !initialFabricatorId)}
                  className="flex items-center gap-2 px-6 py-2.5 text-xs font-bold bg-green-700 hover:bg-green-800 text-white rounded-xl transition-all uppercase tracking-wider disabled:opacity-50 cursor-pointer shadow-md shadow-green-900/10"
                >
                  <UploadCloud className="w-4 h-4" />
                  Start Ingestion
                </button>
              </div>
            </div>

          ) : (
            /* Progress & Status Display */
            <div className="space-y-6 py-4">
              <div className="text-center space-y-2">
                {progressData.percent >= 100 ? (
                  <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
                    <CheckCircle2 className="w-10 h-10 animate-in zoom-in duration-300" />
                  </div>
                ) : progressData.failureReason ? (
                  <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
                    <AlertCircle className="w-10 h-10" />
                  </div>
                ) : (
                  <div className="w-16 h-16 bg-emerald-50 text-emerald-700 rounded-full flex items-center justify-center mx-auto relative shadow-inner">
                    <Loader2 className="w-10 h-10 animate-spin text-emerald-600" />
                    <span className="absolute text-xs font-black text-emerald-800">{progressData.percent}%</span>
                  </div>
                )}

                <h4 className="text-base font-bold text-gray-900">
                  {progressData.percent >= 100
                    ? 'Ingestion Completed Successfully!'
                    : progressData.failureReason
                    ? 'Ingestion Failed'
                    : 'Processing Fabricator Standard'}
                </h4>

                <p className="text-xs text-gray-600 font-medium">
                  {progressData.failureReason
                    ? progressData.failureReason
                    : progressData.processingStage || 'Analyzing and vector indexing PDF standard...'}
                </p>
              </div>

              {/* Progress Bar */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-xs font-bold">
                  <span className="text-gray-600">Progress</span>
                  <span className="text-emerald-700 font-black">{progressData.percent}%</span>
                </div>
                <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden p-0.5 border border-gray-200">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      progressData.failureReason
                        ? 'bg-rose-500'
                        : progressData.percent >= 100
                        ? 'bg-emerald-600'
                        : 'bg-gradient-to-r from-emerald-500 to-green-600 animate-pulse'
                    }`}
                    style={{ width: `${progressData.percent}%` }}
                  />
                </div>
              </div>

              {/* Page Count Information */}
              {progressData.totalPages > 0 && (
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs font-medium text-slate-700">
                  <span>Pages Processed:</span>
                  <span className="font-bold text-slate-900">
                    {progressData.pagesProcessed} / {progressData.totalPages} pages
                  </span>
                </div>
              )}

              {/* Completion Action */}
              {(progressData.percent >= 100 || progressData.failureReason) && (
                <div className="pt-4 flex justify-center">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-8 py-2.5 text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white rounded-xl transition-all uppercase tracking-wider cursor-pointer shadow-md"
                  >
                    {progressData.percent >= 100 ? 'Done' : 'Close'}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default UploadFabricatorStandard
