import React from 'react';
import { useParams } from 'react-router-dom';

const SubmittalDetails = () => {
  const { id } = useParams();

  return (
    <div className="p-4">
      <h2>Submittal Details</h2>
      <p>Viewing details for Submittal ID: {id}</p>
    </div>
  );
};

export default SubmittalDetails;
