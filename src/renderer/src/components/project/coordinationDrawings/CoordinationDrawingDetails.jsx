import React, { useState, useEffect } from 'react';
import { X, ArrowLeft, MessageSquare, Download, Clock, User, Paperclip, Share2 } from 'lucide-react';
import Service from '../../../api/Service';
import { format } from 'date-fns';
import AddCoordinationDrawingResponse from './AddCoordinationDrawingResponse';
import { getBaseURL } from '../../../api/backendConfig';
import { toast } from 'react-toastify';
import RenderFiles from '../../ui/RenderFiles';

const ResponseItem = ({ response, isChild = false }) => {
  const [showChildren, setShowChildren] = useState(false);
  const user = response.user || response.createdBy;
  const hasChildren = response.childResponses && response.childResponses.length > 0;

  return (
    <div className={`space-y-4 ${isChild ? 'ml-12 mt-4 pt-4 border-l-2 border-black/5 pl-6' : ''}`}>
      <div className="bg-white rounded-lg border border-black p-8 shadow-sm">
        <div className="flex justify-between items-start mb-6">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center text-black border border-black shadow-sm">
              <User className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="text-xs font-black text-black uppercase tracking-tight">
                  {user?.firstName} {user?.lastName}
                </p>
                <span className="text-[9px] text-black font-black uppercase bg-slate-100 px-2 py-0.5 rounded border border-black/10">
                  @{user?.username}
                </span>
              </div>
              <p className="text-[9px] text-black font-black uppercase tracking-widest mt-1">
                {format(new Date(response.createdAt), 'dd MMM yyyy, hh:mm a')}
              </p>
            </div>
          </div>
          {hasChildren && (
            <button
              onClick={() => setShowChildren(!showChildren)}
              className="text-[10px] font-black uppercase tracking-widest text-black hover:underline flex items-center gap-2"
            >
              {showChildren ? 'Hide Replies' : `Show Replies (${response.childResponses.length})`}
            </button>
          )}
        </div>
        <div 
          className="prose prose-xs max-w-none text-black font-semibold leading-relaxed"
          dangerouslySetInnerHTML={{ __html: response.description }}
        />
        {response.files && response.files.length > 0 && (
          <div className="mt-8 pt-8 border-t border-black/5">
            <RenderFiles 
              files={response.files} 
              table="coordinationDrawingResponse" 
              parentId={response.id} 
              hideHeader={true}
            />
          </div>
        )}
      </div>

      {hasChildren && showChildren && (
        <div className="space-y-4">
          {response.childResponses.map((child) => (
            <ResponseItem key={child.id} response={child} isChild={true} />
          ))}
        </div>
      )}
    </div>
  );
};

const CoordinationDrawingDetails = ({ drawingId, onBack }) => {
  const [drawing, setDrawing] = useState(null);
  const [responses, setResponses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddResponse, setShowAddResponse] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [drawingRes, responsesRes] = await Promise.all([
        Service.getCoordinationDrawingById(drawingId),
        Service.getResponsesByDrawingId(drawingId)
      ]);
      
      setDrawing(Array.isArray(drawingRes) ? drawingRes[0] : (drawingRes?.data || drawingRes));
      setResponses(Array.isArray(responsesRes) ? responsesRes : (responsesRes?.data || []));
    } catch (error) {
      console.error('Error fetching drawing details:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (e, parentId, fileId, originalName, type = 'drawing') => {
    e.preventDefault();
    e.stopPropagation();
    
    const baseURL = getBaseURL();
    const endpoint = type === 'drawing' 
      ? `coordinationDrawing/viewfile/${parentId}/${fileId}`
      : `coordinationDrawing/response/viewfile/${parentId}/${fileId}`;
    
    const downloadUrl = `${baseURL}/v1/${endpoint}`;

    try {
      const token = sessionStorage.getItem("token");
      const response = await fetch(downloadUrl, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error("Download failed");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = originalName || "download";
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Error downloading file:", error);
      toast.error("Error downloading file");
    }
  };

  const handleShare = async (e, parentId, fileId, type = 'coordinationDrawing') => {
    e.preventDefault();
    e.stopPropagation();
    try {
      const response = await Service.createShareLink(
        type,
        parentId,
        fileId
      );
      if (response.shareUrl) {
        await navigator.clipboard.writeText(response.shareUrl);
        toast.success("Link copied to clipboard!");
      } else {
        toast.error("Failed to generate link");
      }
    } catch (error) {
      console.error("Error sharing file:", error);
      toast.error("Error generating share link");
    }
  };

  useEffect(() => {
    if (drawingId) {
      fetchData();
    }
  }, [drawingId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#6bbd45]"></div>
      </div>
    );
  }

  if (!drawing) {
    return (
      <div className="p-8 text-center text-red-500 font-bold">
        Drawing not found.
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white w-full max-w-6xl rounded-lg overflow-hidden shadow-2xl flex flex-col h-[90vh] border border-black">
        {/* Header */}
        <div className="px-10 py-6 border-b border-gray-100 flex items-center justify-between bg-white shrink-0">
          <div className="flex flex-col">
            <h2 className="text-xl font-black uppercase tracking-tight text-black">{drawing.title}</h2>
            <div className="flex items-center gap-3 mt-1">
              <span className="px-3 py-1 rounded-lg bg-green-50 text-black border border-black font-black uppercase text-[10px] tracking-widest">
                {drawing.stage}
              </span>
              <span className="text-[10px] text-black font-black uppercase tracking-widest flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                {format(new Date(drawing.createdAt), 'dd MMM yyyy, hh:mm a')}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowAddResponse(true)}
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
                  <MessageSquare className="w-4 h-4" />
                  Message / Details
                </h3>
                <div 
                  className="prose prose-sm max-w-none text-black font-bold leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: drawing.description }}
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
                    {responses.map((response) => (
                      <ResponseItem key={response.id} response={response} />
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
                  Creator Details
                </h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black text-black uppercase tracking-widest opacity-60">Created By:</span>
                    <span className="text-xs font-black text-black uppercase">
                      {drawing.createdBy?.firstName} {drawing.createdBy?.lastName}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black text-black uppercase tracking-widest opacity-60">Username:</span>
                    <span className="text-xs font-black text-black uppercase">{drawing.createdBy?.username}</span>
                  </div>
                </div>
              </div>

              {drawing.files && drawing.files.length > 0 && (
                <div className="bg-white rounded-lg border border-black p-8 shadow-sm">
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-black mb-6 flex items-center gap-2">
                    <Download className="w-4 h-4" />
                    Attachments
                  </h3>
                  <RenderFiles 
                    files={drawing.files} 
                    table="coordinationDrawing" 
                    parentId={drawing.id} 
                    hideHeader={true}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {showAddResponse && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-2xl">
            <AddCoordinationDrawingResponse
              drawingId={drawingId}
              onCancel={() => setShowAddResponse(false)}
              onSuccess={() => {
                setShowAddResponse(false);
                fetchData();
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default CoordinationDrawingDetails;
