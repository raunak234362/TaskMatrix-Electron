import React, { useState, useEffect } from 'react';
import { Activity, Clock, Download, User, ArrowLeft, Loader2, MessageSquare, Reply } from 'lucide-react';
import { format } from 'date-fns';
import Service from '../../api/Service';
import RenderFiles from '../ui/RenderFiles';
import AddProjectProgressReportResponse from './AddProjectProgressReportResponse';

const ResponseItem = ({ response, isChild = false, onReply }) => {
  const [showChildren, setShowChildren] = useState(false);
  const user = response.user || response.createdBy;
  const hasChildren = response.childResponses && response.childResponses.length > 0;
  
  const displayName = user?.firstName 
    ? `${user.firstName} ${user.lastName || ''}` 
    : (user?.username || 'Unknown User');

  const initials = user?.firstName?.[0] || user?.username?.[0] || 'U';

  return (
    <div className={`space-y-4 ${isChild ? 'ml-12 mt-4 pt-4 border-l-2 border-black/5 pl-6' : ''}`}>
      <div className="bg-white rounded-lg border border-black p-8 shadow-sm">
        <div className="flex justify-between items-start mb-6">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center text-black border border-black shadow-sm">
              <span className="font-black text-xs">{initials}</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="text-xs font-black text-black uppercase tracking-tight">
                  {displayName}
                </p>
                {user?.username && (
                  <span className="text-[9px] text-black font-black uppercase bg-slate-100 px-2 py-0.5 rounded border border-black/10">
                    @{user.username}
                  </span>
                )}
              </div>
              <p className="text-[9px] text-black font-black uppercase tracking-widest mt-1 opacity-60">
                {format(new Date(response.createdAt), 'dd MMM yyyy, hh:mm a')}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => onReply(response.id)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 hover:bg-green-50 text-black border border-black/10 hover:border-black rounded-lg text-[9px] font-black uppercase tracking-widest transition-all"
            >
              <Reply className="w-3 h-3" />
              Reply
            </button>
            {hasChildren && (
              <button
                onClick={() => setShowChildren(!showChildren)}
                className="text-[10px] font-black uppercase tracking-widest text-black hover:underline flex items-center gap-2"
              >
                {showChildren ? 'Hide Replies' : `Show Replies (${response.childResponses.length})`}
              </button>
            )}
          </div>
        </div>
        <div 
          className="prose prose-xs max-w-none text-black font-semibold leading-relaxed"
          dangerouslySetInnerHTML={{ __html: response.description }}
        />
        {response.files && response.files.length > 0 && (
          <div className="mt-8 pt-8 border-t border-black/5">
            <RenderFiles 
              files={response.files} 
              table="projectProgressReportResponse" 
              parentId={response.id} 
              hideHeader={true}
            />
          </div>
        )}
      </div>

      {hasChildren && showChildren && (
        <div className="space-y-4">
          {response.childResponses.map((child) => (
            <ResponseItem key={child.id} response={child} isChild={true} onReply={onReply} />
          ))}
        </div>
      )}
    </div>
  );
};

