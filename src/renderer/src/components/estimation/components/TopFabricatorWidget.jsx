/* eslint-disable react/prop-types */

import { Crown, Building2 } from 'lucide-react'

const TopFabricatorWidget = ({ fabricator }) => {
  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-full flex flex-col justify-center">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-800">Top Fabricator</h2>
        <Crown className="text-yellow-500" size={24} />
      </div>

      {fabricator ? (
        <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-6 border border-gray-200">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-white rounded-full shadow-sm">
              <Building2 className="text-gray-700" size={28} />
            </div>
            <div>
              <h3 className="text-xl  text-gray-800">{fabricator.name}</h3>
              <p className="text-sm text-gray-500">Most Estimations</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mt-4">
            <div className="bg-white p-3 rounded-lg shadow-sm">
              <p className="text-xs text-gray-500 uppercase font-semibold">Projects</p>
              <p className="text-xl  text-gray-800">{fabricator.projectCount}</p>
            </div>
            <div className="bg-white p-3 rounded-lg shadow-sm">
              <p className="text-xs text-gray-500 uppercase font-semibold">Total Hours</p>
              <p className="text-xl  text-gray-800">{fabricator.totalHours.toFixed(2)}</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center h-40 bg-gray-50 rounded-xl border border-dashed border-gray-200">
          <Building2 className="text-gray-400 mb-2" size={32} />
          <p className="text-gray-500">No data available
        </div>
      )}
    </div>
  )
}

export default TopFabricatorWidget
