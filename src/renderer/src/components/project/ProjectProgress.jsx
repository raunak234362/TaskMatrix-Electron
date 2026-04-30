import React, { useState, useEffect } from 'react';
import { Activity, Loader2 } from 'lucide-react';
import Service from '../../api/Service';

const ProjectProgress = ({ projectId }) => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReports = async () => {
      try {
        setLoading(true);
        const data = await Service.getProjectProgressReportsByProjectId(projectId);
        setReports(data || []);
      } catch (error) {
        console.error('Error fetching project progress reports:', error);
      } finally {
        setLoading(false);
      }
    };

    if (projectId) {
      fetchReports();
    }
  }, [projectId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-green-500" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-black uppercase tracking-widest text-slate-700 flex items-center gap-2">
        <Activity className="w-4 h-4 text-green-500" />
        Project Progress Reports
      </h3>

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
                  <h4 className="font-bold text-slate-700 text-sm">{report.title || 'Weekly Progress Report'}</h4>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    {new Date(report.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-xs text-slate-500 line-clamp-2">{report.summary || 'No summary provided.'}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectProgress;
