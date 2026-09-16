/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  ChevronRight,
  FileText,
  Plus,
  Share2,
  Download,
  FileSpreadsheet,
  File,
  Layers,
  CheckCircle2,
  MessageSquare
} from "lucide-react";
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
  rfqId,
}) => {
  const projectFiles = Array.isArray(files)
    ? files.map((doc) => {
      const fileData = doc.file ? { ...doc.file, ...doc } : { ...doc };
      if (fileData.file) delete fileData.file;
      return fileData;
    })
    : [];

  // Group files by description
  const groupedFiles = projectFiles.reduce(
    (acc, curr) => {
      if (curr.files && Array.isArray(curr.files)) {
        // Handle "Document" structure (nested files)
        const desc = curr.description || "No Description";
        if (!acc[desc]) acc[desc] = [];
        curr.files.forEach((f) => {
          acc[desc].push({
            ...f,
            uploadedAt: f.uploadedAt || curr.uploadedAt || f.createdAt,
            user: f.user || curr.user,
            documentID: f.documentID || (table === "submittals" ? curr.id : ((table === "bfa") && parentId ? parentId : curr.id)),
            versionId: f.versionId || (table === "submittals" ? (curr.currentVersionId || f.submittalVersionId || f.versionId || curr.id) : ((table === "bfa") ? curr.id : f.versionId)),
            stage: f.stage || curr.stage,
            table: f.table || table,
            fileCategory: f.fileCategory || (table === "submittals" ? "submittal" : "general"),
            fileType: f.fileType || (table === "submittals" ? "Submittal File" : "Attachment"),
            originType: f.originType || (table === "submittals" ? "SUBMITTAL" : "ATTACHMENT"),
            responseReason: f.responseReason || "",
            responseStatus: f.responseStatus || "",
          });
        });
      } else {
        // Handle "Flat File" structure (e.g., RFI, Submittals)
        const desc = "Attachments";
        if (!acc[desc]) acc[desc] = [];
        acc[desc].push({
          ...curr,
          documentID: curr.documentID || parentId,
          table: curr.table || table,
          fileCategory: curr.fileCategory || (table === "submittals" ? "submittal" : "general"),
          fileType: curr.fileType || (table === "submittals" ? "Submittal File" : "Attachment"),
          originType: curr.originType || (table === "submittals" ? "SUBMITTAL" : "ATTACHMENT"),
          responseReason: curr.responseReason || "",
          responseStatus: curr.responseStatus || "",
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
    const actualTable = file?.table || table;
    const actualParentId = file?.documentID || parentId;
    switch (actualTable) {
      case "bfa":
        return file?.versionId
          ? `${baseURL}/bfa/viewFile/${actualParentId}/${file.versionId}/${fileId}`
          : `${baseURL}/bfa/viewFile/${actualParentId}/${fileId}`;
      case "project":
        return `${baseURL}/project/viewFile/${actualParentId}/${fileId}`;
      case "notes":
        return `${baseURL}/project/notes/viewFile/${actualParentId}/${fileId}`;
      case "estimation":
        return `${baseURL}/estimation/viewFile/${actualParentId}/${fileId}`;
      case "rFI":
      case "RFI":
        return `${baseURL}/rfi/viewfile/${actualParentId}/${fileId}`;
      case "rFIResponse":
        return `${baseURL}/rfi/response/viewfile/${actualParentId}/${fileId}`;
      case "submittals":
        return `${baseURL}/submittal/${actualParentId}/versions/${file?.versionId || fileId}/${fileId}`;
      case "submittalsResponse":
        return `${baseURL}/submittal/response/${actualParentId}/viewfile/${fileId}`;
      case "rFQ":
      case "rfqCDAttachments":
      case "CDAttachments":
        return `${baseURL}/rfq/viewFile/${actualParentId}/${fileId}`;
      case "estimationResponse":
        return `${baseURL}/estimation/response/viewFile/${actualParentId}/${fileId}`;
      case "changeOrders":
        return `${baseURL}/changeOrder/viewFile/${actualParentId}/${fileId}`;
      case "cOResponse":
        return `${baseURL}/changeOrder/viewFile/${actualParentId}/files/${fileId}`;
      case "teamMeetingNotes":
        return `${baseURL}/team-meeting-notes/viewFile/${actualParentId}/${fileId}`;
      case "teamMeetingResponse":
      case "teamMeetingNotesResponse":
        return `${baseURL}/team-meeting-notes/responses/viewFile/${actualParentId}/${fileId}`;
      case "connectionDesignerQuota":
        return `${baseURL}/connectionDesignerQuota/viewFile/${actualParentId}/${fileId}`;
      case "designDrawings":
        return `${baseURL}/${actualTable}/viewfile/${actualParentId}/${fileId}`;
      case "followups":
        return `${baseURL}/rfq/followups/viewFile/${actualParentId}/${fileId}`;
      default:
        return `${baseURL}/${actualTable}/viewFile/${actualParentId}/${fileId}`;
    }
  };

  const handleShare = async (e, file) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      let shareTable = file.table || table;
      if (shareTable === "rfqCDAttachments" || shareTable === "CDAttachments") shareTable = "rFQ";
      let shareParentId = file.documentID || parentId;
      let shareVersionId = file.versionId;

      if (shareTable === "submittals") {
        shareTable = "submittalVersion";
        shareParentId = file.versionId || file.documentID || parentId;
        shareVersionId = undefined;
      } else if (shareTable === "submittalsResponse") {
        shareTable = "submittalResponse";
        shareParentId = file.documentID || parentId;
        shareVersionId = undefined;
      } else if (shareTable === "bfa") {
        shareTable = "bfaVersion";
        shareParentId = file.versionId || file.documentID || parentId;
        shareVersionId = undefined;
      } else if (shareTable === "followups" || shareTable === "followup") {
        shareTable = "rFQFollowUp";
        shareParentId = file.documentID || parentId;
      }

      const response = await Service.createShareLink(
        shareTable,
        shareParentId,
        file.id,
        shareVersionId
      );
      console.log("Share link response:", response);
      const shareUrl = response?.shareUrl || response?.data?.shareUrl || (typeof response === "string" ? response : null);
      if (shareUrl) {
        await navigator.clipboard.writeText(shareUrl);
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
    const downloadUrl = getDownloadUrl(file.table || table, file.documentID || parentId, file.id, file);

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

  const categorizeFileList = (fileList) => {
    const groups = {
      submittal: { key: "submittal", label: "Submittal Files", icon: Layers, files: [], color: "blue" },
      bfa: { key: "bfa", label: "BFA Files", icon: CheckCircle2, files: [], color: "emerald" },
      response: { key: "response", label: "Response Files", icon: MessageSquare, files: [], color: "purple" },
      general: { key: "general", label: "Attachments", icon: FileText, files: [], color: "gray" },
    };

    fileList.forEach((file) => {
      const origin = (file.originType || "").toUpperCase();
      const cat = (file.fileCategory || "").toLowerCase();
      const tbl = (file.table || "").toLowerCase();
      const pth = (file.path || "").toLowerCase();

      if (cat === "bfa" || origin === "BFA" || tbl === "bfa") {
        groups.bfa.files.push(file);
      } else if (
        cat === "response" ||
        origin === "RESPONSE" ||
        tbl.includes("response") ||
        pth.includes("response")
      ) {
        groups.response.files.push(file);
      } else if (
        cat === "submittal" ||
        origin === "SUBMITTAL" ||
        table === "submittals"
      ) {
        groups.submittal.files.push(file);
      } else {
        groups.general.files.push(file);
      }
    });

    return Object.values(groups).filter((g) => g.files.length > 0);
  };

  const renderFileRow = (file, index) => {
    const { icon: Icon, color, bgColor, text, textColor } = getFileIcon(file.originalName);
    const origin = (file.originType || "").toUpperCase();
    const cat = (file.fileCategory || "").toLowerCase();
    const tbl = (file.table || "").toLowerCase();
    const pth = (file.path || "").toLowerCase();

    const isBfa = cat === "bfa" || origin === "BFA" || tbl === "bfa";

    const isResp =
      !isBfa &&
      (cat === "response" ||
        origin === "RESPONSE" ||
        tbl.includes("response") ||
        pth.includes("response"));

    const isSub =
      !isBfa &&
      !isResp &&
      (cat === "submittal" || origin === "SUBMITTAL" || table === "submittals");

    return (
      <div
        key={file.id || `file-${index}`}
        className="flex items-center gap-2 py-2.5 px-3 rounded-none hover:bg-green-50/50 hover:text-black transition-colors group cursor-pointer"
        title={file.originalName || `File ${index + 1}`}
      >
        <a
          href="#"
          onClick={(e) => handleDownload(e, file)}
          className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer"
        >
          <div className={`p-2 rounded-none border border-black/10 ${bgColor} relative flex items-center justify-center shrink-0`}>
            <Icon size={18} className={color} strokeWidth={2} />
            {text && (
              <span className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-[7px] font-bold mt-0.5 ${textColor}`}>
                {text}
              </span>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-black text-sm font-semibold truncate group-hover:text-black" title={file.originalName}>
                {file.originalName || `File ${index + 1}`}
              </p>

              {/* Badges for Origin */}
              {isBfa && (
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-none border border-emerald-400 bg-emerald-50 text-emerald-800 shrink-0">
                  BFA File
                </span>
              )}
              {isResp && (
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-none border border-purple-400 bg-purple-50 text-purple-800 shrink-0">
                  Response File
                </span>
              )}
              {isSub && (
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-none border border-blue-300 bg-blue-50 text-blue-800 shrink-0">
                  {file.versionNumber !== undefined ? `Submittal v${file.versionNumber}` : "Submittal"}
                </span>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2 sm:gap-3 mt-1 text-xs">
              {file.stage && (
                <span className="text-[11px] text-gray-700 font-bold uppercase tracking-wider">
                  Stage: {file.stage}
                </span>
              )}
              {file.responseReason && (
                <span className="text-[11px] text-gray-600 font-medium">
                  Reason: <span className="font-bold text-gray-900">{file.responseReason}</span>
                </span>
              )}
              {file.uploadedAt && (
                <span className="text-[11px] text-gray-500 font-medium">
                  {formatDate ? formatDate(file.uploadedAt) : new Date(file.uploadedAt).toLocaleString()}
                </span>
              )}
              {file.user && (file.user.f_name || file.user.firstName) && (
                <span className="text-[11px] text-gray-500 font-medium">
                  by {file.user.f_name || file.user.firstName} {file.user.l_name || file.user.lastName || ""}
                </span>
              )}
            </div>
          </div>
        </a>

        <div className="flex items-center gap-2 transition-opacity shrink-0">
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
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
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

          const categorizedGroups = categorizeFileList(files);
          const hasMultipleGroups = categorizedGroups.length > 1;
          const isSubmittalOrBfa = table === "submittals" || table === "bfa";

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
                        {formatDate ? formatDate(firstFile.uploadedAt) : new Date(firstFile.uploadedAt).toLocaleString()}
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

              {/* Grouped file categories if submittals or mixed origins, otherwise flat */}
              {hasMultipleGroups || (isSubmittalOrBfa && categorizedGroups.length > 0) ? (
                <div className="space-y-4 pt-1">
                  {categorizedGroups.map((grp) => {
                    const GroupIcon = grp.icon;
                    const iconColor =
                      grp.color === "emerald"
                        ? "text-emerald-600"
                        : grp.color === "purple"
                        ? "text-purple-600"
                        : grp.color === "blue"
                        ? "text-blue-600"
                        : "text-gray-600";

                    return (
                      <div key={grp.key} className="border border-black/10 rounded-none overflow-hidden bg-white">
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 border-b border-black/10">
                          <GroupIcon size={14} className={iconColor} />
                          <span className="text-xs font-bold uppercase tracking-wider text-black">
                            {grp.label}
                          </span>
                          <span className="text-[10px] font-bold bg-white px-1.5 py-0.5 border border-black/20 rounded-none text-gray-700 ml-auto">
                            {grp.files.length} {grp.files.length === 1 ? "File" : "Files"}
                          </span>
                        </div>
                        <div className="divide-y divide-black/5">
                          {grp.files.map((file, idx) => renderFileRow(file, idx))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="divide-y divide-black/5 border-t border-black/10 mt-3 bg-white">
                  {files.map((file, index) => renderFileRow(file, index))}
                </div>
              )}
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
