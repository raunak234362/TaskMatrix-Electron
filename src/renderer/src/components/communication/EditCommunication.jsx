import React from 'react';
import CommunicationForm from './CommunicationForm';
import Service from '../../api/Service';
import { toast } from 'react-toastify';

const EditCommunication = ({ communication, projects, fabricators, onClose, onSuccess }) => {

    const handleSubmit = async (data) => {
        try {
            await Service.UpdateClientCommunicationFollowup(communication.id || communication._id, data);
            toast.success("Communication updated successfully");
            if (onSuccess) onSuccess();
            if (onClose) onClose();
        } catch (error) {
            console.error("Error updating communication", error);
            toast.error("Failed to update communication");
        }
    };

    return (
        <CommunicationForm
            initialData={communication}
            projects={projects}
            fabricators={fabricators}
            onSubmit={handleSubmit}
            onCancel={onClose}
        />
    );
};

export default EditCommunication;
