import React from 'react';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay } from 'date-fns';

const MonthView = ({ currentDate, meetings, onSelectDate, onSelectMeeting }) => {
    const getDaysInMonth = () => {
        const start = startOfWeek(startOfMonth(currentDate));
        const end = endOfWeek(endOfMonth(currentDate));
        return eachDayOfInterval({ start, end });
    };

    const getMeetingsForDay = (day) => {
        return meetings.filter(meeting => isSameDay(new Date(meeting.startTime), day));
    };

    const formatTime = (dateString) => {
        try {
            return format(new Date(dateString), 'h:mm a');
        } catch (e) {
            return '';
        }
    };

    const days = getDaysInMonth();
    const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    return (
        <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col overflow-hidden h-full">
            <div className="grid grid-cols-7 border-b border-gray-200 bg-gray-50/50">
                {weekDays.map((day) => (
                    <div key={day} className="py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide">
                        {day}
                    </div>
                ))}
            </div>

            <div className="flex-1 grid grid-cols-7 grid-rows-5 sm:grid-rows-6 auto-rows-fr">
                {days.map((day) => {
                    const dayMeetings = getMeetingsForDay(day);
                    const isToday = isSameDay(day, new Date());
                    const isCurrentMonth = isSameMonth(day, currentDate);

                    return (
                        <div
                            key={day.toString()}
                            className={`min-h-[100px] border-b border-r border-gray-100 p-2 transition-all hover:bg-gray-50 flex flex-col gap-1 cursor-pointer group ${!isCurrentMonth ? 'bg-gray-50/30 text-gray-400' : 'bg-white'
                                }`}
                            onClick={() => onSelectDate(day)}
                        >
                            <div className={`text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full mb-1 transition-colors ${isToday
                                    ? 'bg-blue-600 text-white shadow-sm shadow-blue-300'
                                    : isCurrentMonth
                                        ? 'text-gray-700 group-hover:bg-gray-200'
                                        : 'text-gray-400'
                                }`}>
                                {format(day, 'd')}
                            </div>

                            <div className="flex flex-col gap-1 overflow-y-auto max-h-[80px] custom-scrollbar">
                                {dayMeetings.slice(0, 4).map((meeting, i) => (
                                    <div
                                        key={i}
                                        className={`text-[10px] px-1.5 py-1 rounded border truncate font-medium shadow-sm transition-transform hover:scale-[1.02] active:scale-95 ${meeting.status === 'cancelled'
                                                ? 'bg-red-50 text-red-600 border-red-100 line-through decoration-red-400'
                                                : meeting.status === 'completed'
                                                    ? 'bg-green-50 text-green-700 border-green-100'
                                                    : 'bg-blue-50 text-blue-700 border-blue-100'
                                            }`}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onSelectMeeting(meeting);
                                        }}
                                        title={`${formatTime(meeting.startTime)} - ${meeting.title || meeting.subject}`}
                                    >
                                        <span className="font-semibold mr-1">{formatTime(meeting.startTime)}</span>
                                        {meeting.title || meeting.subject}
                                    </div>
                                ))}
                                {dayMeetings.length > 4 && (
                                    <div className="text-[10px] text-gray-400 pl-1 font-medium hover:text-blue-600">
                                        + {dayMeetings.length - 4} more
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default MonthView;
