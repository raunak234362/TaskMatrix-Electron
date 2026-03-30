/* eslint-disable react/prop-types */
import { useEffect, useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { toast } from 'react-toastify'
import { Loader2 } from 'lucide-react'
import ReactSelect from 'react-select'

import Input from '../fields/input'
import SectionTitle from '../ui/SectionTitle'
import Service from '../../api/Service'
import RichTextEditor from '../fields/RichTextEditor'

const RFQ_STATUS_OPTIONS = [
    { label: 'Open', value: 'OPEN' },
    { label: 'Awarded', value: 'AWARDED' },
    { label: 'In Review', value: 'IN_REVIEW' },
    { label: 'Closed', value: 'CLOSED' },
    { label: 'Re-Approval', value: 'RE_APPROVAL' },
    { label: 'Rejected', value: 'REJECTED' },
    { label: 'Assigned for Estimation', value: 'ASSIGNED_FOR_ESTIMATION' },
    { label: 'Estimation in Progress', value: 'ESTIMATION_IN_PROGRESS' },
]

const TOOLS_OPTIONS = [
    { label: 'TEKLA', value: 'TEKLA' },
    { label: 'SDS/2', value: 'SDS/2' },
    { label: 'BOTH', value: 'BOTH' },
    { label: 'NO PREFERENCE', value: 'NO_PREFERENCE' },
]

const selectStyles = {
    control: (base, state) => ({
        ...base,
        borderColor: state.isFocused ? '#3b82f6' : '#d1d5db',
        boxShadow: state.isFocused ? '0 0 0 1px #3b82f6' : 'none',
        '&:hover': { borderColor: '#3b82f6' },
        padding: '2px',
        borderRadius: '0.375rem'
    }),
    menuPortal: (base) => ({ ...base, zIndex: 9999 })
}

const EditRFQByID = ({ id, onSuccess, onCancel }) => {
    const [loading, setLoading] = useState(true)

    const {
        register,
        handleSubmit,
        control,
        reset,
        formState: { errors, isSubmitting }
    } = useForm()

    useEffect(() => {
        const fetchRFQ = async () => {
            try {
                const res = await Service.GetRFQbyId(id)
                if (res?.data) {
                    const d = res.data
                    reset({
                        projectName: d.projectName || '',
                        subject: d.subject || '',
                        projectNumber: d.projectNumber || '',
                        status: d.status || 'OPEN',
                        tools: d.tools || '',
                        estimationDate: d.estimationDate ? String(d.estimationDate).split('T')[0] : '',
                        bidPrice: d.bidPrice ?? '',
                        description: d.description || '',
                        connectionDesign: d.connectionDesign ?? false,
                        miscDesign: d.miscDesign ?? false,
                        customerDesign: d.customerDesign ?? false,
                        detailingMain: d.detailingMain ?? false,
                        detailingMisc: d.detailingMisc ?? false,
                        MTOManual: d.MTOManual ?? false,
                        MTOStickModel: d.MTOStickModel || ""
                    })
                }
            } catch (error) {
                console.error('Fetch RFQ error:', error)
                toast.error('Failed to load RFQ details')
            } finally {
                setLoading(false)
            }
        }

        if (id) fetchRFQ()
    }, [id, reset])

    const onSubmit = async (data) => {
        try {
            const payload = {
                ...data,
                bidPrice: data.bidPrice !== '' && data.bidPrice !== null && data.bidPrice !== undefined
                    ? Number(data.bidPrice)
                    : '',
                estimationDate: data.estimationDate ? new Date(data.estimationDate).toISOString() : ''
            }
            await Service.UpdateRFQById(id, payload)
            toast.success('RFQ updated successfully')
            onSuccess?.()
        } catch (error) {
            console.error('Update RFQ error:', error)
            toast.error('Failed to update RFQ')
        }
    }

    if (loading) {
        return (
            <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 backdrop-blur-sm">
                <Loader2 className="w-8 h-8 animate-spin text-green-600" />
            </div>
        )
    }

    return (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-all duration-300">
            <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl border border-gray-200 max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">

                {/* HEADER */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-white shrink-0">
                    <div>
                        <h2 className="text-xl font-black text-black tracking-tight">Edit RFQ</h2>
                        <p className="text-[10px] font-black text-black uppercase tracking-[0.2em] mt-1">
                            UPDATE RFQ DETAILS AND STATUS
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={onCancel}
                        className="px-4 py-2 bg-red-50 border border-red-600 text-black font-black text-[10px] uppercase tracking-widest rounded-lg hover:bg-red-100 transition-all"
                    >
                        Close
                    </button>
                </div>

                {/* BODY */}
                <div className="flex-1 overflow-y-auto p-8 space-y-8 bg-white font-sans custom-scrollbar">
                    <form id="edit-rfq-form" onSubmit={handleSubmit(onSubmit)} className="space-y-6">

                        {/* Card 1 — Basic Details */}
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 space-y-6">
                            <SectionTitle title="RFQ Details" />
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <Input
                                    label="Project Name *"
                                    {...register('projectName', { required: 'Project name is required' })}
                                    placeholder="e.g. Steel Frame Building"
                                    error={errors.projectName?.message}
                                />
                                <Input
                                    label="Project Number"
                                    {...register('projectNumber')}
                                    placeholder="e.g. PRJ-2025-001"
                                />
                                <Input
                                    label="Subject"
                                    {...register('subject')}
                                    placeholder="e.g. Structural Detailing RFQ"
                                />
                                <Input
                                    label="Due Date (Estimation)"
                                    type="date"
                                    {...register('estimationDate')}
                                />
                                <Input
                                    label="Bid Amount (USD)"
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    {...register('bidPrice')}
                                    placeholder="e.g. 5000"
                                />
                                <div className="flex flex-col gap-1">
                                    <label className="text-[10px] font-black text-black uppercase tracking-widest mb-1">
                                        Tools / Software
                                    </label>
                                    <Controller
                                        name="tools"
                                        control={control}
                                        render={({ field }) => (
                                            <ReactSelect
                                                {...field}
                                                options={TOOLS_OPTIONS}
                                                value={TOOLS_OPTIONS.find((op) => op.value === field.value) || null}
                                                onChange={(val) => field.onChange(val ? val.value : '')}
                                                styles={selectStyles}
                                                menuPortalTarget={document.body}
                                                placeholder="Select Tools..."
                                                className="text-sm w-full"
                                            />
                                        )}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Card 2 — Status */}
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 space-y-4">
                            <SectionTitle title="Status" />
                            <div className="flex flex-col gap-1">
                                <label className="text-[10px] font-black text-black uppercase tracking-widest mb-1">
                                    WBT Status
                                </label>
                                <Controller
                                    name="status"
                                    control={control}
                                    render={({ field }) => (
                                        <ReactSelect
                                            {...field}
                                            options={RFQ_STATUS_OPTIONS}
                                            value={RFQ_STATUS_OPTIONS.find((op) => op.value === field.value) || null}
                                            onChange={(val) => field.onChange(val ? val.value : 'OPEN')}
                                            styles={selectStyles}
                                            menuPortalTarget={document.body}
                                            className="text-sm w-full md:w-1/2"
                                        />
                                    )}
                                />
                            </div>
                        </div>

                        {/* Card 3 — Description */}
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 space-y-4">
                            <SectionTitle title="Description" />
                            <Controller
                                name="description"
                                control={control}
                                render={({ field }) => (
                                    <RichTextEditor
                                        value={field.value || ''}
                                        onChange={field.onChange}
                                        placeholder="Project scope, special requirements..."
                                    />
                                )}
                            />
                        </div>

                        {/* Card 4 — Scope */}
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 space-y-4">
                            <SectionTitle title="Connection Design Scope" />
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <label className="flex items-center gap-3 cursor-pointer select-none group">
                                    <input
                                        type="checkbox"
                                        {...register('connectionDesign')}
                                        className="w-4 h-4 rounded border-gray-300 accent-green-500"
                                    />
                                    <span className="text-sm font-semibold text-gray-700 group-hover:text-black transition-colors">
                                        Connection Design
                                    </span>
                                </label>
                                <label className="flex items-center gap-3 cursor-pointer select-none group">
                                    <input
                                        type="checkbox"
                                        {...register('miscDesign')}
                                        className="w-4 h-4 rounded border-gray-300 accent-green-500"
                                    />
                                    <span className="text-sm font-semibold text-gray-700 group-hover:text-black transition-colors">
                                        Misc Design
                                    </span>
                                </label>
                                <label className="flex items-center gap-3 cursor-pointer select-none group">
                                    <input
                                        type="checkbox"
                                        {...register('customerDesign')}
                                        className="w-4 h-4 rounded border-gray-300 accent-green-500"
                                    />
                                    <span className="text-sm font-semibold text-gray-700 group-hover:text-black transition-colors">
                                        Customer Design
                                    </span>
                                </label>
                            </div>

                            <SectionTitle title="Detailing Scope" />
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <label className="flex items-center gap-3 cursor-pointer select-none group">
                                    <input
                                        type="checkbox"
                                        {...register('detailingMain')}
                                        className="w-4 h-4 rounded border-gray-300 accent-green-500"
                                    />
                                    <span className="text-sm font-semibold text-gray-700 group-hover:text-black transition-colors">
                                        Detailing Main
                                    </span>
                                </label>
                                <label className="flex items-center gap-3 cursor-pointer select-none group">
                                    <input
                                        type="checkbox"
                                        {...register('detailingMisc')}
                                        className="w-4 h-4 rounded border-gray-300 accent-green-500"
                                    />
                                    <span className="text-sm font-semibold text-gray-700 group-hover:text-black transition-colors">
                                        Detailing Misc
                                    </span>
                                </label>
                                <label className="flex items-center gap-3 cursor-pointer select-none group">
                                    <input
                                        type="checkbox"
                                        {...register('MTOManual')}
                                        className="w-4 h-4 rounded border-gray-300 accent-green-500"
                                    />
                                    <span className="text-sm font-semibold text-gray-700 group-hover:text-black transition-colors">
                                        MTO Manual
                                    </span>
                                </label>
                            </div>
                            <div className="pt-4 border-t border-gray-50">
                                <Input
                                    label="MTO Stick Model Details"
                                    {...register('MTOStickModel')}
                                    placeholder="Enter details..."
                                />
                            </div>
                        </div>

                    </form>
                </div>

                {/* FOOTER */}
                <div className="px-8 py-5 border-t border-gray-200 bg-white flex justify-end gap-3 z-10 shrink-0">
                    <button
                        type="button"
                        onClick={onCancel}
                        disabled={isSubmitting}
                        className="px-8 py-3 bg-gray-50 border border-gray-300 hover:bg-gray-100 text-black rounded-lg text-[10px] font-black uppercase tracking-[0.2em] transition-all disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    <button
                        form="edit-rfq-form"
                        type="submit"
                        disabled={isSubmitting}
                        className="px-8 py-3 bg-[#6bbd45]/15 hover:bg-[#6bbd45]/30 text-black border border-black rounded-lg text-[10px] font-black uppercase tracking-[0.2em] shadow-sm transition-all flex items-center gap-3 active:scale-95 disabled:opacity-50"
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 className="animate-spin w-4 h-4" />
                                <span>Updating...</span>
                            </>
                        ) : (
                            'Update RFQ'
                        )}
                    </button>
                </div>

            </div>
        </div>
    )
}

export default EditRFQByID