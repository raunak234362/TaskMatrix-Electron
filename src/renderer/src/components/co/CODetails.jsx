import React from 'react';
import { useParams } from 'react-router-dom';

const CODetails = () => {
  const { id } = useParams();

  return (
    <div className="p-4">
      <h2>Change Order (CO) Details</h2>
      <p>Viewing details for Change Order ID: {id}</p>
    </div>
  );
};

export default CODetails;
