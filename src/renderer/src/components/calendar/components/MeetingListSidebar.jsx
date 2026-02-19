
import React from 'react';
import { format, isSameDay, parseISO } from 'date-fns';
import { Clock, MapPin, Calendar as CalendarIcon, MoreVertical } from 'lucide-react';

const MeetingListSidebar = ({ meetings, onSelectMeeting, selectedDate }) => {
    // Filter meetings for the selected date or show upcoming if no date selected
    const filteredMeetings = meetings
        .filter(meeting => {
            if (!meeting.startTime) return false;
            if (selectedDate) {
                return isSameDay(parseISO(meeting.startTime), selectedDate);
            }
            // If no date selected, show all future meetings or sorted by date
            return true;
        })
        .sort((a, b) => new Date(a.startTime) - new Date(b.startTime));

    return (
        <div className="w-80 bg-white border-l border-gray-200 flex flex-col h-full shadow-sm hidden lg:flex">
            <div className="p-4 border-b border-gray-100 bg-gray-50/50">
                <h3 className="font-bold text-gray-800 flex items-center gap-2">
                    <CalendarIcon size={18} className="text-blue-600" />
                    {selectedDate ? `Meetings for ${format(selectedDate, 'MMM d')}` : 'All Upcoming Meetings'}
                </h3>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar">
                {filteredMeetings.length === 0 ? (
                    <div className="text-center py-10">
                        <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                            <CalendarIcon size={24} className="text-gray-400" />
                        </div>
                        <p className="text-gray-500 text-sm">No meetings scheduled</p>
                    </div>
                ) : (
                    filteredMeetings.map((meeting) => (
                        <div
                            key={meeting.id || meeting._id}
                            onClick={() => onSelectMeeting(meeting)}
                            className="group p-3 rounded-xl border border-gray-100 bg-white hover:border-blue-200 hover:shadow-md transition-all cursor-pointer relative"
                        >
                            <div className={`absolute left-0 top-3 bottom-3 w-1 rounded-r-full ${meeting.status === 'COMPLETED' ? 'bg-green-500' :
                                    meeting.status === 'CANCELLED' ? 'bg-red-500' : 'bg-blue-500'
                                }`} />

                            <div className="pl-3">
                                <h4 className="font-semibold text-gray-800 text-sm mb-1 truncate pr-6">
                                    {meeting.title || meeting.subject || 'Untitled Meeting'}
                                </h4>

                                <div className="space-y-1.5">
                                    <div className="flex items-center gap-2 text-xs text-gray-500">
                                        <Clock size={12} className="text-blue-500" />
                                        <span>
                                            {meeting.startTime && format(parseISO(meeting.startTime), 'MMM d, h:mm a')}
                                            {' - '}
                                            {meeting.endTime && format(parseISO(meeting.endTime), 'h:mm a')}
                                        </span>
                                    </div>

                                    {meeting.location && (
                                        <div className="flex items-center gap-2 text-xs text-gray-500">
                                            <MapPin size={12} className="text-red-400" />
                                            <span className="truncate">{meeting.location}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default MeetingListSidebar;