const ProjectProgressReportDetails = ({ reportId, onBack }) => {
  const [report, setReport] = useState(null);
  const [responses, setResponses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddResponse, setShowAddResponse] = useState(false);
  const [selectedParentId, setSelectedParentId] = useState(null);

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        setLoading(true);
        const response = await Service.getProjectProgressReportById(reportId);
        const reportData = response?.data || response;
        setReport(reportData);
        setResponses(reportData?.responses || []);
      } catch (error) {
        console.error('Error fetching progress report details:', error);
      } finally {
        setLoading(false);
      }
    };

    if (reportId) fetchDetails();
  }, [reportId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-10 h-10 animate-spin text-[#6bbd45]" />
      </div>
    );
  }

  if (!report) {
    return (
      <div className="p-8 text-center text-red-500 font-bold">
        Report not found.
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white w-full max-w-5xl rounded-lg overflow-hidden shadow-2xl flex flex-col h-[85vh] border border-black">
        {/* Header */}
        <div className="px-10 py-6 border-b border-gray-100 flex items-center justify-between bg-white shrink-0">
          <div className="flex flex-col">
            <h2 className="text-xl font-black uppercase tracking-tight text-black">{report.title}</h2>
            <div className="flex items-center gap-3 mt-1">
              <span className="px-3 py-1 rounded-lg bg-green-50 text-black border border-black font-black uppercase text-[10px] tracking-widest">
                {report.stage}
              </span>
              <span className="text-[10px] text-black font-black uppercase tracking-widest flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                {format(new Date(report.createdAt), 'dd MMM yyyy, hh:mm a')}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setSelectedParentId(null);
                setShowAddResponse(true);
              }}
              className="flex items-center gap-2 px-6 py-2.5 bg-[#6bbd45] text-black rounded-lg text-xs font-black uppercase tracking-widest hover:bg-green-500 transition-all shadow-sm border border-black"
            >
              <MessageSquare className="w-4 h-4" />
              Add Response
            </button>
            <button
              onClick={onBack}
              className="px-6 py-1.5 bg-red-50 text-black border-2 border-red-700/80 rounded-lg hover:bg-red-100 transition-all font-bold text-sm uppercase tracking-tight shadow-sm"
            >
              Close
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-10 bg-slate-50/30 custom-scrollbar">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-10">
              <div className="bg-white rounded-lg border border-black p-8 shadow-sm">
                <h3 className="text-[10px] font-black uppercase tracking-widest text-black mb-6 flex items-center gap-2">
                  <Activity className="w-4 h-4" />
                  Report Details
                </h3>
                <div 
                  className="prose prose-sm max-w-none text-black font-bold leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: report.message }}
                />
              </div>

              {/* Responses List */}
              <div className="space-y-6">
                <h3 className="text-[10px] font-black uppercase tracking-widest text-black flex items-center gap-2 px-2">
                  <MessageSquare className="w-4 h-4" />
                  Responses ({responses.length})
                </h3>
                
                {responses.length === 0 ? (
                  <div className="bg-white rounded-lg border border-dashed border-black/20 p-12 text-center text-black font-black uppercase tracking-widest text-[10px] opacity-40">
                    No responses yet. Be the first to respond.
                  </div>
                ) : (
                  <div className="space-y-6">
                    {responses.filter(r => !r.parentResponseId).map((response) => (
                      <ResponseItem 
                        key={response.id} 
                        response={response} 
                        onReply={(id) => {
                          setSelectedParentId(id);
                          setShowAddResponse(true);
                        }} 
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Sidebar / Info */}
            <div className="space-y-8">
              <div className="bg-white rounded-lg border border-black p-8 shadow-sm">
                <h3 className="text-[10px] font-black uppercase tracking-widest text-black mb-6 flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Reporter Details
                </h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black text-black uppercase tracking-widest opacity-60">Created By:</span>
                    <span className="text-xs font-black text-black uppercase">
                      {report.createdBy?.firstName} {report.createdBy?.lastName}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black text-black uppercase tracking-widest opacity-60">Username:</span>
                    <span className="text-xs font-black text-black uppercase">{report.createdBy?.username}</span>
                  </div>
                </div>
              </div>

              {report.files && report.files.length > 0 && (
                <div className="bg-white rounded-lg border border-black p-8 shadow-sm">
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-black mb-6 flex items-center gap-2">
                    <Download className="w-4 h-4" />
                    Attachments
                  </h3>
                  <RenderFiles 
                    files={report.files} 
                    table="projectProgressReport" 
                    parentId={report.id} 
                    hideHeader={true}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {showAddResponse && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-2xl">
            <AddProjectProgressReportResponse
              reportId={reportId}
              parentResponseId={selectedParentId}
              onCancel={() => setShowAddResponse(false)}
              onSuccess={() => {
                setShowAddResponse(false);
                const fetchDetails = async () => {
                  const response = await Service.getProjectProgressReportById(reportId);
                  const reportData = response?.data || response;
                  setReport(reportData);
                  setResponses(reportData?.responses || []);
                };
                fetchDetails();
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectProgressReportDetails;
