import React, { useState, useEffect, useMemo } from 'react';
import { FileText, Plus, Loader2, Compass } from 'lucide-react';
import Service from '../../../api/Service';
import AddCoordinationDrawing from './AddCoordinationDrawing';
import CoordinationDrawingDetails from './CoordinationDrawingDetails';
import DataTable from '../../ui/table';
import { format } from 'date-fns';

const CoordinationDrawings = ({ projectId }) => {
  const [drawings, setDrawings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [selectedDrawingId, setSelectedDrawingId] = useState(null);

  const fetchDrawings = async () => {
    try {
      setLoading(true);
      const data = await Service.getCoordinationDrawingsByProjectId(projectId);
      setDrawings(Array.isArray(data) ? data : (data?.data || []));
    } catch (error) {
      console.error('Error fetching coordination drawings:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (projectId) {
      fetchDrawings();
    }
  }, [projectId]);

  const columns = useMemo(() => [
    {
      header: 'Drawing Name',
      accessorKey: 'title',
      enableColumnFilter: true,
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="font-semibold text-lg text-black">
            {row.original.title}
          </span>
          {row.original.stage && (
            <span className="text-sm text-black font-normal mt-1 opacity-60">
              {row.original.stage}
            </span>
          )}
        </div>
      ),
    },
    {
      header: 'Status',
      accessorKey: 'status',
      enableColumnFilter: true,
      filterType: 'select',
      filterOptions: [
        { label: 'Pending', value: 'Pending' },
        { label: 'In Review', value: 'In Review' },
        { label: 'Approved', value: 'Approved' },
      ],
      cell: ({ row }) => (
        <div className={`px-3 py-1 rounded-none text-sm font-normal border inline-block ${
          row.original.status === 'Approved' 
            ? 'bg-green-50 text-black border-green-200' 
            : 'bg-orange-50 text-black border-orange-200'
        }`}>
          {row.original.status || 'In Review'}
        </div>
      ),
    },
    {
      header: 'Date Created',
      accessorKey: 'createdAt',
      cell: ({ row }) => (
        <div className="text-sm text-black font-normal">
          {format(new Date(row.original.createdAt), 'dd MMM yyyy')}
        </div>
      ),
    },
    {
      header: 'Created By',
      accessorKey: 'createdBy.firstName',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-none bg-gray-100 flex items-center justify-center text-sm font-normal text-black border border-gray-200 shadow-sm">
            {row.original.createdBy?.firstName?.[0] || 'U'}
          </div>
          <span className="text-sm font-normal text-black">
            {row.original.createdBy?.firstName} {row.original.createdBy?.lastName}
          </span>
        </div>
      ),
    }
  ], []);

  if (selectedDrawingId) {
    return (
      <CoordinationDrawingDetails
        drawingId={selectedDrawingId}
        onBack={() => setSelectedDrawingId(null)}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
         
         
        </div>
        <button
          onClick={() => setIsAdding(true)}
          className="px-6 py-1.5 bg-green-50 text-black border-2 border-green-700/80 rounded-none hover:bg-green-100 transition-all font-bold text-sm uppercase tracking-tight shadow-sm inline-flex items-center justify-center cursor-pointer"
        >
          + Add Drawing
        </button>
      </div>

      <div className="flex-1">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white rounded-none border border-gray-200 shadow-sm">
            <Loader2 className="w-10 h-10 animate-spin text-green-600 mb-4" />
            <p className="text-sm text-black font-normal">Loading Drawings...</p>
          </div>
        ) : (
          <DataTable 
            columns={columns}
            data={drawings}
            onRowClick={(row) => setSelectedDrawingId(row.id)}
            pageSizeOptions={[10, 20, 50]}
          />
        )}
      </div>

      {isAdding && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-2xl">
            <AddCoordinationDrawing
              projectId={projectId}
              onCancel={() => setIsAdding(false)}
              onSuccess={() => {
                setIsAdding(false);
                fetchDrawings();
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default CoordinationDrawings;
