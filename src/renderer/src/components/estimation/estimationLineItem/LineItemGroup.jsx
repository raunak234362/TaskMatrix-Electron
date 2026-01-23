/* eslint-disable react/prop-types */
import React, { useEffect, useState } from "react";
import Service from "../../../api/Service";
import DataTable from "../../ui/table";
import LineItemList from "./LineItemList";

const LineItemGroup = ({ estimationId, refreshTrigger }) => {
    const [lineItem, setLineItem] = useState([]);
    // eslint-disable-next-line no-unused-vars
    const [, setLoading] = useState(false);

    const fetchGroups = async () => {
        try {
            setLoading(true);
            const response = await Service.FetchLineItemGroup(estimationId);
            setLineItem(response.data);
        } catch (error) {
            console.log(error);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        if (estimationId) {
            fetchGroups();
        }
    }, [estimationId, refreshTrigger]);

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
    const [selectedGroupId, setSelectedGroupId] = useState(null);

    const handleRowClick = (row) => {
        setSelectedGroupId(row.id);
    };

    return (
        <div>
            <DataTable
                columns={columns}
                data={lineItem}
                onRowClick={handleRowClick}
                searchPlaceholder="Search groups..."
                pageSizeOptions={[5, 10, 25]}
            />
            {selectedGroupId && (
                <LineItemList
                    id={selectedGroupId}
                    onClose={() => setSelectedGroupId(null)}
                />
            )}
        </div>
    );
};

export default LineItemGroup
