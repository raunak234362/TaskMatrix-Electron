import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import Service from '../../api/Service';
import { toast } from 'react-toastify';
import Select from 'react-select';
import { format, parseISO } from 'date-fns';
import { Plus, Check, Edit2, Search, Filter } from 'lucide-react';
import Modal from '../ui/Modal'; // Assuming a reusable Modal component exists, referencing MeetingModal's usage

const customStyles = {
    control: (provided) => ({
        ...provided,
        backgroundColor: '#ffffff !important', // Force white bg
        borderColor: '#e5e7eb',
        color: '#111827 !important', // Force dark text
        minHeight: '42px',
        boxShadow: 'none',
        '&:hover': {
            borderColor: '#3b82f6'
        }
    }),
    singleValue: (provided) => ({
        ...provided,
        color: '#111827 !important', // Force dark text for selected value
    }),
    input: (provided) => ({
        ...provided,
        color: '#111827 !important', // Force dark text for input
    }),
    placeholder: (provided) => ({
        ...provided,
        color: '#6b7280 !important', // Force gray text for placeholder
    }),
    option: (provided, state) => ({
        ...provided,
        backgroundColor: state.isSelected
            ? '#2563eb !important'
            : (state.isFocused ? '#eff6ff !important' : '#ffffff !important'),
        color: state.isSelected
            ? '#ffffff !important'
            : '#111827 !important',
        cursor: 'pointer',
        '&:active': {
            backgroundColor: '#2563eb !important',
        }
    }),
    menu: (provided) => ({
        ...provided,
        backgroundColor: '#ffffff !important',
        zIndex: 9999,
        border: '1px solid #e5e7eb',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
    }),
    menuPortal: (base) => ({ ...base, zIndex: 9999 })
};

