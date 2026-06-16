import React, { useState, useEffect } from 'react';
import { addMonths, subMonths, addWeeks, subWeeks, addDays, subDays } from 'date-fns';
import { toast } from 'react-toastify';
import Service from '../../api/Service';

// Import newly separated components
import CalendarHeader from './components/CalendarHeader';
import MonthView from './views/MonthView';
import WeekView from './views/WeekView';
import DayView from './views/DayView';
import MeetingListSidebar from './components/MeetingListSidebar';
import MeetingModal from './modals/MeetingModal';

const Calendar = () => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [view, setView] = useState('month'); // 'month', 'week', 'day'
    const [meetings, setMeetings] = useState([]);
    const [loading, setLoading] = useState(false);

    // Modal & Selection State
    const [selectedMeeting, setSelectedMeeting] = useState(null);
    const [selectedDate, setSelectedDate] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [viewingMeeting, setViewingMeeting] = useState(null);
    const [isEditMode, setIsEditMode] = useState(false);

    // Stats State
    const [showStats, setShowStats] = useState(false);
    const [stats, setStats] = useState(null);

    // Initial Fetch & Side Effects
    useEffect(() => {
        fetchMeetings();
        fetchStats();
    }, [currentDate, view]);

    // API Calls
    const fetchMeetings = async () => {
        try {
            setLoading(true);
            const data = await Service.GetMyMeetings();
            // Handle potentially different response structures
            const meetingList = Array.isArray(data) ? data : (data?.data || []);
            setMeetings(meetingList);
        } catch (error) {
            console.error("Failed to fetch meetings", error);
            toast.error("Failed to load meetings");
        } finally {
            setLoading(false);
        }
    };

    const fetchStats = async () => {
        try {
            const data = await Service.GetMeetingStatusCount();
            setStats(data);
        } catch (error) {
            console.error("Failed to fetch stats", error);
        }
    };

    // Navigation Logic
    const handleNext = () => {
        if (view === 'month') setCurrentDate(addMonths(currentDate, 1));
        else if (view === 'week') setCurrentDate(addWeeks(currentDate, 1));
        else setCurrentDate(addDays(currentDate, 1));
    };

    const handlePrev = () => {
        if (view === 'month') setCurrentDate(subMonths(currentDate, 1));
        else if (view === 'week') setCurrentDate(subWeeks(currentDate, 1));
        else setCurrentDate(subDays(currentDate, 1));
    };

    const handleToday = () => setCurrentDate(new Date());

    // Interaction Handlers
    const handleOpenCreateModal = () => {
        setViewingMeeting(null);
        setSelectedMeeting(null);
        setIsEditMode(true);
        setIsModalOpen(true);
    };

    const handleSelectMeeting = (meeting) => {
        setViewingMeeting(meeting);
        setSelectedMeeting(meeting);
        setIsEditMode(false);
        setIsModalOpen(true);
    };

    const handleEditMeeting = (meeting) => {
        setSelectedMeeting(meeting);
        setIsEditMode(true);
    };

    const handleSelectDate = (date) => {
      

        setSelectedDate(date);

        // Optional: Also open modal if that was the dedicated interaction for creating 
        // But maybe we want to just focus that day.

        // Let's keep the modal opening for empty space if that was the intent, 
        // OR just filter the list. The user asked for a "List of meetings on left".
        // Let's make selection filter the list.
    };

    // Quick add when clicking specific slot (Day/Week view)
    const handleSelectSlot = (day, hour) => {
        const start = new Date(day);
        start.setHours(hour, 0, 0, 0);
        const end = new Date(start);
        end.setHours(start.getHours() + 1, 0, 0, 0);

        setSelectedMeeting({
            startTime: start.toISOString(),
            endTime: end.toISOString()
        });
        setIsModalOpen(true);
    };

   
    const handleCreateForDate = (date) => {
        const start = new Date(date);
        start.setHours(9, 0, 0, 0);
        const end = new Date(start);
        end.setHours(10, 0, 0, 0);
        setSelectedMeeting({
            startTime: start.toISOString(),
            endTime: end.toISOString()
        });
        setIsModalOpen(true);
    }


    const handleRefresh = () => {
        fetchMeetings();
        fetchStats();
    };

    return (
        <div className="flex h-full bg-gray-50/30 overflow-hidden">
            {/* Sidebar List */}
            <div className="hidden lg:block h-full">
                <MeetingListSidebar
                    meetings={meetings}
                    selectedDate={selectedDate} // Pass selected date to filter
                    onSelectMeeting={handleSelectMeeting}
                />
            </div>

            {/* Main Calendar Area */}
            <div className="flex-1 flex flex-col p-4 sm:p-6 space-y-4 h-full overflow-hidden">
                {/* 1. Header Component */}
                <CalendarHeader
                    currentDate={currentDate}
                    view={view}
                    setView={setView}
                    onPrev={handlePrev}
                    onNext={handleNext}
                    onToday={handleToday}
                    onStatsToggle={() => setShowStats(!showStats)}
                    showStats={showStats}
                    stats={stats}
                    onCreateMeeting={handleOpenCreateModal}
                />

                {/* 2. Main View Area */}
                <div className="flex-1 overflow-y-auto min-h-[500px] bg-white rounded-xl shadow-sm border border-gray-200">
                    {view === 'month' && (
                        <MonthView
                            currentDate={currentDate}
                            meetings={meetings}
                            onSelectDate={(date) => {
                                // On single click, just select the date to filter the sidebar
                                setSelectedDate(date);
                                // Optional: if you want to create meeting on click, uncomment:
                                // handleCreateForDate(date);
                            }}
                            onSelectMeeting={handleSelectMeeting}
                        />
                    )}

                    {view === 'week' && (
                        <WeekView
                            currentDate={currentDate}
                            meetings={meetings}
                            onSelectSlot={handleSelectSlot}
                            onSelectMeeting={handleSelectMeeting}
                        />
                    )}

                    {view === 'day' && (
                        <DayView
                            currentDate={currentDate}
                            meetings={meetings}
                            onSelectSlot={handleSelectSlot}
                            onSelectMeeting={handleSelectMeeting}
                        />
                    )}
                </div>
            </div>

            {/* Modal Component */}
            {isModalOpen && (
                <div className="fixed inset-0 z-10001 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/50">
                            <h2 className="text-xl font-bold text-gray-800">
                                {isEditMode ? (selectedMeeting ? "Edit Meeting" : "Schedule New Meeting") : "Meeting Details"}
                            </h2>
                            <button onClick={() => setIsModalOpen(false)} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors">
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-x"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
                            </button>
                        </div>
                        <div className="overflow-y-auto custom-scrollbar">
                            {isEditMode ? (
                                <MeetingModal
                                    isOpen={true}
                                    onClose={() => setIsModalOpen(false)}
                                    meeting={selectedMeeting}
                                    refresh={handleRefresh}
                                />
                            ) : (
                                <GetMeetingById
                                    meeting={viewingMeeting}
                                    onEdit={handleEditMeeting}
                                    onDelete={() => {
                                        setIsModalOpen(false);
                                        handleRefresh();
                                    }}
                                    onRefresh={handleRefresh}
                                />
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Calendar;