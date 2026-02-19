import React from 'react';
import { format, startOfWeek, endOfWeek, eachDayOfInterval, startOfDay, endOfDay, eachHourOfInterval, isSameDay } from 'date-fns';

const WeekView = ({ currentDate, meetings, onSelectSlot, onSelectMeeting }) => {
    const getDaysInWeek = () => {
        const start = startOfWeek(currentDate);
        const end = endOfWeek(currentDate);
        return eachDayOfInterval({ start, end });
    };

    const hours = eachHourOfInterval({ start: startOfDay(new Date()), end: endOfDay(new Date()) });
    const days = getDaysInWeek();

    const formatTime = (dateString) => {
        try {
            return format(new Date(dateString), 'h:mm a');
        } catch (e) {
            return '';
        }
    };

    return (
        <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col overflow-hidden h-full">
            {/* Header */}
            <div className="grid grid-cols-8 border-b border-gray-200 bg-gray-50/50 sticky top-0 z-20">
                <div className="py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide border-r border-gray-100 bg-gray-50/50">
                    Time
                </div>
                {days.map((day) => (
                    <div
                        key={day.toString()}
                        className={`py-3 text-center text-xs font-semibold uppercase tracking-wide border-r border-gray-100 ${isSameDay(day, new Date()) ? 'text-blue-600 bg-blue-50/50' : 'text-gray-500'
                            }`}
                    >
                        {format(day, 'EEE d')}
                    </div>
                ))}
            </div>

            {/* Grid */}
            <div className="flex-1 overflow-y-auto custom-scrollbar relative">
                <div className="grid grid-cols-8 relative min-w-full">
                    {hours.map((hour) => (
                        <React.Fragment key={hour.toString()}>
                            {/* Time Label */}
                            <div className="h-20 border-b border-r border-gray-100 text-[10px] text-gray-400 flex items-start justify-center pt-2 bg-gray-50/30 sticky left-0 z-10 font-medium">
                                {format(hour, 'h a')}
                            </div>

                            {/* Day Columns */}
                            {days.map((day) => {
                                // Find meetings starting in this hour
                                const slotMeetings = meetings.filter(m => {
                                    const mStart = new Date(m.startTime);
                                    return isSameDay(mStart, day) && mStart.getHours() === hour.getHours();
                                });

                                return (
                                    <div
                                        key={`${day}-${hour}`}
                                        className="h-20 border-b border-r border-gray-100 relative group hover:bg-gray-50/30 transition-colors"
                                        onClick={() => onSelectSlot(day, hour)}
                                    >
                                        {slotMeetings.map((meeting, idx) => (
                                            <div
                                                key={idx}
                                                className={`absolute left-0.5 right-0.5 top-0.5 bottom-0.5 p-1 rounded-md text-[10px] font-medium border overflow-hidden cursor-pointer z-10 hover:z-20 shadow-sm transition-all hover:shadow-md ${meeting.status === 'cancelled' ? 'bg-red-100 text-red-700 border-red-200' :
                                                        meeting.status === 'completed' ? 'bg-green-100 text-green-700 border-green-200' :
                                                            'bg-blue-100 text-blue-700 border-blue-200'
                                                    }`}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onSelectMeeting(meeting);
                                                }}
                                            >
                                                <div className="flex justify-between items-start mb-0.5">
                                                    <span className="font-bold">{formatTime(meeting.startTime)}</span>
                                                </div>
                                                <div className="truncate leading-tight">{meeting.title || meeting.subject}</div>
                                            </div>
                                        ))}

                                        {/* Add button on hover empty slot */}
                                        {slotMeetings.length === 0 && (
                                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                <div className="w-6 h-6 rounded-full bg-blue-50 text-blue-400 flex items-center justify-center shadow-sm">
                                                    <span className="text-lg leading-none mb-0.5">+</span>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </React.Fragment>
                    ))}

                    {/* Current Time Indicator logic would be complex here due to grid layout, skipping for simplicity in this iteration */}
                </div>
            </div>
        </div>
    );
};

export default WeekView;
