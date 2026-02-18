import React from 'react';
import CommunicationForm from './CommunicationForm';
import Service from '../../api/Service';
import { toast } from 'react-toastify';

const AddCommunication = ({ projects, fabricators, onClose, onSuccess }) => {

    const handleSubmit = async (data) => {
        try {
            await Service.AddClientCommunicationFollowup(data);
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
            projects={projects}
            fabricators={fabricators}
            onSubmit={handleSubmit}
            onCancel={onClose}
        />
    );
};

export default AddCommunication;
