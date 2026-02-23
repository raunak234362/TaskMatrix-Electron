import React from 'react';
import { format, isSameDay, parseISO } from 'date-fns';
import { Clock, User, MessageCircle, MoreVertical, Calendar as CalendarIcon } from 'lucide-react';

const CommunicationListSidebar = ({ communications, onSelectComm, selectedDate }) => {
    // Filter communications for the selected date or show all if no date selected
    const filteredComms = communications
        .filter(comm => {
            const commDate = comm.communicationDate ? parseISO(comm.communicationDate) : null;
            const followDate = comm.followUpDate ? parseISO(comm.followUpDate) : null;

            if (selectedDate) {
                return (commDate && isSameDay(commDate, selectedDate)) ||
                    (followDate && isSameDay(followDate, selectedDate));
            }
            return true;
        })
        .sort((a, b) => new Date(a.communicationDate) - new Date(b.communicationDate));

    return (
        <div className="w-80 bg-white border-r border-gray-200 h-full shadow-sm hidden lg:flex flex-col">
            <div className="p-4 border-b border-gray-100 bg-gray-50/50">
                <h3 className="font-bold text-gray-800 flex items-center gap-2">
                    <MessageCircle size={18} className="text-blue-600" />
                    {selectedDate ? `Logs for ${format(selectedDate, 'MMM d')}` : 'Recent Communications'}
                </h3>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar">
                {filteredComms.length === 0 ? (
                    <div className="text-center py-10">
                        <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                            <MessageCircle size={24} className="text-gray-400" />
                        </div>
                        <p className="text-gray-500 text-sm">No records found</p>
                    </div>
                ) : (
                    filteredComms.map((comm) => {
                        const isFollowup = selectedDate && comm.followUpDate && isSameDay(parseISO(comm.followUpDate), selectedDate);

                        return (
                            <div
                                key={comm.id || comm._id}
                                onClick={() => onSelectComm(comm)}
                                className="group p-3 rounded-xl border border-gray-100 bg-white hover:border-blue-200 hover:shadow-md transition-all cursor-pointer relative"
                            >
                                <div className={`absolute left-0 top-3 bottom-3 w-1 rounded-r-full ${isFollowup ? 'bg-amber-500' : 'bg-blue-500'
                                    }`} />

                                <div className="pl-3">
                                    <div className="flex items-center justify-between mb-1">
                                        <span className={`text-[9px] font-black uppercase tracking-widest ${isFollowup ? 'text-amber-600' : 'text-blue-600'
                                            }`}>
                                            {isFollowup ? 'Follow-up' : 'Communication'}
                                        </span>
                                    </div>
                                    <h4 className="font-bold text-gray-800 text-sm mb-1 truncate pr-6">
                                        {comm.subject || 'No Subject'}
                                    </h4>

                                    <div className="space-y-1.5">
                                        <div className="flex items-center gap-2 text-xs text-gray-500">
                                            <Clock size={12} className="text-gray-400" />
                                            <span>
                                                {comm.communicationDate && format(parseISO(comm.communicationDate), 'h:mm a')}
                                            </span>
                                        </div>

                                        <div className="flex items-center gap-2 text-xs text-gray-600 font-medium">
                                            <User size={12} className="text-gray-400" />
                                            <span className="truncate">{comm.clientName}</span>
                                        </div>
                                    </div>
                                </div>

                                <button className="absolute top-2 right-1 p-1 text-gray-300 hover:text-gray-600 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                                    <MoreVertical size={14} />
                                </button>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
};

export default CommunicationListSidebar;
