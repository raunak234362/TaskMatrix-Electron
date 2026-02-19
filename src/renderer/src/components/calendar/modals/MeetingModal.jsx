import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { X, MapPin, Calendar as CalendarIcon, Clock, Users, AlignLeft, CheckCircle, Link as LinkIcon, FileText, List } from 'lucide-react';
import { format } from 'date-fns';
import Service from '../../../api/Service';
import { toast } from 'react-toastify';
import Select from 'react-select';

const MeetingModal = ({ isOpen, onClose, meeting, refresh }) => {
    const [loading, setLoading] = useState(false);
    const [employees, setEmployees] = useState([]);
    const [fileInput, setFileInput] = useState('');

    const isEditing = meeting && (meeting.id || meeting._id);

    const { register, handleSubmit, control, reset, setValue, watch, formState: { errors } } = useForm({
        defaultValues: {
            title: '',
            agenda: '',
            location: '',
            description: '',
            startTime: '',
            endTime: '',
            link: '',
            files: [],
            status: 'SCHEDULED',
            reminderSent: true,
            participantsSchema: [] // We will store select options here { value, label, email }
        }
    });

    const currentFiles = watch('files');

    // Fetch Employees
    useEffect(() => {
        const fetchEmployees = async () => {
            try {
                const response = await Service.FetchAllUsers();
                // Handle different response structures gracefully
                const users = response?.users || response?.data?.users || [];

                if (Array.isArray(users)) {
                    const options = users.map(user => {
                        // Determine display name
                        let displayName = user.username;
                        if (user.firstName && user.lastName) {
                            displayName = `${user.firstName} ${user.lastName}`;
                        } else if (user.firstName) {
                            displayName = user.firstName;
                        }

                        // Determine role label
                        const roleLabel = user.role ? `(${user.role})` : '';

                        return {
                            value: user.id || user._id, // Support both id formats
                            label: `${displayName} ${roleLabel}`.trim(),
                            email: user.email,
                            ...user
                        };
                    });
                    setEmployees(options);
                }
            } catch (err) {
                console.error("Failed to fetch employees", err);
            }
        };
        fetchEmployees();
    }, []);

    // Initialize Form Data
    useEffect(() => {
        if (isOpen) {
            if (meeting) {
                // Prepare participants for select
                let preSelectedParticipants = [];
                if (meeting.participantsSchema) {
                    preSelectedParticipants = meeting.participantsSchema.map(p => {
                        // Try to find full employee data if available in loaded employees list, otherwise fallback
                        const found = employees.find(e => e.value === p.userId);
                        return found || { value: p.userId, label: p.email, email: p.email };
                    });
                }

                // If employees list updates after meeting is loaded, we might want to refresh this mapping,
                // but for now this initial load serves the purpose.

                reset({
                    title: meeting.title || meeting.subject || '',
                    agenda: meeting.agenda || '',
                    location: meeting.location || '',
                    description: meeting.description || '',
                    startTime: meeting.startTime ? format(new Date(meeting.startTime), "yyyy-MM-dd'T'HH:mm") : '',
                    endTime: meeting.endTime ? format(new Date(meeting.endTime), "yyyy-MM-dd'T'HH:mm") : '',
                    link: meeting.link || '',
                    files: meeting.files || [],
                    status: meeting.status || 'SCHEDULED',
                    reminderSent: meeting.reminderSent ?? true,
                    participantsSchema: preSelectedParticipants
                });
            } else {
                reset({
                    title: '',
                    agenda: '',
                    location: '',
                    description: '',
                    startTime: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
                    endTime: format(new Date(new Date().setHours(new Date().getHours() + 1)), "yyyy-MM-dd'T'HH:mm"),
                    link: '',
                    files: [],
                    status: 'SCHEDULED',
                    reminderSent: true,
                    participantsSchema: []
                });
            }
        }
    }, [meeting, isOpen, reset, employees]); // Added employees to dep array to re-map if emp list loads later

    const handleAddFile = () => {
        if (fileInput.trim()) {
            setValue('files', [...currentFiles, fileInput.trim()]);
            setFileInput('');
        }
    };

    const removeFile = (index) => {
        setValue('files', currentFiles.filter((_, i) => i !== index));
    };

    const onSubmit = async (data) => {
        setLoading(true);
        try {
            if (new Date(data.endTime) <= new Date(data.startTime)) {
                toast.error("End time must be after start time");
                setLoading(false);
                return;
            }

            // Transform participants from select options to backend schema
            const participantsPayload = data.participantsSchema.map(p => ({
                userId: p.value,
                email: p.email,
                rsvp: "ACCEPTED",
                role: "HOST"
            }));

            const payload = {
                title: data.title,
                agenda: data.agenda,
                location: data.location,
                description: data.description,
                startTime: new Date(data.startTime).toISOString(),
                endTime: new Date(data.endTime).toISOString(),
                link: data.link,
                files: data.files,
                status: data.status,
                reminderSent: data.reminderSent,
                participantsSchema: participantsPayload
            };

            if (isEditing) {
                await Service.UpdateMeetingById(meeting.id || meeting._id, payload);
                toast.success("Meeting updated successfully");
            } else {
                await Service.CreateMeeting(payload);
                toast.success("Meeting scheduled successfully");
            }
            refresh();
            onClose();
        } catch (error) {
            console.error("Error saving meeting:", error);
            toast.error("Failed to save meeting");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!isEditing) return;
        if (confirm("Are you sure you want to delete this meeting?")) {
            try {
                setLoading(true);
                await Service.DeleteMeeting(meeting.id || meeting._id);
                toast.success("Meeting deleted");
                refresh();
                onClose();
            } catch (error) {
                console.error("Error deleting meeting:", error);
                toast.error("Failed to delete meeting");
            } finally {
                setLoading(false);
            }
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 transition-all">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/50">
                    <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                        {isEditing ? <><CalendarIcon className="text-blue-600" size={20} /> Edit Meeting</> : <><CalendarIcon className="text-blue-600" size={20} /> New Meeting</>}
                    </h2>
                    <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="contents">
                    {/* content */}
                    <div className="overflow-y-auto p-6 space-y-5 custom-scrollbar">
                        {/* Title */}
                        <div className="space-y-1">
                            <div className="flex justify-between">
                                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Title</label>
                                {errors.title && <span className="text-xs text-red-500">Required</span>}
                            </div>
                            <input
                                {...register('title', { required: true })}
                                placeholder="Add title"
                                className="w-full text-lg font-semibold text-gray-800 placeholder-gray-400 border-b-2 border-transparent focus:border-blue-500 outline-none pb-1 transition-colors bg-transparent hover:bg-gray-50 px-2 -mx-2 rounded"
                                autoFocus
                            />
                        </div>

                        {/* Agenda */}
                        <div className="space-y-1">
                            <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                                <List size={16} className="text-orange-500" /> Agenda
                            </label>
                            <input
                                {...register('agenda')}
                                placeholder="Meeting agenda..."
                                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                            />
                        </div>

                        {/* Location */}
                        <div className="space-y-1">
                            <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                                <MapPin size={16} className="text-red-500" /> Location
                            </label>
                            <input
                                {...register('location')}
                                placeholder="Add location"
                                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                            />
                        </div>

                        {/* Time */}
                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-1">
                                <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                                    <Clock size={16} className="text-blue-500" /> Start
                                </label>
                                <input
                                    type="datetime-local"
                                    {...register('startTime', { required: true })}
                                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                                    <Clock size={16} className="text-gray-400" /> End
                                </label>
                                <input
                                    type="datetime-local"
                                    {...register('endTime', { required: true })}
                                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                                />
                            </div>
                        </div>

                        {/* Link */}
                        <div className="space-y-1">
                            <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                                <LinkIcon size={16} className="text-indigo-500" /> Link
                            </label>
                            <input
                                {...register('link')}
                                placeholder="Meeting link (Zoom, Google Meet, etc.)"
                                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                            />
                        </div>

                        {/* Description */}
                        <div className="space-y-1">
                            <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                                <AlignLeft size={16} className="text-gray-400" /> Description
                            </label>
                            <textarea
                                {...register('description')}
                                placeholder="Add description"
                                rows={3}
                                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all resize-none"
                            />
                        </div>

                        {/* Participants */}
                        <div className="space-y-1">
                            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
                                <Users size={16} className="text-purple-500" /> Participants
                            </label>
                            <Controller
                                name="participantsSchema"
                                control={control}
                                render={({ field }) => (
                                    <Select
                                        {...field}
                                        isMulti
                                        options={employees}
                                        placeholder="Select participants..."
                                        className="text-sm"
                                        classNames={{
                                            control: () => "!bg-gray-50 !border-gray-200 !rounded-lg !shadow-none",
                                            option: (state) => state.isSelected ? "!bg-blue-600" : state.isFocused ? "!bg-blue-50" : "",
                                        }}
                                    />
                                )}
                            />
                        </div>

                        {/* File Links */}
                        <div className="space-y-1">
                            <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                                <FileText size={16} className="text-teal-500" /> Files / Attachments
                            </label>
                            <div className="flex gap-2">
                                <input
                                    value={fileInput}
                                    onChange={(e) => setFileInput(e.target.value)}
                                    placeholder="Add file link/ID..."
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            e.preventDefault();
                                            handleAddFile();
                                        }
                                    }}
                                    className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                                />
                                <button
                                    type="button"
                                    onClick={handleAddFile}
                                    className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors"
                                >
                                    Add
                                </button>
                            </div>
                            {currentFiles && currentFiles.length > 0 && (
                                <ul className="mt-2 text-xs space-y-1">
                                    {currentFiles.map((file, idx) => (
                                        <li key={idx} className="flex justify-between items-center bg-gray-50 px-2 py-1 rounded border border-gray-100">
                                            <span className="truncate max-w-[300px]">{file}</span>
                                            <button type="button" onClick={() => removeFile(idx)} className="text-red-500 hover:text-red-700">&times;</button>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>

                        {/* Status if editing */}
                        {isEditing && (
                            <div className="space-y-1">
                                <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                                    <CheckCircle size={16} className="text-green-500" /> Status
                                </label>
                                <select
                                    {...register('status')}
                                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                                >
                                    <option value="SCHEDULED">Scheduled</option>
                                    <option value="COMPLETED">Completed</option>
                                    <option value="CANCELLED">Cancelled</option>
                                </select>
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-between items-center">
                        {isEditing ? (
                            <button
                                type="button"
                                onClick={handleDelete}
                                className="text-red-500 hover:bg-red-50 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                            >
                                Delete
                            </button>
                        ) : <div></div>}

                        <div className="flex gap-3">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-4 py-2 text-gray-600 hover:bg-gray-200 rounded-lg text-sm font-medium transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="px-6 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-70 flex items-center gap-2"
                            >
                                {loading && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                                Save
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default MeetingModal;
