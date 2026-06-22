import React from 'react';
import { useParams } from 'react-router-dom';

const InternalRFQDetails = () => {
  const { id } = useParams();

  return (
    <div className="p-4">
      <h2>Internal RFQ Details</h2>
      <p>Viewing details for Internal RFQ ID: {id}</p>
    </div>
  );
};

export default InternalRFQDetails;
