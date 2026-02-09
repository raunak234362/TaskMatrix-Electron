/* eslint-disable react/prop-types */
import { useEffect, useState } from 'react'
import { Loader2, Pencil } from 'lucide-react'
import Service from '../../api/Service'

const InclusionExclusion = ({ estimationId, onEdit }) => {
  const [inclusions, setInclusions] = useState([])
  const [exclusions, setExclusions] = useState([])
  const [loading, setLoading] = useState(false)

  // Helper to safely parse JSON arrays
  const parseArray = (data) => {
    if (Array.isArray(data)) return data
    if (typeof data === 'string') {
      try {
        // Handle cases where data is double-stringified or simple JSON
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
      if (!estimationId) return
      try {
        setLoading(true)
        const response = await Service.GetEstimationById(estimationId)
        if (response?.data) {
          setInclusions(parseArray(response.data.inclusions))
          setExclusions(parseArray(response.data.exclusions))
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
          {inclusions.length > 0 ? (
            <ul className="space-y-2">
              {inclusions.map((item, index) => (
                <li key={index} className="flex items-start text-gray-700">
                  <span className="mr-2 text-green-500 ">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-400 italic text-sm pl-3">No inclusions specified.</p>
          )}
        </div>

        {/* Exclusions Column */}
        <div>
          <h3 className="text-md  text-red-700 bg-red-50 px-3 py-2 rounded-lg mb-3 border-l-4 border-red-500">
            Exclusions
          </h3>
          {exclusions.length > 0 ? (
            <ul className="space-y-2">
              {exclusions.map((item, index) => (
                <li key={index} className="flex items-start text-gray-700">
                  <span className="mr-2 text-red-500 ">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-400 italic text-sm pl-3">No exclusions specified.</p>
          )}
        </div>
      </div>
    </div>
  )
}

export default InclusionExclusion
