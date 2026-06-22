import React from 'react';
import { useParams } from 'react-router-dom';

const RFIDetails = () => {
  const { id } = useParams();

  return (
    <div className="p-4">
      <h2>RFI Details</h2>
      <p>Viewing details for RFI ID: {id}</p>
    </div>
  );
};

export default RFIDetails;
