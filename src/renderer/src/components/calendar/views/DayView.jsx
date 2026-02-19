import React from 'react';
import { format, startOfDay, endOfDay, eachHourOfInterval, isSameDay } from 'date-fns';

const DayView = ({ currentDate, meetings, onSelectSlot, onSelectMeeting }) => {
    const hours = eachHourOfInterval({ start: startOfDay(currentDate), end: endOfDay(currentDate) });

    const getMeetingsForHour = (hour) => {
        return meetings.filter(m => {
            const mStart = new Date(m.startTime);
            return isSameDay(mStart, currentDate) && mStart.getHours() === hour.getHours();
        });
    };

    const formatTime = (dateString) => {
        try {
            return format(new Date(dateString), 'h:mm a');
        } catch (e) {
            return '';
        }
    };

    return (
        <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col overflow-hidden h-full">
            <div className="py-4 text-center border-b border-gray-200 bg-gray-50/50 sticky top-0 z-20">
                <h2 className="text-lg font-bold text-gray-900">{format(currentDate, 'EEEE, MMMM d, yyyy')}</h2>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar relative">
                <div className="relative">
                    {hours.map((hour) => {
                        const slotMeetings = getMeetingsForHour(hour);

                        return (
                            <div key={hour.toString()} className="flex min-h-[100px] border-b border-gray-100 hover:bg-gray-50/30 transition-colors group relative">
                                {/* Time Label */}
                                <div className="w-20 border-r border-gray-100 flex items-start justify-center pt-3 text-xs text-gray-400 sticky left-0 bg-white group-hover:bg-gray-50/30 z-10 font-medium">
                                    {format(hour, 'h a')}
                                </div>

                                {/* Content Area */}
                                <div
                                    className="flex-1 relative p-2 group-hover:bg-blue-50/10 cursor-pointer"
                                    onClick={() => onSelectSlot(currentDate, hour)}
                                >
                                    {slotMeetings.map((meeting, idx) => (
                                        <div
                                            key={idx}
                                            className={`mb-2 p-3 rounded-lg border text-sm shadow-sm cursor-pointer hover:shadow-md transition-all relative z-10 ${meeting.status === 'cancelled' ? 'bg-red-50 border-red-100 text-red-700' :
                                                    meeting.status === 'completed' ? 'bg-green-50 border-green-100 text-green-700' :
                                                        'bg-blue-50 border-blue-100 text-blue-700'
                                                }`}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onSelectMeeting(meeting);
                                            }}
                                        >
                                            <div className="flex items-center justify-between mb-1">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-bold bg-white/50 px-1.5 py-0.5 rounded text-xs">
                                                        {formatTime(meeting.startTime)} - {formatTime(meeting.endTime)}
                                                    </span>
                                                </div>
                                                <span className={`text-[10px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded border ${meeting.status === 'cancelled' ? 'border-red-200 bg-red-100' :
                                                        meeting.status === 'completed' ? 'border-green-200 bg-green-100' :
                                                            'border-blue-200 bg-blue-100'
                                                    }`}>
                                                    {meeting.status}
                                                </span>
                                            </div>
                                            <div className="font-semibold text-gray-900 text-base mb-0.5">{meeting.title || meeting.subject}</div>
                                            {meeting.description && (
                                                <div className="text-xs opacity-75 truncate max-w-xl">{meeting.description}</div>
                                            )}
                                            {meeting.location && (
                                                <div className="mt-1 flex items-center gap-1 text-xs opacity-80">
                                                    <span>📍 {meeting.location}</span>
                                                </div>
                                            )}
                                        </div>
                                    ))}

                                    {/* Hover hint */}
                                    {slotMeetings.length === 0 && (
                                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 pointer-events-none">
                                            <span className="text-sm text-blue-300 font-medium">+ Add/Schedule</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )
                    })}

                    {/* Current Time Line */}
                    {isSameDay(currentDate, new Date()) && (
                        <div
                            className="absolute left-20 right-0 border-t-2 border-red-500 z-20 pointer-events-none flex items-center shadow-sm"
                            style={{ top: `${(new Date().getHours() * 100) + (new Date().getMinutes() / 60 * 100)}px` }}
                        >
                            <div className="w-3 h-3 bg-red-500 rounded-full -ml-1.5 ring-2 ring-white"></div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default DayView;
