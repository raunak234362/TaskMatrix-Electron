import React from 'react'
import { FileText, Share2, Download, ChevronRight, Plus, FileSpreadsheet, File } from 'lucide-react'
import {
    openFileSecurely,
    downloadFileSecurely,
    shareFileSecurely
} from '../../utils/openFileSecurely'
import Button from '../fields/Button'
import { toast } from 'react-toastify'

const getFileIcon = (filename) => {
    const ext = filename?.split('.').pop()?.toLowerCase();
    switch (ext) {
        case 'pdf':
            return { icon: File, color: 'text-red-500', bgColor: 'bg-red-50', text: 'pdf', textColor: 'text-red-500' };
        case 'xlsx':
        case 'xls':
        case 'csv':
            return { icon: File, color: 'text-green-600', bgColor: 'bg-green-50', text: '.exe', textColor: 'text-green-600' };
        default:
            return { icon: FileText, color: 'text-blue-500', bgColor: 'bg-blue-50', text: null, textColor: null };
    }
};

const RenderFiles = ({ files, onAddFilesClick, formatDate, table, parentId, versionId, hideHeader = false, hideSectionTitle = false }) => {
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
                    documentID: (table === 'submittals' || table === 'bfa') && parentId ? parentId : curr.id,
                    versionId: (table === 'submittals' || table === 'bfa') ? curr.id : (f.versionId || versionId),
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
                   
                    {onAddFilesClick && (
                        <button
                            onClick={onAddFilesClick}
                            className="px-4 py-1.5 text-sm font-bold uppercase tracking-tight rounded-none border border-black hover:bg-slate-50 transition-all cursor-pointer"
                        >
                            <Plus size={14} className="inline mr-1" /> Add Document
                        </button>
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
                            className="border border-[#6bbd45]/40 bg-white rounded-none p-4 space-y-3 shadow-none"
                        >
                            {/* Description + Stage */}
                            {(!hideSectionTitle || firstFile?.stage || firstFile?.uploadedAt || uploaderName !== 'Unknown User') && (
                                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
                                    <div>
                                        {!hideSectionTitle && (
                                            <h5
                                                className="text-sm sm:text-base font-bold text-black uppercase tracking-wider"
                                                dangerouslySetInnerHTML={{ __html: description }}
                                            />
                                        )}
                                        {(firstFile?.stage || firstFile?.uploadedAt || uploaderName !== 'Unknown User') && (
                                            <div className="flex flex-wrap items-center gap-2 sm:gap-3 mt-1.5">
                                                {firstFile?.stage && (
                                                    <p className="text-xs text-blue-800 bg-blue-50 px-2 py-0.5 rounded-none border border-blue-200 font-semibold uppercase tracking-wider">
                                                        {firstFile.stage}
                                                    </p>
                                                )}
                                                {firstFile?.uploadedAt && (
                                                    <p className="text-xs text-black/60 font-medium">
                                                        {formatDate ? formatDate(firstFile.uploadedAt) : new Date(firstFile.uploadedAt).toLocaleString()}
                                                    </p>
                                                )}
                                                {uploaderName !== 'Unknown User' && (
                                                    <p className="text-xs text-black/60 font-medium">
                                                        by <span className="font-bold text-black">{uploaderName}</span>
                                                    </p>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* File List */}
                            <div className={`divide-y divide-black/5 bg-white ${(!hideSectionTitle || firstFile?.stage || firstFile?.uploadedAt || uploaderName !== 'Unknown User') ? "border-t border-black/10 mt-3" : ""}`}>
                                {files.map((file, index) => {
                                    const { icon: Icon, color, bgColor, text, textColor } = getFileIcon(file.originalName);
                                    return (
                                        <div
                                            key={file.id || `file-${index}`}
                                            className="flex items-center gap-2 py-2 px-3 rounded-none hover:bg-green-50/50 hover:text-black transition-colors group cursor-pointer"
                                            title={file.originalName || `File ${index + 1}`}
                                        >
                                            <div
                                                onClick={(e) => handleOpen(e, file)}
                                                className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer"
                                            >
                                                <div className={`p-1.5 rounded-none border border-black/10 ${bgColor} relative flex items-center justify-center`}>
                                                    <Icon size={18} className={color} strokeWidth={2} />
                                                    {text && (
                                                        <span className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-[7px] font-bold mt-[2px] ${textColor}`}>
                                                            {text}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-black text-sm font-semibold truncate group-hover:text-black">
                                                        {file.originalName || `File ${index + 1}`}
                                                    </p>
                                                    {file.stage && (
                                                        <p className="text-xs text-black/60 uppercase font-bold tracking-wider mt-0.5">
                                                            {file.stage}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-1 transition-opacity">
                                                <button
                                                    onClick={(e) => handleShare(e, file)}
                                                    className="p-1.5 text-black hover:text-green-700 hover:bg-green-50 rounded-none border border-transparent hover:border-black/20 transition-colors cursor-pointer"
                                                    title="Share Link"
                                                >
                                                    <Share2 size={16} />
                                                </button>
                                                <button
                                                    onClick={(e) => handleDownload(e, file)}
                                                    className="p-1.5 text-black hover:text-green-700 hover:bg-green-50 rounded-none border border-transparent hover:border-black/20 transition-colors cursor-pointer"
                                                    title="Download"
                                                >
                                                    <Download size={16} />
                                                </button>
                                            </div>

                                            <ChevronRight size={16} className="text-gray-400 group-hover:text-black transition-colors" />
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })
            ) : (
                // Empty State
                <div className="text-center py-8 border border-dashed border-black/30 rounded-none">
                    <FileText className="w-10 h-10 text-black/40 mx-auto mb-3" />
                    <p className="text-sm font-bold uppercase tracking-widest text-black/60">No files available</p>
                    {onAddFilesClick && (
                        <button
                            onClick={onAddFilesClick}
                            className="mt-4 inline-flex items-center gap-2 px-6 py-1.5 bg-green-50 text-black border-2 border-green-700/80 rounded-none hover:bg-green-100 transition-all font-bold text-sm uppercase tracking-tight shadow-sm cursor-pointer"
                        >
                            <Plus size={14} className="mr-2" /> Upload Files
                        </button>
                    )}
                </div>
            )}
        </div>
    )
}

export default RenderFiles
