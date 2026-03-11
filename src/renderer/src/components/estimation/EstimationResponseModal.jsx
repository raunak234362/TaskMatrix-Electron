/* eslint-disable react/prop-types */
import { useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { Loader2, X, Paperclip, Send, MessageSquare } from 'lucide-react'
import { toast } from 'react-toastify'
import Service from '../../api/Service'
import MultipleFileUpload from '../fields/MultipleFileUpload'
import RichTextEditor from '../fields/RichTextEditor'

/**
 * EstimationResponseModal
 * Props:
 *  - estimationId  : string  (required) — the estimation to respond to
 *  - onClose       : () => void
 *  - onSuccess     : () => void  — called after a successful submission
 *  - parentResponseId : string | null  (optional) — for threaded replies
 */
const EstimationResponseModal = ({ estimationId, onClose, onSuccess, parentResponseId = null }) => {
    const [files, setFiles] = useState([])
    const [isSubmitting, setIsSubmitting] = useState(false)

    const {
        handleSubmit,
        control,
        reset,
        formState: { errors }
    } = useForm({
        defaultValues: {
            message: ''
        }
    })

    const onSubmit = async (data) => {
        if (!data.message?.trim() && files.length === 0) {
            toast.error('Please add a message or attach at least one file.')
            return
        }

        try {
            setIsSubmitting(true)

            const formData = new FormData()
            formData.append('message', data.message || '')

            if (parentResponseId) {
                formData.append('parentResponseId', parentResponseId)
            }

            files.forEach((file) => formData.append('files', file))

            await Service.AddEstimationResponse(formData, estimationId)

            toast.success('Response added successfully')
            reset()
            setFiles([])
            onSuccess?.()
            onClose()
        } catch (error) {
            console.error('Failed to submit estimation response:', error)
            toast.error('Failed to submit response. Please try again.')
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-gray-200 flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200">

                {/* HEADER */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 shrink-0 bg-white">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-green-50 rounded-lg border border-green-100">
                            <MessageSquare className="w-4 h-4 text-green-600" />
                        </div>
                        <div>
                            <h2 className="text-base font-black text-black tracking-tight">Add Response</h2>
                            <p className="text-[10px] font-black text-black/40 uppercase tracking-[0.2em]">
                                {parentResponseId ? 'Reply to a response' : 'New estimation response'}
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                        aria-label="Close"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* BODY */}
                <form
                    id="estimation-response-form"
                    onSubmit={handleSubmit(onSubmit)}
                    className="flex-1 overflow-y-auto custom-scrollbar"
                >
                    <div className="p-6 space-y-6">

                        {/* Message */}
                        <div className="space-y-2">
                            <label className="block text-[10px] font-black text-black uppercase tracking-widest">
                                Message
                            </label>
                            <Controller
                                name="message"
                                control={control}
                                render={({ field }) => (
                                    <RichTextEditor
                                        value={field.value || ''}
                                        onChange={field.onChange}
                                        placeholder="Type your response message here..."
                                    />
                                )}
                            />
                            {errors.message && (
                                <p className="text-red-500 text-xs">{errors.message.message}</p>
                            )}
                        </div>

                        {/* File Attachments */}
                        <div className="space-y-2">
                            <label className="flex items-center gap-2 text-[10px] font-black text-black uppercase tracking-widest">
                                <Paperclip className="w-3.5 h-3.5" />
                                Attachments
                            </label>
                            <div className="border border-dashed border-gray-300 rounded-xl p-4 bg-gray-50 hover:bg-gray-100 transition-colors">
                                <MultipleFileUpload onFilesChange={(uploaded) => setFiles(uploaded)} />
                            </div>
                            {files.length > 0 && (
                                <p className="text-xs text-gray-500 font-medium">
                                    {files.length} file{files.length > 1 ? 's' : ''} selected
                                </p>
                            )}
                        </div>

                    </div>
                </form>

                {/* FOOTER */}
                <div className="px-6 py-4 border-t border-gray-200 bg-white flex justify-end gap-3 shrink-0">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={isSubmitting}
                        className="px-6 py-2.5 bg-gray-50 border border-gray-300 hover:bg-gray-100 text-black rounded-lg text-[10px] font-black uppercase tracking-[0.2em] transition-all disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    <button
                        form="estimation-response-form"
                        type="submit"
                        disabled={isSubmitting}
                        className="px-6 py-2.5 bg-[#6bbd45]/15 hover:bg-[#6bbd45]/30 text-black border border-black rounded-lg text-[10px] font-black uppercase tracking-[0.2em] shadow-sm transition-all flex items-center gap-2 active:scale-95 disabled:opacity-50"
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 className="animate-spin w-4 h-4" />
                                <span>Submitting...</span>
                            </>
                        ) : (
                            <>
                                <Send className="w-3.5 h-3.5" />
                                <span>Submit Response</span>
                            </>
                        )}
                    </button>
                </div>

            </div>
        </div>
    )
}

export default EstimationResponseModal
