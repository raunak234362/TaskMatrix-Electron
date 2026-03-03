/* eslint-disable react/prop-types */
import { useEffect, useState } from 'react'
import { X, Save, Loader2, ArrowLeft } from 'lucide-react'
import { toast } from 'react-toastify'
import Service from '../../api/Service'
import Button from '../fields/Button'
import RichTextEditor from '../fields/RichTextEditor'

const EditInclusionExclusion = ({ estimationId, onCancel, onSuccess }) => {
  const [inclusions, setInclusions] = useState('')
  const [exclusions, setExclusions] = useState('')
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  // Helper to safely parse mixed legacy array / new rich text string
  const cleanHtmlList = (htmlString) => {
    if (!htmlString || typeof htmlString !== 'string') return '';
    let cleaned = htmlString;
    // Remove span styling that overrides displaying and blocks list items
    cleaned = cleaned.replace(/<span[^>]*>/gi, '').replace(/<\/span>/gi, '');

    // Convert LIs containing literal newlines into split LIs
    cleaned = cleaned.replace(/<li>([\s\S]*?)<\/li>/gi, (match, p1) => {
      const items = p1.split(/\r?\n/).map(i => i.trim()).filter(Boolean);
      if (items.length > 1) {
        return items.map(i => `<li>${i}</li>`).join('');
      }
      return match;
    });

    // If it's raw text without any lists but contains newlines, force standard HTML list
    if (!cleaned.includes('<ul') && !cleaned.includes('<ol')) {
      const plainLines = cleaned.replace(/<[^>]+>/g, ' ').split(/\r?\n/).map(i => i.trim()).filter(Boolean);
      if (plainLines.length > 1) {
        return `<ul>${plainLines.map(l => `<li>${l}</li>`).join('')}</ul>`;
      }
    }

    return cleaned;
  }

  const formatInitialData = (data) => {
    if (Array.isArray(data)) {
      return data.length > 0 ? `<ul>${data.map((item) => `<li>${item}</li>`).join('')}</ul>` : ''
    }
    if (typeof data === 'string') {
      try {
        const parsed = JSON.parse(data)
        if (Array.isArray(parsed)) {
          return parsed.length > 0
            ? `<ul>${parsed.map((item) => `<li>${item}</li>`).join('')}</ul>`
            : ''
        }
      } catch {
        return cleanHtmlList(data);
      }
    }
    return cleanHtmlList(data);
  }

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const response = await Service.GetEstimationById(estimationId)
        if (response?.data) {
          setInclusions(formatInitialData(response.data.inclusions))
          setExclusions(formatInitialData(response.data.exclusions))
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

  const handleSave = async () => {
    try {
      setSaving(true)
      const payload = {
        inclusions: cleanHtmlList(inclusions),
        exclusions: cleanHtmlList(exclusions)
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
        <button onClick={onCancel} className="text-black border border-black hover:text-black bg-red-100 hover:bg-red-200  px-3 py-1 rounded-md text-sm transition-colors">
         close
        </button>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Inclusions Input */}
        <div>
          <h3 className="text-md  text-green-700 bg-green-50 px-3 py-2 rounded-lg mb-4 border-l-4 border-green-500">
            Inclusions
          </h3>
          <RichTextEditor
            value={inclusions}
            onChange={setInclusions}
            placeholder="Add new inclusion..."
          />
        </div>

        {/* Exclusions Input */}
        <div>
          <h3 className="text-md  text-red-700 bg-red-50 px-3 py-2 rounded-lg mb-4 border-l-4 border-red-500">
            Exclusions
          </h3>
          <RichTextEditor
            value={exclusions}
            onChange={setExclusions}
            placeholder="Add new exclusion..."
          />
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
          className="bg-green-50 text-black hover:bg-green-100 flex items-center gap-2"
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
