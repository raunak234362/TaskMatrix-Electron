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

const GetConnectionDesignerByID = ({ id, onClose }) => {
  const [designer, setDesigner] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [editModel, setEditModel] = useState(null)
  const [engineerModel, setEnginnerModel] = useState(null)
  const [activeTab, setActiveTab] = useState('DASHBOARD')

  useEffect(() => {
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
    fetchDesigner()
  }, [id])

  if (loading)
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="w-10 h-10 animate-spin text-green-600 mb-4" />
        <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">
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
    <div className="flex flex-col h-full bg-white select-none">
      {/* 1. Header Section */}
      <div className="p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 rounded-xl bg-green-100 flex items-center justify-center text-green-800 text-3xl font-black shadow-sm">
            {designer.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h2 className="text-2xl font-black text-gray-900 tracking-tight">{designer.name}</h2>
            <div className="flex items-center gap-4 mt-1">
              <span className="flex items-center gap-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                <Calendar size={12} className="text-green-500" />
                SINCE {new Date(designer.createdAt).toLocaleDateString()}
              </span>
              <span className="flex items-center gap-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                <Globe size={12} className="text-green-500" />
                {designer.location || 'UNITED STATES'}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setActiveTab('DASHBOARD')}
            className={`px-6 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest flex items-center gap-2 border transition-all ${activeTab === 'DASHBOARD'
              ? 'bg-green-50 border-green-200 text-green-700 shadow-sm'
              : 'bg-white border-gray-100 text-gray-400 hover:bg-gray-50'
              }`}
          >
            <LayoutDashboard size={14} /> Dashboard
          </button>
          <button
            onClick={() => setActiveTab('FILES')}
            className={`px-6 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest flex items-center gap-2 border transition-all ${activeTab === 'FILES'
              ? 'bg-green-50 border-green-200 text-green-700 shadow-sm'
              : 'bg-white border-gray-100 text-gray-400 hover:bg-gray-50'
              }`}
          >
            <Files size={14} /> Files
          </button>
          <button
            onClick={onClose}
            className="px-6 py-2 bg-red-50 border border-red-100 rounded-lg text-[10px] font-black text-red-600 uppercase tracking-widest hover:bg-red-100 transition-all flex items-center gap-2"
          >
            <X size={14} /> Close
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 sm:p-8 pt-0">
        {activeTab === 'DASHBOARD' ? (
          <>
            {/* 2. Stats Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
              <StatBox
                label="Total Engineers"
                value={designer.CDEngineers?.length || 0}
                unit="Engineers"
                icon={HardHat}
              />
              <StatBox label="Active Projects" value={0} unit="Projects" icon={RefreshCcw} />
              <StatBox label="Status" value="Active" icon={ShieldCheck} isStatus />
              <StatBox
                label="Availability"
                value={Array.isArray(designer.state) ? designer.state.length : 0}
                unit="States"
                icon={Globe}
                subtext="UNITED STATES"
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
              {/* Left Column: Pending Actions & Profile Details */}
              <div className="lg:col-span-8 space-y-12">
                {/* Pending Actions Section */}
                <div>
                  <h3 className="text-[11px] font-black text-gray-900 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                    <ClipboardList size={16} className="text-green-600" />
                    Pending Actions
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <ActionCard icon={FileText} label="RFI" count={0} color="green" />
                    <ActionCard icon={RefreshCcw} label="SUBMITTALS" count={0} color="purple" />
                    <ActionCard icon={Briefcase} label="CHANGE ORDERS" count={0} color="red" />
                    <ActionCard icon={Search} label="RFQ" count={0} color="blue" />
                  </div>
                </div>

                {/* Profile Details Section */}
                <div>
                  <h3 className="text-[11px] font-black text-gray-900 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                    <Users size={16} className="text-green-600" />
                    Profile Details
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-8 gap-x-12 bg-gray-50/30 p-8 rounded-3xl border border-gray-50">
                    <DetailItem label="PRINCIPAL EMAIL" value={designer.email} />
                    <DetailItem label="DIGITAL PRESENCE" value={designer.websiteLink || '-'} />
                    <DetailItem label="SECURE CONTACT" value={designer.contactInfo || '-'} />
                    <DetailItem
                      label="COVERAGE"
                      value={
                        Array.isArray(designer.state)
                          ? designer.state.join(', ')
                          : designer.state || '-'
                      }
                    />
                  </div>
                </div>
              </div>

              {/* Right Column: Administrative Control */}
              <div className="lg:col-span-4">
                <div className="p-8 rounded-[2rem] border-2 border-gray-100 flex flex-col gap-5 bg-white shadow-xs sticky top-0">
                  <h3 className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2">
                    Administrative Control
                  </h3>

                  <button
                    onClick={() => setEditModel(designer)}
                    className="w-full p-4 bg-white border border-gray-200 rounded-xl flex items-center gap-4 hover:bg-gray-50 transition-all group"
                  >
                    <div className="p-2.5 bg-gray-50 rounded-lg text-gray-400 group-hover:text-gray-900 transition-colors">
                      <Edit2 size={16} />
                    </div>
                    <span className="text-[10px] font-black text-gray-700 uppercase tracking-widest">
                      Edit Designer Info
                    </span>
                  </button>

                  <button
                    onClick={() => setEnginnerModel(designer)}
                    className="w-full p-4 bg-white border border-gray-200 rounded-xl flex items-center gap-4 hover:bg-gray-50 transition-all group"
                  >
                    <div className="p-2.5 bg-gray-50 rounded-lg text-gray-400 group-hover:text-gray-900 transition-colors">
                      <Users size={16} />
                    </div>
                    <span className="text-[10px] font-black text-gray-700 uppercase tracking-widest">
                      Manage Workforce
                    </span>
                  </button>

                  <button className="w-full p-4 bg-red-50/50 border border-red-100 rounded-xl flex items-center gap-4 hover:bg-red-50 transition-all group mt-2">
                    <div className="p-2.5 bg-white border border-red-100 rounded-lg text-red-500">
                      <X size={16} strokeWidth={3} />
                    </div>
                    <span className="text-[10px] font-black text-red-600 uppercase tracking-widest">
                      Archive Profile
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="h-full min-h-[500px] bg-white rounded-3xl border border-gray-100 p-8">
            <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest mb-8 flex items-center gap-3">
              <Files size={18} className="text-green-600" />
              Documentation Vault
            </h3>
            <RenderFiles files={designer.files} table="connection-designer" parentId={id} />
          </div>
        )}
      </div>

      {editModel && (
        <EditConnectionDesigner onClose={() => setEditModel(null)} designerData={designer} />
      )}
      {engineerModel && (
        <AllCDEngineer onClose={() => setEnginnerModel(null)} designerData={designer} />
      )}
    </div>
  )
}

