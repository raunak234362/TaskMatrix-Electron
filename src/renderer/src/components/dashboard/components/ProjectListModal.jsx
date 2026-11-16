import React, { useState, useMemo, useEffect, useRef } from 'react'
import { X, Search, ChevronDown } from 'lucide-react'
import { createPortal } from 'react-dom'
import DataTable from '../../ui/table'

const ProjectListModal = ({ isOpen, onClose, status = '', projects, onProjectSelect }) => {
  if (!isOpen) return null

  const projectRows = useMemo(() => (Array.isArray(projects) ? projects : []), [projects])

  // Filter states matching snapshot
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedManager, setSelectedManager] = useState('All Managers')
  const [selectedFabricator, setSelectedFabricator] = useState('ALL FABRICATORS')
  const [selectedStage, setSelectedStage] = useState('All Stages')

  // Search inside fabricator dropdown
  const [fabSearchQuery, setFabSearchQuery] = useState('')
  const [isFabDropdownOpen, setIsFabDropdownOpen] = useState(false)
  const fabDropdownRef = useRef(null)

  // Close fabricator dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (fabDropdownRef.current && !fabDropdownRef.current.contains(event.target)) {
        setIsFabDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Fabricator options
  const fabricatorOptions = useMemo(() => {
    const set = new Set()
    projectRows.forEach((p) => {
      const name = p.fabricator?.fabName || p.fabricator?.name || p.fabricatorName
      if (name && name !== 'N/A') set.add(name)
    })
    return ['ALL FABRICATORS', ...Array.from(set).sort((a, b) => a.localeCompare(b))]
  }, [projectRows])

  const filteredFabricatorOptions = useMemo(() => {
    if (!fabSearchQuery.trim()) return fabricatorOptions
    const q = fabSearchQuery.toLowerCase().trim()
    return fabricatorOptions.filter((f) => f.toLowerCase().includes(q))
  }, [fabricatorOptions, fabSearchQuery])

  // Manager options
  const managerOptions = useMemo(() => {
    const set = new Set()
    projectRows.forEach((p) => {
      const name = p.manager
        ? `${p.manager.firstName || ''} ${p.manager.lastName || ''}`.trim()
        : p.managerName || p.projectManager?.name || ''
      if (name) set.add(name)
    })
    return ['All Managers', ...Array.from(set).sort((a, b) => a.localeCompare(b))]
  }, [projectRows])

  // Stage options
  const stageOptions = useMemo(() => {
    const defaultStages = ['All Stages', 'IFA', 'IFC', 'RIFA', 'RIFC', 'COR']
    const set = new Set(defaultStages)
    projectRows.forEach((p) => {
      if (p.stage && p.stage !== 'N/A') set.add(p.stage)
    })
    return Array.from(set)
  }, [projectRows])

  // Filtered rows
  const filteredProjects = useMemo(() => {
    return projectRows.filter((p) => {
      // 1. Search term (matches name or project number)
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase().trim()
        const name = (p.name || p.projectName || '').toLowerCase()
        const num = (p.projectNumber || p.project_number || '').toLowerCase()
        if (!name.includes(query) && !num.includes(query)) {
          return false
        }
      }

      // 2. Manager
      if (selectedManager && selectedManager !== 'All Managers' && selectedManager !== 'ALL MANAGERS') {
        const mgr = (
          p.manager
            ? `${p.manager.firstName || ''} ${p.manager.lastName || ''}`.trim()
            : p.managerName || p.projectManager?.name || ''
        ).toLowerCase()
        if (mgr !== selectedManager.toLowerCase()) {
          return false
        }
      }

      // 3. Fabricator
      if (
        selectedFabricator &&
        selectedFabricator !== 'ALL FABRICATORS' &&
        selectedFabricator !== 'All Fabricators'
      ) {
        const fab = (
          p.fabricator?.fabName ||
          p.fabricator?.name ||
          p.fabricatorName ||
          ''
        ).toLowerCase()
        if (fab !== selectedFabricator.toLowerCase()) {
          return false
        }
      }

      // 4. Stage
      if (selectedStage && selectedStage !== 'All Stages' && selectedStage !== 'ALL STAGES') {
        const stage = (p.stage || '').toLowerCase()
        if (stage !== selectedStage.toLowerCase()) {
          return false
        }
      }

      return true
    })
  }, [projectRows, searchTerm, selectedManager, selectedFabricator, selectedStage])

  const hasActiveFilters =
    Boolean(searchTerm.trim()) ||
    (selectedManager !== 'All Managers' && selectedManager !== 'ALL MANAGERS') ||
    (selectedFabricator !== 'ALL FABRICATORS' && selectedFabricator !== 'All Fabricators') ||
    (selectedStage !== 'All Stages' && selectedStage !== 'ALL STAGES')

  const handleClearFilters = () => {
    setSearchTerm('')
    setSelectedManager('All Managers')
    setSelectedFabricator('ALL FABRICATORS')
    setSelectedStage('All Stages')
    setFabSearchQuery('')
  }

  const columns = [
    {
      accessorKey: 'name',
      header: 'Project Name',
      cell: ({ row }) => (
        <span className="font-medium text-gray-700">
          {row.original.name || row.original.projectName || '—'}
        </span>
      )
    },
    {
      id: 'fabricatorName',
      accessorFn: (project) =>
        project.fabricator?.fabName || project.fabricator?.name || project.fabricatorName || 'N/A',
      header: 'Fabricator Name',
      cell: ({ row }) => (
        <span className="text-gray-700">
          {row.original.fabricator?.fabName ||
            row.original.fabricator?.name ||
            row.original.fabricatorName ||
            'N/A'}
        </span>
      )
    },
    {
      accessorFn: (project) => project.stage || 'N/A',
      id: 'stage',
      header: 'Stage',
      cell: ({ row }) => <span className="text-gray-700">{row.original.stage || 'N/A'}</span>
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const st = row.original.status || ''
        const isActive = st === 'ACTIVE'
        const isComplete = st === 'COMPLETED' || st === 'COMPLETE'
        const isOnHold = st === 'ON_HOLD' || st === 'ONHOLD'
        return (
          <span
            className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-black ${
              isActive
                ? 'bg-green-100 text-black'
                : isComplete
                  ? 'bg-blue-100 text-black shadow-sm'
                  : isOnHold
                    ? 'bg-orange-100 text-black shadow-sm'
                    : 'bg-gray-100 text-black shadow-sm'
            }`}
          >
            {st || 'N/A'}
          </span>
        )
      }
    }
  ]

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white w-[90%] max-w-[85%] max-h-[85vh] rounded-3xl shadow-2xl overflow-hidden flex flex-col border border-gray-100 animate-in fade-in zoom-in duration-200">
        {/* Modal Header */}
        <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
          <div>
            <h3 className="text-xl text-gray-700 flex items-center gap-2">
              <div
                className={`w-2 h-6 rounded-full ${
                  status.includes('ACTIVE') || status.includes('IFA')
                    ? 'bg-green-500'
                    : status.includes('COMPLETED') ||
                        status.includes('IFC') ||
                        status.includes('Done')
                      ? 'bg-blue-500'
                      : status.includes('ON_HOLD') ||
                          status.includes('CO#') ||
                          status.includes('On-Hold')
                        ? 'bg-orange-500'
                        : 'bg-gray-500'
                }`}
              ></div>
              {status ? `${status.replace(/_/g, ' ')} Projects` : 'Projects'}
            </h3>
            <p className="text-sm text-gray-700 mt-1">
              Showing {filteredProjects.length}{' '}
              {filteredProjects.length !== projectRows.length && `of ${projectRows.length}`}{' '}
              projects
            </p>
          </div>
          <button
            onClick={onClose}
            className="px-6 py-1.5 bg-red-50 text-black border-2 border-red-700/80 rounded-lg hover:bg-red-100 transition-all font-bold text-sm uppercase tracking-tight shadow-sm cursor-pointer"
          >
            Close
          </button>
        </div>

        {/* Filters Bar matching Snapshot */}
        <div className="px-6 pt-4 pb-3 border-b border-gray-100 bg-white">
          <div className="flex flex-wrap items-end gap-5">
            {/* Search Project Name */}
            <div className="flex flex-col gap-1.5 w-full sm:w-auto min-w-[240px]">
              <label className="text-xs font-semibold text-gray-800 uppercase tracking-normal">
                Search Project
              </label>
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  type="text"
                  placeholder="Search by name..."
                  className="w-full text-sm font-medium text-gray-900 bg-white border border-gray-300 rounded-md pl-9 pr-3 py-2 focus:outline-none focus:border-green-600 focus:ring-1 focus:ring-green-600 hover:border-gray-400 transition-all placeholder:text-gray-500 placeholder:font-normal shadow-sm"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            {/* Manager Filter */}
            {managerOptions.length > 1 && (
              <div className="flex flex-col gap-1.5 w-full sm:w-auto min-w-[180px]">
                <label className="text-xs font-semibold text-gray-800 uppercase tracking-normal">
                  Manager
                </label>
                <select
                  className="w-full text-sm font-medium text-gray-900 bg-white border border-gray-300 rounded-md px-3 py-2 cursor-pointer focus:outline-none focus:border-green-600 focus:ring-1 focus:ring-green-600 hover:border-gray-400 transition-all shadow-sm"
                  value={selectedManager}
                  onChange={(e) => setSelectedManager(e.target.value)}
                >
                  {managerOptions.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Fabricator Filter with Search */}
            <div
              className="flex flex-col gap-1.5 w-full sm:w-auto min-w-[220px] relative"
              ref={fabDropdownRef}
            >
              <label className="text-xs font-semibold text-gray-800 uppercase tracking-normal">
                Fabricator
              </label>
              <div
                onClick={() => setIsFabDropdownOpen((prev) => !prev)}
                className="w-full text-sm font-medium text-gray-900 bg-white border border-gray-300 rounded-md px-3 py-2 cursor-pointer focus:outline-none hover:border-gray-400 transition-all shadow-sm flex items-center justify-between"
              >
                <span className="truncate">{selectedFabricator || 'ALL FABRICATORS'}</span>
                <ChevronDown size={16} className="text-gray-500 shrink-0 ml-2" />
              </div>

              {isFabDropdownOpen && (
                <div className="absolute top-full left-0 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg z-50 overflow-hidden flex flex-col max-h-60 min-w-[220px]">
                  <div className="p-2 border-b border-gray-200 bg-gray-50 sticky top-0">
                    <div className="relative">
                      <Search
                        size={14}
                        className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400"
                      />
                      <input
                        type="text"
                        placeholder="Search fabricator..."
                        className="w-full text-xs font-medium text-gray-900 bg-white border border-gray-300 rounded pl-8 pr-2 py-1.5 focus:outline-none focus:border-green-600"
                        value={fabSearchQuery}
                        onChange={(e) => setFabSearchQuery(e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                        autoFocus
                      />
                    </div>
                  </div>
                  <div className="overflow-y-auto max-h-48 py-1">
                    {filteredFabricatorOptions.length > 0 ? (
                      filteredFabricatorOptions.map((f) => (
                        <div
                          key={f}
                          onClick={() => {
                            setSelectedFabricator(f)
                            setIsFabDropdownOpen(false)
                          }}
                          className={`px-3 py-1.5 text-sm cursor-pointer hover:bg-green-50 hover:text-green-700 transition-colors ${
                            selectedFabricator === f
                              ? 'bg-green-100 text-green-800 font-semibold'
                              : 'text-gray-700'
                          }`}
                        >
                          {f}
                        </div>
                      ))
                    ) : (
                      <div className="px-3 py-2 text-xs text-gray-400 italic">
                        No fabricators found
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Stage Filter */}
            <div className="flex flex-col gap-1.5 w-full sm:w-auto min-w-[180px]">
              <label className="text-xs font-semibold text-gray-800 uppercase tracking-normal">
                Stage
              </label>
              <select
                className="w-full text-sm font-medium text-gray-900 bg-white border border-gray-300 rounded-md px-3 py-2 cursor-pointer focus:outline-none focus:border-green-600 focus:ring-1 focus:ring-green-600 hover:border-gray-400 transition-all shadow-sm"
                value={selectedStage}
                onChange={(e) => setSelectedStage(e.target.value)}
              >
                {stageOptions.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            {/* Clear Filters */}
            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleClearFilters}
                className="px-4 py-2 bg-green-50 text-black border border-green-700/80 rounded-md hover:bg-green-100 transition-all font-semibold text-xs uppercase tracking-normal shadow-sm flex items-center gap-1.5 h-[38px] cursor-pointer"
              >
                <X className="w-3.5 h-3.5" /> Clear Filters
              </button>
            )}
          </div>
        </div>

        {/* Modal Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <DataTable
            columns={columns}
            data={filteredProjects}
            onRowClick={onProjectSelect}
          />
        </div>
      </div>
    </div>,
    document.body
  )
}

export default ProjectListModal
