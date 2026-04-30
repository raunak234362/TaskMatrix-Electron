import React, { useState, useEffect } from 'react';
import { Activity, Loader2, Plus } from 'lucide-react';
import Service from '../../api/Service';
import AddProjectProgressReport from './AddProjectProgressReport';

const ProjectProgress = ({ projectId }) => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);

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

  if (isAdding) {
    return (
      <AddProjectProgressReport
        projectId={projectId}
        onCancel={() => setIsAdding(false)}
        onSuccess={() => {
          setIsAdding(false);
          fetchReports();
        }}
      />
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-green-500" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-black uppercase tracking-widest text-slate-700 flex items-center gap-2">
          <Activity className="w-4 h-4 text-green-500" />
          Project Progress Reports
        </h3>
        <button
          onClick={() => setIsAdding(true)}
          className="flex items-center gap-2 px-4 py-1.5 bg-green-50 text-black border-2 border-[#6bbd45] rounded-lg hover:bg-green-100 transition-all font-bold text-xs uppercase tracking-tight shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Add Report
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
        {reports.length === 0 ? (
          <div className="p-8 text-center text-gray-500 italic text-sm">
            No progress reports found for this project.
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {reports.map((report) => (
              <div key={report.id} className="p-4 hover:bg-slate-50 transition-colors">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex flex-col">
                    <h4 className="font-bold text-slate-700 text-sm">{report.title || 'Weekly Progress Report'}</h4>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{report.stage}</span>
                  </div>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    {new Date(report.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <div 
                  className="text-xs text-slate-500 line-clamp-2 prose prose-xs"
                  dangerouslySetInnerHTML={{ __html: report.message || 'No details provided.' }}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectProgress;
