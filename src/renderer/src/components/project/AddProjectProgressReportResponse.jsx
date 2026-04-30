import React, { useState } from 'react';
import { X, Send, Loader2 } from 'lucide-react';
import Service from '../../../api/Service';
import { toast } from 'react-toastify';
import RichTextEditor from '../../fields/RichTextEditor';
import MultipleFileUpload from '../../fields/MultipleFileUpload';

const AddProjectProgressReportResponse = ({ reportId, parentResponseId, onCancel, onSuccess }) => {
  const [description, setDescription] = useState('');
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!description) {
      toast.error('Please enter a description');
      return;
    }

    try {
      setLoading(true);
      const data = new FormData();
      data.append('reportId', reportId);
      data.append('description', description);
      if (parentResponseId) {
        data.append('parentResponseId', parentResponseId);
      }
      files.forEach((file) => {
        data.append('files', file);
      });

      await Service.createProjectProgressReportResponse(data);
      toast.success('Response added successfully');
      onSuccess();
    } catch (error) {
      console.error('Error creating report response:', error);
      toast.error('Failed to add response');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg border border-black shadow-xl overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-slate-50">
        <h3 className="text-sm font-black uppercase tracking-widest text-slate-700">
          {parentResponseId ? 'Reply to Response' : 'Add Response'}
        </h3>
        <button onClick={onCancel} className="text-slate-400 hover:text-slate-600 transition-colors">
          <X className="w-5 h-5" />
        </button>
      </div>

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

          <MultipleFileUpload onFilesChange={setFiles} />
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-2 border-2 border-slate-200 rounded-lg text-xs font-black uppercase tracking-widest hover:bg-slate-50 transition-all"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-[#6bbd45] text-black rounded-lg text-xs font-black uppercase tracking-widest flex items-center gap-2 hover:bg-green-500 transition-all disabled:opacity-50 border border-black shadow-sm"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            Submit Response
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddProjectProgressReportResponse;
