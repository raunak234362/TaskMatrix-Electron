import React, { useEffect, useState, useMemo } from 'react';
import { useForm, Controller } from 'react-hook-form';
import Select from 'react-select';
import { format, parseISO } from 'date-fns';
import Service from '../../api/Service';

const customStyles = {
    control: (base) => ({
        ...base,
        backgroundColor: "#f9fafb", // gray-50
        borderColor: "#e5e7eb", // gray-200
        borderRadius: "0.5rem",
        minHeight: "40px",
        boxShadow: "none",
        "&:hover": {
            borderColor: "#d1d5db", // gray-300
        },
        cursor: "pointer",
        fontSize: "0.875rem"
    }),
    valueContainer: (base) => ({
        ...base,
        padding: "2px 12px",
    }),
    placeholder: (base) => ({
        ...base,
        color: "#9ca3af", // gray-400
    }),
    menuPortal: base => ({ ...base, zIndex: 9999 }),
    menu: (base) => ({
        ...base,
        zIndex: 9999,
        borderRadius: "0.75rem",
        overflow: "hidden",
        boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
        border: "1px solid #f3f4f6"
    }),
    option: (base, state) => ({
        ...base,
        backgroundColor: state.isSelected
            ? "#eff6ff"
            : state.isFocused
                ? "#f9fafb"
                : "white",
        color: state.isSelected ? "#2563eb" : "#374151",
        fontSize: "0.875rem",
        cursor: "pointer",
        ":active": {
            backgroundColor: "#ebf2ff",
        },
    }),
};

