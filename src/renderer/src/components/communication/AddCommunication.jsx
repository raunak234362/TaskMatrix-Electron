import React, { useCallback } from 'react';
import Service from '../../api/Service';
import { toast } from 'react-toastify';
import CommunicationForm from './CommunicationForm';

const AddCommunication = ({ projects = [], fabricators = [], onClose, onSuccess, initialValues }) => {

    const fetchClientsByFabricator = useCallback(async (fabricatorId) => {
        try {
            const data = await Service.FetchAllClientsByFabricatorID(fabricatorId);
            return Array.isArray(data) ? data : (data?.data || []);
        } catch (error) {
            console.error("Failed to fetch clients", error);
            return [];
        }
    }, []);

    const handleSubmit = async (payload) => {
        try {
            await Service.AddClientCommunicationFollowup(payload);
            toast.success("Communication added successfully");
            if (onSuccess) onSuccess();
            if (onClose) onClose();
        } catch (error) {
            console.error("Error saving communication", error);
            toast.error("Failed to save communication");
        }
    };

    return (
        <CommunicationForm
            initialData={initialValues}
            projects={projects}
            fabricators={fabricators}
            onSubmit={handleSubmit}
            onCancel={onClose}
            fetchClientsByFabricator={fetchClientsByFabricator}
        />
    );
};

export default AddCommunication;
