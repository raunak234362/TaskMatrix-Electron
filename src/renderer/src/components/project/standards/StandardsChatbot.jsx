import { useState, useEffect, useRef, useCallback, memo } from 'react'
import {
  Bot,
  Send,
  UploadCloud,
  FileText,
  RefreshCw,
  User,
  BookOpen,
  Loader2,
  X,
  Image as ImageIcon,
  ExternalLink,
  Maximize2,
  Check,
  ZoomIn,
  ZoomOut
} from 'lucide-react'
import Service from '../../../api/Service'
import { toast } from 'react-toastify'
import UploadFabricatorStandard from '../../fabricator/fabricator/UploadFabricatorStandard'

const ChatMessageItem = memo(({ item, onOpenReferenceImage }) => {
  const isTemp = String(item.id).startsWith('temp-')
  const rawAnswers = Array.isArray(item.answers) ? item.answers : []

  // Filter out answers stating "not covered" (case-insensitive)
  const filteredAnswers = rawAnswers.filter((answer) => {
    const hasCitations = Array.isArray(answer.citations) && answer.citations.length > 0
    let displayText = answer.answerText
    if (!displayText && hasCitations) {
      const foundTxt = answer.citations.find(
        (c) => c.answerText || c.text || c.content || c.snippet
      )
      if (foundTxt) {
        displayText =
          foundTxt.answerText || foundTxt.text || foundTxt.content || foundTxt.snippet
      }
    }
    if (!displayText) return true
    const txt = displayText.toLowerCase()
    return !txt.includes('not covered')
  })

  const hasFilteredAnswers = filteredAnswers.length > 0

  return (
    <div className="space-y-4 w-full">
      {/* User Question */}
      <div className="flex items-start justify-end gap-3 w-full">
        <div className="max-w-[85%] bg-green-600 text-white p-3 px-4 rounded-md shadow-sm">
          <p className="text-sm font-medium whitespace-pre-wrap">{item.queryText}</p>
          <span className="text-[10px] text-green-100 mt-1 block text-right">
            {item.createdAt
              ? new Date(item.createdAt).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit'
                })
              : ''}
          </span>
        </div>
        <div className="w-8 h-8 rounded-full bg-green-700 text-white flex items-center justify-center shrink-0 text-xs font-bold shadow-xs">
          <User className="w-4 h-4" />
        </div>
      </div>

      {/* Bot Answer(s) */}
      {isTemp ? (
        <div className="flex items-start gap-3 w-full">
          <div className="w-8 h-8 rounded-full bg-green-600 text-white flex items-center justify-center shrink-0 shadow-xs mt-1">
            <Bot className="w-4 h-4 text-green-100" />
          </div>
          <div className="flex-1 bg-white border border-black border-l-4 border-l-green-600 p-4 rounded-md shadow-sm flex items-center gap-2 text-xs text-black font-semibold font-sans">
            <Loader2 className="w-4 h-4 animate-spin text-green-600" />
            <span>Synthesizing answer from project standards vector DB...</span>
          </div>
        </div>
      ) : hasFilteredAnswers ? (
        <div className="flex flex-col gap-4 w-full">
          {filteredAnswers.map((answer, aIdx) => {
            const hasCitations =
              Array.isArray(answer.citations) && answer.citations.length > 0

            const citationsList = hasCitations
              ? answer.citations
              : answer.citationPdfName ||
                  (Array.isArray(answer.imagePaths) && answer.imagePaths.length > 0)
                ? [answer]
                : []

            const allImageItems = []
            if (Array.isArray(answer.imagePaths)) {
              answer.imagePaths.forEach((imgPath) => {
                if (imgPath && !allImageItems.some((item) => item.path === imgPath)) {
                  allImageItems.push({
                    path: imgPath,
                    citation: answer
                  })
                }
              })
            }
            if (hasCitations) {
              answer.citations.forEach((c) => {
                if (Array.isArray(c.imagePaths)) {
                  c.imagePaths.forEach((imgPath) => {
                    if (imgPath && !allImageItems.some((item) => item.path === imgPath)) {
                      allImageItems.push({
                        path: imgPath,
                        citation: c
                      })
                    }
                  })
                }
              })
            }

            let displayText = answer.answerText
            if (!displayText && hasCitations) {
              const foundTxt = answer.citations.find(
                (c) => c.answerText || c.text || c.content || c.snippet
              )
              if (foundTxt) {
                displayText =
                  foundTxt.answerText ||
                  foundTxt.text ||
                  foundTxt.content ||
                  foundTxt.snippet
              }
            }
            if (!displayText) {
              if (allImageItems.length > 0 || citationsList.length > 0) {
                displayText =
                  'Reference standard visual specification matched from uploaded document:'
              } else {
                displayText = 'No answer text provided.'
              }
            }

            const sourceType =
              answer.sourceType || citationsList.find((c) => c.sourceType)?.sourceType
            const chunkType =
              answer.chunkType || citationsList.find((c) => c.chunkType)?.chunkType

            return (
              <div key={answer.id || aIdx} className="flex items-start gap-3 w-full">
                <div className="w-8 h-8 rounded-full bg-green-600 text-white flex items-center justify-center shrink-0 shadow-xs mt-1">
                  <Bot className="w-4 h-4 text-green-100" />
                </div>
                <div className="flex-1 bg-white border border-black border-l-4 border-l-green-600 p-4 rounded-md shadow-sm flex flex-col justify-between space-y-3">
                  <div className="space-y-2">
                    <div className="text-sm text-black leading-relaxed whitespace-pre-wrap font-sans font-medium">
                      {displayText}
                    </div>
                  </div>

                  <div className="space-y-2 pt-1">
                    {(citationsList.length > 0 || sourceType || chunkType) && (
                      <div className="pt-2 border-t border-gray-100 flex flex-wrap items-center gap-1.5 text-[11px]">
                        {citationsList.map((cit, cIdx) => {
                          const pdfName = cit.citationPdfName
                          const pStart =
                            cit.citationPageStart !== undefined &&
                            cit.citationPageStart !== null
                              ? cit.citationPageStart
                              : cit.anchorPageStart
                          const pEnd =
                            cit.citationPageEnd !== undefined &&
                            cit.citationPageEnd !== null
                              ? cit.citationPageEnd
                              : cit.anchorPageEnd

                          if (!pdfName) return null
                          return (
                            <div
                              key={cit.id || cIdx}
                              className="flex items-center gap-1 bg-green-50/50 text-black px-2 py-0.5 rounded border border-green-100/60 font-semibold"
                            >
                              <FileText className="w-3 h-3 text-green-600" />
                              <span>
                                Citation:{' '}
                                <strong className="font-bold text-black">
                                  {pdfName}
                                </strong>
                              </span>
                              {pStart !== undefined && pStart !== null && (
                                <span className="ml-1 text-black bg-green-100/80 px-1 rounded text-[10px] font-bold">
                                  Pg {pStart}
                                  {pEnd && pEnd !== pStart ? `-${pEnd}` : ''}
                                </span>
                              )}
                            </div>
                          )
                        })}

                        {sourceType && (
                          <span className="bg-gray-100 text-black px-2 py-0.5 rounded text-[10px] font-bold uppercase">
                            Source: {sourceType}
                          </span>
                        )}

                        {chunkType && (
                          <span className="bg-gray-100 text-black px-2 py-0.5 rounded text-[10px] font-bold">
                            Chunk: {chunkType}
                          </span>
                        )}
                      </div>
                    )}

                    {allImageItems.length > 0 && (
                      <div className="pt-1.5 flex flex-wrap gap-1.5">
                        {allImageItems.map((item, imgIdx) => {
                          const pageNum =
                            item.citation?.citationPageStart ||
                            item.citation?.anchorPageStart ||
                            ''
                          return (
                            <button
                              key={imgIdx}
                              type="button"
                              onClick={() =>
                                onOpenReferenceImage(item.path, imgIdx, item.citation)
                              }
                              className="flex items-center gap-1 text-[11px] font-bold text-black bg-green-50/60 hover:bg-green-100/80 px-2.5 py-1 rounded-md border border-green-200 transition-all cursor-pointer shadow-3xs group animate-in fade-in duration-200"
                            >
                              <ImageIcon className="w-3.5 h-3.5 text-green-600 group-hover:scale-110 transition-transform" />
                              <span>
                                View Reference Image {imgIdx + 1}
                                {pageNum ? ` (Pg ${pageNum})` : ''}
                              </span>
                              <Maximize2 className="w-3 h-3 text-green-600 ml-0.5" />
                            </button>
                          )
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="flex items-start gap-3 w-full animate-in fade-in duration-200">
          <div className="w-8 h-8 rounded-full bg-green-600 text-white flex items-center justify-center shrink-0 shadow-xs mt-1">
            <Bot className="w-4 h-4 text-green-100" />
          </div>
          <div className="flex-1 bg-white border border-black border-l-4 border-l-green-600 p-4 rounded-md shadow-sm">
            <div className="text-sm text-black font-semibold leading-relaxed font-sans">
              Not covered by the current standards.
            </div>
          </div>
        </div>
      )}
    </div>
  )
})

const ChatMessageList = memo(
  ({ messages, loadingHistory, sending, onOpenReferenceImage, chatEndRef }) => {
    return (
      <div className="flex-1 p-6 overflow-y-auto bg-[#f0f4f2] space-y-6">
        {loadingHistory ? (
          <div className="flex flex-col items-center justify-center h-full text-black gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-green-600" />
            <p className="text-sm font-medium">Loading project standards chat history...</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center max-w-md mx-auto py-12">
            <div className="w-16 h-16 bg-green-100/80 text-green-700 rounded-2xl flex items-center justify-center mb-4 shadow-inner">
              <BookOpen className="w-8 h-8" />
            </div>
            <h4 className="text-lg font-bold text-black mb-1">No Standards Chat Yet</h4>
            <p className="text-xs text-black mb-2 leading-relaxed">
              Ask any question regarding structural steel standards, AISC specifications, welding
              codes, or uploaded project standards.
            </p>
          </div>
        ) : (
          messages.map((item, index) => (
            <ChatMessageItem
              key={item.id || index}
              item={item}
              onOpenReferenceImage={onOpenReferenceImage}
            />
          ))
        )}

        {sending && (
          <div className="flex items-start gap-3 w-full">
            <div className="w-8 h-8 rounded-full bg-green-600 text-white flex items-center justify-center shrink-0 shadow-xs mt-1">
              <Bot className="w-4 h-4 text-green-100" />
            </div>
            <div className="flex-1 bg-white border border-black border-l-4 border-l-green-600 p-4 rounded-md shadow-sm flex items-center gap-3">
              <Loader2 className="w-4 h-4 animate-spin text-green-600" />
              <span className="text-xs font-bold text-black">
                Searching project standards & generating response...
              </span>
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>
    )
  }
)

const StandardsChatbot = ({ projectId, project, defaultSourceType = '' }) => {
  const [messages, setMessages] = useState([])
  const [loadingHistory, setLoadingHistory] = useState(true)
  const [query, setQuery] = useState('')
  const [sending, setSending] = useState(false)

  // Upload modal state
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [documentFamilyId, setDocumentFamilyId] = useState('')
  const [selectedTier, setSelectedTier] = useState('')

  // Project standard preferences state (supports array of selected family IDs)
  const [standardPreferences, setStandardPreferences] = useState([])
  const [selectedFamilyIds, setSelectedFamilyIds] = useState([])

  // Fabricator selection state
  const [selectedFabricatorId, setSelectedFabricatorId] = useState('')

  // Zoom and pan states for reference image modal
  const [zoomScale, setZoomScale] = useState(1)
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })

  const targetProjectId = projectId || project?.id || project?._id || project?.projectId
  const targetFabricatorId =
    selectedFabricatorId ||
    project?.fabricatorID ||
    project?.fabricator?.id ||
    project?.fabricator_id ||
    project?.fabricatorId ||
    ''

  // Persist updated preferred family IDs via API POST /standards/projects/{projectId}/preferences
  const savePreferences = async (newFamilyIds) => {
    const projId = targetProjectId || 'general'
    try {
      console.log(
        '[StandardsChatbot] Hitting SetProjectStandardPreferences for project:',
        projId,
        'familyIds:',
        newFamilyIds,
        'tier:',
        selectedTier
      )
      const res = await Service.SetProjectStandardPreferences(
        projId,
        { standardFamilyIds: newFamilyIds },
        selectedTier
      )
      console.log('[StandardsChatbot] SetProjectStandardPreferences success:', res)
      toast.success('Updated standard family preferences')
    } catch (err) {
      console.error('[StandardsChatbot] Error hitting SetProjectStandardPreferences:', err)
      toast.error('Failed to update standard preferences')
    }
  }

  const toggleFamilySelection = (familyId) => {
    const updated = selectedFamilyIds.includes(familyId)
      ? selectedFamilyIds.filter((id) => id !== familyId)
      : [...selectedFamilyIds, familyId]
    setSelectedFamilyIds(updated)
    if (updated.length > 0) {
      setDocumentFamilyId(updated[0])
    }
    savePreferences(updated)
  }

  // Fetch available standard families and project standard preferences
  useEffect(() => {
    const fetchFamiliesAndPreferences = async () => {
      try {
        console.log(
          '[StandardsChatbot] Fetching families & preferences for tier:',
          selectedTier,
          'projectId:',
          targetProjectId
        )

        // GET /standards/families
        const famRes = await Service.GetAvailableStandardFamilies(
          selectedTier,
          selectedTier === 'PROJECT' ? targetProjectId : undefined
        ).catch((err) => {
          console.warn('[StandardsChatbot] Error fetching available standard families:', err)
          return null
        })

        // GET /standards/projects/{projectId}/preferences
        const prefProjId = targetProjectId || 'general'
        const prefRes = await Service.GetProjectStandardPreferences(prefProjId, selectedTier).catch(
          (err) => {
            console.warn('[StandardsChatbot] Error fetching project standard preferences:', err)
            return null
          }
        )

        let combinedFamilies = []
        let prefFamilyIds = []

        // Extract families from GET /standards/families or GET /standards/fabricators/{fabricatorId}/families
        const rawFamilies =
          famRes?.families ||
          famRes?.data?.families ||
          famRes?.standardFamilies ||
          famRes?.data?.standardFamilies ||
          famRes?.data ||
          (Array.isArray(famRes) ? famRes : [])

        if (Array.isArray(rawFamilies) && rawFamilies.length > 0) {
          rawFamilies.forEach((f) => {
            const familyId = typeof f === 'string' ? f : f.id || f.familyCode || f.name
            const familyCode = typeof f === 'object' ? f.familyCode || f.id || familyId : familyId
            const edition = typeof f === 'object' ? f.edition : ''
            const label = familyCode
              ? `${familyCode}${edition ? ` (Ed. ${edition})` : ''}`
              : familyId

            if (familyId && !combinedFamilies.some((item) => item.id === familyId)) {
              combinedFamilies.push({
                id: familyId,
                familyCode,
                edition,
                label,
                isDefault: !!f?.isDefault
              })
            }
          })
        }

        // Extract preferences from GET /standards/projects/{projectId}/preferences
        const rawPrefs =
          prefRes?.standardFamilyIds ||
          prefRes?.data?.standardFamilyIds ||
          prefRes?.families ||
          prefRes?.data?.families ||
          prefRes?.data ||
          (Array.isArray(prefRes) ? prefRes : [])

        if (Array.isArray(rawPrefs) && rawPrefs.length > 0) {
          rawPrefs.forEach((p) => {
            const familyId = typeof p === 'string' ? p : p.id || p.familyCode
            const familyCode = typeof p === 'object' ? p.familyCode || p.id || familyId : familyId
            const edition = typeof p === 'object' ? p.edition : ''
            const label = familyCode
              ? `${familyCode}${edition ? ` (Ed. ${edition})` : ''}`
              : familyId

            if (familyId) {
              if (!prefFamilyIds.includes(familyId)) {
                prefFamilyIds.push(familyId)
              }
              if (!combinedFamilies.some((item) => item.id === familyId)) {
                combinedFamilies.push({
                  id: familyId,
                  familyCode,
                  edition,
                  label,
                  isDefault: !!p?.isDefault
                })
              }
            }
          })
        }

        setStandardPreferences(combinedFamilies)

        if (prefFamilyIds.length > 0) {
          setSelectedFamilyIds(prefFamilyIds)
          setDocumentFamilyId(prefFamilyIds[0])
        } else {
          // Do not default any families to true
          setSelectedFamilyIds([])
          setDocumentFamilyId('')
        }
      } catch (err) {
        console.error('[StandardsChatbot] Failed fetching families and preferences:', err)
      }
    }

    fetchFamiliesAndPreferences()
  }, [targetProjectId, targetFabricatorId, selectedTier])

  useEffect(() => {
    const defaultFabId =
      project?.fabricatorID ||
      project?.fabricator?.id ||
      project?.fabricator_id ||
      project?.fabricatorId ||
      ''
    if (defaultFabId) {
      setSelectedFabricatorId(String(defaultFabId))
    }
  }, [project])

  // Image viewer modal state
  const [imageModal, setImageModal] = useState({
    isOpen: false,
    url: '',
    loading: false,
    title: ''
  })

  const chatEndRef = useRef(null)

  const scrollToBottom = (behavior = 'smooth') => {
    chatEndRef.current?.scrollIntoView({ behavior })
  }

  const fetchHistory = useCallback(async () => {
    const targetId = projectId || selectedFabricatorId || 'general'
    try {
      setLoadingHistory(true)
      const res = await Service.GetStandardsChatHistory(targetId)

      // Normalize history data into array format
      let historyList = []
      if (Array.isArray(res)) {
        historyList = res
      } else if (res && Array.isArray(res.data)) {
        historyList = res.data
      } else if (res && Array.isArray(res.history)) {
        historyList = res.history
      } else if (res && typeof res === 'object') {
        const foundArr = Object.values(res).find(Array.isArray)
        if (foundArr) historyList = foundArr
      }

      // Sort history chronologically ascending (oldest top, latest/newest at bottom)
      const sortedHistory = [...historyList].sort((a, b) => {
        const timeA = new Date(a?.createdAt || a?.timestamp || a?.updatedAt || 0).getTime()
        const timeB = new Date(b?.createdAt || b?.timestamp || b?.updatedAt || 0).getTime()
        return timeA - timeB
      })

      setMessages(sortedHistory)
    } catch (err) {
      console.error('Error loading standards chat history:', err)
      toast.error('Failed to load chat history')
    } finally {
      setLoadingHistory(false)

      setTimeout(() => {
        scrollToBottom('auto')
      }, 100)
    }
  }, [projectId, selectedFabricatorId])

  useEffect(() => {
    fetchHistory()
  }, [fetchHistory])

  useEffect(() => {
    if (!loadingHistory) {
      scrollToBottom()
    }
  }, [messages, sending, loadingHistory])

  const handleSend = async (queryTextToSend) => {
    const textToSubmit = (queryTextToSend || query).trim()
    if (!textToSubmit || sending) return

    setSending(true)
    const tempUserMsg = {
      id: `temp-${Date.now()}`,
      queryText: textToSubmit,
      createdAt: new Date().toISOString(),
      answers: []
    }

    setMessages((prev) => {
      const updated = [...prev, tempUserMsg]
      return updated.sort((a, b) => {
        const timeA = new Date(a?.createdAt || a?.timestamp || a?.updatedAt || 0).getTime()
        const timeB = new Date(b?.createdAt || b?.timestamp || b?.updatedAt || 0).getTime()
        return timeA - timeB
      })
    })
    if (!queryTextToSend) setQuery('')

    try {
      const chatPayload = {
        query: textToSubmit,
        ...(selectedTier ? { tier: selectedTier, sourceType: selectedTier } : {}),
        ...(selectedFamilyIds.length > 0
          ? {
              standardFamilyIds: selectedFamilyIds,
              documentFamilyIds: selectedFamilyIds,
              documentFamilyId: selectedFamilyIds[0]
            }
          : documentFamilyId
            ? { documentFamilyId, standardFamilyIds: [documentFamilyId] }
            : {}),
        ...(selectedFabricatorId ? { fabricatorId: selectedFabricatorId } : {})
      }
      const targetId = projectId || 'general'
      const response = await Service.ChatWithStandards(targetId, chatPayload)
      console.log('Standards chat response:', response)

      // Format response to message item format
      const formattedResponse = {
        id: response?.id || `msg-${Date.now()}`,
        projectId: response?.projectId || projectId,
        queryText: response?.queryText || textToSubmit,
        createdAt: response?.createdAt || new Date().toISOString(),
        answers: Array.isArray(response?.answers)
          ? response.answers
          : response?.answers
            ? [response.answers]
            : []
      }

      setMessages((prev) => {
        // Replace temp msg or append
        const filtered = prev.filter((m) => m.id !== tempUserMsg.id)
        const updated = [...filtered, formattedResponse]
        return updated.sort((a, b) => {
          const timeA = new Date(a?.createdAt || a?.timestamp || a?.updatedAt || 0).getTime()
          const timeB = new Date(b?.createdAt || b?.timestamp || b?.updatedAt || 0).getTime()
          return timeA - timeB
        })
      })
    } catch (err) {
      console.error('Error sending query to standards chat:', err)
      toast.error('Failed to get answer from standards assistant')
      setMessages((prev) => prev.filter((m) => m.id !== tempUserMsg.id))
    } finally {
      setSending(false)
    }
  }

  const handleOpenReferenceImage = useCallback(async (imgPath, imgIdx, answer) => {
    const pageNum = answer?.anchorPageStart || answer?.citationPageStart || ''
    const title = `Reference Image ${imgIdx + 1}${pageNum ? ` (Page ${pageNum})` : ''}`

    // Reset zoom and pan offsets for the new image
    setZoomScale(1)
    setPanOffset({ x: 0, y: 0 })

    setImageModal({
      isOpen: true,
      url: '',
      loading: true,
      title
    })

    try {
      const blob = await Service.GetStandardImageBlob(imgPath)
      const objectUrl = window.URL.createObjectURL(blob)
      setImageModal({
        isOpen: true,
        url: objectUrl,
        loading: false,
        title
      })
    } catch (err) {
      console.error('Error opening reference image:', err)
      toast.error('Failed to load reference image from server')
      setImageModal({ isOpen: false, url: '', loading: false, title: '' })
    }
  }, [])

  const handleMouseDown = (e) => {
    if (zoomScale <= 1) return
    e.preventDefault()
    setIsDragging(true)
    setDragStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y })
  }

  const handleMouseMove = (e) => {
    if (!isDragging) return
    e.preventDefault()
    setPanOffset({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    })
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  const handleWheel = (e) => {
    if (!imageModal.url || imageModal.loading) return
    e.preventDefault()
    // Zoom by 0.1 per scroll tick, bounded between 0.5x and 4x
    const delta = e.deltaY < 0 ? 0.1 : -0.1
    setZoomScale((prev) => Math.min(4, Math.max(0.5, prev + delta)))
  }

  return (
    <div className="flex flex-col h-[700px] bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
      {/* Top Bar Header */}
      <div className="flex items-center justify-between px-6 py-3.5 bg-white border-b border-gray-100 shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-green-50 rounded-xl border border-green-100">
            <Bot className="w-5.5 h-5.5 text-green-600" />
          </div>
          <div>
            <h3 className="font-bold text-base tracking-wide text-black">
              {projectId ? 'Standards AI Assistant' : 'Fabrication Standards AI Assistant'}
            </h3>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowUploadModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold bg-green-600 hover:bg-green-700 text-white rounded-lg transition-all shadow-sm cursor-pointer"
          >
            <UploadCloud className="w-4 h-4" />
            Upload Standard PDF
          </button>
          <button
            type="button"
            onClick={fetchHistory}
            disabled={loadingHistory}
            className="p-1.5 text-black hover:text-green-600 hover:bg-gray-50 rounded-lg transition-all cursor-pointer border border-transparent hover:border-gray-200"
            title="Refresh History"
          >
            <RefreshCw className={`w-4 h-4 ${loadingHistory ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Main Chat Message Container */}
      <ChatMessageList
        messages={messages}
        loadingHistory={loadingHistory}
        sending={sending}
        onOpenReferenceImage={handleOpenReferenceImage}
        chatEndRef={chatEndRef}
      />

      {/* Input Form Bar */}
      <div className="p-4 bg-white border-t border-gray-100 shrink-0">
        <div className="w-full space-y-3">
          {/* Tier and Family Controls (Boolean Toggles - neither default true) */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-gray-50/80 p-2 rounded-2xl border border-gray-200 text-xs shadow-3xs">
            {/* Tier Boolean Toggles */}
            <div className="flex items-center gap-2">
              <span className="text-black font-bold text-[10px] uppercase tracking-wider pl-1">
                Tier:
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setSelectedTier(selectedTier === 'GENERAL' ? '' : 'GENERAL')}
                  className={`px-3 py-1 rounded-full text-xs font-bold border transition-all cursor-pointer flex items-center gap-1 ${
                    selectedTier === 'GENERAL'
                      ? 'bg-green-600 text-white border-green-600 shadow-2xs'
                      : 'bg-white text-black border-gray-250 hover:bg-gray-100'
                  }`}
                >
                  <span>GENERAL</span>
                  {selectedTier === 'GENERAL' && <Check className="w-3 h-3 text-white" />}
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedTier(selectedTier === 'PROJECT' ? '' : 'PROJECT')}
                  className={`px-3 py-1 rounded-full text-xs font-bold border transition-all cursor-pointer flex items-center gap-1 ${
                    selectedTier === 'PROJECT'
                      ? 'bg-green-600 text-white border-green-600 shadow-2xs'
                      : 'bg-white text-black border-gray-250 hover:bg-gray-100'
                  }`}
                >
                  <span>PROJECT</span>
                  {selectedTier === 'PROJECT' && <Check className="w-3 h-3 text-white" />}
                </button>
              </div>
            </div>

            {/* Families Boolean Toggles */}
            {selectedTier ? (
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-black font-bold text-[10px] uppercase tracking-wider">
                  Families:
                </span>
                {standardPreferences.length > 0 ? (
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {standardPreferences.map((fam) => {
                      const isSelected = selectedFamilyIds.includes(fam.id)
                      return (
                        <button
                          key={fam.id}
                          type="button"
                          onClick={() => toggleFamilySelection(fam.id)}
                          className={`px-2.5 py-1 rounded-full text-xs font-bold border transition-all cursor-pointer flex items-center gap-1 ${
                            isSelected
                              ? 'bg-green-700 text-white border-green-700 font-semibold shadow-2xs'
                              : 'bg-white text-black border-gray-250 hover:bg-gray-100'
                          }`}
                        >
                          <span>{fam.label || fam.id}</span>
                          {isSelected && <Check className="w-3 h-3 text-green-200" />}
                        </button>
                      )
                    })}
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5">
                    <input
                      type="text"
                      value={documentFamilyId}
                      onChange={(e) => {
                        setDocumentFamilyId(e.target.value)
                        setSelectedFamilyIds(e.target.value ? [e.target.value] : [])
                      }}
                      onBlur={(e) => {
                        if (e.target.value) {
                          savePreferences([e.target.value])
                        }
                      }}
                      placeholder="e.g. AISC, ACI-318"
                      className="px-2.5 py-1 text-xs border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none w-36 bg-white text-black placeholder-gray-400"
                    />
                  </div>
                )}
              </div>
            ) : (
              <span className="text-black italic text-[10px] pr-2 font-medium">
                Select a Tier above to view standard family options
              </span>
            )}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault()
              handleSend()
            }}
            className="flex items-center gap-3"
          >
            <div className="relative flex-1">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Ask a question about project standards, codes, or specifications..."
                disabled={sending}
                className="w-full pl-5 pr-14 py-3.5 bg-white border border-gray-300 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-green-500 text-black shadow-sm transition-all font-medium placeholder-gray-400"
              />
              <button
                type="submit"
                disabled={!query.trim() || sending}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-2 bg-green-600 hover:bg-green-700 text-white rounded-full transition-all disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed shadow-xs"
              >
                {sending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Upload Standard PDF Modal */}
      {showUploadModal && (
        <UploadFabricatorStandard
          fabricatorId={selectedFabricatorId}
          projectId={projectId}
          initialSourceType={selectedTier || defaultSourceType || 'FABRICATOR'}
          initialDocumentFamilyId={documentFamilyId}
          onClose={() => setShowUploadModal(false)}
          onSuccess={() => {
            setShowUploadModal(false)
            fetchHistory()
          }}
        />
      )}

      {/* Reference Image Viewer Modal */}
      {imageModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-gray-200 max-w-6xl w-full max-h-[95vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-150">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 bg-green-900 text-white shrink-0">
              <div className="flex items-center gap-2">
                <ImageIcon className="w-5 h-5 text-green-300" />
                <h4 className="font-bold text-base">{imageModal.title}</h4>
              </div>
              <div className="flex items-center gap-2">
                {imageModal.url && (
                  <>
                    {/* Zoom Controls */}
                    <div className="flex items-center bg-green-800 rounded-lg border border-green-700 px-1.5 py-0.5 mr-2">
                      <button
                        type="button"
                        onClick={() => setZoomScale((prev) => Math.max(0.5, prev - 0.25))}
                        className="p-1 hover:bg-green-700 rounded transition-colors text-white cursor-pointer"
                        title="Zoom Out"
                      >
                        <ZoomOut className="w-4 h-4" />
                      </button>
                      <span className="px-2 text-xs font-bold text-green-200 select-none min-w-[48px] text-center">
                        {Math.round(zoomScale * 100)}%
                      </span>
                      <button
                        type="button"
                        onClick={() => setZoomScale((prev) => Math.min(4, prev + 0.25))}
                        className="p-1 hover:bg-green-700 rounded transition-colors text-white cursor-pointer"
                        title="Zoom In"
                      >
                        <ZoomIn className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setZoomScale(1)
                          setPanOffset({ x: 0, y: 0 })
                        }}
                        className="px-2 py-0.5 ml-1.5 bg-green-700 hover:bg-green-600 rounded text-[10px] font-bold text-white transition-colors cursor-pointer"
                        title="Reset Zoom"
                      >
                        Reset
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => window.open(imageModal.url, '_blank', 'noopener,noreferrer')}
                      className="flex items-center gap-1.5 text-xs font-semibold bg-green-700 hover:bg-green-600 px-3 py-1.5 rounded-md text-white transition-colors cursor-pointer mr-1"
                      title="Open in New Tab"
                    >
                      <ExternalLink className="w-3.5 h-3.5" /> Open in New Tab
                    </button>
                  </>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setImageModal({ isOpen: false, url: '', loading: false, title: '' })
                    setZoomScale(1)
                    setPanOffset({ x: 0, y: 0 })
                  }}
                  className="text-green-200 hover:text-white p-1 rounded-md hover:bg-green-800 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body / Image preview */}
            <div
              onWheel={handleWheel}
              className="flex-1 p-6 overflow-hidden bg-slate-900 flex items-center justify-center min-h-[400px] relative select-none"
            >
              {imageModal.loading ? (
                <div className="flex flex-col items-center gap-3 text-green-400">
                  <Loader2 className="w-8 h-8 animate-spin" />
                  <p className="text-xs font-medium">Loading authenticated reference image...</p>
                </div>
              ) : imageModal.url ? (
                <div className="w-full h-full flex items-center justify-center overflow-hidden relative">
                  <img
                    src={imageModal.url}
                    alt={imageModal.title}
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseUp}
                    style={{
                      transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoomScale})`,
                      cursor: zoomScale > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default',
                      transition: isDragging ? 'none' : 'transform 0.15s ease-out'
                    }}
                    className="max-w-full max-h-[82vh] object-contain rounded border border-slate-700 shadow-lg select-none"
                  />
                </div>
              ) : (
                <p className="text-xs text-red-400">Failed to load image preview.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default StandardsChatbot
