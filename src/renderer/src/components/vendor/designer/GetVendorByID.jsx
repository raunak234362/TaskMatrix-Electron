/* eslint-disable react/prop-types */
import { useEffect, useState, useRef } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { State, City } from 'country-state-city'
import Select from 'react-select'
import Service from '../../../api/Service'
import { toast } from 'react-toastify'
import Input from '../../fields/input'
import Button from '../../fields/Button'
import VendorFiles from './VendorFiles'
import {
  Loader2, AlertCircle, Globe, MapPin,
  Calendar, ShieldCheck, Files, X, Users, Edit2,
  Check, Trash2, LayoutDashboard, ExternalLink, Phone, Mail, Link
} from 'lucide-react'

// ─── Helpers ──────────────────────────────────────────────────────────────────

const COUNTRY_MAP = { 'United States': 'US', Canada: 'CA', India: 'IN' }

const parseLocation = (location) => {
  if (!location) return { country: '', city: '' }
  const parts = location.split(',').map((p) => p.trim()).filter(Boolean)
  if (parts.length === 0) return { country: '', city: '' }
  if (parts.length === 1) return { country: parts[0], city: '' }
  const country = parts.pop()
  return { country, city: parts.join(', ') }
}

const normalizeStates = (states) => {
  if (Array.isArray(states)) return states
  if (typeof states === 'string') {
    try { const p = JSON.parse(states); return Array.isArray(p) ? p : [states] }
    catch { return [states] }
  }
  return []
}

// ─── Stat Box (identical to Connection Designer) ──────────────────────────────

const StatBox = ({ label, value, unit, icon: Icon, isStatus, subtext }) => (
  <div className="bg-white p-6 rounded-2xl border border-gray-100 flex items-center justify-between shadow-xs">
    <div className="flex items-center gap-5">
      <div className="p-3 bg-green-50/50 rounded-xl text-green-600 border border-green-100 flex items-center justify-center">
        <Icon size={20} strokeWidth={2.5} />
      </div>
      <div>
        <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.15em] mb-1.5">{label}</p>
        <div className="flex items-baseline gap-2">
          <p className={`text-xl font-black ${isStatus ? 'text-green-600' : 'text-gray-900'}`}>{value}</p>
          {unit && <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none">{unit}</span>}
        </div>
      </div>
    </div>
    {subtext && (
      <div className="text-right flex flex-col items-end opacity-60">
        <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.1em] leading-none mb-1.5">{subtext}</p>
        <div className="w-6 h-1 bg-green-500 rounded-full" />
      </div>
    )}
  </div>
)

// ─── Detail Item ──────────────────────────────────────────────────────────────

const DetailItem = ({ label, value, children }) => (
  <div className="space-y-2">
    <p className="text-[9px] font-black text-gray-300 uppercase tracking-[0.2em]">{label}</p>
    {children ?? <p className="text-sm font-bold text-gray-900 break-all">{value || '—'}</p>}
  </div>
)

// ─── Info Row (icon + text) ───────────────────────────────────────────────────

const InfoRow = ({ icon: Icon, label, value, href, color = 'text-gray-600' }) => (
  value ? (
    <div className="flex items-start gap-3">
      <div className="p-2 bg-gray-50 rounded-lg shrink-0 mt-0.5">
        <Icon size={14} className="text-gray-400" />
      </div>
      <div>
        <p className="text-[9px] font-black text-gray-300 uppercase tracking-widest mb-0.5">{label}</p>
        {href
          ? <a href={href} target="_blank" rel="noreferrer" className={`text-sm font-bold ${color} underline flex items-center gap-1`}>
            <ExternalLink size={11} />{value.length > 40 ? value.slice(0, 40) + '...' : value}
          </a>
          : <p className={`text-sm font-bold ${color}`}>{value}</p>
        }
      </div>
    </div>
  ) : null
)

// ─── Edit Vendor Modal ────────────────────────────────────────────────────────

