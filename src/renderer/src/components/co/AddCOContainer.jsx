import { useState } from "react";
import AddCO from "./AddCO";
import CoTable from "./CoTable";


const AddCOContainer = ({ project, onSuccess }) => {
  return (
    <div className="space-y-6">
      <AddCO
        project={project}
        onSuccess={onSuccess}
      />
    </div>
  );
};

export default AddCOContainer;