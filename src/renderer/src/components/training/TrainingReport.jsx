import React, { useState, useEffect, useMemo } from 'react'
import { Calendar, Loader2, Users, FileText, Download, Search } from 'lucide-react'
import Service from '../../api/Service'
import { toast } from 'react-toastify'
import DataTable from '../ui/table'

const TrainingReport = () => {
  const [loading, setLoading] = useState(false)
  const [year, setYear] = useState(new Date().getFullYear())
  const [month, setMonth] = useState(new Date().getMonth() + 1)
  const [reportData, setReportData] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [filterDate, setFilterDate] = useState('')

  const fetchReport = async () => {
    try {
      setLoading(true)
      const data = await Service.GetMonthlyTrainingReport(year, month)
      if (Array.isArray(data)) {
        setReportData(data)
      } else if (data?.data && Array.isArray(data.data)) {
        setReportData(data.data)
      } else {
        setReportData([])
      }
    } catch (error) {
      console.error(error)
      toast.error('Failed to fetch training report')
      setReportData([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchReport()
  }, [year, month])

  const filteredData = useMemo(() => {
    return reportData.filter((item) => {
      // Generic search across all primitive values
      const searchableValues = Object.entries(item)
        .filter(([key, val]) => typeof val !== 'object')
        .map(([key, val]) => String(val).toLowerCase())
      
      const matchesSearch = searchTerm === '' || searchableValues.some(v => v.includes(searchTerm.toLowerCase()))
      const matchesDate = filterDate === '' || searchableValues.some(v => v.includes(filterDate))
      
      return matchesSearch && matchesDate
    })
  }, [reportData, searchTerm, filterDate])

  const columns = useMemo(() => {
    if (!reportData || reportData.length === 0) return []
    const sample = reportData[0]
    
    const hiddenKeys = ['id', '_id', 'requestid', 'userid', 'originaltaskserial', 'taskserial', 'taskId']
    
    return Object.keys(sample)
      .filter((key) => {
        if (typeof sample[key] === 'object') return false
        if (hiddenKeys.includes(key.toLowerCase())) return false
        return true
      })
      .sort((a, b) => {
        if (a === 'requestedAt' && b !== 'requestedAt') return 1
        if (b === 'requestedAt' && a !== 'requestedAt') return -1
        return 0
      })
      .map((key) => {
        let header = key.replace(/([A-Z])/g, ' $1').trim().toUpperCase()
        if (key === 'isTrainingDone') header = 'IS TRAINING GIVEN'
        if (key === 'isTaskAssigned') header = 'IS TASK ASSIGNED FOR TRAINING'

        return {
          accessorKey: key,
          header: header,
          cell: ({ row }) => {
            const val = row.original[key]
            
            if (key === 'isTrainingDone') {
              const isTrue = val === true || val === 'true' || val === 1 || val === '1' || val === 'Yes' || val === 'Given'
              return (
                <span className={`text-sm font-bold ${isTrue ? 'text-green-600' : 'text-red-500'}`}>
                  {isTrue ? 'Given' : 'Not Given'}
                </span>
              )
            }
            
            if (key === 'isTaskAssigned') {
              const isTrue = val === true || val === 'true' || val === 1 || val === '1' || val === 'Yes'
              return (
                <span className={`text-sm font-bold ${isTrue ? 'text-green-600' : 'text-gray-500'}`}>
                  {isTrue ? 'Yes' : 'Not Assigned'}
                </span>
              )
            }
            
            if (key === 'requestedAt') {
              let dateStr = '—'
              if (val) {
                try {
                  dateStr = new Intl.DateTimeFormat('en-IN', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric'
                  }).format(new Date(val))
                } catch (e) {
                  dateStr = String(val)
                }
              }
              return (
                <span className="text-gray-700 font-medium text-sm whitespace-nowrap">
                  {dateStr}
                </span>
              )
            }

            return (
              <span className="text-gray-700 font-medium text-sm">
                {String(val ?? '—')}
              </span>
            )
          }
        }
      })
  }, [reportData])

  const handleExport = () => {
    if (filteredData.length === 0) return toast.info('No data to export')
    
    const allKeys = new Set()
    filteredData.forEach(item => {
      Object.keys(item).forEach(key => {
        if (typeof item[key] !== 'object') allKeys.add(key)
      })
    })
    
    const header = Array.from(allKeys)
    const csvRows = [header.join(',')]
    
    for (const row of filteredData) {
      const values = header.map(key => {
        const val = row[key]
        return `"${String(val || '').replace(/"/g, '""')}"`
      })
      csvRows.push(values.join(','))
    }
    
    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `Training_Report_${year}_${month}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="bg-white rounded-none border border-gray-200 shadow-sm overflow-hidden h-full flex flex-col animate-in fade-in zoom-in-95 duration-200">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-6 border-b border-gray-200 bg-[#f4faf0] shrink-0 gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-green-100 rounded-none text-green-700 border border-green-300">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-800 uppercase tracking-tight">Training Report</h2>
            <p className="text-sm text-gray-600 font-medium">Monthly training requests overview</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-white border border-gray-300 p-1">
            <Calendar className="w-4 h-4 text-gray-500 ml-2" />
            <select
              value={month}
              onChange={(e) => setMonth(Number(e.target.value))}
              className="px-2 py-1.5 outline-none text-sm font-bold text-gray-700 bg-transparent uppercase cursor-pointer"
            >
              {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                <option key={m} value={m}>
                  {new Date(2000, m - 1).toLocaleString('default', { month: 'short' })}
                </option>
              ))}
            </select>
            <select
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              className="px-2 py-1.5 outline-none text-sm font-bold text-gray-700 bg-transparent uppercase border-l border-gray-200 cursor-pointer"
            >
              {[new Date().getFullYear() - 1, new Date().getFullYear(), new Date().getFullYear() + 1].map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
          <button
            onClick={handleExport}
            disabled={filteredData.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 transition-colors font-bold text-sm uppercase disabled:opacity-50 cursor-pointer"
          >
            <Download className="w-4 h-4" /> Export
          </button>
        </div>
      </div>

      {/* Search Filters Row */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 border-b border-gray-200 bg-gray-50 gap-4 shrink-0">
        <div className="flex items-center gap-4 flex-1 w-full">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search User, Topic..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white border border-gray-300 rounded-md text-sm outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-all"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500 font-bold uppercase hidden sm:block">Date Filter:</span>
            <input
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="px-3 py-2 bg-white border border-gray-300 rounded-md text-sm outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 text-gray-700 transition-all"
            />
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto bg-[#fcfdfc] p-4">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500">
            <Loader2 className="w-8 h-8 animate-spin mb-4 text-green-600" />
            <p className="text-sm font-bold uppercase tracking-widest">Loading report...</p>
          </div>
        ) : filteredData.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500 bg-white border border-dashed border-gray-300 rounded-none p-12">
            <Users className="w-12 h-12 mb-4 text-gray-300" />
            <p className="text-lg font-bold text-gray-800 uppercase tracking-tight">No Results Found</p>
            <p className="text-sm text-gray-500 mt-1 uppercase text-center max-w-sm">
              {reportData.length === 0 
                ? "No records found for the selected month."
                : "No records match your search filters."}
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <DataTable
              columns={columns}
              data={filteredData}
              getRowId={(row, idx) => row.id || row._id || String(idx)}
            />
          </div>
        )}
      </div>
    </div>
  )
}

export default TrainingReport
