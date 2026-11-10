import React, { useState } from 'react'
import { createPortal } from 'react-dom'
import { Save, X } from 'lucide-react'
import { toast } from 'react-toastify'
import SelfTaskService from '../../../api/services/selftask.service'

const CATEGORY_OPTIONS = [
  'Training', 'Task Assignment', 'Meeting', 'Report Update', 'Operations',
  'Research', 'Daily Server Check', 'Hourly Basis Report', 'Development',
  'Bug Fix', 'Code Review', 'Documentation', 'Testing'
]

const toDateInput = (value) => {
  if (!value) return ''
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? String(value).slice(0, 10) : date.toISOString().slice(0, 10)
}

const EditSelfTask = ({ task, onClose, onSuccess }) => {
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    name: task.name || '',
    description: task.description || '',
    categoryTag: task.categoryTag || '',
    priority: Number(task.priority) || 2,
    start_date: toDateInput(task.start_date)
  })

  const updateField = (event) => setForm((current) => ({ ...current, [event.target.name]: event.target.value }))
  const selectedCategories = form.categoryTag.split(',').map((category) => category.trim()).filter(Boolean)
  const toggleCategory = (category) => {
    const next = selectedCategories.includes(category)
      ? selectedCategories.filter((item) => item !== category)
      : [...selectedCategories, category]
    setForm((current) => ({ ...current, categoryTag: next.join(', ') }))
  }

  const submit = async (event) => {
    event.preventDefault()
    const id = task.id ?? task._id
    if (!id || !form.name.trim() || !form.categoryTag.trim() || !form.start_date) return
    const payload = {
      name: form.name.trim(),
      description: form.description.trim(),
      categoryTag: form.categoryTag.trim(),
      priority: Number(form.priority),
      start_date: form.start_date
    }
    const teamId = task.teamId ?? task.team?.id ?? task.team?._id
    const userId = task.user_id ?? task.userId ?? task.user?.id ?? task.user?._id
    if (teamId != null) payload.teamId = teamId
    if (userId != null) payload.user_id = userId

    try {
      setSaving(true)
      const response = await SelfTaskService.updateSelfAssignedTaskById(id, payload)
      if (response?.success === false || response?.status === false || response?.error) {
        throw new Error(response?.message || 'Failed to update self task')
      }
      toast.success('Self task updated successfully')
      onSuccess?.()
    } catch (error) {
      toast.error(error?.response?.data?.message || error?.message || 'Failed to update self task')
    } finally {
      setSaving(false)
    }
  }

  if (typeof document === 'undefined') return null
  const inputClass = 'w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-800 outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100'

  return createPortal(
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/50 p-4" onMouseDown={(event) => event.target === event.currentTarget && !saving && onClose?.()}>
      <section role="dialog" aria-modal="true" aria-labelledby="edit-self-task-title" className="w-full max-w-2xl overflow-hidden rounded-xl bg-white shadow-2xl">
        <header className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-green-700">Self-assigned task</p>
            <h2 id="edit-self-task-title" className="mt-1 text-lg font-bold text-gray-900">Edit task</h2>
          </div>
          <button type="button" disabled={saving} onClick={onClose} aria-label="Close edit form" className="rounded-md p-2 text-gray-500 hover:bg-gray-100 disabled:opacity-50"><X className="h-5 w-5" /></button>
        </header>
        <form onSubmit={submit} className="space-y-4 p-6">
          <label className="block text-xs font-semibold text-gray-700">Task name
            <input name="name" value={form.name} onChange={updateField} required maxLength={200} className={`${inputClass} mt-1`} />
          </label>
          <label className="block text-xs font-semibold text-gray-700">Description
            <textarea name="description" value={form.description} onChange={updateField} rows={4} className={`${inputClass} mt-1 resize-y`} />
          </label>
          <div className="grid gap-4 sm:grid-cols-3">
            <label className="block text-xs font-semibold text-gray-700">Categories
              <input name="categoryTag" value={form.categoryTag} onChange={updateField} required placeholder="Separate categories with commas" className={`${inputClass} mt-1`} />
              <span className="mt-1 block text-[11px] font-normal text-gray-500">Select any number of suggestions, or enter comma separated categories.</span>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {CATEGORY_OPTIONS.map((category) => (
                  <button key={category} type="button" aria-pressed={selectedCategories.includes(category)} onClick={() => toggleCategory(category)} className={`rounded border px-2 py-1 text-[10px] font-medium ${selectedCategories.includes(category) ? 'border-green-300 bg-green-50 text-green-800' : 'border-gray-200 bg-gray-50 text-gray-600 hover:bg-gray-100'}`}>
                    {category}
                  </button>
                ))}
              </div>
            </label>
            <label className="block text-xs font-semibold text-gray-700">Priority
              <select name="priority" value={form.priority} onChange={updateField} className={`${inputClass} mt-1`}>
                <option value={1}>Low</option><option value={2}>Medium</option><option value={3}>High</option><option value={4}>Critical</option>
              </select>
            </label>
            <label className="block text-xs font-semibold text-gray-700">Start date
              <input type="date" name="start_date" value={form.start_date} onChange={updateField} required className={`${inputClass} mt-1`} />
            </label>
          </div>
          <div className="flex justify-end gap-2 border-t border-gray-200 pt-4">
            <button type="button" disabled={saving} onClick={onClose} className="rounded-md border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50">Cancel</button>
            <button type="submit" disabled={saving || !form.name.trim() || !form.categoryTag.trim()} className="inline-flex items-center gap-2 rounded-md bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50">
              <Save className="h-4 w-4" />{saving ? 'Saving...' : 'Save changes'}
            </button>
          </div>
        </form>
      </section>
    </div>,
    document.body
  )
}

export default EditSelfTask
