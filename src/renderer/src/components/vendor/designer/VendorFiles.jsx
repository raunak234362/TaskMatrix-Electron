/* eslint-disable react/prop-types */
import { useEffect, useState } from 'react'
import Service from '../../../api/Service'
import { toast } from 'react-toastify'
import {
    FileText, Eye, Trash2, Loader2, AlertCircle,
    Files, RefreshCcw, FileSpreadsheet, File
} from 'lucide-react'

// ─── File type helpers ────────────────────────────────────────────────────────

const getExtension = (name = '') => name.split('.').pop()?.toLowerCase() ?? ''

const FileIcon = ({ name }) => {
    const ext = getExtension(name)
    switch (ext) {
        case 'pdf':
            return { icon: FileText, color: 'text-red-500', bgColor: 'bg-red-50' };
        case 'xlsx':
        case 'xls':
        case 'csv':
            return { icon: FileSpreadsheet, color: 'text-green-600', bgColor: 'bg-green-50' };
        default:
            return { icon: File, color: 'text-blue-500', bgColor: 'bg-blue-50' };
    }
}

// ─── Single File Row ──────────────────────────────────────────────────────────

const FileRow = ({ file, vendorId, onDeleted }) => {
    const [viewing, setViewing] = useState(false)
    const [deleting, setDeleting] = useState(false)
    const [confirmDelete, setConfirmDelete] = useState(false)

    const fileId = file.id ?? file._id ?? file.fileId
    const fileName = file.originalName ?? file.name ?? file.fileName ?? `File ${fileId}`
    const { icon: Icon, color, bgColor } = FileIcon({ name: fileName })

    const handleView = async () => {
        try {
            setViewing(true)
            console.log('[VendorFiles] Viewing file:', vendorId, fileId)
            const blob = await Service.ViewFile(vendorId, fileId)
            const url = URL.createObjectURL(blob)
            window.open(url, '_blank')
        } catch (err) {
            console.error('[VendorFiles] View error:', err)
            toast.error('Failed to open file')
        } finally {
            setViewing(false)
        }
    }

    const handleDelete = async () => {
        try {
            setDeleting(true)
            console.log('[VendorFiles] Deleting file:', vendorId, fileId)
            await Service.DeleteFile(vendorId, fileId)
            toast.success(`"${fileName}" deleted.`)
            setConfirmDelete(false)
            onDeleted?.()
        } catch (err) {
            console.error('[VendorFiles] Delete error:', err)
            toast.error('Failed to delete file')
        } finally {
            setDeleting(false)
        }
    }

    return (
        <div className="flex items-center gap-4 p-4 rounded-2xl border border-gray-100 bg-white hover:shadow-md hover:bg-[#6bbd45]/10 group transition-all" title={fileName}>
            {/* Icon */}
            <div className={`p-3 ${bgColor} rounded-xl border border-gray-100 flex items-center justify-center shrink-0`}>
                <Icon size={18} className={color} />
            </div>

            {/* Name */}
            <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-gray-800 truncate group-hover:text-black transition-colors" title={fileName}>{fileName}</p>
                {file.createdAt && (
                    <p className="text-[10px] text-gray-400 font-medium mt-0.5">
                        {new Date(file.createdAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                    </p>
                )}
            </div>

            {/* Actions */}
            {!confirmDelete ? (
                <div className="flex items-center gap-2 transition-opacity">
                    <button
                        onClick={handleView}
                        disabled={viewing}
                        title="View / Open file"
                        className="p-2 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-all disabled:opacity-50"
                    >
                        {viewing ? <Loader2 size={16} className="animate-spin" /> : <Eye size={16} />}
                    </button>
                    <button
                        onClick={() => setConfirmDelete(true)}
                        title="Delete file"
                        className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-all"
                    >
                        <Trash2 size={16} />
                    </button>
                </div>
            ) : (
                /* Inline delete confirmation */
                <div className="flex items-center gap-2 animate-in fade-in">
                    <span className="text-[10px] font-black text-red-500 uppercase tracking-wider">Delete?</span>
                    <button
                        onClick={handleDelete}
                        disabled={deleting}
                        className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-[10px] font-black uppercase tracking-wider rounded-lg disabled:opacity-60 flex items-center gap-1"
                    >
                        {deleting ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
                        Yes
                    </button>
                    <button
                        onClick={() => setConfirmDelete(false)}
                        disabled={deleting}
                        className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-600 text-[10px] font-black uppercase tracking-wider rounded-lg disabled:opacity-60"
                    >
                        Cancel
                    </button>
                </div>
            )}
        </div>
    )
}

// ─── Vendor Files Panel ───────────────────────────────────────────────────────

const VendorFiles = ({ vendorId }) => {
    const [files, setFiles] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    const fetchFiles = async () => {
        try {
            setLoading(true)
            setError(null)
            console.log('[VendorFiles] Fetching files for vendor:', vendorId)
            const res = await Service.Getfiles(vendorId)
            console.log('[VendorFiles] Raw files response:', res)

            // Normalise: handle { data: [...] } or flat array
            let list = []
            if (Array.isArray(res)) list = res
            else if (Array.isArray(res?.data)) list = res.data

            console.log('[VendorFiles] Parsed files list:', list)
            setFiles(list)
        } catch (err) {
            console.error('[VendorFiles] Fetch error:', err)
            setError('Failed to load files.')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => { if (vendorId) fetchFiles() }, [vendorId])

    // ── Loading ──
    if (loading) return (
        <div className="flex items-center justify-center py-20 text-gray-400">
            <Loader2 className="animate-spin mr-2" size={22} />
            <span className="text-sm font-bold uppercase tracking-widest">Loading files...</span>
        </div>
    )

    // ── Error ──
    if (error) return (
        <div className="flex items-center justify-center py-20 text-red-500 gap-2">
            <AlertCircle size={20} />
            <span className="text-sm font-bold">{error}</span>
        </div>
    )

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h3 className="text-[11px] font-black text-gray-900 uppercase tracking-[0.2em] flex items-center gap-2">
                    <Files size={16} className="text-green-600" />
                    Documentation Vault
                    <span className="text-gray-300">•</span>
                    <span className="text-gray-400">{files.length} file{files.length !== 1 ? 's' : ''}</span>
                </h3>
                <button
                    onClick={fetchFiles}
                    className="p-2 rounded-lg text-gray-400 hover:text-green-600 hover:bg-green-50 transition-all"
                    title="Refresh"
                >
                    <RefreshCcw size={15} />
                </button>
            </div>

            {/* File list */}
            {files.length > 0 ? (
                <div className="space-y-3">
                    {files.map((file, idx) => (
                        <FileRow
                            key={file.id ?? file._id ?? idx}
                            file={file}
                            vendorId={vendorId}
                            onDeleted={fetchFiles}
                        />
                    ))}
                </div>
            ) : (
                <div className="text-center py-20 border-2 border-dashed border-gray-100 rounded-3xl bg-gray-50/50">
                    <Files size={44} className="mx-auto mb-4 text-gray-200" />
                    <p className="text-sm font-bold text-gray-400">No files attached to this vendor</p>
                    <p className="text-xs text-gray-300 mt-1">Files will appear here once uploaded</p>
                </div>
            )}
        </div>
    )
}

export default VendorFiles
