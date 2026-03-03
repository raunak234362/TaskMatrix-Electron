/* eslint-disable react/prop-types */
import { useEffect, useState } from 'react'
import { Loader2, Pencil } from 'lucide-react'
import Service from '../../api/Service'

const InclusionExclusion = ({ estimationId, onEdit }) => {
  const [inclusions, setInclusions] = useState('')
  const [exclusions, setExclusions] = useState('')
  const [loading, setLoading] = useState(false)

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

  const formatData = (data) => {
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
      if (!estimationId) return
      try {
        setLoading(true)
        const response = await Service.GetEstimationById(estimationId)
        if (response?.data) {
          setInclusions(formatData(response.data.inclusions))
          setExclusions(formatData(response.data.exclusions))
        }
      } catch (error) {
        console.error('Error fetching inclusions/exclusions:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [estimationId])

  if (loading) {
    return (
      <div className="flex justify-center p-4">
        <Loader2 className="animate-spin text-gray-500" />
      </div>
    )
  }

  return (
    <div className="bg-white p-6 rounded-xl shadow-xs border border-gray-200 relative">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-gray-800">Scope of Work</h2>
        {onEdit && (
          <button
            onClick={onEdit}
            className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
            title="Edit Scope"
          >
            <Pencil className="w-5 h-5" />
          </button>
        )}
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Inclusions Column */}
        <div>
          <h3 className="text-md  text-green-700 bg-green-50 px-3 py-2 rounded-lg mb-3 border-l-4 border-green-500">
            Inclusions
          </h3>
          {inclusions ? (
            <div
              className="text-gray-700 text-sm [&_ul]:list-disc [&_ul]:ml-5 [&_ol]:list-decimal [&_ol]:ml-5 [&_li]:mb-1 [&_p]:mb-2"
              dangerouslySetInnerHTML={{ __html: inclusions }}
            />
          ) : (
            <p className="text-gray-400 italic text-sm pl-3">No inclusions specified.</p>
          )}
        </div>

        {/* Exclusions Column */}
        <div>
          <h3 className="text-md  text-red-700 bg-red-50 px-3 py-2 rounded-lg mb-3 border-l-4 border-red-500">
            Exclusions
          </h3>
          {exclusions ? (
            <div
              className="text-gray-700 text-sm [&_ul]:list-disc [&_ul]:ml-5 [&_ol]:list-decimal [&_ol]:ml-5 [&_li]:mb-1 [&_p]:mb-2"
              dangerouslySetInnerHTML={{ __html: exclusions }}
            />
          ) : (
            <p className="text-gray-400 italic text-sm pl-3">No exclusions specified.</p>
          )}
        </div>
      </div>
    </div>
  )
}

export default InclusionExclusion
