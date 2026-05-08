import { useState, useMemo } from 'react'
import DataTable from '../../ui/table'
import { format } from 'date-fns'
import { X } from 'lucide-react'
import EstTaskByID from './EstTaskByID'
import AddEstimationTask from './AddEstimationTask'

const AllEstimationTask = ({ estimations, onClose, estimationId, onRefresh }) => {
    const [isAddingTask, setIsAddingTask] = useState(false)
    console.log(estimations)

    const statusOptions = useMemo(() => {
        const statuses = new Set((estimations || []).map((e) => e.status).filter(Boolean))
        const dynamicOptions = Array.from(statuses).map((status) => ({
            label: status,
            value: status
        }))
        return [{ label: 'All Status', value: '' }, ...dynamicOptions]
    }, [estimations])

    // ─────────────── Columns ───────────────
    const columns = [
        {
            header: 'Project Name',
            accessorFn: (row) => row.projectName || row.estimation?.projectName || '—',
            id: 'projectName',
            enableColumnFilter: true
        },
        {
            header: 'Assigned To',
            accessorFn: (row) => {
                const user = row.assignedTo || row.assignee;
                if (!user) return '—';
                return `${user.firstName ?? ''} ${user.middleName ?? ''} ${user.lastName ?? ''}`.trim() || user.username || '—';
            },
            id: 'assignedTo',
            enableColumnFilter: true
        },
        {
            header: 'Created At',
            accessorFn: (row) => row.createdAt,
            id: 'createdAt',
            enableColumnFilter: true,
            filterType: 'date',
            cell: ({ row }) =>
                row.original.createdAt ? format(new Date(row.original.createdAt), 'dd MMM yyyy') : '—'
        },
        {
            header: 'Estimate Date',
            accessorFn: (row) => row.estimateDate || row.estimation?.estimateDate,
            id: 'estimateDate',
            enableColumnFilter: true,
            filterType: 'date',
            cell: ({ row }) => {
                const date = row.original.estimateDate || row.original.estimation?.estimateDate;
                return date ? format(new Date(date), 'dd MMM yyyy') : '—';
            }
        },
        {
            header: 'Status',
            accessorKey: 'status',
            enableColumnFilter: true,
            filterType: 'select',
            filterOptions: statusOptions,
            cell: ({ getValue }) => {
                const status = getValue()
                const color =
                    status === 'COMPLETED'
                        ? 'bg-green-100 text-green-800'
                        : status === 'ASSIGNED' || status === 'ASSIGN'
                            ? 'bg-yellow-100 text-yellow-800'
                            : status === 'BREAK'
                                ? 'bg-orange-100 text-orange-800'
                                : 'bg-blue-100 text-blue-800'

                return (
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${color}`}>{status}</span>
                )
            }
        }
    ]

    // ─────────────── Row Click Handler ───────────────
    const handleRowClick = (row) => {
        const taskId = row.id ?? row.estimationId
        if (!taskId) return
        console.log('Selected Task ID:', taskId)
    }

    return (
        <>
            {/* Header with Close button (used when opened from Estimation details) */}
            <div className="flex items-center justify-between mb-3">
                <div className="flex gap-2">
                    {estimationId && (
                        <button
                            type="button"
                            onClick={() => setIsAddingTask(true)}
                            className="px-3 py-1 text-sm rounded-md bg-green-600 hover:bg-green-700 text-white font-medium transition-colors shadow-sm"
                        >
                            Add Task
                        </button>
                    )}
                    {typeof onClose === 'function' && (
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-6 py-1.5 bg-red-50 text-black border-2 border-red-700/80 rounded-lg hover:bg-red-100 transition-all font-bold text-sm uppercase tracking-tight shadow-sm"
                        >
                            Close
                        </button>
                    )}
                </div>
            </div>

            {/* Modal Overlay for Adding Task */}
            {isAddingTask && estimationId && (
                <div className="fixed inset-0 z-70 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white w-full max-w-3xl max-h-[90vh] rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in duration-200">
                        <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                            <h3 className="text-xl  text-gray-700">Add Estimation Task</h3>
                            <button
                                onClick={() => setIsAddingTask(false)}
                                className="p-2 hover:bg-gray-200 rounded-full transition-colors text-gray-400 hover:text-gray-700"
                            >
                                <X size={24} />
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-8">
                            <AddEstimationTask
                                estimationId={estimationId}
                                onClose={() => setIsAddingTask(false)}
                                onSuccess={() => {
                                    setIsAddingTask(false)
                                    onRefresh?.()
                                }}
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* Table */}
            <div className="w-full rounded-xl p-4 ">
                <div className=" rounded-lg">
                    {estimations?.length > 0 ? (
                        <DataTable
                            columns={columns}
                            data={estimations}
                            onRowClick={handleRowClick}
                            detailComponent={({ row, close }) => {
                                console.log('Detail Component Row:', row.id)
                                const estimationUniqueId = row.id ?? row.estimationId ?? ''
                                return <EstTaskByID id={estimationUniqueId} onClose={close} />
                            }}
                            searchPlaceholder="Search tasks..."

                        />
                    ) : (
                        <div className="text-center text-gray-700 py-10">No estimation tasks found.</div>
                    )}
                </div>
            </div>
        </>
    )
}

export default AllEstimationTask
