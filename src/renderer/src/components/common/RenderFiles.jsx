import React from 'react'
import { FileText, Share2, Download, ChevronRight, Plus } from 'lucide-react'
import {
    openFileSecurely,
    downloadFileSecurely,
    shareFileSecurely
} from '../../utils/openFileSecurely'
import Button from '../fields/Button'
import { toast } from 'react-toastify'

const RenderFiles = ({ files, onAddFilesClick, formatDate, table, parentId, versionId, hideHeader = false }) => {
    // Step 1: Normalize and flatten files
    const projectFiles = Array.isArray(files)
        ? files.map((doc) => {
            const fileData = doc.file ? { ...doc.file, ...doc } : { ...doc }
            if (fileData.file) delete fileData.file
            return fileData
        })
        : []

    // Step 2: Group files by description
    const groupedFiles = projectFiles.reduce((acc, curr) => {
        if (curr.files && Array.isArray(curr.files)) {
            // Handle "Document" structure (nested files)
            const desc = curr.description || 'No Description'
            if (!acc[desc]) acc[desc] = []
            curr.files.forEach((f) => {
                acc[desc].push({
                    ...f,
                    uploadedAt: curr.uploadedAt || curr.createdAt || curr.date,
                    user: curr.user || curr.sender,
                    documentID: table === 'submittals' && parentId ? parentId : curr.id,
                    versionId: table === 'submittals' ? curr.id : (f.versionId || versionId),
                    stage: curr.stage
                })
            })
        } else {
            // Handle "Flat File" structure (e.g., RFI, Submittals)
            const desc = 'Attachments'
            if (!acc[desc]) acc[desc] = []
            acc[desc].push({
                ...curr,
                documentID: parentId, // Use passed parentId for flat files
                versionId: curr.versionId || versionId
            })
        }
        return acc
    }, {})

    const handleShare = async (e, file) => {
        e.preventDefault()
        e.stopPropagation()
        await shareFileSecurely(table, file.documentID, file.id, file.versionId || versionId)
    }

    const handleDownload = async (e, file) => {
        e.preventDefault()
        e.stopPropagation()
        await downloadFileSecurely(table, file.documentID, file.id, file.originalName, file.versionId || versionId)
    }

    const handleOpen = (e, file) => {
        e.preventDefault()
        openFileSecurely(table, file.documentID, file.id, file.versionId || versionId)
    }

    // Step 3: Render grouped sections
    return (
        <div className="space-y-4">
            {/* Header */}
            {!hideHeader && (
                <div className="flex justify-between items-center mb-2">
                    <h4 className="text-sm font-bold text-gray-700 uppercase tracking-tight">Project Files</h4>
                    {onAddFilesClick && (
                        <Button onClick={onAddFilesClick} className="scale-90 origin-right">
                            <Plus size={14} className="mr-1" /> Add Document
                        </Button>
                    )}
                </div>
            )}

            {/* Files grouped by description */}
            {Object.keys(groupedFiles).length > 0 ? (
                Object.entries(groupedFiles).map(([description, files]) => {
                    const firstFile = files[0]
                    const uploaderName = firstFile?.user
                        ? `${firstFile.user.firstName || firstFile.user.f_name || ''} ${firstFile.user.lastName || firstFile.user.l_name || ''
                        }`
                        : 'Unknown User'

                    return (
                        <div
                            key={description}
                            className="border border-gray-100 rounded-xl p-4 space-y-3 bg-white shadow-sm hover:shadow-md transition-shadow"
                        >
                            {/* Description + Stage */}
                            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
                                <div>
                                    <h5
                                        className="text-sm border-l-4 border-green-500 pl-3 sm:text-base font-bold text-gray-800"
                                        dangerouslySetInnerHTML={{ __html: description }}
                                    />
                                    <div className="flex flex-wrap items-center gap-3 mt-1.5 ml-4">
                                        {firstFile?.stage && (
                                            <p className="text-[10px] text-blue-600 font-bold bg-blue-50 px-2 py-0.5 rounded-full uppercase">
                                                {firstFile.stage}
                                            </p>
                                        )}
                                        {firstFile?.uploadedAt && (
                                            <p className="text-[10px] text-gray-400 font-medium">
                                                {formatDate ? formatDate(firstFile.uploadedAt) : new Date(firstFile.uploadedAt).toLocaleString()}
                                            </p>
                                        )}
                                        {uploaderName !== 'Unknown User' && (
                                            <p className="text-[10px] text-gray-400">
                                                by <span className="font-semibold text-gray-600">{uploaderName}</span>
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* File List */}
                            <div className="grid grid-cols-1 gap-2 mt-3">
                                {files.map((file, index) => (
                                    <div
                                        key={file.id || `file-${index}`}
                                        className="flex items-center gap-3 p-3 rounded-xl border border-gray-50 bg-gray-50/30 hover:bg-green-50/20 hover:border-green-100 transition-all group"
                                    >
                                        <div
                                            onClick={(e) => handleOpen(e, file)}
                                            className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer"
                                        >
                                            <div className="p-2 bg-white rounded-lg shadow-sm">
                                                <FileText size={18} className="text-green-600" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-gray-700 text-sm font-bold truncate group-hover:text-green-700">
                                                    {file.originalName || `File ${index + 1}`}
                                                </p>
                                                {file.stage && <p className="text-[10px] text-gray-400 font-medium">{file.stage}</p>}
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-1 opacity-1 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={(e) => handleShare(e, file)}
                                                className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                                                title="Share Link"
                                            >
                                                <Share2 size={16} />
                                            </button>
                                            <button
                                                onClick={(e) => handleDownload(e, file)}
                                                className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-all"
                                                title="Download"
                                            >
                                                <Download size={16} />
                                            </button>
                                        </div>

                                        <ChevronRight size={16} className="text-gray-300 group-hover:text-green-400 transition-colors" />
                                    </div>
                                ))}
                            </div>
                        </div>
                    )
                })
            ) : (
                // Empty State
                <div className="text-center py-10 border-2 border-dashed border-gray-100 rounded-2xl bg-gray-50/50">
                    <FileText className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                    <p className="text-sm font-medium text-gray-400">No files available</p>
                    {onAddFilesClick && (
                        <Button onClick={onAddFilesClick} className="mt-4 bg-green-600 text-white">
                            <Plus size={14} className="mr-2" /> Upload Files
                        </Button>
                    )}
                </div>
            )}
        </div>
    )
}

export default RenderFiles
