import React, { useState, useEffect, useMemo } from 'react';
import { Activity, Loader2, Plus, Compass } from 'lucide-react';
import Service from '../../api/Service';
import AddProjectProgressReport from './AddProjectProgressReport';
import ProjectProgressReportDetails from './ProjectProgressReportDetails';
import DataTable from '../ui/table';
import { format } from 'date-fns';

const ProjectProgress = ({ projectId }) => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [selectedReportId, setSelectedReportId] = useState(null);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const data = await Service.getProjectProgressReportsByProjectId(projectId);
      setReports(Array.isArray(data) ? data : (data?.data || []));
    } catch (error) {
      console.error('Error fetching project progress reports:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (projectId) {
      fetchReports();
    }
  }, [projectId]);

  const columns = useMemo(() => [
    {
      header: 'Report Title',
      accessorKey: 'title',
      enableColumnFilter: true,
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="font-black text-black uppercase tracking-tight text-sm">
            {row.original.title || 'Weekly Progress Report'}
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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-sm border border-black/5">
            <Activity className="w-5 h-5 text-black" />
          </div>
          <h2 className="text-lg font-black text-black uppercase tracking-tight">Progress Reports</h2>
        </div>
        <button
          onClick={() => setIsAdding(true)}
          className="flex items-center gap-2 px-6 py-2 border-2 border-[#6bbd45] text-[#6bbd45] hover:bg-[#6bbd45] hover:text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Add Report
        </button>
      </div>

      <div className="flex-1">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white rounded-lg border border-black shadow-sm">
            <Loader2 className="w-10 h-10 animate-spin text-[#6bbd45] mb-4" />
            <p className="text-sm text-black font-black uppercase tracking-widest">Loading Reports...</p>
          </div>
        ) : (
          <DataTable 
            columns={columns}
            data={reports}
            onRowClick={(row) => setSelectedReportId(row.id)}
            pageSizeOptions={[10, 20, 50]}
          />
        )}
      </div>

      {isAdding && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-2xl">
            <AddProjectProgressReport
              projectId={projectId}
              onCancel={() => setIsAdding(false)}
              onSuccess={() => {
                setIsAdding(false);
                fetchReports();
              }}
            />
          </div>
        </div>
      )}

      {selectedReportId && (
        <ProjectProgressReportDetails
          reportId={selectedReportId}
          onBack={() => setSelectedReportId(null)}
        />
      )}
    </div>
  );
};

export default ProjectProgress;
