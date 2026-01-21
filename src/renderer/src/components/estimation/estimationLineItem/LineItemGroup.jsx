import { useEffect, useState } from "react";
import Service from "../../../api/Service";
import DataTable from "../../ui/table";
import LineItemList from "./LineItemList";
import CreateLineItemGroup from "./CreateLineItemGroup";

const LineItemGroup = ({ estimationId }) => {
  const [lineItem, setLineItem] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchGroups = async () => {
    if (!estimationId) return;
    try {
      setLoading(true);
      const response = await Service.FetchLineItemGroup(estimationId);
      setLineItem(response?.data || []);
    } catch (error) {
      console.error("Error fetching line item groups:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGroups();
  }, [estimationId]);

  const columns = [
    {
      header: "Group Name",
      accessorKey: "name"
    },
    {
      header: "Group Description",
      accessorKey: "description",
      cell: ({ row }) => (
        <div
          dangerouslySetInnerHTML={{ __html: row.original.description || "-" }}
          className="max-w-xs truncate"
        />
      ),
    },
  ];

  const handleRowClick = (row) => {
    console.log("Clicked row:", row);
  };

  return (
    <div className="space-y-6">
      <CreateLineItemGroup
        estimationId={estimationId}
        onGroupCreated={fetchGroups}
      />

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <DataTable
          columns={columns}
          data={lineItem}
          loading={loading}
          onRowClick={handleRowClick}
          detailComponent={({ row, close }) => {
            console.log("Detail Component Row:", row);
            const groupUniqueId = row.id ?? "";
            return <LineItemList id={groupUniqueId} onClose={close} refresh={fetchGroups} />;
          }}
          searchPlaceholder="Search groups..."
          pageSizeOptions={[5, 10, 25]}
        />
      </div>
    </div>
  );
};

export default LineItemGroup;
