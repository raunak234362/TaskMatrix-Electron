import React, { useEffect, useState } from 'react';
import { format, parseISO } from 'date-fns';
import { Check, Edit2, Trash2, Loader2, AlertCircle, MapPin, Clock, Users, Link as LinkIcon, FileText, List } from 'lucide-react';
import Service from '../../api/Service';
import { toast } from 'react-toastify';

const GetMeetingById = ({ id, meeting: initialMeeting, onEdit, onDelete, onRefresh }) => {
    const [meeting, setMeeting] = useState(initialMeeting);
    const [loading, setLoading] = useState(!initialMeeting && !!id);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (id && !initialMeeting) {
            fetchMeeting();
        }
    }, [id]);

    const fetchMeeting = async () => {
        try {
            setLoading(true);
            const res = await Service.GetMeetingById(id);
            setMeeting(res.data || res);
        } catch (err) {
            console.error("Error fetching meeting:", err);
            setError("Failed to load meeting details");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        const meetingId = meeting.id || meeting._id;
        if (window.confirm("Are you sure you want to delete this meeting?")) {
            try {
                await Service.DeleteMeeting(meetingId);
                toast.success("Meeting deleted successfully");
                if (onDelete) onDelete(meetingId);
                if (onRefresh) onRefresh();
            } catch (err) {
                toast.error("Failed to delete meeting");
            }
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center p-12 text-gray-500">
                <Loader2 className="w-8 h-8 animate-spin mb-4 text-blue-600" />
                <p>Loading meeting details...</p>
            </div>
        );
    }

    if (error || !meeting) {
        return (
            <div className="flex flex-col items-center justify-center p-12 text-red-500">
                <AlertCircle className="w-8 h-8 mb-4" />
                <p>{error || "Meeting not found"}</p>
            </div>
        );
    }

    const getStatusColor = (status) => {
        switch (status) {
            case 'COMPLETED': return 'bg-green-100 text-green-800';
            case 'CANCELLED': return 'bg-red-100 text-red-800';
            default: return 'bg-blue-100 text-blue-800';
        }
    };

    return (
        <div className="bg-white rounded-xl overflow-hidden">
            <div className="p-6 border-b border-gray-100 bg-gray-50/30 flex justify-between items-start">
                <div>
                    <h2 className="text-xl font-bold text-gray-900">{meeting.title || meeting.subject}</h2>
                    <div className="flex items-center gap-2 mt-1">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(meeting.status)}`}>
                            {meeting.status}
                        </span>
                        {meeting.location && (
                            <span className="text-sm text-gray-500 flex items-center gap-1">
                                <MapPin size={14} /> {meeting.location}
                            </span>
                        )}
                    </div>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => onEdit && onEdit(meeting)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors border border-blue-100"
                        title="Edit"
                    >
                        <Edit2 size={18} />
                    </button>
                    <button
                        onClick={handleDelete}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-red-100"
                        title="Delete"
                    >
                        <Trash2 size={18} />
                    </button>
                </div>
            </div>

            <div className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                        <div className="flex items-start gap-3">
                            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                                <Clock size={20} />
                            </div>
                            <div>
                                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Time</h3>
                                <p className="text-gray-900 font-medium mt-1">
                                    {meeting.startTime ? format(parseISO(meeting.startTime), 'PPP p') : '-'}
                                </p>
                                <p className="text-sm text-gray-500">
                                    to {meeting.endTime ? format(parseISO(meeting.endTime), 'p') : '-'}
                                </p>
                            </div>
                        </div>

                        {meeting.link && (
                            <div className="flex items-start gap-3">
                                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                                    <LinkIcon size={20} />
                                </div>
                                <div className="min-w-0">
                                    <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Meeting Link</h3>
                                    <a href={meeting.link} target="_blank" rel="noopener noreferrer" className="text-blue-600 font-medium mt-1 block truncate hover:underline">
                                        {meeting.link}
                                    </a>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-start gap-3">
                            <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
                                <Users size={20} />
                            </div>
                            <div>
                                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Participants</h3>
                                <div className="mt-2 flex flex-wrap gap-2">
                                    {meeting.participantsSchema && meeting.participantsSchema.length > 0 ? (
                                        meeting.participantsSchema.map((p, idx) => (
                                            <div key={idx} className="bg-gray-100 px-2.5 py-1 rounded-lg text-xs font-medium text-gray-700 flex items-center gap-1.5 border border-gray-200">
                                                <div className="w-2 h-2 rounded-full bg-blue-500" />
                                                {p.email}
                                            </div>
                                        ))
                                    ) : (
                                        <p className="text-sm text-gray-500 italic">No participants listed</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {meeting.agenda && (
                    <div className="space-y-2">
                        <div className="flex items-center gap-2">
                            <List size={18} className="text-orange-500" />
                            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Agenda</h3>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 text-gray-700 leading-relaxed font-medium">
                            {meeting.agenda}
                        </div>
                    </div>
                )}

                {meeting.description && (
                    <div className="space-y-2">
                        <div className="flex items-center gap-2">
                            <FileText size={18} className="text-gray-400" />
                            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Description</h3>
                        </div>
                        <div className="bg-white p-4 rounded-xl border border-gray-100 text-gray-600 whitespace-pre-wrap leading-relaxed">
                            {meeting.description}
                        </div>
                    </div>
                )}

                {meeting.files && meeting.files.length > 0 && (
                    <div className="space-y-2">
                        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Attachments</h3>
                        <div className="space-y-2">
                            {meeting.files.map((file, idx) => (
                                <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100 hover:bg-gray-100 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <FileText className="text-blue-500" size={18} />
                                        <span className="text-sm font-medium text-gray-700">{file}</span>
                                    </div>
                                    <button className="text-xs text-blue-600 font-bold hover:underline">Download</button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default GetMeetingById;
