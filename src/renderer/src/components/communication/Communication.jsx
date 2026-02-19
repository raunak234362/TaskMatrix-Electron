import React, { useState, useEffect } from 'react';
import Service from '../../api/Service';
import { toast } from 'react-toastify';
import { Plus } from 'lucide-react';
import Modal from '../ui/Modal';

import ListCommunication from './ListCommunication';
import AddCommunication from './AddCommunication';
import EditCommunication from './EditCommunication';
import GetCommunicationById from './GetCommunicationById';

const Communication = () => {
    const [communications, setCommunications] = useState([]);
    const [loading, setLoading] = useState(false);

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalType, setModalType] = useState(null); // 'ADD', 'EDIT', 'VIEW'
    const [selectedComm, setSelectedComm] = useState(null);

    // Data State
    const [projects, setProjects] = useState([]);
    const [fabricators, setFabricators] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');

    // Fetch Initial Data
    useEffect(() => {
        fetchCommunications();
        fetchDropdownData();
    }, []);

    const fetchDropdownData = async () => {
        try {
            const allProjects = await Service.GetAllProjects();
            const allFabricators = await Service.GetAllFabricators();

            setProjects(Array.isArray(allProjects) ? allProjects : (allProjects?.data || []));
            setFabricators(Array.isArray(allFabricators) ? allFabricators : (allFabricators?.data || []));
        } catch (error) {
            console.error("Failed to fetch dropdown data", error);
        }
    };

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

    // Actions
    const handleOpenAdd = () => {
        setModalType('ADD');
        setSelectedComm(null);
        setIsModalOpen(true);
    };

    const handleOpenEdit = (comm) => {
        setModalType('EDIT');
        setSelectedComm(comm);
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
    };

    const handleSuccess = () => {
        fetchCommunications();
        handleCloseModal();
    };

    const handleMarkCompleted = async (id) => {
        try {
            await Service.MarkClientCommunicationAsCompleted(id);
            toast.success("Marked as completed");
            fetchCommunications();
        } catch (error) {
            console.error("Error marking completed", error);
            toast.error("Failed to update status");
        }
    };

    // Render Modal Content based on Type
    const renderModalContent = () => {
        switch (modalType) {
            case 'ADD':
                return (
                    <AddCommunication
                        projects={projects}
                        fabricators={fabricators}
                        onClose={handleCloseModal}
                        onSuccess={handleSuccess}
                    />
                );
            case 'EDIT':
                return (
                    <EditCommunication
                        communication={selectedComm}
                        projects={projects}
                        fabricators={fabricators}
                        onClose={handleCloseModal}
                        onSuccess={handleSuccess}
                    />
                );
            case 'VIEW':
                return (
                    <GetCommunicationById
                        communication={selectedComm}
                        projects={projects}
                        fabricators={fabricators}
                    />
                );
            default:
                return null;
        }
    };

    const getModalTitle = () => {
        switch (modalType) {
            case 'ADD': return 'Log New Communication';
            case 'EDIT': return 'Edit Communication';
            case 'VIEW': return 'Communication Details';
            default: return '';
        }
    };

    return (
        <div className="p-6 h-full flex flex-col bg-gray-50/30">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-800">Client Communication Follow-ups</h1>
                <button
                    onClick={handleOpenAdd}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors shadow-sm"
                >
                    <Plus size={18} /> Add New
                </button>
            </div>

            {/* List */}
            <ListCommunication
                communications={communications}
                loading={loading}
                projects={projects}
                fabricators={fabricators}
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
                onEdit={handleOpenEdit}
                onComplete={handleMarkCompleted}
                onView={handleOpenView}
            />

            {/* Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                title={getModalTitle()}
                width="max-w-2xl"
            >
                {renderModalContent()}
            </Modal>
        </div>
    );
};

export default Communication;