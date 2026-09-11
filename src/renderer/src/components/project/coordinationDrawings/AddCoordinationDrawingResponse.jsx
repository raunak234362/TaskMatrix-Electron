import React, { useState, useEffect } from 'react';
import { X, Send, Loader2 } from 'lucide-react';
import { useSelector } from 'react-redux';
import Service from '../../../api/Service';
import { toast } from 'react-toastify';
import RichTextEditor from '../../fields/RichTextEditor';
import MultipleFileUpload from '../../fields/MultipleFileUpload';
import {
  isCurrentCheckerOrModeler,
  getProjectManager,
  getProjectManagerName
} from '../../../utils/designationUtils';

const AddCoordinationDrawingResponse = ({ drawingId, project, parentResponseId, onCancel, onSuccess }) => {
  const [description, setDescription] = useState('');
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);

  const staffData = useSelector((state) => state.userInfo?.staffData || []);
  const currentUserDetail = useSelector((state) => state.userInfo?.userDetail);
  const [resolvedProject, setResolvedProject] = useState(project || null);

  useEffect(() => {
    if (project && (project.manager || project.managerID || project.managerId)) {
      setResolvedProject(project);
      return;
    }
    const loadProject = async () => {
      if (!drawingId) return;
      try {
        const drawingRes = await Service.getCoordinationDrawingById(drawingId);
        const drawing = drawingRes?.data || drawingRes;
        const pid = drawing?.projectId || drawing?.project_id;
        if (pid) {
          const projectRes = await Service.GetProjectById(pid);
          setResolvedProject(projectRes?.data || projectRes);
        }
      } catch (err) {
        console.error('Error loading project in AddCoordinationDrawingResponse:', err);
      }
    };
    loadProject();
  }, [drawingId, project]);

  const isCheckerOrModeler = isCurrentCheckerOrModeler(staffData, currentUserDetail);
  const pmName = isCheckerOrModeler ? getProjectManagerName(resolvedProject, staffData) : null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!description) {
      toast.error('Please enter a description');
      return;
    }

    try {
      setLoading(true);
      const data = new FormData();
      data.append('drawingId', drawingId);
      data.append('description', description);
      if (parentResponseId) {
        data.append('parentResponseId', parentResponseId);
      }

      if (isCheckerOrModeler) {
        const pm = getProjectManager(resolvedProject, staffData);
        if (pm?.id || resolvedProject?.managerID) {
          data.append('userId', pm?.id || resolvedProject?.managerID);
          data.append('userRole', 'PROJECT_MANAGER');
        }
      }

      files.forEach((file) => {
        data.append('files', file);
      });

      let fabricatorName = "";
      let projectName = "";
      const currentProj = resolvedProject;
      if (currentProj) {
        fabricatorName = currentProj?.fabricator?.fabName || currentProj?.fabricatorName || "";
        projectName = currentProj?.projectName || currentProj?.name || "";
      } else {
        const drawingRes = await Service.getCoordinationDrawingById(drawingId);
        const drawing = drawingRes?.data || drawingRes;
        const pid = drawing?.projectId || drawing?.project_id;
        if (pid) {
          const projectRes = await Service.GetProjectById(pid);
          const p = projectRes?.data || projectRes;
          fabricatorName = p?.fabricator?.fabName || p?.fabricatorName || "";
          projectName = p?.projectName || p?.name || "";
        }
      }

      await Service.createCoordinationDrawingResponse(data, fabricatorName, projectName);
      toast.success('Response added successfully');
      onSuccess();
    } catch (error) {
      console.error('Error creating drawing response:', error);
      toast.error('Failed to add response');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-black shadow-xl overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-slate-50">
        <h3 className="text-sm font-black uppercase tracking-widest text-slate-700">
          {parentResponseId ? 'Reply to Response' : 'Add Response'}
        </h3>
        <button onClick={onCancel} className="text-slate-400 hover:text-slate-600 transition-colors">
          <X className="w-5 h-5" />
        </button>
      </div>

      {isCheckerOrModeler && pmName && (
        <div className="bg-blue-50 border border-blue-200 text-blue-800 text-xs px-4 py-2 font-medium mx-6 mt-4 rounded-xl">
          Submitting as Project Manager: <span className="font-bold">{pmName}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        <div className="space-y-4">
          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Description *</label>
            <RichTextEditor
              value={description}
              onChange={setDescription}
              placeholder="Type your response here..."
            />
          </div>

          <MultipleFileUpload onFilesChange={setFiles} initialFiles={files} />
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-2 border-2 border-slate-200 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-slate-50 transition-all"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-[#6bbd45] text-black rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-2 hover:bg-green-500 transition-all disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            Submit Response
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddCoordinationDrawingResponse;
