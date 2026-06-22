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
  Edit2
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
            <h2 className="text-3xl font-black text-black tracking-tight">{designer.name}</h2>
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
            className={`px-6 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest flex items-center gap-2 border transition-all ${activeTab === 'DASHBOARD'
              ? 'bg-green-50 border-green-400 text-green-700 shadow-sm'
              : 'bg-white border-gray-300 text-black hover:bg-gray-50'
              }`}
          >
            <LayoutDashboard size={14} /> Dashboard
          </button>
          <button
            onClick={() => setActiveTab('PROJECTS')}
            className={`px-6 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest flex items-center gap-2 border transition-all ${activeTab === 'PROJECTS'
              ? 'bg-green-50 border-green-400 text-green-700 shadow-sm'
              : 'bg-white border-gray-300 text-black hover:bg-gray-50'
              }`}
          >
            <Briefcase size={14} /> Projects
          </button>
          <button
            onClick={() => setActiveTab('FILES')}
            className={`px-6 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest flex items-center gap-2 border transition-all ${activeTab === 'FILES'
              ? 'bg-green-50 border-green-400 text-green-700 shadow-sm'
              : 'bg-white border-gray-300 text-black hover:bg-gray-50'
              }`}
          >
            <Files size={14} /> Files
          </button>
          <button
            onClick={onClose}
            className="px-6 py-1.5 bg-red-50 text-black border-2 border-red-700/80 rounded-lg hover:bg-red-100 transition-all font-bold text-sm uppercase tracking-tight shadow-sm"
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
              <StatBox label="All Projects" value={designer.project?.length || 0} icon={RefreshCcw} onClick={() => setActiveTab('PROJECTS')} />
              <StatBox label="Status" value="Active" icon={ShieldCheck} isStatus />
              <StatBox
                label="Availability"
                value={getStatesList(designer.state).length}
                icon={Globe}
              />
            </div>

            <div className="grid grid-cols-12 gap-10">
              {/* Left Column: Profile Details */}
              <div className="col-span-12 lg:col-span-8 space-y-12">
                {/* Profile Details Section */}
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-black mb-6 flex items-center gap-2">
                    <Users size={16} className="text-green-600" />
                    Profile Details
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-8 gap-x-12 p-8 rounded-2xl border border-gray-300">
                    <DetailItem label="Email Address" value={designer.email} />
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
                        <p className="text-sm text-black">-</p>
                      )}
                    </div>
                    <DetailItem label="Contact" value={designer.contactInfo || '-'} />
                    <div className="space-y-1.5">
                      <p className="text-sm font-bold text-black uppercase tracking-wider">Coverage</p>
                      {getStatesList(designer.state).length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {getStatesList(designer.state).map((state, idx) => (
                            <span
                              key={idx}
                              className="px-3.5 py-1 bg-green-50 text-green-900 border border-green-700 rounded-lg font-medium text-xs uppercase tracking-tight shadow-sm inline-flex items-center"
                            >
                              {state}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm font-semibold text-gray-900">-</p>
                      )}
                    </div>
                  </div>
                </div>

              </div>

              {/* Right Column: Administrative Control */}
              <div className="col-span-12 lg:col-span-4">
                <div className="p-8 rounded-2xl border-2 border-gray-300 flex flex-col gap-5 bg-white shadow-sm lg:sticky lg:top-8">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-black mb-2">
                    Administrative Control
                  </h3>

                  <button
                    onClick={() => setEditModel(designer)}
                    className="w-full p-4 bg-white border border-gray-300 rounded-xl flex items-center gap-4 hover:bg-gray-50 transition-all group"
                  >
                    <div className="p-2.5 bg-gray-100 rounded-lg text-black group-hover:text-gray-900 transition-colors border border-gray-300">
                      <Edit2 size={16} />
                    </div>
                    <span className="text-sm font-black uppercase tracking-widest">
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
                    <span className="text-sm font-black uppercase tracking-widest">
                      View Connection designer POC 
                    </span>
                  </button>

                  <button className="w-full p-4 bg-red-50/50 border border-red-400 rounded-xl flex items-center gap-4 hover:bg-red-50 transition-all group mt-2">
                    <div className="p-2.5 bg-white border border-red-300 rounded-lg text-red-500">
                      <X size={16} strokeWidth={3} />
                    </div>
                    <span className="text-sm text-red-600 uppercase tracking-widest">
                      Archive Profile
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </>
        ) : activeTab === 'PROJECTS' ? (
          <div className="h-full min-h-[500px] bg-white rounded-2xl border border-gray-300 p-8 flex flex-col">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-sm font-black text-black uppercase tracking-widest flex items-center gap-3">
                <Briefcase size={18} className="text-green-600" />
                All Projects
              </h3>
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-gray-500 uppercase">Filter by Status:</span>
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
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {designer.project && designer.project.length > 0 ? (
                designer.project
                  .filter(proj => statusFilter === 'ALL' || proj.status === statusFilter)
                  .map((proj) => (
                  <div 
                    key={proj.id} 
                    onClick={() => setSelectedProjectId(proj.id)}
                    className="p-5 rounded-2xl border border-gray-300 flex flex-col gap-2 bg-white hover:border-green-400 hover:shadow-md transition-all cursor-pointer"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-black text-black uppercase tracking-widest">{proj.projectNumber || '-'}</span>
                      {proj.status && (
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest ${proj.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                          {proj.status}
                        </span>
                      )}
                    </div>
                    {proj.name && <span className="text-sm text-gray-700 font-medium line-clamp-2 mt-1">{proj.name}</span>}
                  </div>
                ))
              ) : (
                <div className="col-span-full py-10 flex flex-col items-center justify-center text-gray-400">
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
          <div className="bg-white w-full max-w-7xl h-full max-h-[95vh] rounded-2xl shadow-2xl overflow-hidden flex flex-col">
            <GetProjectById id={selectedProjectId} onClose={() => setSelectedProjectId(null)} />
          </div>
        </div>
      )}
    </div>
  )
}

const StatBox = ({ label, value, unit, icon: Icon, isStatus, subtext, onClick }) => (
  <div 
    onClick={onClick}
    className={`bg-white p-6 rounded-2xl border border-gray-300 flex items-center justify-between shadow-sm ${onClick ? 'cursor-pointer hover:border-green-400 hover:shadow-md transition-all' : ''}`}
  >
    <div className="flex items-center gap-5 flex-1">
      <div className="p-3 bg-green-50 rounded-xl text-green-600 border border-green-300 flex items-center justify-center shadow-sm">
        <Icon size={20} strokeWidth={2.5} />
      </div>
      <p className="text-sm font-bold text-black uppercase tracking-wider">
        {label}
      </p>
    </div>
    <div className="flex items-baseline gap-1">
      <p className={`text-sm font-bold ${isStatus ? 'text-green-600' : 'text-black'} tracking-wider`}>
        {value}
      </p>
      {unit && (
        <span className="text-xs font-bold text-gray-400 uppercase tracking-widest leading-none">
          {unit}
        </span>
      )}
    </div>
    {subtext && (
      <div className="text-right flex flex-col items-end opacity-70">
        <p className="text-[9px] font-semibold text-black uppercatracking-widestem] leading-none mb-1.5">
          {subtext}
        </p>
        <div className="w-6 h-1 bg-green-500 rounded-full"></div>
      </div>
    )}
  </div>
)

const DetailItem = ({ label, value }) => (
  <div className="space-y-1.5">
    <p className="text-sm font-bold text-black uppercase tracking-wider">{label}</p>
    <p className="text-sm text-black break-all">{value || '-'}</p>
  </div>
)

export default GetConnectionDesignerByID
