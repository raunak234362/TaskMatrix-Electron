import { useEffect, useState, useMemo } from "react";
import { X, FileText, Download, User, Search, Award, Clock, CheckCircle2, AlertTriangle } from "lucide-react";
import { useDispatch } from "react-redux";
import { toast } from "react-toastify";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import {
  incrementModalCount,
  decrementModalCount,
} from "../../../../store/uiSlice";

const TeamReportModal = ({
  isOpen,
  onClose,
  teamName,
  members,
  dateFilter,
}) => {
  const dispatch = useDispatch();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedMemberId, setSelectedMemberId] = useState(null);

  useEffect(() => {
    if (isOpen) {
      dispatch(incrementModalCount());
      return () => {
        dispatch(decrementModalCount());
      };
    }
  }, [isOpen, dispatch]);

  // Set default selected member when modal opens or members load
  useEffect(() => {
    if (members && members.length > 0 && !selectedMemberId) {
      const firstId = members[0].userId || members[0].member?.id || members[0].id;
      setSelectedMemberId(firstId);
    }
  }, [members, selectedMemberId]);

  if (!isOpen) return null;

  // Helper: Format duration to minutes
  const parseDurationToMinutes = (duration) => {
    if (!duration) return 0;
    if (typeof duration === "number") return duration;
    if (typeof duration === "string" && !duration.includes(":")) {
      return parseFloat(duration);
    }
    const [hours, minutes, seconds] = duration.split(":").map(Number);
    return hours * 60 + (minutes || 0) + Math.floor((seconds || 0) / 60);
  };

  // Helper: Format decimal hours to HH:MM
  const formatDecimalToHoursMinutes = (val) => {
    if (!val && val !== 0) return "00:00";
    const hrs = Math.floor(val);
    const mins = Math.round((val - hrs) * 60);
    return `${hrs.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}`;
  };

  // Helper: Safe parse float to prevent NaN
  const safeParseFloat = (val) => {
    if (val === null || val === undefined) return 0;
    if (typeof val === "number") {
      return isNaN(val) ? 0 : val;
    }
    const str = String(val).trim();
    if (!str || str.toLowerCase() === "n/a" || str.toLowerCase() === "null") return 0;
    const parsed = parseFloat(str);
    return isNaN(parsed) ? 0 : parsed;
  };

  // Helper: Get human-readable date filter text
  const getReadableDateFilter = () => {
    if (!dateFilter) return "All Time";
    switch (dateFilter.type) {
      case "specificDate":
        return new Date(dateFilter.date).toLocaleDateString("en-US", {
          day: "numeric",
          month: "long",
          year: "numeric",
        });
      case "week":
        return `${new Date(dateFilter.weekStart).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        })} - ${new Date(dateFilter.weekEnd).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        })}`;
      case "month":
        return new Date(dateFilter.year, dateFilter.month).toLocaleDateString("en-US", {
          month: "long",
          year: "numeric",
        });
      case "year":
        return `Year ${dateFilter.year}`;
      case "range":
        return `${new Date(dateFilter.year, dateFilter.startMonth).toLocaleDateString("en-US", {
          month: "long",
        })} - ${new Date(dateFilter.year, dateFilter.endMonth).toLocaleDateString("en-US", {
          month: "long",
          year: "numeric",
        })}`;
      case "dateRange":
        return `${new Date(dateFilter.startDate).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        })} - ${new Date(dateFilter.endDate).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        })}`;
      default:
        return "All Time";
    }
  };

  // Process and calculate stats for all members
  const processedMembers = useMemo(() => {
    if (!members) return [];

    return members.map((member) => {
      const user = member.member || {};
      const memberId = member.userId || user.id || member.id;
      const firstName = member.firstName || user.firstName || "";
      const lastName = member.lastName || user.lastName || "";
      const fullName = `${firstName} ${lastName}`.trim() || "Unknown User";

      // 1. Assigned Hours
      const assignedHours = (member.tasks || []).reduce((sum, task) => {
        let h = 0;
        if (task.allocationLog && task.allocationLog.allocatedHours !== undefined && task.allocationLog.allocatedHours !== null) {
          h = safeParseFloat(task.allocationLog.allocatedHours);
        } else if (task.hours !== undefined && task.hours !== null) {
          h = safeParseFloat(task.hours);
        } else {
          h = safeParseFloat(parseDurationToMinutes(task.duration || "00:00:00")) / 60;
        }
        return sum + h;
      }, 0);

      // 2. Worked Hours
      const workedHours = (member.tasks || [])
        .flatMap((task) => task.workingHourTask || [])
        .reduce((sum, entry) => {
          if (entry.duration_seconds) return sum + entry.duration_seconds / 3600;
          return sum + (entry.duration || 0) / 60;
        }, 0);

      // 3. Completed Tasks
      const completedTasksCount = (member.tasks || []).filter((task) =>
        ["COMPLETED", "USER_FAULT", "VALIDATE_COMPLETED"].includes(task.status?.toUpperCase())
      ).length;

      // 4. Efficiency
      const completedTasks = (member.tasks || []).filter(
        (task) => task.status === "COMPLETED"
      );

      const efficiencyAssigned = completedTasks.reduce((sum, task) => {
        let h = 0;
        if (task.allocationLog && task.allocationLog.allocatedHours !== undefined && task.allocationLog.allocatedHours !== null) {
          h = safeParseFloat(task.allocationLog.allocatedHours);
        } else if (task.hours !== undefined && task.hours !== null) {
          h = safeParseFloat(task.hours);
        } else {
          h = safeParseFloat(parseDurationToMinutes(task.duration || "00:00:00")) / 60;
        }
        return sum + h;
      }, 0);

      const efficiencyWorked = completedTasks
        .flatMap((task) => task.workingHourTask || [])
        .reduce((sum, entry) => {
          if (entry.duration_seconds) return sum + entry.duration_seconds / 3600;
          return sum + (entry.duration || 0) / 60;
        }, 0);

      let efficiency = 0;
      if (efficiencyWorked > 0) {
        efficiency = Math.round((efficiencyAssigned / efficiencyWorked) * 100);
      }

      const sortedTasks = [...(member.tasks || [])].sort((a, b) => {
        const dateA = new Date(a.start_date || a.startDate || 0).getTime();
        const dateB = new Date(b.start_date || b.startDate || 0).getTime();
        return dateB - dateA;
      });

      return {
        id: memberId,
        fullName,
        role: member.role || user.role || "Team Member",
        email: user.email || member.email || "N/A",
        tasks: sortedTasks,
        assignedHours,
        workedHours,
        completedTasks: completedTasksCount,
        totalTasks: member.tasks?.length || 0,
        efficiency,
      };
    });
  }, [members]);

  // Filter members list based on sidebar search
  const filteredMembers = useMemo(() => {
    return processedMembers.filter((m) =>
      m.fullName.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [processedMembers, searchTerm]);

  // Get current active member stats
  const activeMember = useMemo(() => {
    return processedMembers.find((m) => m.id === selectedMemberId) || null;
  }, [processedMembers, selectedMemberId]);

  // PDF Generation logic for a specific member
  const generatePDFForMember = (doc, m, startY = 15) => {
    const isNewDoc = startY === 15;
    
    // Primary Branding Colors: Soft Green theme
    const primaryColor = [107, 189, 69]; // #6bbd45 (Tekla green)
    const textColor = [30, 30, 30];
    const lightBg = [244, 252, 240];

    // Report Title & Meta
    doc.setFontSize(20);
    doc.setTextColor(...primaryColor);
    doc.setFont("helvetica", "bold");
    doc.text(`${m.fullName.toUpperCase()}`, 14, startY);

    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.setFont("helvetica", "normal");
    doc.text(`Role: ${m.role}`, 14, startY + 6);
    doc.text(`Team: ${teamName}`, 14, startY + 11);
    doc.text(`Report Period: ${getReadableDateFilter()}`, 14, startY + 16);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, startY + 21);

    // Summary Cards (drawn manually)
    const cardWidth = 42;
    const cardHeight = 16;
    const gap = 4;
    const cardsStartY = startY + 26;

    const cards = [
      { label: "ASSIGNED HOURS", value: `${m.assignedHours.toFixed(2)}h` },
      { label: "WORKED HOURS", value: `${m.workedHours.toFixed(2)}h` },
      { label: "COMPLETED TASKS", value: `${m.completedTasks} / ${m.totalTasks}` },
      { label: "EFFICIENCY", value: `${m.efficiency}%` },
    ];

    cards.forEach((card, idx) => {
      const cardX = 14 + idx * (cardWidth + gap);
      // Background box
      doc.setFillColor(...lightBg);
      doc.setDrawColor(200, 220, 190);
      doc.rect(cardX, cardsStartY, cardWidth, cardHeight, "FD");

      // Card Content
      doc.setFontSize(7);
      doc.setTextColor(120);
      doc.setFont("helvetica", "bold");
      doc.text(card.label, cardX + 3, cardsStartY + 5);

      doc.setFontSize(11);
      doc.setTextColor(...textColor);
      doc.text(card.value, cardX + 3, cardsStartY + 12);
    });

    // Table Columns & Rows
    const tableColumn = ["Project Name", "Task Subject", "Status", "Allocated", "Worked", "Start Date"];
    const tableRows = (m.tasks || []).map((t) => [
      t.project?.name || "N/A",
      t.name || t.subject || "Untitled Task",
      t.status || "N/A",
      t.allocationLog && t.allocationLog.allocatedHours !== undefined && t.allocationLog.allocatedHours !== null
        ? `${safeParseFloat(t.allocationLog.allocatedHours)} hrs`
        : `${safeParseFloat(t.hours)} hrs`,
      formatDecimalToHoursMinutes(
        (t.workingHourTask || []).reduce((sum, entry) => {
          if (entry.duration_seconds) return sum + entry.duration_seconds / 3600;
          return sum + (entry.duration || 0) / 60;
        }, 0)
      ) + " hrs",
      t.start_date || t.startDate ? new Date(t.start_date || t.startDate).toLocaleDateString() : "N/A",
    ]);

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: cardsStartY + 21,
      theme: "grid",
      headStyles: {
        fillColor: primaryColor,
        textColor: [255, 255, 255],
        fontSize: 9,
        fontStyle: "bold",
      },
      styles: {
        fontSize: 8,
        cellPadding: 3.5,
      },
      alternateRowStyles: {
        fillColor: [250, 250, 250],
      },
      columnStyles: {
        0: { cellWidth: 35 },
        1: { cellWidth: 60 },
        2: { cellWidth: 25 },
        3: { cellWidth: 20 },
        4: { cellWidth: 20 },
        5: { cellWidth: 22 },
      },
    });
  };

  const handleExportExcelSingle = () => {
    if (!activeMember) {
      toast.error("No member selected to export");
      return;
    }
    try {
      const wb = XLSX.utils.book_new();
      const sheetData = [
        ["Member Name", activeMember.fullName],
        ["Period", getReadableDateFilter()],
        ["Generated On", new Date().toLocaleDateString()],
        [],
        ["PERFORMANCE METRICS"],
        ["Assigned Hours", "Worked Hours", "Tasks Completed", "Total Tasks", "Efficiency"],
        [
          activeMember.assignedHours.toFixed(2),
          activeMember.workedHours.toFixed(2),
          activeMember.completedTasks,
          activeMember.totalTasks,
          `${activeMember.efficiency}%`
        ],
        [],
        ["TASKS LIST"],
        ["S.No", "Project Name", "Task Subject", "Status", "Date", "Allocated Hours", "Worked Hours"]
      ];

      activeMember.tasks.forEach((task, idx) => {
        const taskWorked = (task.workingHourTask || []).reduce((sum, entry) => {
          if (entry.duration_seconds) return sum + entry.duration_seconds / 3600;
          return sum + (entry.duration || 0) / 60;
        }, 0);
        
        sheetData.push([
          idx + 1,
          task.project?.name || "N/A",
          task.name || task.subject || "Untitled Task",
          task.status || "N/A",
          task.start_date || task.startDate
            ? new Date(task.start_date || task.startDate).toLocaleDateString("en-GB")
            : "N/A",
          task.allocationLog && task.allocationLog.allocatedHours !== undefined && task.allocationLog.allocatedHours !== null
            ? safeParseFloat(task.allocationLog.allocatedHours)
            : safeParseFloat(task.hours),
          Number(taskWorked.toFixed(2))
        ]);
      });

      const ws = XLSX.utils.aoa_to_sheet(sheetData);
      
      const maxColWidth = sheetData.reduce((widths, row) => {
        row.forEach((cell, i) => {
          const cellLen = cell ? String(cell).length : 0;
          widths[i] = Math.max(widths[i] || 10, cellLen + 3);
        });
        return widths;
      }, []);
      ws["!cols"] = maxColWidth.map(w => ({ wch: w }));

      XLSX.utils.book_append_sheet(wb, ws, "Performance Report");
      
      const safeName = activeMember.fullName.replace(/\s+/g, "_");
      XLSX.writeFile(wb, `${safeName}_Report_${teamName}_${new Date().toISOString().split("T")[0]}.xlsx`);
      toast.success(`Exported Excel report for ${activeMember.fullName} successfully!`);
    } catch (error) {
      console.error("Excel generation failed:", error);
      toast.error("Failed to export Excel report");
    }
  };

  const handleExportExcelAll = () => {
    if (!processedMembers || processedMembers.length === 0) {
      toast.error("No team data to export");
      return;
    }
    try {
      const wb = XLSX.utils.book_new();
      const usedSheetNames = new Set();

      processedMembers.forEach((m) => {
        const sheetData = [
          ["Member Name", m.fullName],
          ["Period", getReadableDateFilter()],
          ["Generated On", new Date().toLocaleDateString()],
          [],
          ["PERFORMANCE METRICS"],
          ["Assigned Hours", "Worked Hours", "Tasks Completed", "Total Tasks", "Efficiency"],
          [
            m.assignedHours.toFixed(2),
            m.workedHours.toFixed(2),
            m.completedTasks,
            m.totalTasks,
            `${m.efficiency}%`
          ],
          [],
          ["TASKS LIST"],
          ["S.No", "Project Name", "Task Subject", "Status", "Date", "Allocated Hours", "Worked Hours"]
        ];

        m.tasks.forEach((task, idx) => {
          const taskWorked = (task.workingHourTask || []).reduce((sum, entry) => {
            if (entry.duration_seconds) return sum + entry.duration_seconds / 3600;
            return sum + (entry.duration || 0) / 60;
          }, 0);
          
          sheetData.push([
            idx + 1,
            task.project?.name || "N/A",
            task.name || task.subject || "Untitled Task",
            task.status || "N/A",
            task.start_date || task.startDate
              ? new Date(task.start_date || task.startDate).toLocaleDateString("en-GB")
              : "N/A",
            task.allocationLog && task.allocationLog.allocatedHours !== undefined && task.allocationLog.allocatedHours !== null
            ? safeParseFloat(task.allocationLog.allocatedHours)
            : safeParseFloat(task.hours),
            Number(taskWorked.toFixed(2))
          ]);
        });

        const ws = XLSX.utils.aoa_to_sheet(sheetData);

        const maxColWidth = sheetData.reduce((widths, row) => {
          row.forEach((cell, i) => {
            const cellLen = cell ? String(cell).length : 0;
            widths[i] = Math.max(widths[i] || 10, cellLen + 3);
          });
          return widths;
        }, []);
        ws["!cols"] = maxColWidth.map(w => ({ wch: w }));

        let sheetName = m.fullName.replace(/[:\\/?*\[\]]/g, "").substring(0, 28).trim() || `Member_${m.id}`;
        let baseName = sheetName;
        let counter = 1;
        while (usedSheetNames.has(sheetName)) {
          sheetName = `${baseName}_${counter}`;
          counter++;
        }
        usedSheetNames.add(sheetName);

        XLSX.utils.book_append_sheet(wb, ws, sheetName);
      });

      XLSX.writeFile(wb, `Team_Report_${teamName}_${new Date().toISOString().split("T")[0]}.xlsx`);
      toast.success(`Exported team Excel workbook with ${processedMembers.length} tabs successfully!`);
    } catch (error) {
      console.error("Excel generation failed:", error);
      toast.error("Failed to export team Excel report");
    }
  };

  const handleExportSingle = () => {
    if (!activeMember) {
      toast.error("No member selected to export");
      return;
    }
    try {
      const doc = new jsPDF();
      generatePDFForMember(doc, activeMember);
      
      const safeName = activeMember.fullName.replace(/\s+/g, "_");
      doc.save(`${safeName}_Report_${teamName}_${new Date().toISOString().split("T")[0]}.pdf`);
      toast.success(`Exported report for ${activeMember.fullName} successfully!`);
    } catch (error) {
      console.error("PDF generation failed:", error);
      toast.error("Failed to export PDF report");
    }
  };

  const handleExportAll = () => {
    if (!processedMembers || processedMembers.length === 0) {
      toast.error("No team data to export");
      return;
    }
    try {
      const doc = new jsPDF();
      processedMembers.forEach((m, index) => {
        if (index > 0) doc.addPage();
        generatePDFForMember(doc, m);
      });
      doc.save(`All_Members_Report_${teamName}_${new Date().toISOString().split("T")[0]}.pdf`);
      toast.success(`Exported combined report for ${processedMembers.length} members successfully!`);
    } catch (error) {
      console.error("PDF generation failed:", error);
      toast.error("Failed to export combined PDF report");
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-[96%] max-w-[95vw] h-[90vh] rounded-2xl shadow-2xl border border-gray-200 overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-6 border-b border-gray-200 flex items-center justify-between bg-white shrink-0">
          <div>
            <h2 className="text-xl font-black text-black tracking-tight uppercase flex items-center gap-2">
              <FileText className="text-[#6bbd45]" size={24} />
              Team Performance Report &middot; {teamName}
            </h2>
            <p className="text-[10px] font-black text-black uppercase tracking-[0.2em] mt-1">
              Active Period Filter: <span className="text-[#6bbd45]">{getReadableDateFilter()}</span>
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleExportAll}
              className="px-4 py-2 bg-[#6bbd45] text-white rounded-lg hover:bg-[#5aa33a] transition-all font-bold text-xs uppercase tracking-wider shadow-sm flex items-center gap-2 cursor-pointer active:scale-95 border-0"
            >
              <Download size={15} />
              Export PDF (All Members)
            </button>
            <button
              onClick={handleExportExcelAll}
              className="px-4 py-2 bg-black text-white rounded-lg hover:bg-black/80 transition-all font-bold text-xs uppercase tracking-wider shadow-sm flex items-center gap-2 cursor-pointer active:scale-95 border-0"
            >
              <Download size={15} />
              Export Excel (All Members)
            </button>
            <button
              onClick={onClose}
              className="px-6 py-2 bg-white text-black border-2 border-black rounded-lg hover:bg-gray-100 transition-all font-bold text-xs uppercase tracking-wider shadow-sm cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>

        {/* Layout Body: Sidebar + Main Content */}
        <div className="flex-1 flex overflow-hidden min-h-0">
          
          {/* Sidebar Tab List */}
          <div className="w-80 border-r border-gray-200 bg-gray-50/50 flex flex-col shrink-0">
            {/* Search Box */}
            <div className="p-4 border-b border-gray-200 shrink-0">
              <div className="relative group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-black transition-colors" size={16} />
                <input
                  type="text"
                  placeholder="Search team member..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-white border border-gray-300 rounded-lg text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#6bbd45]/20 focus:border-[#6bbd45] transition-all placeholder:text-gray-400"
                />
              </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {filteredMembers.map((m) => {
                const isSelected = m.id === selectedMemberId;
                return (
                  <button
                    key={m.id}
                    onClick={() => setSelectedMemberId(m.id)}
                    className={`w-full text-left p-3 rounded-xl transition-all border flex items-center justify-between gap-3 cursor-pointer
                      ${isSelected
                        ? "bg-green-50/70 border-[#6bbd45]/50 text-black shadow-sm font-semibold"
                        : "bg-transparent border-transparent hover:bg-gray-100 text-gray-700 hover:text-black"
                      }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs uppercase shrink-0
                        ${isSelected ? "bg-[#6bbd45] text-white" : "bg-gray-200 text-gray-600"}`}>
                        {m.fullName.split(" ").map(w => w[0]).join("").substring(0, 2)}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold truncate leading-tight">{m.fullName}</p>
                        <p className="text-[10px] text-gray-500 truncate mt-0.5">{m.role}</p>
                      </div>
                    </div>
                    
                    <div className="text-right shrink-0">
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md border
                        ${m.efficiency >= 80 ? "bg-green-100/50 text-green-700 border-green-200" :
                          "bg-black/5 text-black border-black/10"}`}>
                        {m.efficiency}%
                      </span>
                    </div>
                  </button>
                );
              })}
              {filteredMembers.length === 0 && (
                <div className="p-8 text-center text-xs text-gray-400 italic">
                  No team members match search.
                </div>
              )}
            </div>
          </div>

          {/* Main Selected Content */}
          <div className="flex-1 bg-white flex flex-col overflow-hidden">
            {activeMember ? (
              <div className="flex-1 flex flex-col overflow-hidden">
                {/* Member Profile Stats Banner */}
                <div className="p-6 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0 bg-green-50/20">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-green-100 text-[#6bbd45] border border-green-200/50 flex items-center justify-center font-bold text-lg uppercase shrink-0 shadow-inner">
                      <User size={24} />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-black uppercase">{activeMember.fullName}</h3>
                      <p className="text-xs text-gray-500 mt-0.5">{activeMember.role} &middot; <span className="font-medium text-gray-400">{activeMember.email}</span></p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleExportSingle}
                      className="px-3 py-1.5 border border-black hover:bg-gray-50 text-black rounded-lg text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer shadow-sm active:scale-95 transition-all bg-white"
                    >
                      <Download size={13} />
                      Export PDF
                    </button>
                    <button
                      onClick={handleExportExcelSingle}
                      className="px-3 py-1.5 bg-[#6bbd45] hover:bg-[#5aa33a] text-white rounded-lg text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer shadow-sm active:scale-95 transition-all border-0"
                    >
                      <Download size={13} />
                      Export Excel
                    </button>
                  </div>
                </div>

                {/* Score Cards Grid */}
                <div className="p-6 grid grid-cols-2 lg:grid-cols-4 gap-4 shrink-0 border-b border-gray-100 bg-gray-50/20">
                  {/* Assigned Hours */}
                  <div className="p-4 bg-white border border-gray-200 rounded-xl shadow-sm flex items-center gap-3">
                    <div className="p-2.5 bg-green-50 text-black rounded-lg border border-green-100 shrink-0">
                      <Clock size={18} />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider leading-none">Assigned Hours</p>
                      <p className="text-lg font-bold text-black mt-1.5 leading-none">{activeMember.assignedHours.toFixed(2)} hrs</p>
                    </div>
                  </div>

                  {/* Worked Hours */}
                  <div className="p-4 bg-white border border-gray-200 rounded-xl shadow-sm flex items-center gap-3">
                    <div className="p-2.5 bg-green-50 text-black rounded-lg border border-green-100 shrink-0">
                      <Clock size={18} />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider leading-none">Worked Hours</p>
                      <p className="text-lg font-bold text-black mt-1.5 leading-none">{activeMember.workedHours.toFixed(2)} hrs</p>
                    </div>
                  </div>

                  {/* Task Completion */}
                  <div className="p-4 bg-white border border-gray-200 rounded-xl shadow-sm flex items-center gap-3">
                    <div className="p-2.5 bg-green-50 text-[#6bbd45] rounded-lg border border-green-100 shrink-0">
                      <CheckCircle2 size={18} />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider leading-none">Tasks Completed</p>
                      <p className="text-lg font-bold text-black mt-1.5 leading-none">{activeMember.completedTasks} / {activeMember.totalTasks}</p>
                    </div>
                  </div>

                  {/* User Efficiency */}
                  <div className="p-4 bg-white border border-gray-200 rounded-xl shadow-sm flex items-center gap-3">
                    <div className="p-2.5 bg-green-50 text-[#6bbd45] rounded-lg border border-green-100 shrink-0">
                      <Award size={18} />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider leading-none">User Efficiency</p>
                      <p className="text-lg font-bold text-[#6bbd45] mt-1.5 leading-none">{activeMember.efficiency}%</p>
                    </div>
                  </div>
                </div>

                {/* Selected User Tasks List Table */}
                <div className="flex-1 overflow-auto p-6 min-h-0">
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                    Tasks List Period ({activeMember.tasks.length})
                  </h4>

                  {activeMember.tasks.length > 0 ? (
                    <div className="border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                      <table className="w-full text-left border-collapse bg-white">
                        <thead>
                          <tr className="bg-green-50/30 border-b border-gray-200 text-[10px] font-bold text-black uppercase tracking-wider">
                            <th className="px-4 py-3.5 w-12 text-center">S.No</th>
                            <th className="px-4 py-3.5">Task Name</th>
                            <th className="px-4 py-3.5">Project</th>
                            <th className="px-4 py-3.5 w-28 text-center">Date</th>
                            <th className="px-4 py-3.5 w-28 text-center">Allocated</th>
                            <th className="px-4 py-3.5 w-28 text-center">Worked Hours</th>
                            <th className="px-4 py-3.5 w-28 text-center">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 text-xs font-medium text-gray-700">
                          {activeMember.tasks.map((task, idx) => {
                            // Sum worked hours for this task
                            const taskWorked = (task.workingHourTask || []).reduce((sum, entry) => {
                              if (entry.duration_seconds) return sum + entry.duration_seconds / 3600;
                              return sum + (entry.duration || 0) / 60;
                            }, 0);

                            const isComplete = ["COMPLETED", "COMPLETE", "VALIDATE_COMPLETED"].includes(task.status?.toUpperCase());

                            return (
                              <tr key={task.id || idx} className="hover:bg-gray-50/50 transition-colors">
                                <td className="px-4 py-3 text-center text-gray-400 font-bold">{idx + 1}</td>
                                <td className="px-4 py-3">
                                  <p className="font-bold text-black line-clamp-1">{task.name || task.subject || "Untitled Task"}</p>
                                  {task.description && task.description !== task.name && (
                                    <p className="text-[10px] text-gray-400 font-normal mt-0.5 line-clamp-1">{task.description}</p>
                                  )}
                                </td>
                                <td className="px-4 py-3 font-semibold text-gray-600 truncate max-w-[150px]">
                                  {task.project?.name || "No Project"}
                                </td>
                                <td className="px-4 py-3 text-center font-bold text-gray-700">
                                  {task.start_date || task.startDate
                                    ? new Date(task.start_date || task.startDate).toLocaleDateString("en-GB", {
                                        day: "2-digit",
                                        month: "short",
                                        year: "numeric",
                                      })
                                    : "N/A"}
                                </td>
                                <td className="px-4 py-3 text-center font-bold">
                                  {task.allocationLog && task.allocationLog.allocatedHours !== undefined && task.allocationLog.allocatedHours !== null
                                    ? `${safeParseFloat(task.allocationLog.allocatedHours)} hrs`
                                    : `${safeParseFloat(task.hours)} hrs`}
                                </td>
                                <td className="px-4 py-3 text-center text-black font-bold">
                                  {formatDecimalToHoursMinutes(taskWorked)} hrs
                                </td>
                                <td className="px-4 py-3 text-center">
                                  <span className={`inline-block px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase border
                                    ${isComplete
                                      ? "bg-green-50 text-green-700 border-green-200"
                                      : "bg-black text-white border-black"
                                    }`}>
                                    {task.status}
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="border border-dashed border-gray-200 rounded-2xl p-12 text-center bg-gray-50/30 flex flex-col items-center justify-center gap-3">
                      <AlertTriangle className="text-gray-300" size={32} />
                      <p className="text-sm text-gray-400 italic">No tasks recorded for this member in this period.</p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-12 text-center text-gray-400 gap-3">
                <User size={40} className="text-gray-300" />
                <p className="text-sm">Select a team member from the sidebar to view their report.</p>
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
};

export default TeamReportModal;