const Communication = () => {
    const [communications, setCommunications] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingComm, setEditingComm] = useState(null); // Track communication being edited
    const [projects, setProjects] = useState([]);
    const [fabricators, setFabricators] = useState([]);
    const [clients, setClients] = useState([]); // Added clients state
    const [searchTerm, setSearchTerm] = useState('');

    const { register, handleSubmit, control, reset, setValue, watch, formState: { errors } } = useForm({
        defaultValues: {
            projectId: '',
            fabricatorId: '', // Added fabricatorId
            clientName: '',
            subject: '',
            notes: '',
            communicationDate: '',
            followUpDate: '',
            reminderSent: true,
            isCompleted: false
        }
    });

    const watchedProjectId = watch('projectId');
    const watchedFabricatorId = watch('fabricatorId');

    // Fetch Initial Data
    useEffect(() => {
        fetchCommunications();
        fetchDropdownData();
    }, []);

    // Handle Fabricator Selection -> Fetch Clients
    useEffect(() => {
        const fetchClients = async () => {
            if (watchedFabricatorId) {
                try {
                    const data = await Service.FetchAllClientsByFabricatorID(watchedFabricatorId);
                    // Ensure data is an array (handle potential { data: [...] } structure)
                    const clientList = Array.isArray(data) ? data : (data?.data || []);
                    setClients(clientList);
                } catch (error) {
                    console.error("Failed to fetch clients for fabricator", error);
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

    const fetchCommunications = async () => {
        setLoading(true);
        try {
            const data = await Service.GetClientCommunicationFollowupList();
            // Ensure data is an array
            setCommunications(Array.isArray(data) ? data : (data?.data || []));
        } catch (error) {
            console.error("Failed to fetch communications", error);
            toast.error("Failed to load communications");
        } finally {
            setLoading(false);
        }
    };

    const fetchDropdownData = async () => {
        try {
            // Fetch Projects and Fabricators for dropdowns
            // Assuming these APIs exist based on Service.js content
            const allProjects = await Service.GetAllProjects();
            const allFabricators = await Service.GetAllFabricators();

            // Map for react-select or standard select
            // Assuming AllProjects returns { data: [...] } or array
            setProjects(Array.isArray(allProjects) ? allProjects : (allProjects?.data || []));
            setFabricators(Array.isArray(allFabricators) ? allFabricators : (allFabricators?.data || []));

        } catch (error) {
            console.error("Failed to fetch dropdown data", error);
        }
    };

    // Modal Handlers
    const handleOpenModal = (comm = null) => {
        setEditingComm(comm);
        if (comm) {
            // Populate form for editing
            reset({
                projectId: comm.projectId,
                fabricatorId: comm.fabricatorId,
                clientName: comm.clientName,
                subject: comm.subject,
                notes: comm.notes,
                communicationDate: comm.communicationDate ? format(parseISO(comm.communicationDate), "yyyy-MM-dd'T'HH:mm") : '',
                followUpDate: comm.followUpDate ? format(parseISO(comm.followUpDate), "yyyy-MM-dd'T'HH:mm") : '',
                reminderSent: comm.reminderSent,
                isCompleted: comm.isCompleted
            });
        } else {
            // Reset for new entry
            reset({
                projectId: '',
                fabricatorId: '',
                clientName: '',
                subject: '',
                notes: '',
                communicationDate: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
                followUpDate: '',
                reminderSent: true,
                isCompleted: false
            });
        }
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingComm(null);
        reset();
    };

    const onSubmit = async (data) => {
        try {
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

            if (editingComm) {
                await Service.UpdateClientCommunicationFollowup(editingComm.id || editingComm._id, payload);
                toast.success("Communication updated successfully");
            } else {
                await Service.AddClientCommunicationFollowup(payload);
                toast.success("Communication added successfully");
            }
            fetchCommunications();
            handleCloseModal();
        } catch (error) {
            console.error("Error saving communication", error);
            toast.error("Failed to save communication");
        }
    };

    const handleMarkCompleted = async (id) => {
        try {
            await Service.MarkClientCommunicationAsCompleted(id);
            toast.success("Marked as completed");
            fetchCommunications();
        } catch (error) {
            console.error("Error marking completed", error);
            toast.error("Failed to update status");
        }
    };

    // Filter Logic
    const filteredCommunications = communications.filter(comm =>
        (comm.clientName?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (comm.subject?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (comm.notes?.toLowerCase() || '').includes(searchTerm.toLowerCase())
    );

    return (
        <div className="p-6 h-full flex flex-col bg-gray-50/30">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-800">Client Communication Follow-ups</h1>
                <button
                    onClick={() => handleOpenModal()}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors shadow-sm"
                >
                    <Plus size={18} /> Add New
                </button>
            </div>

            {/* Filters */}
            <div className="flex gap-4 mb-6 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                        type="text"
                        placeholder="Search client, subject, or notes..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                    />
                </div>
                {/* Additional filters could go here (e.g. status, date range) */}
            </div>

            {/* List / Table */}
            <div className="flex-1 overflow-y-auto bg-white rounded-xl shadow-sm border border-gray-200">
                {loading ? (
                    <div className="flex justify-center items-center h-40">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                ) : filteredCommunications.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-gray-500">
                        <p>No communications found.</p>
                    </div>
                ) : (
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-gray-50 sticky top-0 z-10">
                            <tr>
                                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Client / Subject</th>
                                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Follow Up</th>
                                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Project / Fabricator</th>
                                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Notes</th>
                                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filteredCommunications.map((comm) => (
                                <tr key={comm.id || comm._id} className="hover:bg-gray-50/50 transition-colors group">
                                    <td className="px-6 py-4">
                                        <div className="font-medium text-gray-900">{comm.clientName}</div>
                                        <div className="text-sm text-gray-500 truncate max-w-xs">{comm.subject}</div>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-600">
                                        {comm.communicationDate && format(parseISO(comm.communicationDate), 'MMM d, yyyy')}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-600">
                                        {comm.followUpDate ? (
                                            <span className={`${new Date(comm.followUpDate) < new Date() && !comm.isCompleted ? 'text-red-500 font-medium' : ''}`}>
                                                {format(parseISO(comm.followUpDate), 'MMM d, yyyy')}
                                            </span>
                                        ) : '-'}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-600">
                                        {/* Ideally these IDs would be mapped to names if the list payload doesn't include populated data */}
                                        {/* For now displaying IDs or checking if we can find name from loaded lists if IDs match */}
                                        <div className="text-xs text-gray-400">
                                            P: {projects.find(p => p._id === comm.projectId)?.projectName || 'N/A'}
                                        </div>
                                        <div className="text-xs text-gray-400">
                                            F: {fabricators.find(f => f._id === comm.fabricatorId)?.name || 'N/A'}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate" title={comm.notes}>
                                        {comm.notes}
                                    </td>
                                    <td className="px-6 py-4">
                                        {comm.isCompleted ? (
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                Completed
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                                Pending
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-right space-x-2">
                                        {!comm.isCompleted && (
                                            <button
                                                onClick={() => handleMarkCompleted(comm.id || comm._id)}
                                                className="text-green-600 hover:text-green-800 p-1 rounded hover:bg-green-50"
                                                title="Mark as Completed"
                                            >
                                                <Check size={16} />
                                            </button>
                                        )}
                                        <button
                                            onClick={() => handleOpenModal(comm)}
                                            className="text-blue-600 hover:text-blue-800 p-1 rounded hover:bg-blue-50"
                                            title="Edit"
                                        >
                                            <Edit2 size={16} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Modal - Could be extracted to separate component if complex */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                            <h2 className="text-lg font-bold text-gray-800">
                                {editingComm ? 'Edit Communication' : 'Log New Communication'}
                            </h2>
                            <button onClick={handleCloseModal} className="text-gray-400 hover:text-gray-600">&times;</button>
                        </div>

                        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-sm font-medium text-gray-700">Fabricator <span className="text-red-500">*</span></label>
                                    <Controller
                                        name="fabricatorId"
                                        control={control}
                                        rules={{ required: true }}
                                        render={({ field }) => (
                                            <Select
                                                {...field}
                                                options={fabricators.map(f => ({ value: f.id || f._id, label: f.name }))}
                                                value={fabricators.map(f => ({ value: f.id || f._id, label: f.name })).find(op => op.value === field.value) || null}
                                                onChange={(val) => field.onChange(val ? val.value : '')}
                                                styles={customStyles}
                                                placeholder="Select Fabricator"
                                                menuPortalTarget={document.body}
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
                                    onClick={handleCloseModal}
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
                    </div>
                </div>
            )}
        </div>
    );
};

export default Communication;