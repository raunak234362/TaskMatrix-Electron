import React from 'react';
import { useParams } from 'react-router-dom';

const CDRFQDetails = () => {
  const { id } = useParams();

  return (
    <div className="p-4">
      <h2>CD RFQ Details</h2>
      <p>Viewing details for CD RFQ ID: {id}</p>
    </div>
  );
};

export default CDRFQDetails;
