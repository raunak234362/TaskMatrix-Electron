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

const AddCoordinationDrawing = ({ projectId, project, onCancel, onSuccess }) => {
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    stage: 'IFA',
  });
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
      if (!projectId) return;
      try {
        const projectRes = await Service.GetProjectById(projectId);
        setResolvedProject(projectRes?.data || projectRes);
      } catch (err) {
        console.error('Error loading project in AddCoordinationDrawing:', err);
      }
    };
    loadProject();
  }, [projectId, project]);

  const isCheckerOrModeler = isCurrentCheckerOrModeler(staffData, currentUserDetail);
  const pmName = isCheckerOrModeler ? getProjectManagerName(resolvedProject, staffData) : null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.message) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      setLoading(true);
      const data = new FormData();
      data.append('projectId', projectId);
      data.append('title', formData.title);
      data.append('message', formData.message);
      data.append('stage', formData.stage);

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
      } else if (projectId) {
        const projectRes = await Service.GetProjectById(projectId);
        const p = projectRes?.data || projectRes;
        fabricatorName = p?.fabricator?.fabName || p?.fabricatorName || "";
        projectName = p?.projectName || p?.name || "";
      }

      await Service.createCoordinationDrawing(data, fabricatorName, projectName);
      toast.success('Coordination Drawing created successfully');
      onSuccess();
    } catch (error) {
      console.error('Error creating coordination drawing:', error);
      toast.error('Failed to create coordination drawing');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-black shadow-sm overflow-hidden animate-in fade-in zoom-in duration-300">
      <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-slate-50">
        <h3 className="text-sm font-black uppercase tracking-widest text-slate-700">Add Coordination Drawing</h3>
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
            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Title *</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-4 py-2 border-2 border-slate-100 rounded-xl focus:border-[#6bbd45] outline-none transition-all text-sm font-bold"
              placeholder="Enter drawing title"
              required
            />
          </div>

          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Stage</label>
            <select
              value={formData.stage}
              onChange={(e) => setFormData({ ...formData, stage: e.target.value })}
              className="w-full px-4 py-2 border-2 border-slate-100 rounded-xl focus:border-[#6bbd45] outline-none transition-all text-sm font-bold uppercase tracking-widest"
            >
              <option value="IFA">IFA</option>
              <option value="IFC">IFC</option>
              <option value="RE-IFA">RE-IFA</option>
              <option value="RIFC">RIFC</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Description *</label>
            <RichTextEditor
              value={formData.message}
              onChange={(content) => setFormData({ ...formData, message: content })}
              placeholder="Enter details..."
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
            Submit Drawing
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddCoordinationDrawing;
