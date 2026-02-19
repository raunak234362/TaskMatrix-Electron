import React, { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import Select from 'react-select';
import { format, parseISO } from 'date-fns';
import Service from '../../api/Service';

const customStyles = {
    control: (base) => ({
        ...base,
        backgroundColor: 'white',
        borderColor: '#e5e7eb',
        borderRadius: '0.5rem',
        padding: '2px',
        boxShadow: 'none',
        '&:hover': {
            borderColor: '#3b82f6'
        }
    }),
    singleValue: (base) => ({
        ...base,
        color: '#374151'
    }),
    option: (base, state) => ({
        ...base,
        backgroundColor: state.isSelected ? '#eff6ff' : state.isFocused ? '#f9fafb' : 'white',
        color: state.isSelected ? '#1d4ed8' : '#374151',
        cursor: 'pointer'
    }),
    menu: (base) => ({
        ...base,
        zIndex: 9999,
        borderRadius: '0.5rem',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
    })
};

const CommunicationForm = ({
    initialData,
    projects = [],
    fabricators = [],
    onSubmit,
    onCancel
}) => {
    const [clients, setClients] = useState([]);

    const { register, handleSubmit, control, reset, watch, formState: { errors } } = useForm({
        defaultValues: {
            projectId: '',
            fabricatorId: '',
            clientName: '',
            subject: '',
            notes: '',
            communicationDate: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
            followUpDate: '',
            reminderSent: true,
            isCompleted: false
        }
    });

    const watchedFabricatorId = watch('fabricatorId');

    // Populate form if editing
    useEffect(() => {
        if (initialData) {
            reset({
                projectId: initialData.projectId,
                fabricatorId: initialData.fabricatorId,
                clientName: initialData.clientName,
                subject: initialData.subject,
                notes: initialData.notes,
                communicationDate: initialData.communicationDate ? format(parseISO(initialData.communicationDate), "yyyy-MM-dd'T'HH:mm") : '',
                followUpDate: initialData.followUpDate ? format(parseISO(initialData.followUpDate), "yyyy-MM-dd'T'HH:mm") : '',
                reminderSent: initialData.reminderSent,
                isCompleted: initialData.isCompleted
            });
        }
    }, [initialData, reset]);

    // Fetch Clients when Fabricator changes
    useEffect(() => {
        const fetchClients = async () => {
            if (watchedFabricatorId) {
                try {
                    const data = await Service.FetchAllClientsByFabricatorID(watchedFabricatorId);
                    const clientList = Array.isArray(data) ? data : (data?.data || []);
                    setClients(clientList);
                } catch (error) {
                    console.error("Failed to fetch clients", error);
                    setClients([]);
                }
            } else {
                setClients([]);
            }
        };
        fetchClients();
    }, [watchedFabricatorId]);

    // Derived state for projects based on selected fabricator
    const availableProjects = watchedFabricatorId
        ? projects.filter(p => p.fabricatorId === watchedFabricatorId)
        : [];

    const onFormSubmit = (data) => {
        const payload = {
            projectId: data.projectId,
            fabricatorId: data.fabricatorId,
            clientName: data.clientName,
            subject: data.subject,
            notes: data.notes,
            communicationDate: data.communicationDate ? new Date(data.communicationDate).toISOString() : null,
            followUpDate: data.followUpDate ? new Date(data.followUpDate).toISOString() : null,
            reminderSent: data.reminderSent,
            isCompleted: data.isCompleted
        };
        onSubmit(payload);
    };

    return (
        <form onSubmit={handleSubmit(onFormSubmit)} className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-700">Fabricator <span className="text-red-500">*</span></label>
                    <Controller
                        name="fabricatorId"
                        control={control}
                        rules={{ required: true }}
                        render={({ field }) => (
                            <Select
                                options={fabricators.map(f => ({ value: f.id || f._id, label: f.fabName }))}
                                value={fabricators.map(f => ({ value: f.id || f._id, label: f.fabName })).find(op => op.value === field.value) || null}
                                onChange={(val) => field.onChange(val ? val.value : '')}
                                placeholder="Select Fabricator"
                                menuPortalTarget={document.body}
                                styles={customStyles}
                            />
                        )}
                    />
                    {errors.fabricatorId && <span className="text-xs text-red-500">Required</span>}
                </div>
                <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-700">Project <span className="text-red-500">*</span></label>
                    <Controller
                        name="projectId"
                        control={control}
                        rules={{ required: true }}
                        render={({ field }) => (
                            <Select
                                {...field}
                                isDisabled={!watchedFabricatorId}
                                options={availableProjects.map(p => ({ value: p.id || p._id, label: p.projectName }))}
                                value={availableProjects.map(p => ({ value: p.id || p._id, label: p.projectName })).find(op => op.value === field.value) || null}
                                onChange={(val) => field.onChange(val ? val.value : '')}
                                styles={customStyles}
                                placeholder="Select Project"
                                menuPortalTarget={document.body}
                            />
                        )}
                    />
                    {errors.projectId && <span className="text-xs text-red-500">Required</span>}
                </div>
            </div>

            <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">Client Name <span className="text-red-500">*</span></label>
                <Controller
                    name="clientName"
                    control={control}
                    rules={{ required: true }}
                    render={({ field }) => {
                        const options = clients.map(c => ({ value: `${c.firstName} ${c.lastName}`, label: `${c.firstName} ${c.lastName} (${c.email})` }));
                        const selectedOption = options.find(op => op.value === field.value) || (field.value ? { value: field.value, label: field.value } : null);
                        return (
                            <Select
                                {...field}
                                isDisabled={!watchedFabricatorId}
                                options={options}
                                value={selectedOption}
                                onChange={(val) => field.onChange(val ? val.value : '')}
                                styles={customStyles}
                                placeholder="Select Client"
                                menuPortalTarget={document.body}
                            />
                        );
                    }}
                />
                {errors.clientName && <span className="text-xs text-red-500">Required</span>}
            </div>

            <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">Subject <span className="text-red-500">*</span></label>
                <input
                    {...register('subject', { required: true })}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-500"
                    placeholder="Quick summary"
                />
                {errors.subject && <span className="text-xs text-red-500">Required</span>}
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-700">Date <span className="text-red-500">*</span></label>
                    <input
                        type="datetime-local"
                        defaultValue={initialData ? undefined : format(new Date(), "yyyy-MM-dd'T'HH:mm")}
                        {...register('communicationDate', { required: true })}
                        className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-500"
                    />
                </div>
                <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-700">Follow-up Date</label>
                    <input
                        type="datetime-local"
                        {...register('followUpDate')}
                        className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-500"
                    />
                </div>
            </div>

            <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">Notes</label>
                <textarea
                    {...register('notes')}
                    rows={4}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-500 resize-none"
                    placeholder="Detailed notes..."
                />
            </div>

            <div className="flex items-center gap-2">
                <input
                    type="checkbox"
                    id="reminderSent"
                    {...register('reminderSent')}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="reminderSent" className="text-sm text-gray-700">Send Reminder Notification</label>
            </div>

            <div className="pt-4 flex justify-end gap-3">
                <button
                    type="button"
                    onClick={onCancel}
                    className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg text-sm font-medium transition-colors"
                >
                    Cancel
                </button>
                <button
                    type="submit"
                    className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors shadow-sm"
                >
                    Save Record
                </button>
            </div>
        </form>
    );
};

export default CommunicationForm;
