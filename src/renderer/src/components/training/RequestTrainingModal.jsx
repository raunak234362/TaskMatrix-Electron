import React, { useState } from 'react'
import { createPortal } from 'react-dom'
import { Loader2, GraduationCap, X } from 'lucide-react'
import Service from '../../api/Service'
import { toast } from 'react-toastify'

const RequestTrainingModal = ({ taskId, onClose }) => {
  const [topic, setTopic] = useState('')
  const [reason, setReason] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!topic.trim()) return toast.warning('Please enter a topic')
    if (!reason.trim() || reason.trim().length < 10)
      return toast.warning('Please provide a reason (min 10 characters)')

    try {
      setSubmitting(true)
      await Service.RequestTraining({ taskId, topic: topic.trim(), reason: reason.trim() })
      toast.success('Training request submitted successfully!')
      onClose()
    } catch (err) {
      console.error(err)
      toast.error('Failed to submit training request')
    } finally {
      setSubmitting(false)
    }
  }

  return createPortal(
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 space-y-6 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#6bbd45]/15 rounded-xl text-[#6bbd45]">
              <GraduationCap className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-gray-800">Request Training</h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-xl transition-colors text-gray-500"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-sm text-gray-500">
          Submit a training request for this task. It will be reviewed by your manager.
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Topic */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
              Topic <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g. SDS2 Connection Design, AutoCAD Basics..."
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#6bbd45] focus:ring-2 focus:ring-[#6bbd45]/20 outline-none transition-all text-gray-700 bg-white placeholder:text-gray-400 text-sm"
            />
          </div>

          {/* Reason */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
              Reason / Description <span className="text-red-500">*</span>
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={4}
              placeholder="Describe why this training is needed, what you're struggling with, and what outcome you expect..."
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#6bbd45] focus:ring-2 focus:ring-[#6bbd45]/20 outline-none transition-all resize-none text-gray-700 bg-white placeholder:text-gray-400 text-sm"
            />
            <p className="text-xs text-gray-400">Minimum 10 characters</p>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 border border-gray-200 text-gray-600 font-semibold rounded-xl hover:bg-gray-50 transition-colors text-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !topic.trim() || reason.trim().length < 10}
              className="flex-1 py-3 bg-[#6bbd45] hover:bg-[#5aab37] text-white font-semibold rounded-xl transition-all shadow-md flex items-center justify-center gap-2 text-sm disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <GraduationCap className="w-4 h-4" />
                  Submit Request
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  )
}

export default RequestTrainingModal
