/* eslint-disable react/prop-types */
import { useEffect, useState } from 'react'
import Service from '../../../api/Service'
import { format } from 'date-fns'
import DataTable from '../../ui/table'
import EstimationTaskByID from './EstimationTaskByID'

const AllAssignedTask = ({
  estimations: externalEstimations,
  onRefresh: externalOnRefresh,
  isLoading: externalIsLoading
}) => {
  const [internalLoading, setInternalLoading] = useState(false)
  const [internalEstimations, setInternalEstimations] = useState([])

  const isLoading = externalIsLoading !== undefined ? externalIsLoading : internalLoading
  const estimations = externalEstimations !== undefined ? externalEstimations : internalEstimations
  const onRefresh = externalOnRefresh || fetchEstimations

  const fetchEstimations = async () => {
    if (externalOnRefresh) return externalOnRefresh()

    setInternalLoading(true)
    try {
      const response = await Service.GetEstimationTaskForME()
      const data = Array.isArray(response) ? response : response?.data || []
      setInternalEstimations(data)
    } catch (error) {
      console.error('Error fetching estimations:', error)
    } finally {
      setInternalLoading(false)
    }
  }

  useEffect(() => {
    if (externalEstimations === undefined) {
      fetchEstimations()
    }
  }, [])
  const columns = [
    {
      header: 'Fabricator Name',
      accessorFn: (row) => row.estimation?.fabricators?.fabName || '—'
    },
    {
      header: 'Project Name',
      accessorFn: (row) => row.estimation?.projectName || '—'
    },

    {
      header: 'Assigned To',
      accessorFn: (row) =>
        `${row.assignedTo?.firstName ?? ''} ${row.assignedTo?.middleName ?? ''
          } ${row.assignedTo?.lastName ?? ''}`.trim() || '—'
    },
    {
      header: 'End Date',
      accessorFn: (row) => (row.endDate ? format(new Date(row.endDate), 'dd MMM yyyy') : '—')
    },
    {
      header: 'Status',
      accessorFn: (row) => row.status,
      cell: ({ getValue }) => {
        const status = getValue()
        const color =
          status === 'COMPLETED'
            ? 'bg-green-100 text-green-800'
            : status === 'ASSIGNED'
              ? 'bg-yellow-100 text-yellow-800'
              : 'bg-blue-100 text-blue-800'
        return (
          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${color}`}>{status}</span>
        )
      }
    }
  ]

  const handleRowClick = (row) => {
    console.log('Task clicked:', row.id)
  }
  return (
    <div>
      {/* Task Table */}
      <div className="mt-4 border rounded-lg">
        {isLoading ? (
          <div className="flex items-center justify-center py-12 text-gray-700">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600 mr-2"></div>
            Loading tasks...
          </div>
        ) : estimations?.length > 0 ? (
          <DataTable
            columns={columns}
            data={estimations}
            onRowClick={handleRowClick}
            detailComponent={({ row, close }) => {
              console.log('Detail Component Row:', row)
              const estimationUniqueId = row.id ?? row.estimationId ?? ''
              return (
                <EstimationTaskByID
                  id={estimationUniqueId}
                  onClose={close}
                  refresh={onRefresh}
                />
              )
            }}
            searchPlaceholder="Search tasks..."

          />
        ) : (
          <div className="text-center text-gray-700 py-10">No estimation tasks found.</div>
        )}
      </div>
    </div>
  )
}

export default AllAssignedTask
