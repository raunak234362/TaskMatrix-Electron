import React, { useEffect, useState } from 'react';
import { format, parseISO } from 'date-fns';
import { Check, Edit2, Trash2, Loader2, AlertCircle } from 'lucide-react';
import Service from '../../api/Service';
import { toast } from 'react-toastify';

const GetCommunicationById = ({ id, communication: initialComm, projects: initialProjects = [], fabricators: initialFabricators = [], onEdit, onDelete, onComplete }) => {
    const [communication, setCommunication] = useState(initialComm);
    const [loading, setLoading] = useState(!initialComm && !!id);
    const [error, setError] = useState(null);
    const [projects, setProjects] = useState(initialProjects);
    const [fabricators, setFabricators] = useState(initialFabricators);

    useEffect(() => {
        if (id && !initialComm) {
            fetchCommunication();
        }
    }, [id]);

    useEffect(() => {
        if (projects.length === 0 || fabricators.length === 0) {
            fetchDropdownData();
        }
    }, []);

    const fetchCommunication = async () => {
        try {
            setLoading(true);
            const res = await Service.GetCommunicationById(id);
            setCommunication(res.data || res);
        } catch (err) {
            console.error("Error fetching communication:", err);
            setError("Failed to load communication details");
        } finally {
            setLoading(false);
        }
    };

    const fetchDropdownData = async () => {
        try {
            const [pData, fData] = await Promise.all([
                Service.GetAllProjects(),
                Service.GetAllFabricators()
            ]);
            setProjects(Array.isArray(pData) ? pData : (pData?.data || []));
            setFabricators(Array.isArray(fData) ? fData : (fData?.data || []));
        } catch (err) {
            console.error("Error fetching dropdown data:", err);
        }
    };

    const handleComplete = async () => {
        const commId = communication.id || communication._id;
        try {
            await Service.MarkClientCommunicationAsCompleted(commId);
            toast.success("Marked as completed");
            if (onComplete) onComplete(commId);
            if (id) fetchCommunication();
            else setCommunication({ ...communication, isCompleted: true });
        } catch (err) {
            toast.error("Failed to update status");
        }
    };

    const handleDelete = async () => {
        const commId = communication.id || communication._id;
        if (window.confirm("Are you sure you want to delete this communication?")) {
            try {
                await Service.DeleteCommunication(commId);
                toast.success("Communication deleted successfully");
                if (onDelete) onDelete(commId);
            } catch (err) {
                toast.error("Failed to delete communication");
            }
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center p-12 text-gray-500">
                <Loader2 className="w-8 h-8 animate-spin mb-4 text-blue-600" />
                <p>Loading communication details...</p>
            </div>
        );
    }

    if (error || !communication) {
        return (
            <div className="flex flex-col items-center justify-center p-12 text-red-500">
                <AlertCircle className="w-8 h-8 mb-4" />
                <p>{error || "Communication not found"}</p>
            </div>
        );
    }

    const projectName = projects.find(p => p._id === communication.projectId || p.id === communication.projectId)?.projectName || 'N/A';
    const fabricatorName = fabricators.find(f => f._id === communication.fabricatorId || f.id === communication.fabricatorId)?.name || 'N/A';

    return (
        <div className="bg-white rounded-xl overflow-hidden">
            <div className="p-6 border-b border-gray-100 bg-gray-50/30 flex justify-between items-start">
                <div>
                    <h2 className="text-xl font-bold text-gray-900">{communication.subject}</h2>
                    <p className="text-gray-600 font-medium mt-1">{communication.clientName}</p>
                </div>
                <div className="flex flex-col items-end gap-3">
                    {communication.isCompleted ? (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800 gap-1.5">
                            <Check size={14} /> Completed
                        </span>
                    ) : (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
                            Pending
                        </span>
                    )}

                    <div className="flex items-center gap-2 mt-2">
                        {!communication.isCompleted && (
                            <button
                                onClick={handleComplete}
                                className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors border border-green-100"
                                title="Mark as Completed"
                            >
                                <Check size={18} />
                            </button>
                        )}
                        <button
                            onClick={() => onEdit && onEdit(communication)}
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
            </div>

            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                <div>
                    <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">Context</h3>
                    <div className="space-y-3">
                        <div>
                            <span className="text-gray-500 text-sm block">Fabricator</span>
                            <span className="text-gray-900 font-medium">{fabricatorName}</span>
                        </div>
                        <div>
                            <span className="text-gray-500 text-sm block">Project</span>
                            <span className="text-gray-900 font-medium">{projectName}</span>
                        </div>
                    </div>
                </div>

                <div>
                    <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">Timeline</h3>
                    <div className="space-y-3">
                        <div>
                            <span className="text-gray-500 text-sm block">Date Logged</span>
                            <span className="text-gray-900 font-medium">
                                {communication.communicationDate ? format(parseISO(communication.communicationDate), 'PPP p') : '-'}
                            </span>
                        </div>
                        <div>
                            <span className="text-gray-500 text-sm block">Follow-up Due</span>
                            <span className={`font-medium ${communication.followUpDate && new Date(communication.followUpDate) < new Date() && !communication.isCompleted ? 'text-red-600' : 'text-gray-900'}`}>
                                {communication.followUpDate ? format(parseISO(communication.followUpDate), 'PPP p') : '-'}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="md:col-span-2">
                    <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">Notes</h3>
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-100 text-gray-700 whitespace-pre-wrap leading-relaxed">
                        {communication.notes || 'No notes provided.'}
                    </div>
                </div>

                {communication.reminderSent && (
                    <div className="md:col-span-2 text-sm text-blue-600 bg-blue-50 px-3 py-2 rounded-md inline-block w-fit">
                        ✓ Reminder notification enabled
                    </div>
                )}
            </div>
        </div>
    );
};

export default GetCommunicationById;
