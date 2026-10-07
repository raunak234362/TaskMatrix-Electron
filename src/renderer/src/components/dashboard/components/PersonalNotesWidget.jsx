/* eslint-disable react/prop-types */
import React, { useMemo } from 'react'
import { MessageSquare } from 'lucide-react'
import DataTable from '../../ui/table'

const PersonalNotesWidget = ({ projectNotes = [] }) => {
  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    })
  }

  const columns = useMemo(() => [
    {
      header: 'Content / Stage',
      accessorKey: 'content',
      cell: ({ row }) => (
        <div className="flex items-start gap-4">
         
          <div className="flex flex-col min-w-0">
            <div
              className="text-sm font-medium "
              dangerouslySetInnerHTML={{ __html: row.original.content }}
            />
            <div className="mt-2 flex items-center gap-2">
              <span className="px-2 py-0.5 bg-amber-50 text-amber-600 border border-amber-100 text-[9px] font-black rounded-full uppercase tracking-widest">
                {row.original.stage || 'Update'}
              </span>
            </div>
          </div>
        </div>
      ),
    },
    {
      header: 'Date',
      accessorKey: 'createdAt',
      cell: ({ row }) => (
        <span className="text-sm font-semibold text- uppercase tracking-normal">
          {formatDate(row.original.createdAt)}
        </span>
      ),
    },
  ], [])

  return (
    <div className="bg-white flex-1 flex flex-col min-h-0">
      <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-100">
        <div className="flex items-center gap-2">
          
          <h3 className="text-md font-semibold uppercase text-black">Notes & Updates</h3>
        </div>
        <div className="px-2 py-1 bg-gray-50/50 border border-gray-100 rounded text-[10px] font-bold text-gray-500 uppercase tracking-widest">
          {projectNotes.length} NEW
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {projectNotes.length > 0 ? (
          <div className="w-full">
            <DataTable 
              columns={columns} 
              data={projectNotes} 
              pageSizeOptions={[5, 10, 25]} 
            />
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-48 text-gray-300 space-y-3">
            <MessageSquare size={40} className="text-gray-100" strokeWidth={1} />
            <p className="text-xs font-semibold  tracking-normal">No Updates</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default PersonalNotesWidget
