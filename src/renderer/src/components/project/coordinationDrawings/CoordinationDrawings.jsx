import React, { useState, useEffect } from 'react';
import { FileText, Plus, Loader2 } from 'lucide-react';
import Service from '../../../api/Service';
import AddCoordinationDrawing from './AddCoordinationDrawing';
import CoordinationDrawingDetails from './CoordinationDrawingDetails';

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

  if (selectedDrawingId) {
    return (
      <CoordinationDrawingDetails
        drawingId={selectedDrawingId}
        onBack={() => setSelectedDrawingId(null)}
      />
    );
  }

  if (isAdding) {
    return (
      <AddCoordinationDrawing
        projectId={projectId}
        onCancel={() => setIsAdding(false)}
        onSuccess={() => {
          setIsAdding(false);
          fetchDrawings();
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
          <FileText className="w-4 h-4" />
          Coordination Drawings
        </h3>
        <button
          onClick={() => setIsAdding(true)}
          className="flex items-center gap-2 px-4 py-1.5 bg-green-50 text-black border-2 border-[#6bbd45] rounded-lg hover:bg-green-100 transition-all font-bold text-xs uppercase tracking-tight shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Add Drawing
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
        {drawings.length === 0 ? (
          <div className="p-8 text-center text-gray-500 italic text-sm">
            No coordination drawings found for this project.
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {/* Table Header */}
            <div className="grid grid-cols-4 gap-4 px-6 py-3 bg-slate-50 text-[10px] font-black uppercase tracking-widest text-slate-500">
              <div>Drawing Name</div>
              <div>Status</div>
              <div>Date Created</div>
              <div className="text-right">Actions</div>
            </div>
            {/* Table Body */}
            {drawings.map((drawing) => (
              <div key={drawing.id} className="grid grid-cols-4 gap-4 px-6 py-4 items-center text-xs hover:bg-slate-50 transition-colors">
                <div className="flex flex-col">
                  <span className="font-bold text-slate-700">{drawing.title}</span>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{drawing.stage}</span>
                </div>
                <div>
                  <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 border border-blue-100 font-bold uppercase text-[9px]">
                    {drawing.status || 'Pending'}
                  </span>
                </div>
                <div className="text-slate-500">{new Date(drawing.createdAt).toLocaleDateString()}</div>
                <div className="text-right">
                  <button 
                    onClick={() => setSelectedDrawingId(drawing.id)}
                    className="text-blue-500 hover:underline font-bold"
                  >
                    View Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CoordinationDrawings;
