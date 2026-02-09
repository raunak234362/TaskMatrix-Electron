/* eslint-disable @typescript-eslint/no-explicit-any */
import { ChevronRight, FileText, Plus, Share2, Download } from "lucide-react";
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
            documentID: curr.id,
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
    fileId
  ) => {
    const baseURL = import.meta.env.VITE_BASE_URL?.replace(/\/$/, "");
    switch (table) {
      case "project":
        return `${baseURL}/project/viewFile/${parentId}/${fileId}`;
      case "estimation":
        return `${baseURL}/estimation/viewFile/${parentId}/${fileId}`;
      case "rFI":
        return `${baseURL}/api/RFI/rfi/viewfile/${parentId}/${fileId}`;
      case "rFIResponse":
        return `${baseURL}/api/RFI/rfi/response/viewfile/${parentId}/${fileId}`;
      case "submittals":
      case "submittalsResponse":
        return `${baseURL}/api/Submittals/submittals/${parentId}/${fileId}`;
      case "rFQ":
        return `${baseURL}/rfq/viewFile/${parentId}/${fileId}`;
      case "changeOrders":
      case "cOResponse":
        return `${baseURL}/api/co/viewfile/${parentId}/${fileId}`;
      case "designDrawings":
      default:
        return `${baseURL}/api/${table}/designdrawing/viewfile/${parentId}/${fileId}`;
    }
  };

  const handleShare = async (e, file) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      const response = await Service.createShareLink(
        table,
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
    const downloadUrl = getDownloadUrl(table, file.documentID, file.id);

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
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Error downloading file:", error);
      toast.error("Error downloading file");
    }
  };

  // Step 3 grouped sections
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h4 className="text-sm font-medium text-gray-700">Project Files</h4>
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
              className="border border-gray-200 rounded-lg p-4 space-y-3 shadow-sm"
            >
              {/* Description + Stage */}
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-1.5">
                <div>
                  <h5
                    className="text-sm border-l-4 border-green-500 pl-2 sm:text-base  text-gray-800"
                    dangerouslySetInnerHTML={{ __html: description }}
                  />
                  <div className="flex flex-wrap items-center gap-2 sm:gap-3 mt-1.5">
                    {firstFile?.stage && (
                      <p className="text-[10px] sm:text-xs text-blue-600  bg-blue-50 px-2 py-0.5 rounded-full">
                        {firstFile.stage}
                      </p>
                    )}
                    {firstFile?.uploadedAt && (
                      <p className="text-[10px] sm:text-xs text-gray-500">
                        {formatDate(firstFile.uploadedAt)}
                      </p>
                    )}
                    {(firstFile?.user?.f_name || firstFile?.user?.l_name) && (
                      <p className="text-[10px] sm:text-xs text-gray-500">
                        by <span className="font-semibold text-gray-700">{uploaderName}</span>
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* File List */}
              <div className="grid grid-cols-1 gap-2 mt-2">
                {files.map((file, index) => (
                  <div
                    key={file.id || `file-${index}`}
                    className="flex items-center gap-2 p-3 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors group"
                  >
                    <a
                      href="#"
                      onClick={(e) => handleDownload(e, file)}
                      className="flex items-center gap-2 flex-1 min-w-0"
                    >
                      <FileText size={18} className="text-green-500" />
                      <div className="flex-1 min-w-0">
                        <p className="text-gray-700 text-sm font-medium truncate">
                          {file.originalName || `File ${index + 1}`}
                        </p>
                        {file.stage && (
                          <p className="text-xs text-gray-700">
                            Stage: {file.stage}
                          </p>
                        )}
                      </div>
                    </a>

                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => handleShare(e, file)}
                        className="p-1.5 text-gray-700 hover:text-green-600 hover:bg-green-50 rounded-md transition-colors"
                        title="Share Link"
                      >
                        <Share2 size={16} />
                      </button>
                      <button
                        onClick={(e) => handleDownload(e, file)}
                        className="p-1.5 text-gray-700 hover:text-green-600 hover:bg-green-50 rounded-md transition-colors"
                        title="Download"
                      >
                        <Download size={16} />
                      </button>
                    </div>

                    <ChevronRight
                      size={16}
                      className="text-gray-400 shrink-0"
                    />
                  </div>
                ))}
              </div>
            </div>
          );
        })
      ) : (
        // Empty State
        <div className="text-center py-8 border border-dashed border-gray-200 rounded-lg">
          <p className="text-gray-700">No files available for this project</p>
          {onAddFilesClick && (
            <Button onClick={onAddFilesClick} className="mt-2">
              <Plus size={14} />
              Upload Files
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

export default RenderFiles;
