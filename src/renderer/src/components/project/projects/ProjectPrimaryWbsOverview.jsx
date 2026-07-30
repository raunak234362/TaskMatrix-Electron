import React from 'react'
import { formatSeconds } from '../../../utils/timeUtils'

const WBS_CATEGORIES = [
  {
    key: 'modelling',
    label: 'Modelling',
    color: 'text-green-600',
    bg: 'bg-green-50'
  },
  {
    key: 'modelling_checking',
    label: 'Modeling C.',
    color: 'text-green-600',
    bg: 'bg-green-50'
  },
  {
    key: 'detailing',
    label: 'Detailing',
    color: 'text-green-600',
    bg: 'bg-green-50'
  },
  {
    key: 'detailing_checking',
    label: 'Detailing C.',
    color: 'text-green-600',
    bg: 'bg-green-50'
  },
  {
    key: 'erection',
    label: 'Erection',
    color: 'text-green-600',
    bg: 'bg-green-50'
  },
  {
    key: 'erection_checking',
    label: 'Erection C.',
    color: 'text-green-600',
    bg: 'bg-green-50'
  }
]

const ProjectPrimaryWbsOverview = ({ wbsCategoryTotals }) => {
  return (
    <div className="mt-12">
      <div className="pb-3 border-b border-gray-200 flex items-center gap-2 mb-6">
        <h4 className="text-sm font-semibold uppercase tracking-normal text-black">
          Primary WBS &mdash; Logged &amp; Allocated Time
        </h4>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
        {WBS_CATEGORIES.map((cat) => (
          <div
            key={cat.key}
            className="p-4 bg-slate-50/40 hover:bg-slate-50 transition-colors flex flex-col items-center justify-center text-center"
          >
            <span className="text-sm font-semibold uppercase tracking-normal text-black mb-2.5 truncate w-full">
              {cat.label}
            </span>
            <div className="flex flex-col gap-1.5 w-full max-w-[110px]">
              <div
                className={`px-2.5 py-1 rounded-none ${cat.bg} border border-[#6bbd45]/20 flex justify-between items-center text-sm shadow-none`}
              >
                <span className="font-semibold text-black uppercase tracking-normal">
                  W:
                </span>
                <span className={`font-semibold ${cat.color}`}>
                  {wbsCategoryTotals[cat.key]?.logged > 0
                    ? formatSeconds(wbsCategoryTotals[cat.key].logged)
                    : '00:00'}
                </span>
              </div>
              <div className="px-2.5 py-1 rounded-none bg-blue-50 border border-blue-100 flex justify-between items-center text-sm shadow-none">
                <span className="font-semibold text-black uppercase tracking-normal">
                  A:
                </span>
                <span className="font-semibold text-blue-600">
                  {wbsCategoryTotals[cat.key]?.allocated > 0
                    ? formatSeconds(wbsCategoryTotals[cat.key].allocated)
                    : '00:00'}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default ProjectPrimaryWbsOverview
