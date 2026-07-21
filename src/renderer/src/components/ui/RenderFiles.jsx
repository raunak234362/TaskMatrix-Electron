/* eslint-disable @typescript-eslint/no-explicit-any */
import { ChevronRight, FileText, Plus, Share2, Download, FileSpreadsheet, File } from "lucide-react";
import Button from "../fields/Button";
import Service from "../../api/Service";
import { toast } from "react-toastify";
import React from "react";

const RenderFiles = ({
  files,
  onAddFilesClick,
  formatDate,
  table,
  parentId,
}) => {
  // Step 1 and flatten files
  console.log(files);

  const projectFiles = Array.isArray(files)
    ? files.map((doc) => {
      const fileData = doc.file ? { ...doc.file, ...doc } : { ...doc };
      if (fileData.file) delete fileData.file;
      return fileData;
    })
    : [];

  // Step 2 files by description
  const groupedFiles = projectFiles.reduce(
    (acc, curr) => {
      if (curr.files && Array.isArray(curr.files)) {
        // Handle "Document" structure (nested files)
        const desc = curr.description || "No Description";
        if (!acc[desc]) acc[desc] = [];
        curr.files.forEach((f) => {
          acc[desc].push({
            ...f,
            uploadedAt: curr.uploadedAt,
            user: curr.user,
            documentID: table === "submittals" ? curr.id : ((table === "bfa") && parentId ? parentId : curr.id),
            versionId: table === "submittals" ? (curr.currentVersionId || f.submittalVersionId || f.versionId || curr.id) : ((table === "bfa") ? curr.id : f.versionId),
            stage: curr.stage,
          });
        });
      } else {
        // Handle "Flat File" structure (e.g., RFI, Submittals)
        const desc = "Attachments";
        if (!acc[desc]) acc[desc] = [];
        acc[desc].push({
          ...curr,
          documentID: parentId, // Use passed parentId for flat files
        });
      }
      return acc;
    },
    {}
  );

  const getDownloadUrl = (
    table,
    parentId,
    fileId,
    file
  ) => {
    const baseURL = import.meta.env.VITE_BASE_URL?.replace(/\/$/, "");
    switch (table) {
      case "bfa":
        return `${baseURL}/bfa/viewFile/${parentId}/${fileId}`;
      case "project":
        return `${baseURL}/project/viewFile/${parentId}/${fileId}`;
      case "notes":
        return `${baseURL}/project/notes/viewFile/${parentId}/${fileId}`;
      case "estimation":
        return `${baseURL}/estimation/viewFile/${parentId}/${fileId}`;
      case "rFI":
      case "RFI":
        return `${baseURL}/rfi/viewfile/${parentId}/${fileId}`;
      case "rFIResponse":
        return `${baseURL}/rfi/response/viewfile/${parentId}/${fileId}`;
      case "submittals":
        return `${baseURL}/submittal/${parentId}/versions/${file?.versionId || fileId}/${fileId}`;
      case "submittalsResponse":
        return `${baseURL}/submittal/response/${parentId}/viewfile/${fileId}`;
      case "rFQ":
      case "rfqCDAttachments":
      case "CDAttachments":
        return `${baseURL}/rfq/viewFile/${parentId}/${fileId}`;
      case "estimationResponse":
        return `${baseURL}/estimation/response/viewFile/${parentId}/${fileId}`;
      case "changeOrders":
        return `${baseURL}/changeOrder/viewFile/${parentId}/${fileId}`;
      case "cOResponse":
        return `${baseURL}/changeOrder/viewFile/${parentId}/files/${fileId}`;
      case "teamMeetingNotes":
        return `${baseURL}/teamMeetingNotes/viewFile/${parentId}/${fileId}`;
      case "teamMeetingResponse":
        return `${baseURL}/teamMeetingNotes/responses/viewFile/${parentId}/${fileId}`;
      case "connectionDesignerQuota":
        return `${baseURL}/connectionDesignerQuota/viewFile/${parentId}/${fileId}`;
      case "designDrawings":
        return `${baseURL}/${table}/viewfile/${parentId}/${fileId}`;
      default:
        return `${baseURL}/${table}/viewFile/${parentId}/${fileId}`;
    }
  };

  const handleShare = async (e, file) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      const shareTable = (table === "rfqCDAttachments" || table === "CDAttachments") ? "rFQ" : table;
      const response = await Service.createShareLink(
        shareTable,
        file.documentID,
        file.id
      );
      console.log(response);
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

  const handleDownload = async (
    e,
    file
  ) => {
    e.preventDefault();
    e.stopPropagation();
    const downloadUrl = getDownloadUrl(table, file.documentID, file.id, file);

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
      a.download = file.originalName || "download";
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }, 1000);
    } catch (error) {
      console.error("Error downloading file:", error);
      toast.error("Error downloading file");
    }
  };

  const getFileIcon = (filename) => {
    const ext = filename?.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'pdf':
        return { icon: File, color: 'text-red-500', bgColor: 'bg-red-50', text: 'pdf', textColor: 'text-red-500' };
      case 'xlsx':
      case 'xls':
      case 'csv':
        return { icon: File, color: 'text-green-600', bgColor: 'bg-green-50', text: '.exe', textColor: 'text-green-600' };
      default:
        return { icon: FileText, color: 'text-blue-500', bgColor: 'bg-blue-50', text: null, textColor: null };
    }
  };

  // Step 3 grouped sections
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        {/* <h4 className="text-sm font-medium text-black">Project Files</h4> */}
        {onAddFilesClick && (
          <Button onClick={onAddFilesClick}>Add Document</Button>
        )}
      </div>

      {/* Files grouped by description */}
      {Object.keys(groupedFiles).length > 0 ? (
        Object.entries(groupedFiles).map(([description, files]) => {
          const firstFile = files[0];
          const uploaderName = firstFile?.user
            ? `${firstFile.user.f_name || ""} ${firstFile.user.l_name || ""}`
            : "Unknown User";

          return (
            <div
              key={description}
              className="border border-[#6bbd45]/40 bg-white rounded-none p-4 space-y-3 shadow-none"
            >
              {/* Description + Stage */}
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-1.5">
                <div>
                  <h5
                    className="text-sm sm:text-base font-bold text-black uppercase tracking-wider"
                    dangerouslySetInnerHTML={{ __html: description }}
                  />
                  <div className="flex flex-wrap items-center gap-2 sm:gap-3 mt-1.5">
                    {firstFile?.stage && (
                      <p className="text-xs text-blue-800 bg-blue-50 px-2 py-0.5 rounded-none border border-blue-200 font-semibold uppercase tracking-wider">
                        {firstFile.stage}
                      </p>
                    )}
                    {firstFile?.uploadedAt && (
                      <p className="text-sm text-black font-medium">
                        {formatDate(firstFile.uploadedAt)}
                      </p>
                    )}
                    {(firstFile?.user?.f_name || firstFile?.user?.l_name) && (
                      <p className="text-sm text-black font-medium">
                        by <span className="font-bold text-black">{uploaderName}</span>
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* File List */}
              <div className="divide-y divide-black/5 border-t border-black/10 mt-3 bg-white">
                {files.map((file, index) => {
                  const { icon: Icon, color, bgColor, text, textColor } = getFileIcon(file.originalName);
                  return (
                    <div
                      key={file.id || `file-${index}`}
                      className="flex items-center gap-2 py-2 px-3 rounded-none hover:bg-green-50/50 hover:text-black transition-colors group cursor-pointer"
                      title={file.originalName || `File ${index + 1}`}
                    >
                      <a
                        href="#"
                        onClick={(e) => handleDownload(e, file)}
                        className="flex items-center gap-2 flex-1 min-w-0 cursor-pointer"
                      >
                        <div className={`p-1.5 rounded-none border border-black/10 ${bgColor} relative flex items-center justify-center`}>
                          <Icon size={18} className={color} strokeWidth={2} />
                          {text && (
                            <span className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-[7px] font-bold mt-[2px] ${textColor}`}>
                              {text}
                            </span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-black text-sm font-semibold truncate group-hover:text-black" title={file.originalName}>
                            {file.originalName || `File ${index + 1}`}
                          </p>
                          {file.stage && (
                            <p className="text-sm text-black uppercase font-bold tracking-wider mt-0.5">
                              Stage: {file.stage}
                            </p>
                          )}
                        </div>
                      </a>

                      <div className="flex items-center gap-2 transition-opacity">
                        <button
                          onClick={(e) => handleShare(e, file)}
                          className="p-1.5 text-black hover:text-green-700 hover:bg-green-50 rounded-none border border-transparent hover:border-black/20 transition-colors cursor-pointer"
                          title="Share Link"
                        >
                          <Share2 size={16} />
                        </button>
                        <button
                          onClick={(e) => handleDownload(e, file)}
                          className="p-1.5 text-black hover:text-green-700 hover:bg-green-50 rounded-none border border-transparent hover:border-black/20 transition-colors cursor-pointer"
                          title="Download"
                        >
                          <Download size={16} />
                        </button>
                      </div>

                      <ChevronRight
                        size={16}
                        className="text-black shrink-0 group-hover:text-black"
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })
      ) : (
        // Empty State
        <div className="text-center py-8 border border-dashed border-black/30 rounded-none">
          <p className="text-sm font-bold uppercase tracking-widest text-black">No files available for this project</p>
          {onAddFilesClick && (
            <button
              onClick={onAddFilesClick}
              className="mt-4 inline-flex items-center gap-2 px-6 py-1.5 bg-green-50 text-black border-2 border-green-700/80 rounded-none hover:bg-green-100 transition-all font-bold text-sm uppercase tracking-tight shadow-sm cursor-pointer"
            >
              <Plus size={14} />
              Upload Files
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default RenderFiles;
