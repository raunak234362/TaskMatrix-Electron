import React, { useState, useEffect, useMemo } from "react";
import Service from "../../api/Service";
import { Loader2, Search, Filter, RefreshCw, Download, Calendar, X, FileText } from "lucide-react";
import * as XLSX from "xlsx";
import { toast } from "react-toastify";
import { useDispatch } from "react-redux";
import { setActiveDetail as setGlobalActiveDetail } from "../../store/uiSlice";

const TeamProjectReport = () => {
  const dispatch = useDispatch();
  const [teams, setTeams] = useState([]);
  const [selectedTeamId, setSelectedTeamId] = useState("ALL");
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [reportData, setReportData] = useState([]);

  // Date Filter State
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Detail Modal State
  const [activeDetail, setActiveDetail] = useState(null); // { type, projectName, items }
  const [detailSearch, setDetailSearch] = useState("");

  // Reset search query when modal detail type/project changes
  useEffect(() => {
    setDetailSearch("");
  }, [activeDetail]);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const [teamRes, projRes] = await Promise.all([
        Service.AllTeam(),
        Service.GetAllProjects()
      ]);
      
      const teamsData = Array.isArray(teamRes) ? teamRes : teamRes?.data || [];
      const projectsData = Array.isArray(projRes) ? projRes : projRes?.data || [];
      
      setTeams(teamsData);
      setProjects(projectsData);
    } catch (err) {
      console.error("Error fetching teams/projects:", err);
      toast.error("Failed to load initial data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInitialData();
  }, []);

  const extractArray = (res) => {
    if (!res) return [];
    if (Array.isArray(res)) return res;
    if (Array.isArray(res.data)) return res.data;
    if (res["show rfi"] && Array.isArray(res["show rfi"])) return res["show rfi"];
    if (typeof res === "object") {
      const firstArray = Object.values(res).find(Array.isArray);
      if (firstArray) return firstArray;
    }
    return [];
  };

  const generateReport = async () => {
    if (projects.length === 0) return;
    try {
      setIsRefreshing(true);
      
      let targetProjects = projects;
      if (selectedTeamId !== "ALL") {
        targetProjects = projects.filter(p => {
          const pTeamId = p.teamId || p.teamID || p.team?.id || p.team?._id;
          return pTeamId && String(pTeamId) === String(selectedTeamId);
        });
      }

      const pData = await Promise.all(
        targetProjects.map(async (p) => {
          try {
            const [rfis, submittals, cos] = await Promise.all([
              Service.GetRFIByProjectId(p.id || p._id).catch(() => null),
              Service.GetSubmittalByProjectId(p.id || p._id).catch(() => null),
              Service.GetChangeOrder(p.id || p._id).catch(() => null)
            ]);

            return {
              project: p,
              rfis: extractArray(rfis),
              submittals: extractArray(submittals),
              cos: extractArray(cos)
            };
          } catch (e) {
            return { project: p, rfis: [], submittals: [], cos: [] };
          }
        })
      );

      setReportData(pData);
      toast.success("Report generated successfully");
    } catch (err) {
      console.error("Error generating report", err);
      toast.error("Failed to generate report");
    } finally {
      setIsRefreshing(false);
    }
  };

  const isWithinDateRange = (dateStr) => {
    if (!startDate && !endDate) return true;
    if (!dateStr) return false;
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return false;
    
    const start = startDate ? new Date(startDate) : new Date(0);
    const end = endDate ? new Date(endDate) : new Date();
    // adjust end to include the whole day
    end.setHours(23, 59, 59, 999);
    
    return d >= start && d <= end;
  };

  const filteredReportData = useMemo(() => {
    return reportData.map(item => {
      // Filter RFIs
      const filteredRfis = item.rfis.filter((r) => isWithinDateRange(r.createdAt || r.date));
      // Split RFIs into regular and connection design
      const regularRfis = filteredRfis.filter((r) => !(r.isConnectionDesign === true || String(r.isConnectionDesign).toLowerCase() === "true"));
      const cdRfis = filteredRfis.filter((r) => r.isConnectionDesign === true || String(r.isConnectionDesign).toLowerCase() === "true");

      // Filter Submittals
      const filteredSubmittals = item.submittals.filter((s) => isWithinDateRange(s.createdAt || s.date));
      const regularSubmittals = filteredSubmittals.filter((s) => !(s.isConnectionDesign === true || String(s.isConnectionDesign).toLowerCase() === "true"));
      const cdSubmittals = filteredSubmittals.filter((s) => s.isConnectionDesign === true || String(s.isConnectionDesign).toLowerCase() === "true");

      // Filter COs
      const filteredCos = item.cos.filter((c) => isWithinDateRange(c.createdAt || c.date));

      return {
        project: item.project,
        items: {
          regularRfis,
          cdRfis,
          regularSubmittals,
          cdSubmittals,
          cos: filteredCos
        },
        stats: {
          regularRfis: regularRfis.length,
          cdRfis: cdRfis.length,
          regularSubmittals: regularSubmittals.length,
          cdSubmittals: cdSubmittals.length,
          cos: filteredCos.length
        }
      };
    });
  }, [reportData, startDate, endDate]);

  // Filter detail items based on search query in modal
  const filteredDetailItems = useMemo(() => {
    if (!activeDetail) return [];
    if (!detailSearch) return activeDetail.items;
    const query = detailSearch.toLowerCase();
    return activeDetail.items.filter(item => {
      const title = (item.subject || item.remarks || item.changeOrderNumber || "").toLowerCase();
      const desc = (item.description || item.reason || "").toLowerCase();
      return title.includes(query) || desc.includes(query);
    });
  }, [activeDetail, detailSearch]);

  const stripHtml = (html) => {
    if (!html) return "";
    return html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ');
  };

  const renderItemDetails = (items, type, project) => {
    if (!items || items.length === 0) {
      return <span className="text-gray-300 text-xs font-semibold">—</span>;
    }
    const projectName = project?.name || "Unnamed Project";
    const projectId = project?.id || project?._id;

    return (
      <div className="flex flex-col gap-2 min-w-[150px] max-w-[250px] max-h-[380px] overflow-y-auto pr-1.5 custom-scrollbar">
        {items.map((item, idx) => {
          const title = item.subject || item.remarks || (item.changeOrderNumber ? `COR-${item.changeOrderNumber.slice(-3)}` : `Item #${idx + 1}`);
          const rawStatus = String(item.wbtStatus || item.status || "PENDING");
          const dateVal = item.createdAt || item.date;
          const desc = stripHtml(item.description || item.reason || item.remarks || "");
          const truncatedDesc = desc ? (desc.length > 50 ? desc.substring(0, 50) + "..." : desc) : "";

          const getStatusStyle = (s) => {
            switch (String(s).toUpperCase()) {
              case "OPEN":
              case "PENDING":
              case "WAITING_FOR_BFA":
                return "bg-yellow-100 text-yellow-700 border-yellow-200";
              case "COMPLETE":
              case "APPROVED":
              case "BFA_RECEIVED":
              case "RELEASE_FOR_FABRICATION":
                return "bg-green-100 text-green-700 border-green-200";
              case "REJECTED":
              case "NOT_APPROVED":
                return "bg-red-100 text-red-700 border-red-200";
              case "PARTIAL":
              case "REVISED_RESUBMITTAL":
              case "REVISED_RESUBMIT_FOR_FABRICATION":
                return "bg-orange-100 text-orange-700 border-orange-200";
              case "BFA_SENT":
              case "SUBMITTED_TO_EOR":
                return "bg-blue-100 text-blue-700 border-blue-200";
              default:
                return "bg-gray-100 text-gray-700 border-gray-200";
            }
          };

          const handleItemClick = () => {
            const itemId = item.id || item._id;
            const normalizedType = String(type).toLowerCase();
            if (normalizedType.includes("rfi")) {
              dispatch(setGlobalActiveDetail({ type: "rfi", id: itemId }));
            } else if (normalizedType.includes("submittal")) {
              dispatch(setGlobalActiveDetail({ type: "submittal", id: itemId }));
            } else if (normalizedType.includes("change") || normalizedType.includes("co")) {
              dispatch(setGlobalActiveDetail({ type: "co", id: itemId, projectId }));
            } else {
              // fallback
              setActiveDetail({
                type,
                projectName,
                items: [item]
              });
            }
          };

          return (
            <div
              key={item.id || item._id || idx}
              onClick={handleItemClick}
              className="p-2.5 bg-gray-50 border border-gray-200 rounded-xl space-y-1 shadow-sm hover:shadow transition-shadow text-left cursor-pointer hover:bg-gray-100/80"
            >
              <div className="flex justify-between items-start gap-1">
                <span className="font-bold text-gray-900 text-[11px] line-clamp-2 leading-tight">{title}</span>
                <span className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider border shrink-0 ${getStatusStyle(rawStatus)}`}>
                  {rawStatus.replace(/_/g, " ")}
                </span>
              </div>
              {truncatedDesc && (
                <p className="text-[10px] text-gray-500 line-clamp-2 leading-relaxed">
                  {truncatedDesc}
                </p>
              )}
              {dateVal && (
                <div className="text-[9px] font-bold text-gray-400 mt-1">
                  {new Date(dateVal).toLocaleDateString("en-IN", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric"
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  const handleExport = () => {
    if (filteredReportData.length === 0) {
      toast.info("No data to export");
      return;
    }

    const exportData = filteredReportData.map(item => ({
      "Project Name": item.project.name || "N/A",
      "Stage": item.project.stage || "N/A",
      "Status": item.project.status || "N/A",
      "Total RFIs": item.stats.regularRfis,
      "CD RFIs": item.stats.cdRfis,
      "Total Submittals": item.stats.regularSubmittals,
      "CD Submittals": item.stats.cdSubmittals,
      "Change Orders": item.stats.cos,
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Team Report");
    XLSX.writeFile(wb, `Team_Report_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 bg-white rounded-3xl border border-gray-100">
        <Loader2 className="w-8 h-8 animate-spin text-green-500 mb-4" />
        <p className="text-black font-black uppercase tracking-widest text-xs">Loading Projects & Teams...</p>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="bg-white rounded-2xl shadow-sm border border-black/5 p-6 mb-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-black text-gray-900 tracking-tight">Team Reports</h1>
            <p className="text-sm text-gray-500 mt-1">Aggregate WPR, RFIs, Submittals and COs across projects</p>
          </div>
          <button 
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-lg font-bold text-sm hover:bg-gray-800 transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4" />
            Export Excel
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold uppercase tracking-widest text-gray-500">Filter by Team</label>
            <select
              value={selectedTeamId}
              onChange={(e) => setSelectedTeamId(e.target.value)}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-green-500 outline-none"
            >
              <option value="ALL">All Teams</option>
              {teams.map((t) => (
                <option key={t.id || t._id} value={t.id || t._id}>
                  {t.name || t.teamName || `Team ${t.id || t._id}`}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold uppercase tracking-widest text-gray-500">Start Date</label>
            <div className="relative">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-green-500 outline-none"
              />
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold uppercase tracking-widest text-gray-500">End Date</label>
            <div className="relative">
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-green-500 outline-none"
              />
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <button
              onClick={generateReport}
              disabled={isRefreshing}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-green-500 text-white rounded-xl font-bold text-sm hover:bg-green-600 transition-colors disabled:opacity-50 cursor-pointer"
            >
              {isRefreshing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
              {isRefreshing ? "Generating..." : "Generate Report"}
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-black/5 overflow-hidden">
        {reportData.length === 0 ? (
          <div className="p-12 text-center text-gray-500 flex flex-col items-center">
            <Filter className="w-12 h-12 text-gray-300 mb-4" />
            <p className="font-bold text-lg">No report data generated</p>
            <p className="text-sm">Select a team and date range, then click Generate Report.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-gray-500">Project</th>
                  <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-gray-500">Status</th>
                  <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-gray-500">Regular RFIs</th>
                  <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-gray-500">CD RFIs</th>
                  <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-gray-500">Regular Submittals</th>
                  <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-gray-500">CD Submittals</th>
                  <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-gray-500">Change Orders</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredReportData.map((row, idx) => (
                  <tr key={idx} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 font-bold text-gray-900 align-top">{row.project?.name || "Unnamed Project"}</td>
                    <td className="px-6 py-4 align-top">
                      <span className="px-2.5 py-1 text-[10px] font-black uppercase tracking-widest rounded-md bg-gray-100 text-gray-700">
                        {row.project?.status || "UNKNOWN"}
                      </span>
                    </td>
                    <td className="px-6 py-4 align-top">
                      {renderItemDetails(row.items.regularRfis, "Regular RFIs", row.project)}
                    </td>
                    <td className="px-6 py-4 align-top">
                      {renderItemDetails(row.items.cdRfis, "CD RFIs", row.project)}
                    </td>
                    <td className="px-6 py-4 align-top">
                      {renderItemDetails(row.items.regularSubmittals, "Regular Submittals", row.project)}
                    </td>
                    <td className="px-6 py-4 align-top">
                      {renderItemDetails(row.items.cdSubmittals, "CD Submittals", row.project)}
                    </td>
                    <td className="px-6 py-4 align-top">
                      {renderItemDetails(row.items.cos, "Change Orders", row.project)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {activeDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 w-full max-w-4xl max-h-[85vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 bg-gray-50 border-b border-gray-100">
              <div>
                <h3 className="text-lg font-black text-gray-900 tracking-tight">
                  {activeDetail.projectName}
                </h3>
                <p className="text-xs font-bold uppercase tracking-widest text-green-600 mt-0.5">
                  {activeDetail.type} ({activeDetail.items.length})
                </p>
              </div>
              <button
                onClick={() => setActiveDetail(null)}
                className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-900 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Search Bar */}
            <div className="p-4 border-b border-gray-100 bg-white">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder={`Search ${activeDetail.type.toLowerCase()}...`}
                  value={detailSearch}
                  onChange={(e) => setDetailSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-green-500 outline-none"
                />
              </div>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50/50">
              {filteredDetailItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                  <FileText className="w-12 h-12 mb-3 text-gray-300" />
                  <p className="font-bold">No items found</p>
                  <p className="text-xs">Try adjusting your search query</p>
                </div>
              ) : (
                filteredDetailItems.map((item, idx) => {
                  const title = item.subject || item.remarks || (item.changeOrderNumber ? `COR-${item.changeOrderNumber.slice(-3)}` : `Item #${idx + 1}`);
                  const desc = stripHtml(item.description || item.reason || item.remarks || "");
                  const rawStatus = String(item.wbtStatus || item.status || "PENDING");
                  const dateVal = item.createdAt || item.date;

                  // Define status badge style
                  const getStatusStyle = (s) => {
                    switch (String(s).toUpperCase()) {
                      case "OPEN":
                      case "PENDING":
                      case "WAITING_FOR_BFA":
                        return "bg-yellow-100 text-yellow-700 border-yellow-200";
                      case "COMPLETE":
                      case "APPROVED":
                      case "BFA_RECEIVED":
                      case "RELEASE_FOR_FABRICATION":
                        return "bg-green-100 text-green-700 border-green-200";
                      case "REJECTED":
                      case "NOT_APPROVED":
                        return "bg-red-100 text-red-700 border-red-200";
                      case "PARTIAL":
                      case "REVISED_RESUBMITTAL":
                      case "REVISED_RESUBMIT_FOR_FABRICATION":
                        return "bg-orange-100 text-orange-700 border-orange-200";
                      case "BFA_SENT":
                      case "SUBMITTED_TO_EOR":
                        return "bg-blue-100 text-blue-700 border-blue-200";
                      default:
                        return "bg-gray-100 text-gray-700 border-gray-200";
                    }
                  };

                  return (
                    <div
                      key={item.id || item._id || idx}
                      className="p-5 bg-white border border-black/5 rounded-2xl shadow-sm hover:shadow-md transition-shadow"
                    >
                      <div className="flex justify-between items-start gap-4 mb-2">
                        <h4 className="font-bold text-gray-900 text-base">{title}</h4>
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${getStatusStyle(rawStatus)}`}>
                          {rawStatus.replace(/_/g, " ")}
                        </span>
                      </div>

                      {desc && (
                        <p className="text-sm text-gray-600 line-clamp-3 mb-4 leading-relaxed whitespace-pre-line">
                          {desc}
                        </p>
                      )}

                      <div className="flex items-center gap-4 text-xs font-bold text-gray-400">
                        {dateVal && (
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5" />
                            {new Date(dateVal).toLocaleDateString("en-IN", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            })}
                          </span>
                        )}
                        {item.changeOrderNumber && (
                          <span className="px-2 py-0.5 bg-gray-100 rounded text-gray-600">
                            No. {item.changeOrderNumber}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end">
              <button
                onClick={() => setActiveDetail(null)}
                className="px-4 py-2 bg-black text-white hover:bg-gray-800 rounded-xl font-bold text-sm transition-colors cursor-pointer"
              >
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeamProjectReport;
