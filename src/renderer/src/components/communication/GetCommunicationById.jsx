import React from 'react';
import { format, parseISO } from 'date-fns';
import { Check } from 'lucide-react';

const GetCommunicationById = ({ communication, projects = [], fabricators = [] }) => {
    if (!communication) return null;

    const projectName = projects.find(p => p._id === communication.projectId || p.id === communication.projectId)?.projectName || 'N/A';
    const fabricatorName = fabricators.find(f => f._id === communication.fabricatorId || f.id === communication.fabricatorId)?.name || 'N/A';

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-100 bg-gray-50/30 flex justify-between items-start">
                <div>
                    <h2 className="text-xl font-bold text-gray-900">{communication.subject}</h2>
                    <p className="text-gray-600 font-medium mt-1">{communication.clientName}</p>
                </div>
                <div>
                    {communication.isCompleted ? (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800 gap-1.5">
                            <Check size={14} /> Completed
                        </span>
                    ) : (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
                            Pending
                        </span>
                    )}
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
