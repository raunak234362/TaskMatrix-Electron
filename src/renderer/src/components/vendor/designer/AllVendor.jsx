/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
import Service from "../../../api/Service";

import DataTable from "../../ui/table";

import GetConnectionDesignerByID from "./GetVendorByID";

const AllConnectionDesigner = () => {
  const [connectionDesigner, setConnectionDesigner] = useState([]);
  const fetchCD = async () => {
    try {
      const response = await Service.FetchAllConnectionDesigner();
      setConnectionDesigner(response.data);
      console.log(response.data);
    } catch (error) {
      console.log(error);
    }
  };
  useEffect(() => {
    fetchCD();
  }, []);

  // Handle row click (optional)
  const handleRowClick = (row) => {
    const fabricatorUniqueId = (row  ).id ?? (row  ).fabId ?? "";
    console.debug("Selected fabricator:", fabricatorUniqueId);
  };


  const columns = [
    { accessorKey: "name", header: "Name" },
    { accessorKey: "email", header: "Email" },
  ];

  return (
    <div className=" bg-white p-4 rounded-2xl shadow-sm">
      <DataTable
        columns={columns}
        data={connectionDesigner}
        onRowClick={handleRowClick}
        detailComponent={({ row }) => {
          const fabricatorUniqueId =
            (row  ).id ?? (row  ).fabId ?? "";
          return <GetConnectionDesignerByID id={fabricatorUniqueId} />;
        }}
        pageSizeOptions={[5, 10, 25]}
      />
    </div>
  );
};

export default AllConnectionDesigner;
