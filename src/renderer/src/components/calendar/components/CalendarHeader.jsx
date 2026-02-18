import React from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Plus, PieChart } from 'lucide-react';
import { format } from 'date-fns';

const CalendarHeader = ({
    currentDate,
    view,
    setView,
    onPrev,
    onNext,
    onToday,
    onStatsToggle,
    showStats,
    stats,
    onCreateMeeting
}) => {
    return (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 py-4 px-6 bg-white border-b border-gray-100">
            <div className="flex items-center gap-2 sm:gap-4">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight flex items-center gap-2">
                    <CalendarIcon className="text-blue-600 hidden sm:block" size={28} />
                    {format(currentDate, 'MMMM yyyy')}
                </h1>
                <div className="flex items-center bg-gray-50 rounded-lg border border-gray-200 p-0.5 shadow-sm">
                    <button onClick={onPrev} className="p-1.5 hover:bg-gray-200 rounded-md transition-colors text-gray-600">
                        <ChevronLeft size={18} />
                    </button>
                    <button onClick={onNext} className="p-1.5 hover:bg-gray-200 rounded-md transition-colors text-gray-600">
                        <ChevronRight size={18} />
                    </button>
                    <button onClick={onToday} className="px-3 py-1 text-xs font-semibold text-gray-600 hover:bg-gray-200 rounded-md transition-colors border-l border-gray-200 ml-1">
                        Today
                    </button>
                </div>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
                {/* Stats Button */}
                <div className="relative">
                    <button
                        onClick={onStatsToggle}
                        className={`p-2 rounded-lg border transition-colors ${showStats ? 'bg-blue-50 border-blue-200 text-blue-600' : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'}`}
                        title="View Statistics"
                    >
                        <PieChart size={20} />
                    </button>

                    {showStats && stats && (
                        <div className="absolute top-12 right-0 bg-white rounded-xl shadow-xl border border-gray-100 p-4 w-64 z-30 animate-in fade-in zoom-in duration-200 origin-top-right">
                            <h3 className="text-sm font-bold text-gray-900 mb-3 uppercase tracking-wider border-b pb-2">Meeting Stats</h3>
                            <div className="space-y-3">
                                <div className="flex justify-between text-sm items-center">
                                    <span className="text-gray-600 font-medium">Total</span>
                                    <span className="font-bold text-gray-900 bg-gray-100 px-2 py-0.5 rounded-full">{stats.total || 0}</span>
                                </div>
                                <div className="flex justify-between text-sm items-center">
                                    <span className="text-blue-600 font-medium">Scheduled</span>
                                    <span className="font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full">{stats.scheduled || 0}</span>
                                </div>
                                <div className="flex justify-between text-sm items-center">
                                    <span className="text-green-600 font-medium">Completed</span>
                                    <span className="font-bold text-green-700 bg-green-50 px-2 py-0.5 rounded-full">{stats.completed || 0}</span>
                                </div>
                                <div className="flex justify-between text-sm items-center">
                                    <span className="text-red-600 font-medium">Cancelled</span>
                                    <span className="font-bold text-red-700 bg-red-50 px-2 py-0.5 rounded-full">{stats.cancelled || 0}</span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="hidden sm:flex bg-gray-50 rounded-lg border border-gray-200 p-1 shadow-sm">
                    {['month', 'week', 'day'].map((v) => (
                        <button
                            key={v}
                            onClick={() => setView(v)}
                            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${view === v
                                    ? 'bg-blue-600 text-white shadow-sm'
                                    : 'text-gray-500 hover:bg-gray-200 hover:text-gray-700'
                                }`}
                        >
                            {v.charAt(0).toUpperCase() + v.slice(1)}
                        </button>
                    ))}
                </div>

                <button
                    onClick={onCreateMeeting}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 active:scale-95 transition-all shadow-md shadow-blue-600/20 font-semibold text-sm"
                >
                    <Plus size={18} />
                    <span className="hidden sm:inline">Schedule</span>
                    <span className="sm:hidden">Add</span>
                </button>
            </div>

            {/* Mobile View Switcher */}
            <div className="sm:hidden flex bg-gray-50 rounded-lg border border-gray-200 p-1 shadow-sm w-full mt-2">
                {['month', 'week', 'day'].map((v) => (
                    <button
                        key={v}
                        onClick={() => setView(v)}
                        className={`flex-1 px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${view === v
                                ? 'bg-blue-600 text-white shadow-sm'
                                : 'text-gray-500 hover:bg-gray-200 hover:text-gray-700'
                            }`}
                    >
                        {v.charAt(0).toUpperCase() + v.slice(1)}
                    </button>
                ))}
            </div>
        </div>
    );
};

export default CalendarHeader;
