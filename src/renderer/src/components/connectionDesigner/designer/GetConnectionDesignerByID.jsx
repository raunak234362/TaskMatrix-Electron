import { useEffect, useState } from 'react'
import Service from '../../../api/Service'
import {
  Loader2,
  AlertCircle,
  Mail,
  Phone,
  Globe,
  MapPin,
  Calendar,
  Users,
  Briefcase,
  ShieldCheck,
  LayoutDashboard,
  Files,
  X,
  ClipboardList,
  RefreshCcw,
  HardHat,
  FileText,
  Search,
  Settings,
  Edit2,
  ChevronRight
} from 'lucide-react'
import EditConnectionDesigner from './EditConnectionDesigner'
import { AllCDEngineer } from '../..'
import RenderFiles from '../../common/RenderFiles'
import GetProjectById from '../../project/GetProjectById'

const getStatesList = (stateVal) => {
  let states = []
  if (Array.isArray(stateVal)) states = stateVal
  else if (typeof stateVal === 'string') {
    try {
      states = stateVal.startsWith('[') ? JSON.parse(stateVal) : [stateVal]
    } catch {
      states = [stateVal]
    }
  }
  return states.filter(Boolean)
}

const GetConnectionDesignerByID = ({ id, onClose }) => {
  const [designer, setDesigner] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [editModel, setEditModel] = useState(null)
  const [engineerModel, setEnginnerModel] = useState(null)
  const [activeTab, setActiveTab] = useState('DASHBOARD')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [selectedProjectId, setSelectedProjectId] = useState(null)
  const [projectSearchTerm, setProjectSearchTerm] = useState('')

  const fetchDesigner = async () => {
    if (!id) return
    try {
      setLoading(true)
      const response = await Service.FetchConnectionDesignerByID(id)
      setDesigner(response?.data || null)
    } catch (err) {
      setError('Failed to load details')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDesigner()
  }, [id])

  if (loading)
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="w-10 h-10 animate-spin text-green-600 mb-4" />
        <p className="text-black font-bold uppercase tracking-widest text-xs">
          Synchronizing Intelligence...
        </p>
      </div>
    )

  if (error || !designer)
    return (
      <div className="flex flex-col items-center justify-center py-20 text-red-500">
        <AlertCircle className="w-12 h-12 mb-4" />
        <p className="font-bold uppercase tracking-widest text-xs">
          {error || 'Connection Designer not found'}
        </p>
      </div>
    )

  return (
    <div className="flex flex-col h-full bg-white select-none overflow-x-hidden font-roboto text-sm">
      {/* 1. Header Section */}
      <div className="p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-gray-200 shrink-0">
        <div className="flex items-center gap-5">

          <div>
            <h2 className="text-lg md:text-2xl font-semibold text-gray-900 tracking-tight uppercase">
              {designer.name}
            </h2>
            <div className="flex items-center gap-4 mt-1">
              <span className="flex items-center gap-1.5 text-sm font-bold text-black uppercase tracking-widest">
                <Calendar size={12} className="text-green-500" />
                SINCE {new Date(designer.createdAt).toLocaleDateString()}
              </span>
              <span className="flex items-center gap-1.5 text-sm font-bold text-black uppercase tracking-widest">
                <Globe size={12} className="text-green-500" />
                {designer.location}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setActiveTab('DASHBOARD')}
            className={`px-6 py-1.5 border-2 rounded-lg font-bold text-sm uppercase tracking-tight shadow-sm flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'DASHBOARD'
                ? 'bg-green-50 border-green-700/80 text-black hover:bg-green-100'
                : 'bg-white border-gray-300 text-black hover:bg-gray-50'
            }`}
          >
            <LayoutDashboard size={14} /> Dashboard
          </button>
          <button
            onClick={() => setActiveTab('PROJECTS')}
            className={`px-6 py-1.5 border-2 rounded-lg font-bold text-sm uppercase tracking-tight shadow-sm flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'PROJECTS'
                ? 'bg-green-50 border-green-700/80 text-black hover:bg-green-100'
                : 'bg-white border-gray-300 text-black hover:bg-gray-50'
            }`}
          >
            <Briefcase size={14} /> Projects
          </button>
          <button
            onClick={onClose}
            className="px-6 py-1.5 bg-red-50 text-black border-2 border-red-700/80 rounded-lg hover:bg-red-100 transition-all font-bold text-sm uppercase tracking-tight shadow-sm cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-8 pt-6 no-scrollbar">
        {activeTab === 'DASHBOARD' ? (
          <>
            {/* 2. Stats Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10 shrink-0">
              <StatBox
                label="Total Engineers"
                value={designer.CDEngineers?.length || 0}
                icon={HardHat}
              />
              <StatBox
                label="Stamping Availability"
                value={getStatesList(designer.state).length}
                icon={Globe}
              />
              <StatBox label="Status" value="Active" icon={ShieldCheck} isStatus />
              <StatBox label="All Projects" value={designer.project?.length || 0} icon={RefreshCcw} onClick={() => setActiveTab('PROJECTS')} />
            </div>

            <div className="grid grid-cols-12 gap-10">
              {/* Left Column: Profile Details */}
              <div className="col-span-12 lg:col-span-8 flex flex-col">
                <h3 className="text-sm font-bold uppercase tracking-wider text-black mb-6 flex items-center gap-2 shrink-0">
                  <Users size={16} className="text-green-600" />
                  Profile Details
                </h3>
                <div className="flex flex-col gap-6 p-8 rounded-2xl border border-gray-300 bg-white flex-1">
                  {/* Top Row: Basic Info */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                    <DetailItem label="Email Address" value={designer.email} />
                    <DetailItem label="Contact" value={designer.contactInfo || '-'} />
                    <div className="space-y-1.5">
                      <p className="text-sm font-bold text-black uppercase tracking-wider">Website Link</p>
                      {designer.websiteLink ? (
                        <a
                          href={designer.websiteLink.startsWith("http") ? designer.websiteLink : `https://${designer.websiteLink}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-green-700 hover:text-green-900 underline font-semibold break-all"
                        >
                          {designer.websiteLink}
                        </a>
                      ) : (
                        <p className="text-sm font-semibold text-black">-</p>
                      )}
                    </div>
                  </div>

                  <hr className="border-gray-200" />

                  {/* Bottom Row: Coverage */}
                  <div className="space-y-3">
                    <p className="text-sm font-bold text-black uppercase tracking-wider">Coverage / Stamping States</p>
                    {getStatesList(designer.state).length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {getStatesList(designer.state).map((state, idx) => (
                          <span
                            key={idx}
                            className="px-3.5 py-1 bg-green-50 text-green-700 border border-green-100 rounded-none font-bold text-xs uppercase tracking-tight inline-flex items-center"
                          >
                            {state}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm font-semibold text-gray-400">-</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Right Column: Administrative Control */}
              <div className="col-span-12 lg:col-span-4 flex flex-col">
                <h3 className="text-sm font-bold uppercase tracking-wider text-black mb-6 flex items-center gap-2 shrink-0">
                  <Settings size={16} className="text-green-600" />
                  Administrative Control
                </h3>
                <div className="p-8 rounded-2xl border border-gray-300 flex flex-col justify-between gap-5 bg-white shadow-sm flex-1">
                  <div className="flex flex-col gap-5">
                    <button
                      onClick={() => setEditModel(designer)}
                      className="w-full p-4 bg-white border border-gray-300 rounded-xl flex items-center gap-4 hover:bg-gray-50 transition-all group"
                    >
                      <div className="p-2.5 bg-gray-100 rounded-lg text-black group-hover:text-gray-900 transition-colors border border-gray-300">
                        <Edit2 size={16} />
                      </div>
                      <span className="text-sm font-black text-black uppercase">
                        Edit Designer Info
                      </span>
                    </button>

                    <button
                      onClick={() => setEnginnerModel(designer)}
                      className="w-full p-4 bg-white border border-gray-300 rounded-xl flex items-center gap-4 hover:bg-gray-50 transition-all group"
                    >
                      <div className="p-2.5 bg-gray-100 rounded-lg text-black group-hover:text-gray-900 transition-colors border border-gray-300">
                        <Users size={16} />
                      </div>
                      <span className="text-sm font-semibold text-black uppercase">
                        View Connection designer POC 
                      </span>
                    </button>
                  </div>


                </div>
              </div>
            </div>
          </>
        ) : activeTab === 'PROJECTS' ? (
          <div className="flex flex-col gap-6">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 pb-2">
              <div className="relative w-full max-w-md">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search projects by number or name..."
                  value={projectSearchTerm}
                  onChange={(e) => setProjectSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:border-green-500 w-full bg-white text-black font-semibold uppercase tracking-tight"
                />
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-gray-500 uppercase shrink-0">Filter by Status:</span>
                <select
                  className="px-4 py-2 border border-gray-300 rounded-lg text-xs font-bold text-black uppercase outline-none focus:border-green-500 cursor-pointer bg-white"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="ALL">All Status</option>
                  {Array.from(new Set(designer.project?.map(p => p.status).filter(Boolean))).map(status => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="flex flex-col border border-gray-200 rounded-2xl overflow-hidden bg-white">
              {designer.project && designer.project.length > 0 ? (
                designer.project
                  .filter(proj => {
                    const matchesStatus = statusFilter === 'ALL' || proj.status === statusFilter;
                    const matchesSearch = 
                      !projectSearchTerm || 
                      (proj.projectNumber || '').toLowerCase().includes(projectSearchTerm.toLowerCase()) ||
                      (proj.name || '').toLowerCase().includes(projectSearchTerm.toLowerCase());
                    return matchesStatus && matchesSearch;
                  })
                  .map((proj, idx, arr) => (
                    <div 
                      key={proj.id} 
                      onClick={() => setSelectedProjectId(proj.id)}
                      className={`group flex items-center justify-between p-4 hover:bg-gray-50/60 transition-all cursor-pointer ${
                        idx !== arr.length - 1 ? 'border-b border-gray-100' : ''
                      }`}
                    >
                      <div className="flex items-center gap-4 min-w-0">
                        <div className="w-10 h-10 shrink-0 rounded-xl bg-green-50 border border-green-100 flex items-center justify-center text-green-600 font-bold text-sm">
                          {proj.projectNumber?.slice(0, 2).toUpperCase() || 'PR'}
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-sm font-semibold text-black group-hover:text-green-600 transition-colors uppercase tracking-normal">
                            {proj.projectNumber || '-'}
                          </h4>
                          <p className="text-sm text-black font-semibold line-clamp-1 mt-0.5">
                            {proj.name || '—'}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 shrink-0">
                        {proj.status && (
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest ${
                            proj.status === 'ACTIVE' 
                              ? 'bg-green-50 text-green-700 border border-green-100' 
                              : 'bg-gray-50 text-gray-600 border border-gray-200'
                          }`}>
                            {proj.status}
                          </span>
                        )}
                        <ChevronRight size={14} className="text-gray-300 group-hover:text-green-500 transition-colors" />
                      </div>
                    </div>
                  ))
              ) : (
                <div className="py-12 flex flex-col items-center justify-center text-gray-400">
                  <Briefcase size={32} className="mb-3 opacity-20" />
                  <p className="text-sm font-bold uppercase tracking-widest">No projects found</p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="h-full min-h-[500px] bg-white rounded-2xl border border-gray-300 p-8">
            <h3 className="text-sm font-black text-black uppercase tracking-widest mb-8 flex items-center gap-3">
              <Files size={18} className="text-green-600" />
              Documentation Vault
            </h3>
            <RenderFiles files={designer.files} table="connection-designer" parentId={id} />
          </div>
        )}
      </div>

      {editModel && (
        <EditConnectionDesigner onClose={() => setEditModel(null)} designerData={designer} onSuccess={fetchDesigner} />
      )}
      {engineerModel && (
        <AllCDEngineer onClose={() => setEnginnerModel(null)} designerData={designer} refresh={fetchDesigner} />
      )}
      {selectedProjectId && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white w-full h-full max-h-[95vh] rounded-2xl shadow-2xl overflow-hidden flex flex-col">
            <div className="flex-1 overflow-y-auto">
              <GetProjectById id={selectedProjectId} onClose={() => setSelectedProjectId(null)} />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const StatBox = ({ label, value, unit, icon: Icon, isStatus, subtext, onClick }) => {
  const isGreenValue = !!isStatus;
  const valueColorClass = isGreenValue ? "text-green-600" : "text-black";
  const valueSizeClass = isStatus ? "text-sm sm:text-base" : "text-xl sm:text-2xl";

  return (
    <div 
      onClick={onClick}
      className={`bg-white py-3 px-4 rounded-none border border-black border-l-[6px] border-l-green-600 flex items-center justify-between shadow-sm ${
        onClick ? 'cursor-pointer hover:bg-gray-50/50 transition-all' : ''
      }`}
    >
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div className="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center text-black shrink-0 shadow-sm">
          <Icon size={18} strokeWidth={2} />
        </div>
        <p className="text-sm sm:text-base font-bold text-black uppercase tracking-wider truncate">
          {label}
        </p>
      </div>
      <div className="flex items-baseline gap-1 shrink-0 ml-4">
        <p className={`${valueSizeClass} font-bold ${valueColorClass} tracking-tight`}>
          {value}
        </p>
        {unit && (
          <span className="text-xs font-bold text-gray-400 uppercase tracking-widest leading-none">
            {unit}
          </span>
        )}
      </div>
    </div>
  )
}

const DetailItem = ({ label, value }) => (
  <div className="space-y-1.5">
    <p className="text-sm font-bold text-black uppercase tracking-wider">{label}</p>
    <p className="text-sm font-semibold text-black break-all">{value || '-'}</p>
  </div>
)

export default GetConnectionDesignerByID
