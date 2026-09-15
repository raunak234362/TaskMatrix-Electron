import { useState, useEffect, useRef, useCallback, memo, useMemo } from 'react'
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
  ZoomOut,
  AlertCircle
} from 'lucide-react'
import Service from '../../../api/Service'
import { toast } from 'react-toastify'
import UploadFabricatorStandard from '../../fabricator/fabricator/UploadFabricatorStandard'

const formatStandardMessage = (item) => {
  if (!item) return null

  // If item already contains structured answers array with contents
  if (Array.isArray(item.answers) && item.answers.length > 0) {
    return item
  }

  const rawResults = Array.isArray(item.results) ? item.results : []
  const citations = rawResults.map((r, idx) => ({
    id: r.documentId ? `${r.documentId}-${idx}` : `cit-${idx}`,
    documentId: r.documentId,
    pageNumber: r.pageStart,
    pageStart: r.pageStart,
    pageEnd: r.pageEnd,
    citationPdfName: r.documentName || r.documentFamilyId || 'Standard Document',
    documentName: r.documentName,
    documentFamilyId: r.documentFamilyId,
    familyCode: r.familyCode,
    edition: r.edition,
    citationPageStart: r.pageStart,
    citationPageEnd: r.pageEnd,
    anchorPageStart: r.pageStart,
    anchorPageEnd: r.pageEnd,
    imageUrl: r.imageUrl,
    imagePaths: r.imageUrl ? [r.imageUrl] : [],
    sourceType: r.edition
      ? `${r.familyCode || r.documentFamilyId} (Ed. ${r.edition})`
      : r.familyCode || r.documentFamilyId || 'STANDARD',
    chunkType: r.chunkType || 'PROSE',
    score: r.score,
    isPrimarySource: !!r.isPrimarySource
  }))

  const allImagePaths = rawResults
    .map((r) => r.imageUrl)
    .filter(Boolean)

  let displayText = item.aiSummary || ''

  const answers = [
    {
      id: item.messageId || item.id || `ans-${Date.now()}`,
      answerText: displayText,
      citations,
      imagePaths: allImagePaths,
      deferralReason: item.deferralReason || null,
      generationStatus: item.aiSummary
        ? 'SUCCESS'
        : item.deferralReason
          ? 'DEFERRED'
          : 'COMPLETED'
    }
  ]

  return {
    id: item.messageId || item.id || `msg-${Date.now()}`,
    projectId: item.projectId,
    queryText: item.queryText || '',
    createdAt: item.createdAt || new Date().toISOString(),
    generationStatus: item.deferralReason
      ? 'DEFERRED'
      : item.aiSummary
        ? 'SUCCESS'
        : 'COMPLETED',
    answers,
    aiSummary: item.aiSummary,
    deferralReason: item.deferralReason,
    results: item.results
  }
}

