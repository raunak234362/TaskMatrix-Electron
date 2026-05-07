import DataTable from '../ui/table'
import GetEstimationByID from './GetEstimationByID'
import { useMemo } from 'react'

const AllEstimation = ({ estimations, onRefresh }) => {
  console.log(estimations)

  const handleRowClick = (row) => {
    // setSelectedEstimationId(row.id); // Assuming id exists in payload or response
    console.log('Clicked row:', row)
  }

  const statusOptions = useMemo(() => {
    const statuses = new Set((estimations || []).map(e => e.status).filter(Boolean));
    const dynamicOptions = Array.from(statuses).map(status => ({
      label: status,
      value: status
    }));
    return [
      { label: 'All Status', value: '' },
      ...dynamicOptions
    ];
  }, [estimations]);

  const columns = [
    { accessorKey: 'projectName', header: 'Project Name', enableColumnFilter: true },
    { accessorKey: 'fabricators.fabName', header: 'Fabricator', enableColumnFilter: true },
    { 
      accessorKey: 'status', 
      header: 'Status', 
      enableColumnFilter: true,
      filterType: 'select',
      filterOptions: statusOptions
    },
    {
      accessorKey: 'createdAt',
      header: 'Created On',
      enableColumnFilter: true,
      filterType: 'date',
      cell: ({ row }) =>
        row.original.createdAt ? new Date(row.original.createdAt).toLocaleDateString() : '-'
    },
    {
      accessorKey: 'estimateDate',
      header: 'Due Date',
      enableColumnFilter: true,
      filterType: 'date',
      cell: ({ row }) =>
        row.original.estimateDate ? new Date(row.original.estimateDate).toLocaleDateString() : '-'
    }
  ]

  return (
    <div className="bg-white p-2 rounded-2xl">
      <DataTable
        columns={columns}
        data={estimations || []}
        onRowClick={handleRowClick}
        detailComponent={({ row, close }) => {
          const estimationUniqueId = row.id ?? row.fabId ?? ''
          return <GetEstimationByID id={estimationUniqueId} onRefresh={onRefresh} onClose={close} />
        }}
        searchPlaceholder="Search estimations..."

      />
    </div>
  )
}

export default AllEstimation
