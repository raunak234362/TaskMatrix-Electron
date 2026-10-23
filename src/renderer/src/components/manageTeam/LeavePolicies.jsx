import { useCallback, useEffect, useState } from 'react'
import { Check, Pencil, Plus, RefreshCw, Trash2, X } from 'lucide-react'
import { toast } from 'react-toastify'
import Service from '../../api/Service'
import { extractList, getLeaveType } from './leaveUtils'

const LEAVE_TYPES = ['SICK', 'PAID', 'CASUAL']
const policyUserType = (policy) => policy?.userType || 'ALL'
const policyKey = (policy) => `${getLeaveType(policy)}:${policyUserType(policy)}:${policy?.isProbation ? 'probation' : 'regular'}`

const LeavePolicies = () => {
  const [policies, setPolicies] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editingKey, setEditingKey] = useState('')
  const [formType, setFormType] = useState('')
  const [userType, setUserType] = useState('ALL')
  const [annualAllowance, setAnnualAllowance] = useState('')
  const [isProbation, setIsProbation] = useState(false)
  const [creating, setCreating] = useState(false)
  const [deletingKey, setDeletingKey] = useState('')

  const loadPolicies = useCallback(async () => {
    setLoading(true)
    try {
      const response = await Service.GetLeavePolicies()
      setPolicies(extractList(response, ['policies', 'items']))
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Unable to load leave policies.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadPolicies()
  }, [loadPolicies])

  const resetForm = () => {
    setEditingKey('')
    setFormType('')
    setUserType('ALL')
    setAnnualAllowance('')
    setIsProbation(false)
    setCreating(false)
  }

  const beginEdit = (policy) => {
    setEditingKey(policyKey(policy))
    setFormType(getLeaveType(policy))
    setUserType(policyUserType(policy))
    setAnnualAllowance(String(policy.annualAllowance ?? ''))
    setIsProbation(Boolean(policy.isProbation))
  }

  const beginCreate = () => {
    resetForm()
    setCreating(true)
  }

  const savePolicy = async (event) => {
    event.preventDefault()
    const type = creating ? formType : getLeaveType(policies.find((policy) => policyKey(policy) === editingKey))
    const designation = userType.trim() || 'ALL'
    const allowance = Number(annualAllowance)
    if (!type) {
      toast.error('A leave policy type is required.')
      return
    }
    if (annualAllowance === '' || !Number.isInteger(allowance) || allowance < 0 || allowance > 365) {
      toast.error('Annual allowance must be a whole number between 0 and 365.')
      return
    }
    if (creating && policies.some((policy) => getLeaveType(policy) === type && policyUserType(policy).toLowerCase() === designation.toLowerCase() && Boolean(policy.isProbation) === isProbation)) {
      toast.error('A policy already exists for this leave type, designation, and stage.')
      return
    }

    const payload = { userType: designation, annualAllowance: allowance, isProbation }
    setSaving(true)
    try {
      if (creating) {
        await Service.CreateLeavePolicy({ type, ...payload })
        toast.success('Leave policy created.')
      } else {
        await Service.UpdateLeavePolicy(type, payload)
        toast.success('Leave policy updated.')
      }
      resetForm()
      await loadPolicies()
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Unable to save this leave policy.')
    } finally {
      setSaving(false)
    }
  }

  const deletePolicy = async (policy) => {
    const key = policyKey(policy)
    const type = getLeaveType(policy)
    const designation = policyUserType(policy)
    const probation = Boolean(policy.isProbation)
    if (!window.confirm(`Delete the ${type} ${probation ? 'probation' : 'regular'} leave policy for ${designation}? This cannot be undone.`)) return
    setDeletingKey(key)
    try {
      await Service.DeleteLeavePolicy(type, designation, probation)
      toast.success('Leave policy deleted.')
      await loadPolicies()
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Unable to delete this leave policy.')
    } finally {
      setDeletingKey('')
    }
  }

  const policyForm = (title, submitLabel) => (
    <form onSubmit={savePolicy} className="mb-5 rounded-xl border border-green-200 bg-white p-5 shadow-sm">
      <h3 className="mb-3 text-lg font-bold text-gray-900">{title}</h3>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm font-medium text-gray-700">
          Leave type
          <select value={formType} onChange={(event) => setFormType(event.target.value)} required disabled={!creating} className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 focus:border-green-600 focus:outline-none focus:ring-2 focus:ring-green-100 disabled:bg-gray-100">
            <option value="">Select a leave type</option>
            {LEAVE_TYPES.map((type) => <option key={type} value={type}>{type}</option>)}
          </select>
        </label>
        <label className="block text-sm font-medium text-gray-700">
          User type (matches employee designation)
          <input type="text" maxLength="50" required disabled={!creating} value={userType} onChange={(event) => setUserType(event.target.value)} placeholder="ALL or e.g. TRAINEE" className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-green-600 focus:outline-none focus:ring-2 focus:ring-green-100 disabled:bg-gray-100" />
          <span className="mt-1 block text-xs font-normal text-gray-500">Use ALL as the fallback for designations without a specific policy.</span>
        </label>
        <label className="block text-sm font-medium text-gray-700">
          Annual allowance (days)
          <input type="number" min="0" max="365" step="1" required value={annualAllowance} onChange={(event) => setAnnualAllowance(event.target.value)} className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-green-600 focus:outline-none focus:ring-2 focus:ring-green-100" />
        </label>
        <label className="block text-sm font-medium text-gray-700">
          Employee stage
          <select value={isProbation ? 'probation' : 'regular'} onChange={(event) => setIsProbation(event.target.value === 'probation')} disabled={!creating} className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 focus:border-green-600 focus:outline-none focus:ring-2 focus:ring-green-100 disabled:bg-gray-100">
            <option value="regular">Regular (probation completed)</option>
            <option value="probation">On probation</option>
          </select>
        </label>
      </div>
      <div className="mt-3 flex justify-end gap-2">
        <button type="button" onClick={resetForm} disabled={saving} className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-50"><X size={14} /> Cancel</button>
        <button type="submit" disabled={saving} className="inline-flex items-center gap-1 rounded-lg bg-green-700 px-3 py-2 text-sm font-semibold text-white hover:bg-green-800 disabled:opacity-60"><Check size={14} /> {saving ? 'Saving…' : submitLabel}</button>
      </div>
    </form>
  )

  return (
    <section className="mx-auto w-full max-w-6xl p-5 md:p-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-green-700">Human resources</p>
          <h2 className="mt-1 text-2xl font-bold text-gray-900">Leave policies</h2>
          <p className="mt-1 text-sm text-gray-500">Set separate leave allowances for employees on probation and regular employees.</p>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={beginCreate} className="inline-flex items-center gap-2 rounded-lg bg-green-700 px-4 py-2 text-sm font-semibold text-white hover:bg-green-800"><Plus size={15} /> Add policy</button>
          <button type="button" onClick={loadPolicies} disabled={loading} className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-60"><RefreshCw size={15} className={loading ? 'animate-spin' : ''} /> Refresh</button>
        </div>
      </div>

      {creating && policyForm('New leave policy', 'Create policy')}

      {loading ? (
        <div className="rounded-xl border border-gray-200 bg-white p-8 text-center text-sm text-gray-500"><RefreshCw size={17} className="mx-auto mb-2 animate-spin" /> Loading leave policies…</div>
      ) : policies.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 bg-white p-8 text-center text-sm text-gray-500">No leave policies were returned by the server.</div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {policies.map((policy, index) => {
            const type = getLeaveType(policy)
            const designation = policyUserType(policy)
            const probation = Boolean(policy.isProbation)
            const key = policyKey(policy)
            const isEditing = editingKey === key
            return (
              <article key={policy?.id ?? policy?._id ?? key} className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                <div className="mb-4 flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">{type} · {designation}</h3>
                    <p className="mt-1 text-xs text-gray-500">{probation ? 'For employees currently on probation' : 'For employees who completed probation'}</p>
                  </div>
                  {!isEditing && (
                    <div className="flex gap-2">
                      <button type="button" onClick={() => beginEdit(policy)} className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"><Pencil size={14} /> Edit</button>
                      <button type="button" onClick={() => deletePolicy(policy)} disabled={deletingKey === key} className="inline-flex items-center gap-2 rounded-lg border border-red-200 px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:opacity-60"><Trash2 size={14} /> {deletingKey === key ? 'Deleting…' : 'Delete'}</button>
                    </div>
                  )}
                </div>
                {isEditing ? policyForm('Edit leave policy', 'Save policy') : (
                  <dl className="grid grid-cols-2 gap-3 border-t border-gray-100 pt-3 text-sm">
                    <div><dt className="text-gray-500">Annual allowance</dt><dd className="font-semibold text-gray-800">{policy.annualAllowance} days</dd></div>
                    <div><dt className="text-gray-500">Employee stage</dt><dd className="font-semibold text-gray-800">{probation ? 'On probation' : 'Regular'}</dd></div>
                  </dl>
                )}
              </article>
            )
          })}
        </div>
      )}
    </section>
  )
}

export default LeavePolicies