const EditVendorModal = ({ vendorData, onClose, onSuccess }) => {
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const [stateOptions, setStateOptions] = useState([])
  const [cityOptions, setCityOptions] = useState([])
  const lastCountryRef = useRef(null)

  const { country: initialCountry, city: initialCity } = parseLocation(vendorData.location)

  const { register, handleSubmit, control, setValue, watch, reset, formState: { errors } } = useForm({
    defaultValues: {
      name: vendorData?.name || '',
      contactInfo: vendorData?.contactInfo || '',
      websiteLink: vendorData?.websiteLink || '',
      email: vendorData?.email || '',
      insurenceLiability: vendorData?.insurenceLiability || '',
      headquater: { country: initialCountry, city: initialCity, states: normalizeStates(vendorData?.state) },
    },
  })

  useEffect(() => {
    reset({
      name: vendorData?.name || '',
      contactInfo: vendorData?.contactInfo || '',
      websiteLink: vendorData?.websiteLink || '',
      email: vendorData?.email || '',
      insurenceLiability: vendorData?.insurenceLiability || '',
      headquater: { country: initialCountry, city: initialCity, states: normalizeStates(vendorData?.state) },
    })
    lastCountryRef.current = initialCountry || null
  }, [vendorData, initialCountry, initialCity, reset])

  const country = watch('headquater.country')
  const selectedStates = watch('headquater.states')
  const selectedCity = watch('headquater.city')

  useEffect(() => {
    if (country && COUNTRY_MAP[country]) {
      const code = COUNTRY_MAP[country]
      setStateOptions((State.getStatesOfCountry(code) || []).map((s) => ({ label: s.name, value: s.name })))
      if (lastCountryRef.current && lastCountryRef.current !== country) {
        setValue('headquater.states', []); setValue('headquater.city', ''); setCityOptions([])
      }
      lastCountryRef.current = country
    } else {
      setStateOptions([]); setCityOptions([])
      if (lastCountryRef.current) { setValue('headquater.states', []); setValue('headquater.city', '') }
      lastCountryRef.current = country || null
    }
  }, [country, setValue])

  useEffect(() => {
    const normed = normalizeStates(selectedStates)
    if (normed.length > 0 && country && COUNTRY_MAP[country]) {
      const code = COUNTRY_MAP[country]
      const statesOfCountry = State.getStatesOfCountry(code) || []
      const allCities = []
      normed.forEach((name) => {
        const s = statesOfCountry.find((st) => st.name === name)
        if (s) allCities.push(...(City.getCitiesOfState(code, s.isoCode) || []).map((c) => ({ label: c.name, value: c.name })))
      })
      setCityOptions(allCities)
      if (selectedCity && !allCities.some((o) => o.value === selectedCity)) setValue('headquater.city', '')
    } else { setCityOptions([]); if (selectedCity) setValue('headquater.city', '') }
  }, [selectedStates, country, selectedCity, setValue])

  const onSubmit = async (data) => {
    try {
      setSubmitting(true); setError(null)
      const statesArray = Array.isArray(data.headquater.states) ? data.headquater.states : []
      const location = data.headquater.city ? `${data.headquater.city}, ${data.headquater.country}` : data.headquater.country
      const payload = {
        name: data.name.trim(),
        contactInfo: data.contactInfo || '',
        websiteLink: data.websiteLink || '',
        email: data.email || '',
        insurenceLiability: data.insurenceLiability || '',
        location: location || '',
        state: statesArray,
      }
      console.log('[EditVendor] Updating vendor:', vendorData.id, payload)
      await Service.UpdateVendorById(vendorData.id, payload)
      toast.success('Vendor updated successfully!')
      onSuccess?.()
      onClose()
    } catch (err) {
      const msg = err?.response?.data?.message || 'Failed to update vendor'
      setError(msg); toast.error(msg)
    } finally { setSubmitting(false) }
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center p-5 border-b bg-gray-50 shrink-0">
          <h2 className="text-lg font-bold text-gray-800">Edit Vendor</h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 transition"><X size={18} className="text-gray-500" /></button>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-5 overflow-y-auto flex-1">
          {error && <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{error}</div>}
          <Input label="Vendor Name *" type="text" {...register('name', { required: 'Vendor name is required' })} placeholder="Enter vendor name" />
          {errors.name && <p className="text-red-500 text-xs">{errors.name.message}</p>}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <Input label="Contact Info" type="text" {...register('contactInfo')} placeholder="+1 234 567 8900" />
            <Input label="Email" type="email" {...register('email')} placeholder="vendor@example.com" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <Input label="Website" type="url" {...register('websiteLink')} placeholder="https://example.com" />
            <Input label="Insurance Liability" type="text" {...register('insurenceLiability')} placeholder="Insurance details" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Controller name="headquater.country" control={control}
              render={({ field }) => (
                <Select placeholder="Select Country"
                  options={Object.keys(COUNTRY_MAP).map((c) => ({ label: c, value: c }))}
                  value={field.value ? { label: field.value, value: field.value } : null}
                  onChange={(opt) => field.onChange(opt?.value || '')}
                  menuPortalTarget={document.body} styles={{ menuPortal: (b) => ({ ...b, zIndex: 9999 }) }} />
              )} />
            <Controller name="headquater.states" control={control}
              render={({ field }) => (
                <Select isMulti placeholder="Select State(s)" options={stateOptions}
                  value={Array.isArray(field.value) ? stateOptions.filter((o) => field.value.includes(o.value)) : []}
                  onChange={(opts) => { field.onChange(opts ? opts.map((o) => o.value) : []); setValue('headquater.city', '') }}
                  menuPortalTarget={document.body} styles={{ menuPortal: (b) => ({ ...b, zIndex: 9999 }) }} />
              )} />
            <Controller name="headquater.city" control={control}
              render={({ field }) => (
                <Select placeholder="Select City (Optional)" options={cityOptions}
                  value={field.value ? { label: field.value, value: field.value } : null}
                  onChange={(opt) => field.onChange(opt?.value || '')}
                  menuPortalTarget={document.body} styles={{ menuPortal: (b) => ({ ...b, zIndex: 9999 }) }} />
              )} />
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" onClick={onClose} disabled={submitting}>Cancel</Button>
            <Button type="submit" disabled={submitting} className="bg-green-600 text-white hover:bg-green-700 flex items-center gap-2 disabled:opacity-70">
              {submitting ? <><Loader2 className="w-4 h-4 animate-spin" />Saving...</> : <><Check className="w-4 h-4" />Save Changes</>}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Archive Confirmation ─────────────────────────────────────────────────────

const ArchiveConfirmModal = ({ vendorName, onConfirm, onCancel, deleting }) => (
  <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 p-4" onClick={onCancel}>
    <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl p-8 text-center" onClick={(e) => e.stopPropagation()}>
      <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-5">
        <Trash2 size={28} className="text-red-600" />
      </div>
      <h3 className="text-xl font-black text-gray-900 mb-2">Archive Vendor?</h3>
      <p className="text-sm text-gray-500 mb-1">You are about to permanently archive:</p>
      <p className="text-base font-black text-gray-800 mb-6">&quot;{vendorName}&quot;</p>
      <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 text-left">
        <p className="text-xs font-bold text-red-700 uppercase tracking-wider mb-1">⚠ This action cannot be undone</p>
        <p className="text-xs text-red-600">All vendor data, files, certificates and associations will be permanently removed from the system.</p>
      </div>
      <div className="flex gap-3">
        <button onClick={onCancel} disabled={deleting}
          className="flex-1 py-3 px-4 border border-gray-200 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-50 transition disabled:opacity-50">
          Cancel, Keep Vendor
        </button>
        <button onClick={onConfirm} disabled={deleting}
          className="flex-1 py-3 px-4 bg-red-600 hover:bg-red-700 rounded-xl text-sm font-black text-white transition flex items-center justify-center gap-2 disabled:opacity-70">
          {deleting ? <><Loader2 size={16} className="animate-spin" />Archiving...</> : <><Trash2 size={16} />Yes, Archive</>}
        </button>
      </div>
    </div>
  </div>
)

// ─── Main Popup ───────────────────────────────────────────────────────────────

const GetVendorByID = ({ id, onClose, onDeleted }) => {
  const [vendor, setVendor] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [activeTab, setActiveTab] = useState('DASHBOARD')
  const [editModal, setEditModal] = useState(false)
  const [archiveConfirm, setArchiveConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const loadVendor = async () => {
    try {
      setLoading(true); setError(null)
      console.log('[GetVendorByID] Fetching vendor:', id)
      const res = await Service.GetVendorById(id)
      const data = res?.data ?? res
      console.log('[GetVendorByID] Vendor data:', data)
      setVendor(data)
    } catch (err) {
      console.error('[GetVendorByID] Error:', err)
      setError('Failed to load vendor details')
    } finally { setLoading(false) }
  }

  useEffect(() => { if (id) loadVendor() }, [id])

  const handleArchive = async () => {
    try {
      setDeleting(true)
      await Service.DeleteVendorById(id)
      toast.success(`Vendor "${vendor.name}" archived successfully.`)
      setArchiveConfirm(false)
      onDeleted?.()
      onClose?.()
    } catch (err) {
      console.error('[GetVendorByID] Delete error:', err)
      toast.error('Failed to archive vendor')
    } finally { setDeleting(false) }
  }

  // ── Loading ──
  if (loading) return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-2xl p-12 flex flex-col items-center gap-4 shadow-2xl">
        <Loader2 className="w-12 h-12 animate-spin text-green-600" />
        <p className="text-gray-400 font-black uppercase tracking-widest text-xs">Loading Vendor Profile...</p>
      </div>
    </div>
  )

  // ── Error ──
  if (error || !vendor) return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-2xl p-12 flex flex-col items-center gap-4 shadow-2xl">
        <AlertCircle className="w-12 h-12 text-red-500" />
        <p className="font-bold uppercase tracking-widest text-xs text-red-500">{error || 'Vendor not found'}</p>
        <button onClick={onClose} className="mt-2 px-6 py-2 bg-gray-100 rounded-lg text-sm font-bold text-gray-600 hover:bg-gray-200 transition">Close</button>
      </div>
    </div>
  )

  return (
    <>
      {/* Full-screen overlay — same pattern as Connection Designer */}
      <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 sm:p-8">
        <div className="w-full h-full max-w-6xl max-h-[92vh] bg-white rounded-3xl shadow-2xl flex flex-col overflow-hidden">

          {/* ── Header ── */}
          <div className="p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 border-b border-gray-100 shrink-0">
            <div className="flex items-center gap-5">
              <div className="w-16 h-16 rounded-2xl bg-green-100 flex items-center justify-center text-green-800 text-3xl font-black shadow-sm shrink-0">
                {vendor.name?.charAt(0).toUpperCase()}
              </div>
              <div>
                <h2 className="text-2xl font-black text-gray-900 tracking-tight">{vendor.name}</h2>
                <div className="flex items-center flex-wrap gap-4 mt-1.5">
                  <span className="flex items-center gap-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                    <Calendar size={11} className="text-green-500" />
                    SINCE {new Date(vendor.createdAt).toLocaleDateString()}
                  </span>
                  {vendor.location && (
                    <span className="flex items-center gap-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                      <Globe size={11} className="text-green-500" />
                      {vendor.location.toUpperCase()}
                    </span>
                  )}
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${vendor.isDeleted ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-700'}`}>
                    {vendor.isDeleted ? 'Inactive' : 'Active'}
                  </span>
                </div>
              </div>
            </div>

            {/* Tab buttons + close */}
            <div className="flex items-center gap-2 shrink-0">
              <button onClick={() => setActiveTab('DASHBOARD')}
                className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 border transition-all ${activeTab === 'DASHBOARD' ? 'bg-green-50 border-green-200 text-green-700 shadow-sm' : 'bg-white border-gray-100 text-gray-400 hover:bg-gray-50'}`}>
                <LayoutDashboard size={13} /> Dashboard
              </button>
              <button onClick={() => setActiveTab('FILES')}
                className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 border transition-all ${activeTab === 'FILES' ? 'bg-green-50 border-green-200 text-green-700 shadow-sm' : 'bg-white border-gray-100 text-gray-400 hover:bg-gray-50'}`}>
                <Files size={13} /> Files
              </button>
              <button onClick={onClose}
                className="px-5 py-2 bg-red-50 border border-red-100 rounded-xl text-[10px] font-black text-red-600 uppercase tracking-widest hover:bg-red-100 transition-all flex items-center gap-2">
                <X size={13} /> Close
              </button>
            </div>
          </div>

          {/* ── Scrollable Body ── */}
          <div className="flex-1 overflow-y-auto p-6 sm:p-8 pt-6">
            {activeTab === 'DASHBOARD' ? (
              <>
                {/* Stat Row */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
                  <StatBox label="Files" value={vendor.files?.length ?? 0} unit="Files" icon={Files} />
                  <StatBox label="Certificates" value={vendor.certificates?.length ?? 0} unit="Certs" icon={ShieldCheck} />
                  <StatBox label="Status" value={vendor.isDeleted ? 'Inactive' : 'Active'} icon={ShieldCheck} isStatus={!vendor.isDeleted} />
                  <StatBox label="Coverage" value={Array.isArray(vendor.state) ? vendor.state.length : 0} unit="States" icon={Globe} subtext="COVERAGE AREA" />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                  {/* Left: profile info */}
                  <div className="lg:col-span-8 space-y-10">

                    {/* Contact info strip */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <InfoRow icon={Mail} label="Email" value={vendor.email} />
                      <InfoRow icon={Phone} label="Contact Info" value={vendor.contactInfo} />
                      <InfoRow icon={Link} label="Insurance Liability" value={vendor.insurenceLiability} />
                      <InfoRow icon={Globe} label="Website" value={vendor.websiteLink}
                        href={vendor.websiteLink} color="text-cyan-600" />
                    </div>

                    {/* Profile Details */}
                    <div>
                      <h3 className="text-[11px] font-black text-gray-900 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                        <Users size={16} className="text-green-600" /> Profile Details
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-8 gap-x-12 bg-gray-50/40 p-8 rounded-3xl border border-gray-100">
                        <DetailItem label="Principal Email" value={vendor.email} />
                        <DetailItem label="Digital Presence">
                          {vendor.websiteLink
                            ? <a href={vendor.websiteLink} target="_blank" rel="noreferrer"
                              className="text-cyan-600 underline text-sm font-bold flex items-center gap-1 hover:text-cyan-800">
                              <ExternalLink size={12} />
                              {vendor.websiteLink.length > 35 ? vendor.websiteLink.slice(0, 35) + '...' : vendor.websiteLink}
                            </a>
                            : <p className="text-sm font-bold text-gray-900">—</p>
                          }
                        </DetailItem>
                        <DetailItem label="Secure Contact" value={vendor.contactInfo} />
                        <DetailItem label="Insurance Liability" value={vendor.insurenceLiability} />
                        <DetailItem label="Coverage"
                          value={Array.isArray(vendor.state) && vendor.state.length > 0 ? vendor.state.join(', ') : '—'} />
                        <DetailItem label="POC Count"
                          value={vendor.pointOfContacts?.length ? `${vendor.pointOfContacts.length} contact(s)` : '—'} />
                      </div>
                    </div>

                    {/* State coverage pills */}
                    {Array.isArray(vendor.state) && vendor.state.length > 0 && (
                      <div>
                        <h3 className="text-[11px] font-black text-gray-900 uppercase tracking-[0.2em] mb-5 flex items-center gap-2">
                          <MapPin size={16} className="text-green-600" /> State Coverage
                        </h3>
                        <div className="flex flex-wrap gap-2">
                          {vendor.state.map((s) => (
                            <span key={s} className="px-4 py-1.5 bg-green-50 border border-green-200 text-green-700 text-[11px] font-black uppercase tracking-wider rounded-full">{s}</span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Right: Admin Control */}
                  <div className="lg:col-span-4">
                    <div className="p-8 rounded-[2rem] border-2 border-gray-100 flex flex-col gap-5 bg-white shadow-sm sticky top-0">
                      <h3 className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2">
                        Administrative Control
                      </h3>

                      <button onClick={() => setEditModal(true)}
                        className="w-full p-4 bg-white border border-gray-200 rounded-xl flex items-center gap-4 hover:bg-gray-50 transition-all group">
                        <div className="p-2.5 bg-gray-50 rounded-lg text-gray-400 group-hover:text-gray-900 transition-colors">
                          <Edit2 size={16} />
                        </div>
                        <span className="text-[10px] font-black text-gray-700 uppercase tracking-widest">Edit Vendor Info</span>
                      </button>

                      <button onClick={() => setArchiveConfirm(true)}
                        className="w-full p-4 bg-red-50/50 border border-red-100 rounded-xl flex items-center gap-4 hover:bg-red-50 transition-all group">
                        <div className="p-2.5 bg-white border border-red-100 rounded-lg text-red-500">
                          <Trash2 size={16} strokeWidth={2.5} />
                        </div>
                        <span className="text-[10px] font-black text-red-600 uppercase tracking-widest">Archive Vendor</span>
                      </button>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              /* Files Tab */
              <div className="min-h-[400px]">
                <VendorFiles vendorId={id} />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Edit Modal ── */}
      {editModal && (
        <EditVendorModal vendorData={vendor} onClose={() => setEditModal(false)} onSuccess={loadVendor} />
      )}

      {/* ── Archive Confirmation ── */}
      {archiveConfirm && (
        <ArchiveConfirmModal
          vendorName={vendor.name}
          onConfirm={handleArchive}
          onCancel={() => setArchiveConfirm(false)}
          deleting={deleting}
        />
      )}
    </>
  )
}

export default GetVendorByID
