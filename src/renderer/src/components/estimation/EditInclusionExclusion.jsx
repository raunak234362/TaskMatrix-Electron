/* eslint-disable react/prop-types */
import { useEffect, useState } from 'react'
import { Plus, X, Save, Loader2, ArrowLeft } from 'lucide-react'
import { toast } from 'react-toastify'
import Service from '../../api/Service'
import Button from '../fields/Button'

const EditInclusionExclusion = ({ estimationId, onCancel, onSuccess }) => {
  const [inclusions, setInclusions] = useState([])
  const [exclusions, setExclusions] = useState([])
  const [newInclusion, setNewInclusion] = useState('')
  const [newExclusion, setNewExclusion] = useState('')
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  // Helper to safely parse JSON arrays
  const parseArray = (data) => {
    if (Array.isArray(data)) return data
    if (typeof data === 'string') {
      try {
        const parsed = JSON.parse(data)
        return Array.isArray(parsed) ? parsed : []
      } catch {
        console.error('Failed to parse array:', data)
        return []
      }
    }
    return []
  }

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const response = await Service.GetEstimationById(estimationId)
        if (response?.data) {
          setInclusions(parseArray(response.data.inclusions))
          setExclusions(parseArray(response.data.exclusions))
        }
      } catch (error) {
        toast.error('Failed to load current data.')
        console.error('Error fetching data:', error)
      } finally {
        setLoading(false)
      }
    }

    if (estimationId) {
      fetchData()
    }
  }, [estimationId])

  const handleAddInclusion = () => {
    if (newInclusion.trim()) {
      setInclusions([...inclusions, newInclusion.trim()])
      setNewInclusion('')
    }
  }

  const handleRemoveInclusion = (index) => {
    const updated = [...inclusions]
    updated.splice(index, 1)
    setInclusions(updated)
  }

  const handleAddExclusion = () => {
    if (newExclusion.trim()) {
      setExclusions([...exclusions, newExclusion.trim()])
      setNewExclusion('')
    }
  }

  const handleRemoveExclusion = (index) => {
    const updated = [...exclusions]
    updated.splice(index, 1)
    setExclusions(updated)
  }

  const cleanArray = (arr) => {
    return arr.filter((item) => item !== null && item !== undefined && item !== '')
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      const payload = {
        inclusions: cleanArray(inclusions),
        exclusions: cleanArray(exclusions)
      }

      await Service.UpdateEstimationById(estimationId, payload)
      toast.success('Scope updated successfully!')
      onSuccess()
    } catch (error) {
      toast.error('Failed to save changes.')
      console.error('Error saving scope:', error)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center p-8 bg-white rounded-xl shadow-xs border border-gray-200">
        <Loader2 className="animate-spin text-gray-500 mr-2" /> Loading...
      </div>
    )
  }

  return (
    <div className="bg-white p-6 rounded-xl shadow-xs border border-gray-200">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl  text-gray-800">Edit Scope of Work</h2>
        <button onClick={onCancel} className="text-gray-500 hover:text-gray-700 p-2">
          <X className="w-6 h-6" />
        </button>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Inclusions Input */}
        <div>
          <h3 className="text-md  text-green-700 bg-green-50 px-3 py-2 rounded-lg mb-4 border-l-4 border-green-500">
            Inclusions
          </h3>
          <div className="flex gap-2 mb-4">
            <input
              type="text"
              value={newInclusion}
              onChange={(e) => setNewInclusion(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddInclusion()}
              placeholder="Add new inclusion..."
              className="flex-1 p-2 border border-blue-200 rounded-md focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={handleAddInclusion}
              className="bg-green-600 text-white p-2 rounded-md hover:bg-green-700 transition-colors"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>
          <ul className="space-y-2 max-h-60 overflow-y-auto pr-1">
            {inclusions.map((item, index) => (
              <li
                key={index}
                className="flex items-center justify-between bg-gray-50 p-2 rounded-md border border-gray-100 group"
              >
                <span className="text-gray-700 break-all">{item}</span>
                <button
                  onClick={() => handleRemoveInclusion(index)}
                  className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-4 h-4" />
                </button>
              </li>
            ))}
          </ul>
        </div>

        {/* Exclusions Input */}
        <div>
          <h3 className="text-md  text-red-700 bg-red-50 px-3 py-2 rounded-lg mb-4 border-l-4 border-red-500">
            Exclusions
          </h3>
          <div className="flex gap-2 mb-4">
            <input
              type="text"
              value={newExclusion}
              onChange={(e) => setNewExclusion(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddExclusion()}
              placeholder="Add new exclusion..."
              className="flex-1 p-2 border border-blue-200 rounded-md focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={handleAddExclusion}
              className="bg-red-600 text-white p-2 rounded-md hover:bg-red-700 transition-colors"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>
          <ul className="space-y-2 max-h-60 overflow-y-auto pr-1">
            {exclusions.map((item, index) => (
              <li
                key={index}
                className="flex items-center justify-between bg-gray-50 p-2 rounded-md border border-gray-100 group"
              >
                <span className="text-gray-700 break-all">{item}</span>
                <button
                  onClick={() => handleRemoveExclusion(index)}
                  className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-4 h-4" />
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="mt-8 flex justify-end gap-3 pt-4 border-t border-gray-100">
        <Button
          onClick={onCancel}
          className="bg-gray-100 text-gray-700 hover:bg-gray-200 flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" /> Cancel
        </Button>
        <Button
          onClick={handleSave}
          className="bg-blue-600 text-white hover:bg-blue-700 flex items-center gap-2"
          disabled={saving}
        >
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" /> Saving...
            </>
          ) : (
            <>
              <Save className="w-4 h-4" /> Save Scope
            </>
          )}
        </Button>
      </div>
    </div>
  )
}

export default EditInclusionExclusion
