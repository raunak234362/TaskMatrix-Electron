import React from 'react';
import { useParams } from 'react-router-dom';

const RFQDetails = () => {
  const { id } = useParams();

  return (
    <div className="p-4">
      <h2>RFQ Details</h2>
      <p>Viewing details for RFQ ID: {id}</p>
    </div>
  );
};

export default RFQDetails;
