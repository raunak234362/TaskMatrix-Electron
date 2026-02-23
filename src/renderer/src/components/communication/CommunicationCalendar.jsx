import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useLocation, useNavigate } from 'react-router-dom';
import {
    format,
    addMonths,
    subMonths,
    startOfWeek,
    endOfWeek,
    startOfMonth,
    endOfMonth,
    eachDayOfInterval,
    isSameMonth,
    isSameDay,
    parseISO
} from 'date-fns';
import {
    ChevronLeft,
    ChevronRight,
    MessageCircle,
    Plus,
    Search,
    Calendar as CalendarIcon,
    Clock,
    User,
    ArrowRight
} from 'lucide-react';
import Service from '../../api/Service';
import { toast } from 'react-toastify';
import Modal from '../ui/Modal';
import AddCommunication from './AddCommunication';
import GetCommunicationById from './GetCommunicationById';
import CommunicationListSidebar from './CommunicationListSidebar';

const CommunicationCalendar = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const [currentDate, setCurrentDate] = useState(new Date());
    const [communications, setCommunications] = useState([]);
    const [loading, setLoading] = useState(false);

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalType, setModalType] = useState(null); // 'ADD', 'VIEW'
    const [selectedComm, setSelectedComm] = useState(null);
    const [prefilledData, setPrefilledData] = useState(null);
    const [selectedDate, setSelectedDate] = useState(new Date());

    // Dropdown Data from Redux
    const projects = useSelector((state) => state.projectInfo?.projectData || []);
    const fabricators = useSelector((state) => state.fabricatorInfo?.fabricatorData || []);

    useEffect(() => {
        fetchCommunications();
    }, []);

    // Handle pre-filled data from navigation state (e.g. from RFI/CO)
    useEffect(() => {
        if (location.state?.prefill) {
            setPrefilledData(location.state.prefill);
            setModalType('ADD');
            setIsModalOpen(true);
            // Clear state after reading to prevent re-opening on refresh
            navigate(location.pathname, { replace: true, state: {} });
        }
    }, [location.state, navigate]);


    const fetchCommunications = async () => {
        setLoading(true);
        try {
            const data = await Service.GetClientCommunicationFollowupList();
            setCommunications(Array.isArray(data) ? data : (data?.data || []));
        } catch (error) {
            console.error("Failed to fetch communications", error);
            toast.error("Failed to load communications");
        } finally {
            setLoading(false);
        }
    };

    const handlePrevMonth = () => setCurrentDate(subMonths(currentDate, 1));
    const handleNextMonth = () => setCurrentDate(addMonths(currentDate, 1));
    const handleToday = () => {
        const today = new Date();
        setCurrentDate(today);
        setSelectedDate(today);
    };

    const handleOpenAdd = (date = null) => {
        setModalType('ADD');
        setSelectedComm(null);
        if (date) {
            // Set default date to the clicked date
            const dateStr = format(date, "yyyy-MM-dd'T'HH:mm");
            setPrefilledData({ communicationDate: dateStr });
        } else {
            setPrefilledData(null);
        }
        setIsModalOpen(true);
    };

    const handleOpenView = (comm) => {
        setModalType('VIEW');
        setSelectedComm(comm);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setModalType(null);
        setSelectedComm(null);
        setPrefilledData(null);
    };

    const handleSuccess = () => {
        fetchCommunications();
        handleCloseModal();
    };

    // Calendar Logic
    const getDaysInMonth = () => {
        const start = startOfWeek(startOfMonth(currentDate));
        const end = endOfWeek(endOfMonth(currentDate));
        return eachDayOfInterval({ start, end });
    };

    const getCommForDay = (day) => {
        return communications.filter(c => {
            const cDate = c.communicationDate ? parseISO(c.communicationDate) : null;
            const fDate = c.followUpDate ? parseISO(c.followUpDate) : null;
            return (cDate && isSameDay(cDate, day)) || (fDate && isSameDay(fDate, day));
        });
    };

    const days = getDaysInMonth();
    const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    return (
        <div className="flex h-full bg-gray-50/30 overflow-hidden">
            <CommunicationListSidebar
                communications={communications}
                selectedDate={selectedDate}
                onSelectComm={handleOpenView}
            />

            <div className="flex-1 flex flex-col min-w-0 bg-white rounded-l-3xl border-l border-gray-200 shadow-sm overflow-hidden">
                {/* Header */}
                <div className="flex flex-col sm:flex-row items-center justify-between p-6 border-b border-gray-100 bg-gray-50/30 gap-4">
                    <div className="flex items-center gap-4">
                        <h1 className="text-2xl font-black text-gray-800 tracking-tight flex items-center gap-3">
                            <MessageCircle className="text-blue-600" size={28} />
                            {format(currentDate, 'MMMM yyyy')}
                        </h1>
                        <div className="flex items-center bg-white rounded-xl border border-gray-200 p-1 shadow-sm">
                            <button onClick={handlePrevMonth} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors text-gray-600">
                                <ChevronLeft size={20} />
                            </button>
                            <button onClick={handleNextMonth} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors text-gray-600">
                                <ChevronRight size={20} />
                            </button>
                            <button onClick={handleToday} className="px-3 py-1 text-xs font-bold text-blue-600 hover:bg-blue-50 rounded-lg transition-colors ml-1">
                                Today
                            </button>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 w-full sm:w-auto">
                        <button
                            onClick={() => handleOpenAdd()}
                            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 active:scale-95 transition-all shadow-lg shadow-blue-200 font-bold text-sm"
                        >
                            <Plus size={18} />
                            Log Communication
                        </button>
                    </div>
                </div>

                {/* Calendar Grid */}
                <div className="flex-1 flex flex-col overflow-hidden">
                    <div className="grid grid-cols-7 bg-gray-50/50 border-b border-gray-100">
                        {weekDays.map(day => (
                            <div key={day} className="py-3 text-center text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                {day}
                            </div>
                        ))}
                    </div>

                    <div className="flex-1 grid grid-cols-7 auto-rows-fr overflow-y-auto">
                        {days.map((day, idx) => {
                            const dayComms = getCommForDay(day);
                            const isToday = isSameDay(day, new Date());
                            const isCurrentMonth = isSameMonth(day, currentDate);

                            return (
                                <div
                                    key={idx}
                                    className={`min-h-[120px] border-b border-r border-gray-50 p-2 transition-all hover:bg-gray-50/50 flex flex-col gap-1 cursor-pointer ${!isCurrentMonth ? 'bg-gray-50/20 text-gray-300' :
                                        isSameDay(day, selectedDate) ? 'bg-blue-50/50' : 'bg-white'
                                        }`}
                                    onClick={() => setSelectedDate(day)}
                                    onDoubleClick={() => handleOpenAdd(day)}
                                >
                                    <div className={`text-xs font-black w-7 h-7 flex items-center justify-center rounded-lg mb-1 ${isToday
                                        ? 'bg-blue-600 text-white shadow-md shadow-blue-200'
                                        : isSameDay(day, selectedDate) ? 'bg-blue-100 text-blue-700' : isCurrentMonth ? 'text-gray-700' : 'text-gray-300'
                                        }`}>
                                        {format(day, 'd')}
                                    </div>

                                    <div className="flex flex-col gap-1.5 overflow-y-auto max-h-[100px] custom-scrollbar">
                                        {dayComms.map((comm, i) => {
                                            const isFollowup = comm.followUpDate && isSameDay(parseISO(comm.followUpDate), day);
                                            return (
                                                <div
                                                    key={comm.id || i}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleOpenView(comm);
                                                    }}
                                                    className={`text-[10px] p-2 rounded-xl border leading-tight transition-all hover:shadow-md cursor-pointer ${isFollowup
                                                        ? 'bg-amber-50 text-amber-800 border-amber-100 hover:border-amber-300'
                                                        : 'bg-indigo-50 text-indigo-800 border-indigo-100 hover:border-indigo-300'
                                                        }`}
                                                >
                                                    <div className="flex items-center justify-between mb-1">
                                                        <span className="font-black uppercase tracking-tighter opacity-70">
                                                            {isFollowup ? 'Follow-up' : 'Comm'}
                                                        </span>
                                                        <Clock size={10} className="opacity-50" />
                                                    </div>
                                                    <div className="font-bold line-clamp-1">{comm.subject}</div>
                                                    <div className="text-[9px] opacity-80 mt-1 flex items-center gap-1">
                                                        <User size={8} /> {comm.clientName}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                title={modalType === 'ADD' ? 'Log New Communication' : 'Communication Details'}
                width="max-w-2xl"
            >
                {modalType === 'ADD' ? (
                    <AddCommunication
                        projects={projects}
                        fabricators={fabricators}
                        onClose={handleCloseModal}
                        onSuccess={handleSuccess}
                        initialValues={prefilledData}
                    />
                ) : (
                    <GetCommunicationById
                        communication={selectedComm}
                        projects={projects}
                        fabricators={fabricators}
                        onEdit={(comm) => {
                            handleCloseModal();
                            // Logic for edit from calendar if needed, usually just opening edit modal
                            // For now let's keep it simple
                        }}
                        onDelete={handleSuccess}
                        onComplete={handleSuccess}
                    />
                )}
            </Modal>
        </div>
    );
};

export default CommunicationCalendar;