const CommunicationForm = ({ initialData, projects = [], fabricators = [], onSubmit, onCancel, fetchClientsByFabricator }) => {
    const [clients, setClients] = useState([]);
    const [isFetchingClients, setIsFetchingClients] = useState(false);
    const [allFabricators, setAllFabricators] = useState([]);
    const [isFetchingFabricators, setIsFetchingFabricators] = useState(false);

    const { register, handleSubmit, control, reset, watch, setValue, formState: { errors } } = useForm();

    const watchedFabricatorId = watch('fabricatorId');

    // Fetch fabricators with limit 100 and search query
    const loadFabricators = async (search = '') => {
        setIsFetchingFabricators(true);
        try {
            const res = await Service.GetAllFabricators(1, 100, search);
            let list = [];
            if (Array.isArray(res)) {
                list = res;
            } else if (res?.data?.data && Array.isArray(res.data.data)) {
                list = res.data.data;
            } else if (res?.data && Array.isArray(res.data)) {
                list = res.data;
            } else if (res?.fabricators && Array.isArray(res.fabricators)) {
                list = res.fabricators;
            }
            setAllFabricators(list);
        } catch (err) {
            console.error("Failed to fetch fabricators (limit 100):", err);
        } finally {
            setIsFetchingFabricators(false);
        }
    };

    useEffect(() => {
        loadFabricators();
    }, []);

    useEffect(() => {
        if (Array.isArray(fabricators) && fabricators.length > 0) {
            setAllFabricators(prev => {
                const combined = [...prev, ...fabricators];
                const uniqueMap = new Map();
                combined.forEach(f => {
                    const id = f.id || f._id;
                    if (id && !uniqueMap.has(id)) {
                        uniqueMap.set(id, f);
                    }
                });
                return Array.from(uniqueMap.values());
            });
        }
    }, [fabricators]);

    // Default fetch function if not provided
    const defaultFetchClients = async (fabId) => {
        return [];
    };

    const fetchClients = fetchClientsByFabricator || defaultFetchClients;

    // Populate form if pre-filling
    useEffect(() => {
        if (initialData) {
            let finalFabricatorId = initialData.fabricatorId;
            let finalProjectId = initialData.projectId;

            // If project is provided but fabricator isn't, try to find it
            if (finalProjectId && !finalFabricatorId) {
                const foundProject = projects.find(p => String(p.id || p._id) === String(finalProjectId));
                if (foundProject) {
                    finalFabricatorId = foundProject.fabricatorId || foundProject.fabricatorID || foundProject.fabId || (foundProject.fabricator?.id || foundProject.fabricator?._id || foundProject.fabricator?.fabId);
                }
            }

            reset({
                projectId: finalProjectId || '',
                fabricatorId: finalFabricatorId || '',
                clientName: initialData.clientName || '',
                subject: initialData.subject || '',
                notes: initialData.notes || '',
                communicationDate: initialData.communicationDate
                    ? format(initialData.communicationDate.includes('T') ? parseISO(initialData.communicationDate) : new Date(initialData.communicationDate), "yyyy-MM-dd'T'HH:mm")
                    : '',
                followUpDate: initialData.followUpDate
                    ? format(initialData.followUpDate.includes('T') ? parseISO(initialData.followUpDate) : new Date(initialData.followUpDate), "yyyy-MM-dd'T'HH:mm")
                    : '',
                reminderSent: initialData.reminderSent ?? false,
                isCompleted: initialData.isCompleted ?? false
            });
        }
    }, [initialData, reset, projects]);

    const [fetchedProjects, setFetchedProjects] = useState([]);
    const [isFetchingProjects, setIsFetchingProjects] = useState(false);

    // Fetch Projects when Fabricator changes using Service.GetProjectsByFabricatorID
    useEffect(() => {
        const getProjects = async () => {
            if (watchedFabricatorId) {
                setIsFetchingProjects(true);
                try {
                    const response = await Service.GetProjectsByFabricatorID(watchedFabricatorId);
                    let list = [];
                    if (response) {
                        if (Array.isArray(response)) {
                            list = response;
                        } else if (response.data) {
                            if (Array.isArray(response.data)) {
                                list = response.data;
                            } else if (response.data.projects && Array.isArray(response.data.projects)) {
                                list = response.data.projects;
                            } else if (Array.isArray(response.data.data)) {
                                list = response.data.data;
                            }
                        }
                    }
                    setFetchedProjects(list);
                } catch (error) {
                    console.error("Failed to fetch projects by fabricator ID", error);
                    setFetchedProjects([]);
                } finally {
                    setIsFetchingProjects(false);
                }
            } else {
                setFetchedProjects([]);
            }
        };
        getProjects();
    }, [watchedFabricatorId]);

    // Fetch Clients when Fabricator changes
    useEffect(() => {
        const getClients = async () => {
            if (watchedFabricatorId) {
                setIsFetchingClients(true);
                try {
                    const clientList = await fetchClients(watchedFabricatorId);
                    setClients(clientList);
                } catch (error) {
                    console.error("Failed to fetch clients", error);
                    setClients([]);
                } finally {
                    setIsFetchingClients(false);
                }
            } else {
                setClients([]);
            }
        };
        getClients();
    }, [watchedFabricatorId, fetchClients]);

    // Derived collections
    const fabricatorOptions = useMemo(() =>
        allFabricators.map((f, idx) => ({
            value: f.id || f._id || f.fabricatorId || f.fabId || `fab-${idx}`,
            label: f.fabName || f.name || f.fabricatorName || "Unnamed Fabricator"
        })),
        [allFabricators]);

    const availableProjects = useMemo(() => {
        if (!watchedFabricatorId) return [];
        const propProjects = projects.filter(p => {
            const fid = p.fabricatorId || p.fabricatorID || p.fabId || (p.fabricator?.id || p.fabricator?._id || p.fabricator?.fabId);
            return String(fid) === String(watchedFabricatorId);
        });
        const combined = [...fetchedProjects, ...propProjects];
        const uniqueMap = new Map();
        combined.forEach((p, idx) => {
            const id = p.id || p._id || p.projectId || p.fabId || p.name || `proj-${idx}`;
            if (id && !uniqueMap.has(String(id))) {
                uniqueMap.set(String(id), { ...p, _derivedId: id });
            }
        });
        return Array.from(uniqueMap.values());
    }, [projects, fetchedProjects, watchedFabricatorId]);

    const projectOptions = useMemo(() =>
        availableProjects.map((p, idx) => ({
            value: p.id || p._id || p.projectId || p.fabId || p._derivedId || p.name || `proj-${idx}`,
            label: p.name || p.projectName || p.title || p.project_name || "Unnamed Project"
        })),
        [availableProjects]);

    const handleFormSubmit = (data) => {
        const payload = {
            ...data,
            communicationDate: data.communicationDate ? new Date(data.communicationDate).toISOString() : null,
            followUpDate: data.followUpDate ? new Date(data.followUpDate).toISOString() : null,
        };
        onSubmit(payload);
    };

    return (
        <form onSubmit={handleSubmit(handleFormSubmit)} className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-700">Fabricator <span className="text-red-500">*</span></label>
                    <Controller
                        name="fabricatorId"
                        control={control}
                        rules={{ required: true }}
                        render={({ field }) => (
                            <Select
                                isClearable
                                isLoading={isFetchingFabricators}
                                options={fabricatorOptions}
                                onInputChange={(inputValue, { action }) => {
                                    if (action === 'input-change') {
                                        loadFabricators(inputValue);
                                    }
                                }}
                                value={fabricatorOptions.find(op => String(op.value) === String(field.value)) || null}
                                onChange={(val) => {
                                    field.onChange(val ? val.value : '');
                                    setValue('projectId', '');
                                    setValue('clientName', '');
                                }}
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
                                isDisabled={!watchedFabricatorId || isFetchingProjects}
                                isLoading={isFetchingProjects}
                                isClearable
                                options={projectOptions}
                                value={projectOptions.find(op => String(op.value) === String(field.value) || String(op.label) === String(field.value)) || (field.value ? { value: field.value, label: field.value } : null)}
                                onChange={(val) => field.onChange(val ? val.value : '')}
                                styles={customStyles}
                                placeholder={isFetchingProjects ? "Loading projects..." : "Select Project"}
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
                                isDisabled={!watchedFabricatorId || isFetchingClients}
                                isClearable
                                options={options}
                                value={selectedOption}
                                onChange={(val) => field.onChange(val ? val.value : '')}
                                styles={customStyles}
                                placeholder={isFetchingClients ? "Loading clients..." : "Select Client"}
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
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-green-500"
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
                        className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-green-500"
                    />
                </div>
                <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-700">Follow-up Date</label>
                    <input
                        type="datetime-local"
                        {...register('followUpDate')}
                        className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-green-500"
                    />
                </div>
            </div>

            <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">Notes</label>
                <textarea
                    {...register('notes')}
                    rows={4}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-green-500 resize-none"
                    placeholder="Detailed notes..."
                />
            </div>

            <div className="flex items-center gap-2">
                <input
                    type="checkbox"
                    id="reminderSent"
                    {...register('reminderSent')}
                    className="rounded border-gray-300 text-green-600 focus:ring-green-500"
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
                    className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors shadow-sm"
                >
                    Save Record
                </button>
            </div>
        </form>
    );
};

export default CommunicationForm;
