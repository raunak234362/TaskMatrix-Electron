import React from 'react';
import { format, parseISO } from 'date-fns';
import { Edit2, Check, Search, Eye, Trash2 } from 'lucide-react';

const ListCommunication = ({
    communications,
    loading,
    projects,
    fabricators,
    onEdit,
    onComplete,
    onView,
    onDelete,
    searchTerm,
    onSearchChange
}) => {

    const filteredCommunications = communications.filter(comm =>
        (comm.clientName?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (comm.subject?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (comm.notes?.toLowerCase() || '').includes(searchTerm.toLowerCase())
    );

    return (
        <div className="flex flex-col h-full">
            {/* Filters */}
            <div className="flex gap-4 mb-6 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                        type="text"
                        placeholder="Search client, subject, or notes..."
                        value={searchTerm}
                        onChange={(e) => onSearchChange(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                    />
                </div>
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
                                        <button
                                            onClick={() => onView && onView(comm)}
                                            className="text-gray-500 hover:text-gray-700 p-1 rounded hover:bg-gray-100"
                                            title="View Details"
                                        >
                                            <Eye size={16} />
                                        </button>
                                        {!comm.isCompleted && (
                                            <button
                                                onClick={() => onComplete(comm.id || comm._id)}
                                                className="text-green-600 hover:text-green-800 p-1 rounded hover:bg-green-50"
                                                title="Mark as Completed"
                                            >
                                                <Check size={16} />
                                            </button>
                                        )}
                                        <button
                                            onClick={() => onEdit(comm)}
                                            className="text-blue-600 hover:text-blue-800 p-1 rounded hover:bg-blue-50"
                                            title="Edit"
                                        >
                                            <Edit2 size={16} />
                                        </button>
                                        <button
                                            onClick={() => onDelete && onDelete(comm.id || comm._id)}
                                            className="text-red-600 hover:text-red-800 p-1 rounded hover:bg-red-50"
                                            title="Delete"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
};

export default ListCommunication;
