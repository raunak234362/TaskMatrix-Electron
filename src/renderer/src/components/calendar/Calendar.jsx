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
    const [selectedDate, setSelectedDate] = useState(null); // Track selected date for sidebar filtering
    const [isModalOpen, setIsModalOpen] = useState(false);

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
        setSelectedMeeting(null);
        setIsModalOpen(true);
    };

    const handleSelectMeeting = (meeting) => {
        setSelectedMeeting(meeting);
        setIsModalOpen(true);
    };

    const handleSelectDate = (date) => {
        // When clicking a date cell in month view, set selected date for sidebar filtering
        // Double click or similar could be used for creating meeting, but let's keep it simple for now
        // If exact date click behavior for creating meeting is desired, we can add a specific handler

        // For now, let's say single click filters the sidebar list, 
        // and we provide a way to open modal manually or via slot click in other views

        // Actually, previous behavior was opening modal immediately. 
        // Let's modify: Click -> Filter List. 
        // If user wants to create, they can use header button or drag/double click (if implemented). 
        // OR we differentiate based on where they click.

        // To preserve "Click date to create meeting" flow:
        // We can just set selected date to filter the list. 
        // And have a separate "Create Meeting" button or double click.

        // However, standard calendar behavior: 
        // Click date -> Show day view or list for that day.

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

    // New wrapper to handle creating from month view specifically if needed, 
    // replacing the old handleSelectDate if strictly creating meeting was the only goal.
    // For now, let's assume filtering sidebar is the priority for date selection.

    // Helper to open modal for specific date (e.g. from Sidebar "Add" button if we added one, or double click)
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

            {/* 3. Modal Component (Global at calendar level) */}
            <MeetingModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                meeting={selectedMeeting}
                refresh={handleRefresh}
            />
        </div>
    );
};

export default Calendar;