const StatBox = ({ label, value, unit, icon: Icon, isStatus, subtext }) => (
  <div className="bg-white p-6 rounded-2xl border border-gray-100 flex items-center justify-between shadow-xs">
    <div className="flex items-center gap-5">
      <div className="p-3 bg-green-50/50 rounded-xl text-green-600 border border-green-100 flex items-center justify-center">
        <Icon size={20} strokeWidth={2.5} />
      </div>
      <div>
        <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.15em] mb-1.5">
          {label}
        </p>
        <div className="flex items-baseline gap-2">
          <p className={`text-xl font-black ${isStatus ? 'text-green-600' : 'text-gray-900'}`}>
            {value}
          </p>
          {unit && (
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none">
              {unit}
            </span>
          )}
        </div>
      </div>
    </div>
    {subtext && (
      <div className="text-right flex flex-col items-end opacity-60">
        <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.1em] leading-none mb-1.5">
          {subtext}
        </p>
        <div className="w-6 h-1 bg-green-500 rounded-full"></div>
      </div>
    )}
  </div>
)

const ActionCard = ({ icon: Icon, label, count, color }) => {
  const styles = {
    green: { bg: 'bg-green-50/50', text: 'text-green-600', border: 'border-green-100' },
    purple: { bg: 'bg-purple-50/50', text: 'text-purple-600', border: 'border-purple-100' },
    red: { bg: 'bg-red-50/30', text: 'text-red-600', border: 'border-red-100' },
    blue: { bg: 'bg-blue-50/50', text: 'text-blue-600', border: 'border-blue-100' }
  }
  const s = styles[color]
  return (
    <div className="p-6 rounded-2xl bg-gray-50/30 border border-gray-100 flex items-center justify-between group hover:bg-white hover:shadow-md hover:border-green-200 transition-all cursor-pointer">
      <div className="flex items-center gap-5">
        <div className={`p-4 rounded-2xl border transition-all ${s.bg} ${s.text} ${s.border}`}>
          <Icon size={20} strokeWidth={2.5} />
        </div>
        <span className="text-[11px] font-black text-gray-400 group-hover:text-gray-900 uppercase tracking-[0.15em] transition-colors">
          {label}
        </span>
      </div>
      <span className={`text-2xl font-black ${s.text}`}>{count}</span>
    </div>
  )
}

const DetailItem = ({ label, value }) => (
  <div className="space-y-2">
    <p className="text-[9px] font-black text-gray-300 uppercase tracking-[0.2em]">{label}</p>
    <p className="text-sm font-bold text-gray-900 break-all">{value || '-'}</p>
  </div>
)

export default GetConnectionDesignerByID

