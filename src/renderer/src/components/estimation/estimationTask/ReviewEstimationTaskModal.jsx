/* eslint-disable react/prop-types */
'use client'

import React, { useState } from 'react'
import { X, CheckCircle2, MessageSquare, Loader2, Clock, Play, Pause, AlertCircle } from 'lucide-react'
import { toast } from 'react-toastify'
import Service from '../../../api/Service'
import RichTextEditor from '../../fields/RichTextEditor'
import Select from 'react-select'

const ReviewEstimationTaskModal = ({ task, onClose, refresh }) => {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [reviewNotes, setReviewNotes] = useState('')
  const [status, setStatus] = useState(task?.status || 'ASSIGNED')
  
  const currentUserId = sessionStorage.getItem('userId')

  const statusOptions = [
    { label: 'Assigned', value: 'ASSIGNED', icon: <Clock className="w-4 h-4" /> },
    { label: 'In Progress', value: 'IN_PROGRESS', icon: <Play className="w-4 h-4" /> },
    { label: 'On Break', value: 'BREAK', icon: <Pause className="w-4 h-4" /> },
    { label: 'Completed', value: 'COMPLETED', icon: <CheckCircle2 className="w-4 h-4" /> },
    { label: 'Pending', value: 'PENDING', icon: <AlertCircle className="w-4 h-4" /> },
    { label: 'Absent', value: 'ABSENT', icon: <AlertCircle className="w-4 h-4" /> },
    { label: 'Wrong Allocation', value: 'WRONG_ALLOCATION', icon: <AlertCircle className="w-4 h-4" /> },
    { label: 'Rework', value: 'REWORK', icon: <AlertCircle className="w-4 h-4" /> },
  ]

  const handleReview = async () => {
    if (!reviewNotes.trim()) {
      toast.warning('Please provide review notes')
      return
    }

    try {
      setIsSubmitting(true)
      const payload = {
        status,
        reviewNotes,
        reviewedById: currentUserId
      }
      await Service.ReviewEstimationTaskById(task.id, payload)
      toast.success('Review submitted successfully')
      refresh?.()
      onClose()
    } catch (error) {
      console.error('Error submitting review:', error)
      toast.error('Failed to submit review')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl border border-gray-200 overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="bg-white px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h3 className="text-lg font-black text-black tracking-tight uppercase flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-indigo-600" />
            Review Estimation Task
          </h3>
          <button
            onClick={onClose}
            className="px-6 py-1.5 bg-red-50 text-black border-2 border-red-700/80 rounded-lg hover:bg-red-100 transition-all font-bold text-sm uppercase tracking-tight shadow-sm"
          >
            Close
          </button>
        </div>

        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
          {/* Status Selection */}
          <div>
            <p className="text-sm text-slate-500 mb-3 font-medium uppercase tracking-wider">
              Update Status
            </p>
            <Select
              options={statusOptions}
              value={statusOptions.find((opt) => opt.value === status)}
              onChange={(option) => setStatus(option.value)}
              className="text-sm"
              styles={{
                control: (base) => ({
                  ...base,
                  borderRadius: '0.75rem',
                  padding: '4px',
                  borderColor: '#e5e7eb',
                  '&:hover': { borderColor: '#4f46e5' }
                })
              }}
              formatOptionLabel={(option) => (
                <div className="flex items-center gap-3">
                  {option.icon}
                  <span>{option.label}</span>
                </div>
              )}
            />
          </div>

          {/* Review Notes */}
          <div>
            <p className="text-sm text-slate-500 mb-3 font-medium uppercase tracking-wider">
              Review Notes
            </p>
            <div className="min-h-[200px]">
              <RichTextEditor
                value={reviewNotes}
                onChange={setReviewNotes}
                placeholder="Enter your review feedback here..."
              />
            </div>
          </div>
        </div>

        <div className="bg-white px-6 py-4 flex justify-end gap-3 border-t border-gray-200">
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="px-6 py-2 bg-gray-50 border border-gray-300 hover:bg-gray-100 text-black rounded-lg text-[10px] font-black uppercase tracking-[0.2em] transition-all disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleReview}
            disabled={isSubmitting}
            className="px-6 py-2 bg-indigo-600 text-white hover:bg-indigo-700 rounded-lg text-[10px] font-black uppercase tracking-[0.2em] transition-all disabled:opacity-50 flex items-center gap-2"
          >
            {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
            Submit Review
          </button>
        </div>
      </div>
    </div>
  )
}

export default ReviewEstimationTaskModal