const InlineStandardImage = memo(({ docId, pageStart, imagePath, citation, onOpenReferenceImage, index }) => {
  const [imageUrl, setImageUrl] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  let resolvedDocId = docId || citation?.documentId
  let resolvedPageStart =
    pageStart ??
    citation?.pageStart ??
    citation?.pageNumber ??
    citation?.citationPageStart ??
    citation?.anchorPageStart ??
    ''

  const targetPath = imagePath || citation?.imageUrl || (Array.isArray(citation?.imagePaths) ? citation.imagePaths[0] : '')

  if ((!resolvedDocId || resolvedPageStart === '' || resolvedPageStart === undefined || resolvedPageStart === null) && targetPath) {
    const match = String(targetPath).match(/standards\/image\/([^/]+)\/([^/?#]+)/)
    if (match) {
      if (!resolvedDocId) resolvedDocId = match[1]
      if (resolvedPageStart === '' || resolvedPageStart === undefined || resolvedPageStart === null) {
        resolvedPageStart = match[2]
      }
    }
  }

  const docName =
    citation?.citationPdfName ||
    citation?.documentName ||
    citation?.documentFamilyId ||
    'Standard Document'
  const familyCode = citation?.familyCode || citation?.documentFamilyId || ''
  const edition = citation?.edition || ''
  const chunkType = citation?.chunkType || ''
  const isPrimary = !!citation?.isPrimarySource

  useEffect(() => {
    let active = true
    let objectUrl = ''

    const loadImage = async () => {
      setLoading(true)
      setError(false)
      try {
        let blob = null
        // Prioritize Service.GetStandardImagePage with documentId and pageStart
        if (resolvedDocId && resolvedPageStart !== '' && resolvedPageStart !== undefined && resolvedPageStart !== null) {
          blob = await Service.GetStandardImagePage(resolvedDocId, resolvedPageStart)
        } else if (targetPath) {
          const match = String(targetPath).match(/standards\/image\/([^/]+)\/([^/?#]+)/)
          if (match) {
            blob = await Service.GetStandardImagePage(match[1], match[2])
          } else {
            blob = await Service.GetStandardImageBlob(targetPath)
          }
        }

        if (!active) return
        if (blob) {
          objectUrl = window.URL.createObjectURL(blob)
          setImageUrl(objectUrl)
        } else {
          setError(true)
        }
      } catch (err) {
        console.error('Failed to load standard image page:', resolvedDocId, resolvedPageStart, err)
        if (active) setError(true)
      } finally {
        if (active) setLoading(false)
      }
    }

    loadImage()

    return () => {
      active = false
      if (objectUrl) {
        window.URL.revokeObjectURL(objectUrl)
      }
    }
  }, [resolvedDocId, resolvedPageStart, targetPath])

  const handleClick = (e) => {
    e?.stopPropagation?.()
    if (onOpenReferenceImage) {
      onOpenReferenceImage(
        {
          docId: resolvedDocId,
          pageStart: resolvedPageStart,
          path: targetPath,
          citation,
          existingUrl: imageUrl
        },
        index,
        citation
      )
    }
  }

  return (
    <div
      onClick={handleClick}
      className="group relative flex flex-col rounded-xl border border-gray-250 bg-white hover:border-green-600 hover:shadow-md transition-all duration-200 overflow-hidden cursor-pointer w-full text-left select-none"
    >
      {/* Visual Thumbnail Area (Google Search Image Reference Style) */}
      <div className="relative w-full h-44 bg-gradient-to-b from-slate-50 to-slate-100 flex items-center justify-center p-2 overflow-hidden border-b border-gray-100">
        {loading ? (
          <div className="flex flex-col items-center justify-center gap-2 py-8 text-gray-400">
            <Loader2 className="w-5 h-5 animate-spin text-green-600" />
            <span className="text-[11px] font-medium text-gray-500">
              Loading Page {resolvedPageStart || ''}...
            </span>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center gap-1.5 py-8 text-gray-400">
            <AlertCircle className="w-5 h-5 text-amber-500" />
            <span className="text-[11px] font-medium text-gray-500">Preview not available</span>
            {resolvedPageStart && (
              <span className="text-[10px] text-gray-400">Standard Page {resolvedPageStart}</span>
            )}
          </div>
        ) : imageUrl ? (
          <>
            <img
              src={imageUrl}
              alt={`${docName} ${resolvedPageStart ? `Page ${resolvedPageStart}` : ''}`}
              className="max-h-full max-w-full object-contain rounded drop-shadow-2xs group-hover:scale-105 transition-transform duration-300"
            />
            {/* Hover overlay hint */}
            <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-end p-2 pointer-events-none">
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-black/80 text-white text-[10px] font-semibold shadow-sm backdrop-blur-xs">
                <Maximize2 className="w-3 h-3" /> Enlarge
              </span>
            </div>
          </>
        ) : null}

        {/* Top-left: Page badge */}
        <div className="absolute top-2 left-2 flex items-center gap-1.5 pointer-events-none">
          {resolvedPageStart !== '' && resolvedPageStart !== undefined && resolvedPageStart !== null && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-black/75 backdrop-blur-xs text-white shadow-xs">
              <BookOpen className="w-2.5 h-2.5 text-green-400" />
              Pg {resolvedPageStart}
            </span>
          )}
        </div>

        {/* Top-right: Primary Source badge */}
        {isPrimary && (
          <div className="absolute top-2 right-2 pointer-events-none">
            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase tracking-wider bg-green-600 text-white shadow-xs">
              Primary
            </span>
          </div>
        )}
      </div>

      {/* Card Body / Google-style Reference Footer */}
      <div className="p-3 flex flex-col justify-between flex-1 gap-1.5 bg-white">
        <div>
          {/* Family & Chunk type meta row */}
          <div className="flex items-center gap-1.5 flex-wrap mb-1">
            {(familyCode || edition) && (
              <span className="text-[10px] font-extrabold uppercase tracking-wide text-green-800 bg-green-50 px-1.5 py-0.5 rounded border border-green-200/60">
                {familyCode || 'STANDARD'} {edition ? `• Ed. ${edition}` : ''}
              </span>
            )}
            {chunkType && (
              <span className="text-[10px] font-bold text-gray-600 bg-gray-100 px-1.5 py-0.5 rounded">
                {chunkType}
              </span>
            )}
          </div>

          {/* Document Name */}
          <h5
            className="text-xs font-bold text-gray-900 group-hover:text-green-700 transition-colors line-clamp-2 leading-snug"
            title={docName}
          >
            {docName}
          </h5>
        </div>

        {/* Action Link Footer */}
        <div className="flex items-center justify-between text-[11px] pt-2 border-t border-gray-100 text-gray-400">
          <span className="text-[10px] text-gray-500 font-medium">Standard Reference</span>
          <span className="text-green-700 font-bold group-hover:underline inline-flex items-center gap-1 text-[11px]">
            View Page <ExternalLink className="w-2.5 h-2.5" />
          </span>
        </div>
      </div>
    </div>
  )
})

const ChatMessageItem = memo(({ item, onOpenReferenceImage }) => {
  const isTemp = String(item.id).startsWith('temp-')
  const formattedItem = useMemo(() => formatStandardMessage(item) || item, [item])
  const rawAnswers = Array.isArray(formattedItem.answers) ? formattedItem.answers : []

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

  const hasFilteredAnswers = filteredAnswers.length > 0 || (Array.isArray(formattedItem.results) && formattedItem.results.length > 0)

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

            // 1. Gather from citationsList
            if (Array.isArray(citationsList)) {
              citationsList.forEach((c) => {
                let docId = c.documentId
                let pageStart =
                  c.pageStart ?? c.pageNumber ?? c.citationPageStart ?? c.anchorPageStart
                const path =
                  c.imageUrl || (Array.isArray(c.imagePaths) ? c.imagePaths[0] : null)

                if ((!docId || pageStart === undefined || pageStart === null || pageStart === '') && path) {
                  const match = String(path).match(/standards\/image\/([^/]+)\/([^/?#]+)/)
                  if (match) {
                    if (!docId) docId = match[1]
                    if (pageStart === undefined || pageStart === null || pageStart === '') pageStart = match[2]
                  }
                }

                if ((docId && pageStart !== undefined && pageStart !== null && pageStart !== '') || path) {
                  const key = docId && pageStart ? `${docId}-${pageStart}` : path
                  if (!allImageItems.some((item) => item.key === key)) {
                    allImageItems.push({
                      key,
                      docId,
                      pageStart,
                      path,
                      citation: c
                    })
                  }
                }
              })
            }

            // 2. Gather from answer.imagePaths
            if (Array.isArray(answer.imagePaths)) {
              answer.imagePaths.forEach((imgPath) => {
                if (imgPath) {
                  const match = String(imgPath).match(/standards\/image\/([^/]+)\/([^/?#]+)/)
                  const docId = match ? match[1] : null
                  const pageStart = match ? match[2] : null
                  const key = docId && pageStart ? `${docId}-${pageStart}` : imgPath
                  if (!allImageItems.some((item) => item.key === key)) {
                    allImageItems.push({
                      key,
                      docId,
                      pageStart,
                      path: imgPath,
                      citation: answer
                    })
                  }
                }
              })
            }

            // 3. Gather from formattedItem.results
            if (Array.isArray(formattedItem.results)) {
              formattedItem.results.forEach((r) => {
                let docId = r.documentId
                let pageStart = r.pageStart ?? r.pageEnd
                const path = r.imageUrl

                if ((!docId || pageStart === undefined || pageStart === null || pageStart === '') && path) {
                  const match = String(path).match(/standards\/image\/([^/]+)\/([^/?#]+)/)
                  if (match) {
                    if (!docId) docId = match[1]
                    if (pageStart === undefined || pageStart === null || pageStart === '') pageStart = match[2]
                  }
                }

                if ((docId && pageStart !== undefined && pageStart !== null && pageStart !== '') || path) {
                  const key = docId && pageStart ? `${docId}-${pageStart}` : path
                  if (!allImageItems.some((item) => item.key === key)) {
                    allImageItems.push({
                      key,
                      docId,
                      pageStart,
                      path,
                      citation: {
                        documentId: r.documentId,
                        documentName: r.documentName,
                        documentFamilyId: r.documentFamilyId,
                        familyCode: r.familyCode,
                        edition: r.edition,
                        citationPdfName: r.documentName || r.documentFamilyId,
                        citationPageStart: r.pageStart,
                        citationPageEnd: r.pageEnd,
                        pageNumber: r.pageStart,
                        pageStart: r.pageStart,
                        pageEnd: r.pageEnd,
                        chunkType: r.chunkType,
                        isPrimarySource: r.isPrimarySource,
                        imageUrl: r.imageUrl
                      }
                    })
                  }
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
                  'Top standard references matched for your query:'
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
                    {answer.deferralReason && (
                      <div className="bg-amber-50 text-amber-900 border border-amber-200 px-2.5 py-1 rounded text-xs font-bold w-fit">
                        Status: {answer.deferralReason}
                      </div>
                    )}
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
                              {cit.isPrimarySource && (
                                <span className="ml-1 text-green-900 bg-green-200/90 px-1 rounded text-[10px] font-extrabold uppercase">
                                  Primary
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

                    {/* Google-style visual reference cards */}
                    {allImageItems.length > 0 && (
                      <div className="pt-3">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-1.5 text-xs font-bold text-gray-800">
                            <ImageIcon className="w-3.5 h-3.5 text-green-700" />
                            <span>Visual Reference{allImageItems.length > 1 ? 's' : ''} ({allImageItems.length})</span>
                          </div>
                          <span className="text-[10px] text-gray-500 font-medium">Click card to expand & zoom</span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                          {allImageItems.map((imgItem, imgIdx) => (
                            <InlineStandardImage
                              key={`${imgItem.key || imgItem.path || imgIdx}-${imgIdx}`}
                              docId={imgItem.docId}
                              pageStart={imgItem.pageStart}
                              imagePath={imgItem.path}
                              citation={imgItem.citation}
                              index={imgIdx}
                              onOpenReferenceImage={onOpenReferenceImage}
                            />
                          ))}
                        </div>
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
              Answer Not Available
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
          targetProjectId,
          'fabricatorId:',
          targetFabricatorId
        )

        let famRes = null

        if (targetFabricatorId && (selectedTier === 'FABRICATOR' || !selectedTier)) {
          famRes = await Service.GetFabricatorStandardFamilies(targetFabricatorId).catch((err) => {
            console.warn('[StandardsChatbot] Error fetching fabricator standard families:', err)
            return null
          })
        }

        if (!famRes) {
          // GET /standards/families
          famRes = await Service.GetAvailableStandardFamilies(
            selectedTier,
            selectedTier === 'PROJECT' ? targetProjectId : undefined
          ).catch((err) => {
            console.warn('[StandardsChatbot] Error fetching available standard families:', err)
            return null
          })
        }

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
      const sortedHistory = [...historyList]
        .map(formatStandardMessage)
        .filter(Boolean)
        .sort((a, b) => {
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
      const famIds =
        selectedFamilyIds.length > 0
          ? selectedFamilyIds
          : documentFamilyId
            ? [documentFamilyId]
            : []

      const queryPayload = {
        query: textToSubmit,
        ...(famIds.length > 0 ? { standardFamilyIds: famIds } : {})
      }
      const targetId = projectId || 'general'
      const response = await Service.QueryProjectStandards(targetId, queryPayload)
      console.log('Standards query response:', response)

      const formattedResponse = formatStandardMessage({
        messageId: response?.messageId || response?.id,
        projectId: response?.projectId || projectId,
        queryText: response?.queryText || textToSubmit,
        createdAt: response?.createdAt || new Date().toISOString(),
        aiSummary: response?.aiSummary,
        deferralReason: response?.deferralReason,
        results: response?.results,
        answers: response?.answers
      })

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
      console.error('Error sending query to standards assistant:', err)
      toast.error('Failed to get answer from standards assistant')
      setMessages((prev) => prev.filter((m) => m.id !== tempUserMsg.id))
    } finally {
      setSending(false)
    }
  }

  const handleOpenReferenceImage = useCallback(async (itemOrPath, imgIdx, citation) => {
    let existingUrl =
      itemOrPath?.existingUrl ||
      itemOrPath?.url ||
      (typeof itemOrPath === 'string' && itemOrPath.startsWith('blob:') ? itemOrPath : '')

    let docId =
      itemOrPath?.docId ||
      citation?.documentId ||
      itemOrPath?.citation?.documentId ||
      null

    let pageStart =
      itemOrPath?.pageStart ??
      itemOrPath?.pageNum ??
      citation?.pageStart ??
      citation?.pageNumber ??
      citation?.citationPageStart ??
      citation?.anchorPageStart ??
      itemOrPath?.citation?.pageStart ??
      itemOrPath?.citation?.pageNumber ??
      null

    let imgPath =
      typeof itemOrPath === 'string' && !itemOrPath.startsWith('blob:')
        ? itemOrPath
        : itemOrPath?.path ||
          itemOrPath?.imageUrl ||
          citation?.imageUrl ||
          (Array.isArray(citation?.imagePaths) ? citation.imagePaths[0] : null) ||
          (Array.isArray(itemOrPath?.citation?.imagePaths) ? itemOrPath.citation.imagePaths[0] : null)

    if ((!docId || pageStart === null || pageStart === undefined || pageStart === '') && imgPath) {
      const match = String(imgPath).match(/standards\/image\/([^/]+)\/([^/?#]+)/)
      if (match) {
        if (!docId) docId = match[1]
        if (pageStart === null || pageStart === undefined || pageStart === '') pageStart = match[2]
      }
    }

    const docName =
      citation?.citationPdfName ||
      citation?.documentName ||
      itemOrPath?.citation?.citationPdfName ||
      itemOrPath?.citation?.documentName ||
      'Standard Document'
    const title = `${docName}${pageStart !== undefined && pageStart !== null && pageStart !== '' ? ` (Page ${pageStart})` : ''}`

    // Reset zoom and pan offsets for the new image
    setZoomScale(1)
    setPanOffset({ x: 0, y: 0 })

    // If an existing loaded blob URL is available, open immediately without re-fetching!
    if (existingUrl) {
      setImageModal({
        isOpen: true,
        url: existingUrl,
        loading: false,
        title
      })
      return
    }

    setImageModal({
      isOpen: true,
      url: '',
      loading: true,
      title
    })

    try {
      let blob = null
      if (docId && pageStart !== undefined && pageStart !== null && pageStart !== '') {
        blob = await Service.GetStandardImagePage(docId, pageStart)
      } else if (imgPath) {
        const match = String(imgPath).match(/standards\/image\/([^/]+)\/([^/?#]+)/)
        if (match) {
          blob = await Service.GetStandardImagePage(match[1], match[2])
        } else {
          blob = await Service.GetStandardImageBlob(imgPath)
        }
      } else {
        throw new Error('Reference image details not found.')
      }

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
                  className={`px-3 py-1 rounded-full text-xs font-bold border transition-all cursor-pointer flex items-center gap-1 ${selectedTier === 'GENERAL'
                      ? 'bg-green-600 text-white border-green-600 shadow-2xs'
                      : 'bg-white text-black border-gray-250 hover:bg-gray-100'
                    }`}
                >
                  <span>GENERAL</span>
                  {selectedTier === 'GENERAL' && <Check className="w-3 h-3 text-white" />}
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedTier(selectedTier === 'FABRICATOR' ? '' : 'FABRICATOR')}
                  className={`px-3 py-1 rounded-full text-xs font-bold border transition-all cursor-pointer flex items-center gap-1 ${selectedTier === 'FABRICATOR'
                      ? 'bg-green-600 text-white border-green-600 shadow-2xs'
                      : 'bg-white text-black border-gray-250 hover:bg-gray-100'
                    }`}
                >
                  <span>FABRICATOR</span>
                  {selectedTier === 'FABRICATOR' && <Check className="w-3 h-3 text-white" />}
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedTier(selectedTier === 'PROJECT' ? '' : 'PROJECT')}
                  className={`px-3 py-1 rounded-full text-xs font-bold border transition-all cursor-pointer flex items-center gap-1 ${selectedTier === 'PROJECT'
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
                          className={`px-2.5 py-1 rounded-full text-xs font-bold border transition-all cursor-pointer flex items-center gap-1 ${isSelected
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
