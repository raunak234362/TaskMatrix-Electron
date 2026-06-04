import React, { useState } from 'react';
import { X, Send, Loader2 } from 'lucide-react';
import Service from '../../api/Service';
import { toast } from 'react-toastify';
import RichTextEditor from '../fields/RichTextEditor';
import MultipleFileUpload from '../fields/MultipleFileUpload';

const AddProjectProgressReport = ({ projectId, onCancel, onSuccess }) => {
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    stage: 'IFA',
  });
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);

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
      files.forEach((file) => {
        data.append('files', file);
      });

      await Service.createProjectProgressReport(data);
      toast.success('Progress Report created successfully');
      onSuccess();
    } catch (error) {
      console.error('Error creating progress report:', error);
      toast.error('Failed to create progress report');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl h-[90vh] border border-black shadow-sm overflow-hidden animate-in fade-in zoom-in duration-300">
      <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-slate-50">
        <h3 className="text-sm font-black uppercase tracking-widest text-slate-700">Add Weekly Progress Report</h3>
        <button onClick={onCancel} className="text-slate-900 font-semibold bg-green-200 px-2 py-1 rounded-lg border border-green-500 shadow-sm hover:bg-green-500 hover:text-white transition-colors">
          CLOSE
        </button>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-6 h-[80vh] overflow-y-auto">
        <div className="space-y-4">
          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Title *</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-4 py-2 border-2 border-slate-100 rounded-xl focus:border-[#6bbd45] outline-none transition-all text-sm font-bold"
              placeholder="Enter report title"
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
            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Message *</label>
            <RichTextEditor
              value={formData.message}
              onChange={(content) => setFormData({ ...formData, message: content })}
              placeholder="Enter progress details..."
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
            Submit Report
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddProjectProgressReport;
