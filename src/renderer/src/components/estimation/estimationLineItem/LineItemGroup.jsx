import { useEffect, useState } from "react";
import Service from "../../../api/Service";
import DataTable from "../../ui/table";
import LineItemList from "./LineItemList";

const LineItemGroup = ({ estimationId }) => {
  const [lineItem, setLineItem] = useState([]);
  const [loading, setLoading] = useState(false);
  const fetchGroups = async () => {
    const response = await Service.FetchLineItemGroup(estimationId);
    setLineItem(response.data);
    console.log(groupData);
  }

  useEffect(() => {
    fetchGroups();
  }, []);

  const columns = [

    {
      header: "Group Name",
      accessorKey: "name"
    },
    {
      header: "Group Description",
      accessorKey: "description"
    },

  ];
  const handleRowClick = (row) => {
    // setSelectedEstimationId(row.id); // Assuming id exists in payload or response
    console.log("Clicked row:", row);
  };

  return (
    <div>
      <DataTable
        columns={columns}
        data={lineItem}
        onRowClick={handleRowClick}
        detailComponent={({ row, close }) => {
          console.log("Detail Component Row:", row);
          const groupUniqueId =
            row.id ?? row.estimationId ?? "";
          return <LineItemList id={groupUniqueId} onClose={close} refresh={fetchGroups} />;
        }}
        searchPlaceholder="Search tasks..."
        pageSizeOptions={[5, 10, 25]}
      />
    </div>
  );
};

export default LineItemGroup;
