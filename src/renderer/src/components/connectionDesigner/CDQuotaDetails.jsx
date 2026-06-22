import React from 'react';
import { useParams } from 'react-router-dom';

const CDQuotaDetails = () => {
  const { id } = useParams();

  return (
    <div className="p-4">
      <h2>CD Quota Details</h2>
      <p>Viewing details for CD Quota ID: {id}</p>
    </div>
  );
};

export default CDQuotaDetails;
