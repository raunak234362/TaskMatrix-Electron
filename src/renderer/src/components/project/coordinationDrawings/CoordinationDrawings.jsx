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
          <span className="font-black text-black uppercase tracking-tight text-sm">
            {row.original.title}
          </span>
          {row.original.stage && (
            <span className="text-[10px] text-black font-black uppercase tracking-widest mt-1 opacity-60">
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
        <div className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border inline-block ${
          row.original.status === 'Approved' 
            ? 'bg-green-50 text-black border-black' 
            : 'bg-orange-50 text-black border-black'
        }`}>
          {row.original.status || 'In Review'}
        </div>
      ),
    },
    {
      header: 'Date Created',
      accessorKey: 'createdAt',
      cell: ({ row }) => (
        <div className="text-[11px] text-black font-black uppercase tracking-widest">
          {format(new Date(row.original.createdAt), 'dd MMM yyyy')}
        </div>
      ),
    },
    {
      header: 'Created By',
      accessorKey: 'createdBy.firstName',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-[10px] font-black text-black border border-black shadow-sm">
            {row.original.createdBy?.firstName?.[0] || 'U'}
          </div>
          <span className="text-[10px] font-black text-black uppercase tracking-widest">
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
          <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-sm border border-black/5">
            <Compass className="w-5 h-5 text-black" />
          </div>
          <h2 className="text-lg font-black text-black uppercase tracking-tight">Coordination Drawings</h2>
        </div>
        <button
          onClick={() => setIsAdding(true)}
          className="flex items-center gap-2 px-6 py-2 border-2 border-[#6bbd45] text-[#6bbd45] hover:bg-[#6bbd45] hover:text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Add Drawing
        </button>
      </div>

      <div className="flex-1">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white rounded-lg border border-black shadow-sm">
            <Loader2 className="w-10 h-10 animate-spin text-[#6bbd45] mb-4" />
            <p className="text-sm text-black font-black uppercase tracking-widest">Loading Drawings...</p>
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
