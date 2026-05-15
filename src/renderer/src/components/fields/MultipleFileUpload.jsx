import React, { useState, useRef, useEffect } from "react";
import { Upload, X, FileText, Paperclip } from "lucide-react";

/**
 * A reusable component for uploading multiple files.
 * It displays a list of selected files and allows removing individual files.
 */
function MultipleFileUpload({
  onFilesChange,
  initialFiles = [],
}) {
  const [files, setFiles] = useState(initialFiles);
  const [isDraggingGlobal, setIsDraggingGlobal] = useState(false);
  const dragCounter = useRef(0);
  const fileInputRef = useRef(null);

  useEffect(() => {
    // Only update if initialFiles is explicitly different from current state
    // and skip if it's the same array reference to avoid unnecessary resets
    if (initialFiles && initialFiles !== files && initialFiles.length !== files.length) {
      setFiles(initialFiles);
    } else if (initialFiles && initialFiles.length === 0 && files.length > 0) {
      // Check if this was a manual reset (e.g. form submission)
      // If the parent passes an empty array, we should clear
      setFiles([]);
    }
  }, [initialFiles]);

  // Handle global drag events
  useEffect(() => {
    const handleDragEnter = (e) => {
      e.preventDefault();
      dragCounter.current++;
      if (dragCounter.current === 1) {
        setIsDraggingGlobal(true);
      }
    };

    const handleDragLeave = (e) => {
      e.preventDefault();
      dragCounter.current--;
      if (dragCounter.current === 0) {
        setIsDraggingGlobal(false);
      }
    };

    const handleDropGlobal = (e) => {
      // We don't preventDefault here anymore to let the overlay handle it
      // or to let the browser handle it if no overlay is present.
      dragCounter.current = 0;
      setIsDraggingGlobal(false);
    };

    window.addEventListener("dragenter", handleDragEnter);
    window.addEventListener("dragleave", handleDragLeave);
    // Removed window drop listener as it conflicts with overlay drop

    return () => {
      window.removeEventListener("dragenter", handleDragEnter);
      window.removeEventListener("dragleave", handleDragLeave);
    };
  }, []);

  const handleFileChange = (event) => {
    if (!event.target.files) return;

    const selectedFiles = Array.from(event.target.files);
    const updatedFiles = [...files, ...selectedFiles];

    setFiles(updatedFiles);
    onFilesChange(updatedFiles);
    event.target.value = "";
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDraggingGlobal(false);
    dragCounter.current = 0;

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFiles = Array.from(e.dataTransfer.files);
      const updatedFiles = [...files, ...droppedFiles];
      setFiles(updatedFiles);
      onFilesChange(updatedFiles);
    }
  };

  const removeFile = (indexToRemove) => {
    const updatedFiles = files.filter((_, index) => index !== indexToRemove);
    setFiles(updatedFiles);
    onFilesChange(updatedFiles);
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  };

  return (
    <div className="w-full space-y-3 relative">
      {/* Global Drop Overlay */}
      {isDraggingGlobal && (
        <div 
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          className="fixed inset-0 z-[9999] bg-[#6bbd45]/5 backdrop-blur-md flex items-center justify-center p-8 animate-in fade-in duration-300"
        >
          <div className="w-full h-full border-4 border-dashed border-[#6bbd45] rounded-[3rem] bg-white/90 flex flex-col items-center justify-center shadow-2xl animate-in zoom-in duration-500">
            <div className="w-24 h-24 rounded-full bg-[#6bbd45]/10 flex items-center justify-center mb-6 animate-bounce">
              <Upload className="w-12 h-12 text-[#6bbd45]" />
            </div>
            <h2 className="text-4xl font-black text-black uppercase tracking-tight mb-2">Drop files here</h2>
            <p className="text-gray-400 font-bold uppercase tracking-widest text-sm">Release to add to your attachments</p>
          </div>
        </div>
      )}

      <div 
        onClick={() => fileInputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          if (!isDraggingGlobal) setIsDraggingGlobal(true);
        }}
        onDrop={handleDrop}
        className="group cursor-pointer border-2 border-dashed border-gray-200 rounded-2xl p-6 bg-gray-50/50 hover:bg-[#ebf5ea]/30 hover:border-[#6bbd45]/50 transition-all duration-200 flex flex-col items-center justify-center gap-3"
      >
        <div className="w-12 h-12 rounded-full bg-white shadow-sm flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
          <Upload className="w-6 h-6 text-[#6bbd45]" />
        </div>
        <div className="text-center">
          <p className="text-sm font-black text-black uppercase tracking-tight">Click or drag files here</p>
          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">PDF, Image, Excel, etc.</p>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={handleFileChange}
          className="hidden"
        />
      </div>

      {files.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between px-1">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Selected Files ({files.length})</p>
          </div>
          <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
            {files.map((file, index) => (
              <div
                key={`${file.name}-${file.lastModified}-${index}`}
                className="flex items-center justify-between p-3 border border-gray-100 rounded-xl bg-white shadow-sm group hover:border-[#6bbd45]/30 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center shrink-0">
                    <FileText className="w-4 h-4 text-[#6bbd45]" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-black truncate" title={file.name}>
                      {file.name}
                    </p>
                    <p className="text-[10px] text-gray-400 font-medium uppercase">
                      {formatFileSize(file.size)}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFile(index);
                  }}
                  className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600 transition-all"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default MultipleFileUpload;
