import React, { useState, useEffect, useMemo, useRef } from "react";
import { 
  FileSpreadsheet, 
  Printer, 
  Download, 
  Plus, 
  Save, 
  Trash2, 
  FileText,
  Calendar,
  CheckCircle,
  HelpCircle,
  Clock,
  ArrowRight,
  TrendingUp,
  Loader2,
  Compass
} from "lucide-react";
import Service from "../../api/Service";
import { toast } from "react-toastify";
import * as XLSX from "xlsx";
import { jsPDF } from "jspdf";
import "jspdf-autotable";

const WorkProgressReport = ({ 
  projectId, 
  project, 
  milestones = [], 
  rfiData = [], 
  submittalData = [], 
  coordinationDrawings = [],
  onUpdate 
}) => {
  const userRole = sessionStorage.getItem("userRole")?.toLowerCase() || "";
  const canEdit = !["client", "staff", "estimator"].includes(userRole);

  // WPR Header Info state
  const [reportDate, setReportDate] = useState(new Date().toISOString().split("T")[0]);
  const [weekEnding, setWeekEnding] = useState("");
  const [circulatedTo, setCirculatedTo] = useState("Rob Tucci / Vishal / Rajeshwari");
  const [software, setSoftware] = useState(project?.tools || "SDS2");
  const [fabProjectManager, setFabProjectManager] = useState("Matt Aurand");

  // RFI Grid local state
  const [rfis, setRfis] = useState([]);
  // Project Schedule Grid (Milestones & Submittals) local state
  const [scheduleRows, setScheduleRows] = useState([]);
  // Change Order local state
  const [coRows, setCoRows] = useState([]);
  // Coordination Drawings local state
  const [coordDrawings, setCoordDrawings] = useState([]);

  // Keyboard navigation & Editing Cell state
  // format: { table: 'rfi'|'schedule'|'co'|'coordDrawing', rowIndex: number, field: string }
  const [activeCell, setActiveCell] = useState(null);
  const [editValue, setEditValue] = useState("");
  const inputRef = useRef(null);

  // Set default week ending date to next/previous Friday
  useEffect(() => {
    const d = new Date();
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 5); // next/current Friday
    const friday = new Date(d.setDate(diff));
    setWeekEnding(friday.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }));
  }, []);

  // Sync RFIs
  useEffect(() => {
    let rfiArray = [];
    if (Array.isArray(rfiData)) {
      rfiArray = rfiData;
    } else if (rfiData && rfiData.data) {
      rfiArray = rfiData.data;
    } else if (rfiData && rfiData["show rfi"]) {
      rfiArray = rfiData["show rfi"];
    }

    const formattedRFIs = rfiArray.map((r, index) => {
      const responses = r.rfiresponse || [];
      const customerRep = responses.find(res => res.userRole === "CLIENT" || res.userRole === "CLIENT_ADMIN" || res.createdByRole === "CLIENT");
      const wbtRep = responses.find(res => res.userRole !== "CLIENT" && res.userRole !== "CLIENT_ADMIN" && res.createdByRole !== "CLIENT");
      
      return {
        id: r.id || r._id,
        rfiNo: r.subject || `RFI #${index + 1}`,
        sentDate: r.date ? new Date(r.date).toLocaleDateString("en-US") : "—",
        customerResponse: customerRep ? customerRep.description?.replace(/<[^>]+>/g, "") : "Waiting...",
        responseReceivedDate: customerRep ? new Date(customerRep.createdAt).toLocaleDateString("en-US") : "—",
        wbtResponse: wbtRep ? wbtRep.description?.replace(/<[^>]+>/g, "") : "100% Responded & Updated",
        status: r.status ? "OPEN" : "Closed"
      };
    });

    setRfis(formattedRFIs);
  }, [rfiData]);

  // Sync Schedule (Milestones mapped to Submittals)
  useEffect(() => {
    const rows = milestones.map((m) => {
      // Find submittals for this milestone
      const milestoneSubmittals = submittalData.filter(
        sub => String(sub.mileStoneId || sub.milestoneId || sub.milestone?.id) === String(m.id || m._id)
      );

      const ifaSub = milestoneSubmittals.find(s => String(s.stage).toUpperCase() === "IFA");
      const ifcSub = milestoneSubmittals.find(s => String(s.stage).toUpperCase() === "IFC");
      const corSub = milestoneSubmittals.find(s => ["CO", "COR"].includes(String(s.stage).toUpperCase()));

      // BFA Date is response date of IFA submittals
      const ifaResponses = ifaSub?.submittalsResponse || [];
      const latestIfaResponse = ifaResponses.length > 0 ? ifaResponses[ifaResponses.length - 1] : null;

      return {
        id: m.id || m._id,
        phase: m.subject || "Unnamed Phase",
        startDate: m.date ? new Date(m.date).toLocaleDateString("en-US") : project?.startDate ? new Date(project.startDate).toLocaleDateString("en-US") : "—",
        ifaSubDate: ifaSub ? new Date(ifaSub.date || ifaSub.createdAt).toLocaleDateString("en-US") : "—",
        bfaRecdDate: latestIfaResponse ? new Date(latestIfaResponse.createdAt).toLocaleDateString("en-US") : "—",
        ifcSubDate: ifcSub ? new Date(ifcSub.date || ifcSub.createdAt).toLocaleDateString("en-US") : "—",
        corSubDate: corSub ? new Date(corSub.date || corSub.createdAt).toLocaleDateString("en-US") : "—",
        comments: m.description ? m.description.replace(/<[^>]+>/g, "") : (m.percentage ? `${m.percentage}% Completed` : "—")
      };
    });

    setScheduleRows(rows);
  }, [milestones, submittalData, project]);

  // Sync Change Orders Month-by-month
  useEffect(() => {
    const rawCOs = project?.changeOrders || [];
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    
    const rows = rawCOs.map((co) => {
      const coDate = co.createdAt || co.date ? new Date(co.createdAt || co.date) : null;
      const coMonthIndex = coDate ? coDate.getMonth() : -1;
      const amount = co.totalCost || co.amount || 0;

      const monthlyBreakdown = {};
      months.forEach((m, idx) => {
        if (idx === coMonthIndex) {
          monthlyBreakdown[m] = amount > 0 ? `$${amount.toLocaleString()}` : "Sent";
        } else {
          monthlyBreakdown[m] = "";
        }
      });

      return {
        id: co.id || co._id,
        changeOrder: co.changeOrderNumber ? `COR-${co.changeOrderNumber.slice(-3)}` : "COR-New",
        ...monthlyBreakdown,
        total: amount > 0 ? `$${amount.toLocaleString()}` : "—"
      };
    });

    setCoRows(rows);
  }, [project]);

  // Sync Coordination Drawings
  useEffect(() => {
    if (Array.isArray(coordinationDrawings)) {
      const formattedDrawings = coordinationDrawings.map((cd, index) => ({
        id: cd.id || cd._id,
        title: cd.title || `Drawing #${index + 1}`,
        stage: cd.stage || "IFA",
        status: cd.status || "Pending",
        createdAt: cd.createdAt ? new Date(cd.createdAt).toLocaleDateString("en-US") : "—"
      }));
      setCoordDrawings(formattedDrawings);
    }
  }, [coordinationDrawings]);

  // Handle cell double-click
  const handleCellClick = (table, rowIndex, field, value) => {
    if (!canEdit) return;
    setActiveCell({ table, rowIndex, field });
    setEditValue(value);
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  // Save cell edit
  const handleCellSave = () => {
    if (!activeCell) return;
    const { table, rowIndex, field } = activeCell;

    if (table === "rfi") {
      const updated = [...rfis];
      updated[rowIndex][field] = editValue;
      setRfis(updated);
    } else if (table === "schedule") {
      const updated = [...scheduleRows];
      updated[rowIndex][field] = editValue;
      setScheduleRows(updated);
    } else if (table === "co") {
      const updated = [...coRows];
      updated[rowIndex][field] = editValue;
      
      // Recompute total if month was changed
      const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      let sum = 0;
      months.forEach(m => {
        const val = updated[rowIndex][m]?.replace(/[^0-9.]/g, "");
        if (val) sum += Number(val);
      });
      updated[rowIndex].total = sum > 0 ? `$${sum.toLocaleString()}` : "—";
      setCoRows(updated);
    } else if (table === "coordDrawing") {
      const updated = [...coordDrawings];
      updated[rowIndex][field] = editValue;
      setCoordDrawings(updated);
    }
    setActiveCell(null);
  };

  // Keyboard Navigation inside table cells
  const handleKeyDown = (e) => {
    if (!activeCell) return;
    const { table, rowIndex, field } = activeCell;
    const tableData = 
      table === "rfi" 
        ? rfis 
        : table === "schedule" 
        ? scheduleRows 
        : table === "co" 
        ? coRows 
        : coordDrawings;
    const fields = Object.keys(tableData[0]).filter(k => k !== "id");
    const fieldIndex = fields.indexOf(field);

    if (e.key === "Enter") {
      handleCellSave();
      // Move to cell below
      if (rowIndex < tableData.length - 1) {
        handleCellClick(table, rowIndex + 1, field, tableData[rowIndex + 1][field]);
      }
    } else if (e.key === "Tab") {
      e.preventDefault();
      handleCellSave();
      // Move to next cell horizontally
      if (fieldIndex < fields.length - 1) {
        const nextField = fields[fieldIndex + 1];
        handleCellClick(table, rowIndex, nextField, tableData[rowIndex][nextField]);
      } else if (rowIndex < tableData.length - 1) {
        // Wrap to next row
        const nextField = fields[0];
        handleCellClick(table, rowIndex + 1, nextField, tableData[rowIndex + 1][nextField]);
      }
    } else if (e.key === "Escape") {
      setActiveCell(null);
    }
  };

  // Save WPR Data to Server/API
  const [saving, setSaving] = useState(false);
  const handleSaveChanges = async () => {
    try {
      setSaving(true);
      // Sync milestones to backend
      for (const row of scheduleRows) {
        if (row.id) {
          const payload = {
            subject: row.phase,
            description: row.comments,
            // Convert formatted dates back to ISO
            approvalDate: row.ifaSubDate !== "—" ? new Date(row.ifaSubDate).toISOString() : undefined,
            CDApprovalDate: row.ifcSubDate !== "—" ? new Date(row.ifcSubDate).toISOString() : undefined,
          };
          await Service.EditMilestoneById(row.id, payload);
        }
      }

      // Sync RFIs to backend
      for (const row of rfis) {
        if (row.id) {
          const payload = {
            subject: row.rfiNo,
            status: row.status === "OPEN",
          };
          await Service.EditRFIByID(row.id, payload);
        }
      }

      // Sync Coordination Drawings to backend
      for (const row of coordDrawings) {
        if (row.id) {
          const payload = {
            title: row.title,
            stage: row.stage,
            status: row.status
          };
          await Service.updateCoordinationDrawing(row.id, payload);
        } else {
          // Create new drawing
          const formData = new FormData();
          formData.append("projectId", projectId);
          formData.append("title", row.title);
          formData.append("description", `Created from Weekly Progress Report on ${new Date().toLocaleDateString()}`);
          formData.append("stage", row.stage || "IFA");
          
          const res = await Service.createCoordinationDrawing(formData);
          if (res && res.data && row.status !== "Pending") {
            const newId = res.data.id || res.data._id;
            if (newId) {
              await Service.updateCoordinationDrawing(newId, { status: row.status });
            }
          }
        }
      }

      toast.success("Progress Report updated successfully!");
      if (onUpdate) onUpdate();
    } catch (err) {
      console.error(err);
      toast.error("Failed to sync report data with server");
    } finally {
      setSaving(false);
    }
  };

  // Add new rows to table
  const addRow = (table) => {
    if (table === "rfi") {
      setRfis([...rfis, {
        id: "",
        rfiNo: `RFI #${rfis.length + 1}`,
        sentDate: new Date().toLocaleDateString("en-US"),
        customerResponse: "—",
        responseReceivedDate: "—",
        wbtResponse: "—",
        status: "OPEN"
      }]);
    } else if (table === "schedule") {
      setScheduleRows([...scheduleRows, {
        id: "",
        phase: `New Phase #${scheduleRows.length + 1}`,
        startDate: new Date().toLocaleDateString("en-US"),
        ifaSubDate: "—",
        bfaRecdDate: "—",
        ifcSubDate: "—",
        corSubDate: "—",
        comments: "—"
      }]);
    } else if (table === "co") {
      setCoRows([...coRows, {
        id: "",
        changeOrder: `COR-${String(coRows.length + 1).padStart(3, "0")}`,
        Jan: "", Feb: "", Mar: "", Apr: "", May: "", Jun: "", Jul: "", Aug: "", Sep: "", Oct: "", Nov: "", Dec: "",
        total: "—"
      }]);
    } else if (table === "coordDrawing") {
      setCoordDrawings([...coordDrawings, {
        id: "",
        title: `Drawing #${coordDrawings.length + 1}`,
        stage: "IFA",
        status: "Pending",
        createdAt: new Date().toLocaleDateString("en-US")
      }]);
    }
  };

  // Export spreadsheet using XLSX
  const exportToExcel = () => {
    const workbook = XLSX.utils.book_new();

    // Sheet 1: RFI
    const rfiWS = XLSX.utils.json_to_sheet(rfis.map(r => ({
      "RFI No.": r.rfiNo,
      "Sent Date": r.sentDate,
      "Customer Response": r.customerResponse,
      "Response Received Date": r.responseReceivedDate,
      "Whiteboard Response": r.wbtResponse,
      "Status": r.status
    })));
    XLSX.utils.book_append_sheet(workbook, rfiWS, "RFI Status");

    // Sheet 2: Schedule
    const schedWS = XLSX.utils.json_to_sheet(scheduleRows.map(s => ({
      "Phase": s.phase,
      "Start Date": s.startDate,
      "IFA Submission Date": s.ifaSubDate,
      "BFA Received Date": s.bfaRecdDate,
      "IFC Submission Date": s.ifcSubDate,
      "COR Drawing Sub Date": s.corSubDate,
      "Comments": s.comments
    })));
    XLSX.utils.book_append_sheet(workbook, schedWS, "Project Schedule");

    // Sheet 3: Change Orders
    const coWS = XLSX.utils.json_to_sheet(coRows);
    XLSX.utils.book_append_sheet(workbook, coWS, "Change Orders");

    // Sheet 4: Coordination Drawings
    const coordWS = XLSX.utils.json_to_sheet(coordDrawings.map(cd => ({
      "Drawing Name": cd.title,
      "Stage": cd.stage,
      "Status": cd.status,
      "Date Created": cd.createdAt
    })));
    XLSX.utils.book_append_sheet(workbook, coordWS, "Coordination Drawings");

    XLSX.writeFile(workbook, `${project?.projectName || "Project"}_WPR_Report.xlsx`);
    toast.success("Excel sheet exported successfully!");
  };

  // Export layout to PDF using jsPDF
  const exportToPDF = () => {
    const doc = new jsPDF("landscape", "pt", "a4");

    doc.setFont("Helvetica", "bold");
    doc.setFontSize(16);
    doc.text(`WEEKLY WORK PROGRESS REPORT`, 40, 40);
    
    doc.setFontSize(10);
    doc.setFont("Helvetica", "normal");
    doc.text(`Project Name: ${project?.projectName || project?.name || "—"}`, 40, 60);
    doc.text(`Customer: ${project?.fabricator?.fabName || "—"}`, 40, 75);
    doc.text(`Week Ending: ${weekEnding}`, 40, 90);
    doc.text(`Circulated To: ${circulatedTo}`, 40, 105);

    // Add Schedule Table
    doc.setFont("Helvetica", "bold");
    doc.text("1. Project Schedule / Milestones", 40, 130);
    doc.autoTable({
      startY: 140,
      head: [["Phase", "Start Date", "IFA Sub Date", "BFA Recd Date", "IFC Sub Date", "COR Sub Date", "Comments"]],
      body: scheduleRows.map(s => [s.phase, s.startDate, s.ifaSubDate, s.bfaRecdDate, s.ifcSubDate, s.corSubDate, s.comments]),
      theme: "grid",
      styles: { fontSize: 8 },
      headStyles: { fillColor: [107, 189, 69] }
    });

    // Add RFI Table
    const rfiY = doc.previousAutoTable.finalY + 30;
    doc.text("2. RFIs Overview", 40, rfiY);
    doc.autoTable({
      startY: rfiY + 10,
      head: [["RFI No.", "Sent Date", "Customer Response", "Response Recd Date", "Whiteboard Response", "Status"]],
      body: rfis.map(r => [r.rfiNo, r.sentDate, r.customerResponse, r.responseReceivedDate, r.wbtResponse, r.status]),
      theme: "grid",
      styles: { fontSize: 8 },
      headStyles: { fillColor: [107, 189, 69] }
    });

    // Add Change Orders Table
    const coY = doc.previousAutoTable.finalY + 30;
    let finalCoY = coY;
    if (finalCoY > 500) {
      doc.addPage();
      finalCoY = 40;
    }
    doc.text("3. Change Orders Overview", 40, finalCoY);
    doc.autoTable({
      startY: finalCoY + 10,
      head: [["Change Order", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec", "FY Total"]],
      body: coRows.map(c => [
        c.changeOrder, c.Jan, c.Feb, c.Mar, c.Apr, c.May, c.Jun, c.Jul, c.Aug, c.Sep, c.Oct, c.Nov, c.Dec, c.total
      ]),
      theme: "grid",
      styles: { fontSize: 7, cellPadding: 2 },
      headStyles: { fillColor: [107, 189, 69] }
    });

    // Add Coordination Drawings Table
    const coordY = doc.previousAutoTable.finalY + 30;
    let finalCoordY = coordY;
    if (finalCoordY > 500) {
      doc.addPage();
      finalCoordY = 40;
    }
    doc.text("4. Coordination Drawings Status", 40, finalCoordY);
    doc.autoTable({
      startY: finalCoordY + 10,
      head: [["Drawing Name", "Stage", "Status", "Date Created"]],
      body: coordDrawings.map(cd => [cd.title, cd.stage, cd.status, cd.createdAt]),
      theme: "grid",
      styles: { fontSize: 8 },
      headStyles: { fillColor: [107, 189, 69] }
    });

    doc.save(`${project?.projectName || "Project"}_WPR_Report.pdf`);
    toast.success("PDF report exported successfully!");
  };

  // Print layout handler
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-8 p-1 animate-in fade-in slide-in-from-bottom-2 duration-500">
      
      {/* ── ACTION TOOLBAR ── */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-50 border border-black p-4 rounded-2xl shadow-sm shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-2.5 h-6 bg-[#6bbd45] rounded-full" />
          <h2 className="text-md font-black uppercase tracking-widest text-slate-700">WPR Spreadsheet Control</h2>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {canEdit && (
            <button
              onClick={handleSaveChanges}
              disabled={saving}
              className="flex items-center gap-2 px-5 py-2.5 bg-[#6bbd45]/15 border border-[#6bbd45] rounded-xl text-xs font-black uppercase tracking-widest hover:bg-[#6bbd45]/30 text-black shadow-sm transition-all"
            >
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              Save Changes
            </button>
          )}
          <button
            onClick={exportToExcel}
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-50 border border-blue-200 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-blue-100 text-blue-700 shadow-sm transition-all"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            Excel Export
          </button>
          <button
            onClick={exportToPDF}
            className="flex items-center gap-2 px-5 py-2.5 bg-red-50 border border-red-200 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-red-100 text-red-700 shadow-sm transition-all"
          >
            <Download className="w-3.5 h-3.5" />
            PDF Export
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-5 py-2.5 bg-gray-100 border border-gray-300 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-gray-200 text-gray-700 shadow-sm transition-all"
          >
            <Printer className="w-3.5 h-3.5" />
            Print Report
          </button>
        </div>
      </div>

      {/* ── REPORT METADATA GRID (SPREADSHEET HEADER) ── */}
      <div className="bg-white border-2 border-black rounded-2xl overflow-hidden shadow-md">
        <div className="p-4 bg-[#6bbd45]/10 border-b border-black flex justify-between items-center">
          <div className="flex items-center gap-3">
            <FileText className="text-[#6bbd45]" />
            <span className="text-sm font-black uppercase tracking-[0.2em] text-black">WPR Report Metadata</span>
          </div>
          <span className="text-[10px] font-black uppercase tracking-widest border-2 border-black px-3 py-1 rounded-md bg-white">
            FORM NO: WBT/PMO/WPR-001
          </span>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
          <div className="space-y-1.5">
            <span className="block text-[10px] font-black uppercase tracking-widest text-slate-400">Week Ending Date</span>
            <input 
              type="text" 
              value={weekEnding} 
              onChange={(e) => setWeekEnding(e.target.value)}
              className="w-full px-4 py-2.5 border-2 border-slate-100 rounded-xl font-bold outline-none focus:border-[#6bbd45] transition-all text-sm uppercase"
            />
          </div>
          <div className="space-y-1.5">
            <span className="block text-[10px] font-black uppercase tracking-widest text-slate-400">Customer</span>
            <div className="px-4 py-2.5 border-2 border-slate-100 bg-slate-50/50 rounded-xl font-bold text-sm uppercase text-slate-700">
              {project?.fabricator?.fabName || "—"}
            </div>
          </div>
          <div className="space-y-1.5">
            <span className="block text-[10px] font-black uppercase tracking-widest text-slate-400">Project Name</span>
            <div className="px-4 py-2.5 border-2 border-slate-100 bg-slate-50/50 rounded-xl font-bold text-sm uppercase text-slate-700 truncate">
              {project?.projectName || project?.name || "—"}
            </div>
          </div>
          <div className="space-y-1.5">
            <span className="block text-[10px] font-black uppercase tracking-widest text-slate-400">WBT Project Manager</span>
            <div className="px-4 py-2.5 border-2 border-slate-100 bg-slate-50/50 rounded-xl font-bold text-sm uppercase text-slate-700">
              {project?.manager ? `${project.manager.firstName} ${project.manager.lastName}` : "—"}
            </div>
          </div>
          <div className="space-y-1.5">
            <span className="block text-[10px] font-black uppercase tracking-widest text-slate-400">Fabricator Project Manager</span>
            <input 
              type="text" 
              value={fabProjectManager} 
              onChange={(e) => setFabProjectManager(e.target.value)}
              className="w-full px-4 py-2.5 border-2 border-slate-100 rounded-xl font-bold outline-none focus:border-[#6bbd45] transition-all text-sm uppercase"
            />
          </div>
          <div className="space-y-1.5">
            <span className="block text-[10px] font-black uppercase tracking-widest text-slate-400">Report Circulated To</span>
            <input 
              type="text" 
              value={circulatedTo} 
              onChange={(e) => setCirculatedTo(e.target.value)}
              className="w-full px-4 py-2.5 border-2 border-slate-100 rounded-xl font-bold outline-none focus:border-[#6bbd45] transition-all text-sm uppercase"
            />
          </div>
          <div className="space-y-1.5">
            <span className="block text-[10px] font-black uppercase tracking-widest text-slate-400">Software</span>
            <input 
              type="text" 
              value={software} 
              onChange={(e) => setSoftware(e.target.value)}
              className="w-full px-4 py-2.5 border-2 border-slate-100 rounded-xl font-bold outline-none focus:border-[#6bbd45] transition-all text-sm uppercase"
            />
          </div>
          <div className="space-y-1.5">
            <span className="block text-[10px] font-black uppercase tracking-widest text-slate-400">Project Awarded</span>
            <div className="px-4 py-2.5 border-2 border-slate-100 bg-slate-50/50 rounded-xl font-bold text-sm uppercase text-slate-700">
              {project?.startDate ? new Date(project.startDate).toLocaleDateString() : "—"}
            </div>
          </div>
          <div className="space-y-1.5">
            <span className="block text-[10px] font-black uppercase tracking-widest text-slate-400">Fab Released Date</span>
            <div className="px-4 py-2.5 border-2 border-slate-100 bg-slate-50/50 rounded-xl font-bold text-sm uppercase text-slate-700">
              {project?.fabricationDate ? new Date(project.fabricationDate).toLocaleDateString() : "—"}
            </div>
          </div>
        </div>
      </div>

      {/* ── 1. PROJECT SCHEDULE & MILESTONES TABLE ── */}
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <CheckCircle className="text-[#6bbd45] w-5 h-5" />
            <h3 className="text-md font-black uppercase tracking-widest text-slate-700">1. Project Schedule / Milestones</h3>
          </div>
          {canEdit && (
            <button
              onClick={() => addRow("schedule")}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-green-50 hover:bg-green-100 border border-green-200 text-green-700 rounded-lg text-xs font-bold uppercase transition-all shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Row
            </button>
          )}
        </div>

        <div className="overflow-x-auto border border-black/15 rounded-2xl bg-white shadow-sm custom-scrollbar max-w-full">
          <table className="w-full text-left border-collapse min-w-[800px] text-xs">
            <thead>
              <tr className="bg-slate-100 border-b border-black/10">
                <th className="p-3 font-black uppercase tracking-wider text-slate-500 border-r border-black/5">Phase</th>
                <th className="p-3 font-black uppercase tracking-wider text-slate-500 border-r border-black/5 w-28">Start Date</th>
                <th className="p-3 font-black uppercase tracking-wider text-slate-500 border-r border-black/5 w-40">IFA - Submission Date</th>
                <th className="p-3 font-black uppercase tracking-wider text-slate-500 border-r border-black/5 w-36">BFA - Recd Date</th>
                <th className="p-3 font-black uppercase tracking-wider text-slate-500 border-r border-black/5 w-40">IFC - Sub Date</th>
                <th className="p-3 font-black uppercase tracking-wider text-slate-500 border-r border-black/5 w-44">COR Drawing Sub Date</th>
                <th className="p-3 font-black uppercase tracking-wider text-slate-500">Comments</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5">
              {scheduleRows.map((row, rowIndex) => (
                <tr key={row.id || rowIndex} className="hover:bg-slate-50 transition-all">
                  {/* Phase cell */}
                  <td 
                    onClick={() => handleCellClick("schedule", rowIndex, "phase", row.phase)}
                    className="p-3 font-black border-r border-black/5 cursor-pointer hover:bg-slate-100/50"
                  >
                    {activeCell?.table === "schedule" && activeCell.rowIndex === rowIndex && activeCell.field === "phase" ? (
                      <input
                        ref={inputRef}
                        type="text"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onBlur={handleCellSave}
                        onKeyDown={handleKeyDown}
                        className="w-full bg-white border border-[#6bbd45] px-2 py-1 rounded font-bold uppercase text-xs"
                      />
                    ) : (
                      <span className="uppercase">{row.phase}</span>
                    )}
                  </td>

                  {/* Start Date */}
                  <td 
                    onClick={() => handleCellClick("schedule", rowIndex, "startDate", row.startDate)}
                    className="p-3 border-r border-black/5 font-semibold text-slate-600 cursor-pointer hover:bg-slate-100/50"
                  >
                    {activeCell?.table === "schedule" && activeCell.rowIndex === rowIndex && activeCell.field === "startDate" ? (
                      <input
                        ref={inputRef}
                        type="text"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onBlur={handleCellSave}
                        onKeyDown={handleKeyDown}
                        className="w-full bg-white border border-[#6bbd45] px-2 py-1 rounded text-xs"
                      />
                    ) : (
                      <span>{row.startDate}</span>
                    )}
                  </td>

                  {/* IFA submission date */}
                  <td 
                    onClick={() => handleCellClick("schedule", rowIndex, "ifaSubDate", row.ifaSubDate)}
                    className="p-3 border-r border-black/5 font-semibold text-slate-600 cursor-pointer hover:bg-slate-100/50"
                  >
                    {activeCell?.table === "schedule" && activeCell.rowIndex === rowIndex && activeCell.field === "ifaSubDate" ? (
                      <input
                        ref={inputRef}
                        type="text"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onBlur={handleCellSave}
                        onKeyDown={handleKeyDown}
                        className="w-full bg-white border border-[#6bbd45] px-2 py-1 rounded text-xs"
                      />
                    ) : (
                      <span>{row.ifaSubDate}</span>
                    )}
                  </td>

                  {/* BFA date */}
                  <td 
                    onClick={() => handleCellClick("schedule", rowIndex, "bfaRecdDate", row.bfaRecdDate)}
                    className="p-3 border-r border-black/5 font-semibold text-slate-600 cursor-pointer hover:bg-slate-100/50"
                  >
                    {activeCell?.table === "schedule" && activeCell.rowIndex === rowIndex && activeCell.field === "bfaRecdDate" ? (
                      <input
                        ref={inputRef}
                        type="text"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onBlur={handleCellSave}
                        onKeyDown={handleKeyDown}
                        className="w-full bg-white border border-[#6bbd45] px-2 py-1 rounded text-xs"
                      />
                    ) : (
                      <span>{row.bfaRecdDate}</span>
                    )}
                  </td>

                  {/* IFC sub date */}
                  <td 
                    onClick={() => handleCellClick("schedule", rowIndex, "ifcSubDate", row.ifcSubDate)}
                    className="p-3 border-r border-black/5 font-semibold text-slate-600 cursor-pointer hover:bg-slate-100/50"
                  >
                    {activeCell?.table === "schedule" && activeCell.rowIndex === rowIndex && activeCell.field === "ifcSubDate" ? (
                      <input
                        ref={inputRef}
                        type="text"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onBlur={handleCellSave}
                        onKeyDown={handleKeyDown}
                        className="w-full bg-white border border-[#6bbd45] px-2 py-1 rounded text-xs"
                      />
                    ) : (
                      <span>{row.ifcSubDate}</span>
                    )}
                  </td>

                  {/* COR Sub date */}
                  <td 
                    onClick={() => handleCellClick("schedule", rowIndex, "corSubDate", row.corSubDate)}
                    className="p-3 border-r border-black/5 font-semibold text-slate-600 cursor-pointer hover:bg-slate-100/50"
                  >
                    {activeCell?.table === "schedule" && activeCell.rowIndex === rowIndex && activeCell.field === "corSubDate" ? (
                      <input
                        ref={inputRef}
                        type="text"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onBlur={handleCellSave}
                        onKeyDown={handleKeyDown}
                        className="w-full bg-white border border-[#6bbd45] px-2 py-1 rounded text-xs"
                      />
                    ) : (
                      <span>{row.corSubDate}</span>
                    )}
                  </td>

                  {/* Comments */}
                  <td 
                    onClick={() => handleCellClick("schedule", rowIndex, "comments", row.comments)}
                    className="p-3 font-semibold text-slate-700 cursor-pointer hover:bg-slate-100/50"
                  >
                    {activeCell?.table === "schedule" && activeCell.rowIndex === rowIndex && activeCell.field === "comments" ? (
                      <input
                        ref={inputRef}
                        type="text"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onBlur={handleCellSave}
                        onKeyDown={handleKeyDown}
                        className="w-full bg-white border border-[#6bbd45] px-2 py-1 rounded text-xs"
                      />
                    ) : (
                      <span>{row.comments}</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── 2. RFIs OVERVIEW TABLE ── */}
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <HelpCircle className="text-[#6bbd45] w-5 h-5" />
            <h3 className="text-md font-black uppercase tracking-widest text-slate-700">2. RFI Status Overview</h3>
          </div>
          {canEdit && (
            <button
              onClick={() => addRow("rfi")}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-green-50 hover:bg-green-100 border border-green-200 text-green-700 rounded-lg text-xs font-bold uppercase transition-all shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Row
            </button>
          )}
        </div>

        <div className="overflow-x-auto border border-black/15 rounded-2xl bg-white shadow-sm custom-scrollbar max-w-full">
          <table className="w-full text-left border-collapse min-w-[800px] text-xs">
            <thead>
              <tr className="bg-slate-100 border-b border-black/10">
                <th className="p-3 font-black uppercase tracking-wider text-slate-500 border-r border-black/5 w-24">RFI No.</th>
                <th className="p-3 font-black uppercase tracking-wider text-slate-500 border-r border-black/5 w-28">Sent Date</th>
                <th className="p-3 font-black uppercase tracking-wider text-slate-500 border-r border-black/5">Customer Response</th>
                <th className="p-3 font-black uppercase tracking-wider text-slate-500 border-r border-black/5 w-36">Response Received</th>
                <th className="p-3 font-black uppercase tracking-wider text-slate-500 border-r border-black/5">Whiteboard Response</th>
                <th className="p-3 font-black uppercase tracking-wider text-slate-500 w-24">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5">
              {rfis.map((row, rowIndex) => (
                <tr key={row.id || rowIndex} className="hover:bg-slate-50 transition-all">
                  {/* RFI No. */}
                  <td 
                    onClick={() => handleCellClick("rfi", rowIndex, "rfiNo", row.rfiNo)}
                    className="p-3 font-black border-r border-black/5 cursor-pointer hover:bg-slate-100/50"
                  >
                    {activeCell?.table === "rfi" && activeCell.rowIndex === rowIndex && activeCell.field === "rfiNo" ? (
                      <input
                        ref={inputRef}
                        type="text"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onBlur={handleCellSave}
                        onKeyDown={handleKeyDown}
                        className="w-full bg-white border border-[#6bbd45] px-2 py-1 rounded font-bold text-xs"
                      />
                    ) : (
                      <span>{row.rfiNo}</span>
                    )}
                  </td>

                  {/* Sent Date */}
                  <td 
                    onClick={() => handleCellClick("rfi", rowIndex, "sentDate", row.sentDate)}
                    className="p-3 border-r border-black/5 font-semibold text-slate-600 cursor-pointer hover:bg-slate-100/50"
                  >
                    {activeCell?.table === "rfi" && activeCell.rowIndex === rowIndex && activeCell.field === "sentDate" ? (
                      <input
                        ref={inputRef}
                        type="text"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onBlur={handleCellSave}
                        onKeyDown={handleKeyDown}
                        className="w-full bg-white border border-[#6bbd45] px-2 py-1 rounded text-xs"
                      />
                    ) : (
                      <span>{row.sentDate}</span>
                    )}
                  </td>

                  {/* Customer Response */}
                  <td 
                    onClick={() => handleCellClick("rfi", rowIndex, "customerResponse", row.customerResponse)}
                    className="p-3 border-r border-black/5 font-semibold text-slate-700 cursor-pointer hover:bg-slate-100/50"
                  >
                    {activeCell?.table === "rfi" && activeCell.rowIndex === rowIndex && activeCell.field === "customerResponse" ? (
                      <textarea
                        ref={inputRef}
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onBlur={handleCellSave}
                        onKeyDown={handleKeyDown}
                        className="w-full bg-white border border-[#6bbd45] px-2 py-1 rounded text-xs"
                      />
                    ) : (
                      <span>{row.customerResponse}</span>
                    )}
                  </td>

                  {/* Response Recd Date */}
                  <td 
                    onClick={() => handleCellClick("rfi", rowIndex, "responseReceivedDate", row.responseReceivedDate)}
                    className="p-3 border-r border-black/5 font-semibold text-slate-600 cursor-pointer hover:bg-slate-100/50"
                  >
                    {activeCell?.table === "rfi" && activeCell.rowIndex === rowIndex && activeCell.field === "responseReceivedDate" ? (
                      <input
                        ref={inputRef}
                        type="text"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onBlur={handleCellSave}
                        onKeyDown={handleKeyDown}
                        className="w-full bg-white border border-[#6bbd45] px-2 py-1 rounded text-xs"
                      />
                    ) : (
                      <span>{row.responseReceivedDate}</span>
                    )}
                  </td>

                  {/* WBT Response */}
                  <td 
                    onClick={() => handleCellClick("rfi", rowIndex, "wbtResponse", row.wbtResponse)}
                    className="p-3 border-r border-black/5 font-semibold text-slate-700 cursor-pointer hover:bg-slate-100/50"
                  >
                    {activeCell?.table === "rfi" && activeCell.rowIndex === rowIndex && activeCell.field === "wbtResponse" ? (
                      <textarea
                        ref={inputRef}
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onBlur={handleCellSave}
                        onKeyDown={handleKeyDown}
                        className="w-full bg-white border border-[#6bbd45] px-2 py-1 rounded text-xs"
                      />
                    ) : (
                      <span>{row.wbtResponse}</span>
                    )}
                  </td>

                  {/* Status */}
                  <td 
                    onClick={() => handleCellClick("rfi", rowIndex, "status", row.status)}
                    className="p-3 font-black text-xs cursor-pointer hover:bg-slate-100/50"
                  >
                    {activeCell?.table === "rfi" && activeCell.rowIndex === rowIndex && activeCell.field === "status" ? (
                      <select
                        ref={inputRef}
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onBlur={handleCellSave}
                        onKeyDown={handleKeyDown}
                        className="w-full bg-white border border-[#6bbd45] px-1 py-1 rounded text-xs uppercase font-black"
                      >
                        <option value="OPEN">OPEN</option>
                        <option value="Closed">Closed</option>
                      </select>
                    ) : (
                      <span className={`px-2 py-1 rounded border border-black ${row.status === "OPEN" ? "bg-orange-50 text-orange-700" : "bg-green-50 text-green-700"}`}>
                        {row.status}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── 3. CHANGE ORDER AMOUNT GRID ── */}
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Clock className="text-[#6bbd45] w-5 h-5" />
            <h3 className="text-md font-black uppercase tracking-widest text-slate-700">3. Change Order Amount ($) Monthly Breakdown</h3>
          </div>
          {canEdit && (
            <button
              onClick={() => addRow("co")}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-green-50 hover:bg-green-100 border border-green-200 text-green-700 rounded-lg text-xs font-bold uppercase transition-all shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Row
            </button>
          )}
        </div>

        <div className="overflow-x-auto border border-black/15 rounded-2xl bg-white shadow-sm custom-scrollbar max-w-full">
          <table className="w-full text-center border-collapse min-w-[1000px] text-xs">
            <thead>
              <tr className="bg-slate-100 border-b border-black/10">
                <th className="p-3 text-left font-black uppercase tracking-wider text-slate-500 border-r border-black/5">Change Order</th>
                {["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"].map(m => (
                  <th key={m} className="p-3 font-black uppercase tracking-wider text-slate-500 border-r border-black/5">{m}</th>
                ))}
                <th className="p-3 font-black uppercase tracking-wider text-slate-500">FY Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5 font-semibold text-slate-600">
              {coRows.map((row, rowIndex) => (
                <tr key={row.id || rowIndex} className="hover:bg-slate-50 transition-all">
                  {/* CO number name */}
                  <td 
                    onClick={() => handleCellClick("co", rowIndex, "changeOrder", row.changeOrder)}
                    className="p-3 text-left font-black text-black border-r border-black/5 cursor-pointer hover:bg-slate-100/50"
                  >
                    {activeCell?.table === "co" && activeCell.rowIndex === rowIndex && activeCell.field === "changeOrder" ? (
                      <input
                        ref={inputRef}
                        type="text"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onBlur={handleCellSave}
                        onKeyDown={handleKeyDown}
                        className="w-full bg-white border border-[#6bbd45] px-2 py-1 rounded font-bold text-xs"
                      />
                    ) : (
                      <span>{row.changeOrder}</span>
                    )}
                  </td>

                  {/* Monthly amount columns */}
                  {["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"].map(m => (
                    <td 
                      key={m}
                      onClick={() => handleCellClick("co", rowIndex, m, row[m])}
                      className="p-3 border-r border-black/5 cursor-pointer hover:bg-slate-100/50 text-slate-800"
                    >
                      {activeCell?.table === "co" && activeCell.rowIndex === rowIndex && activeCell.field === m ? (
                        <input
                          ref={inputRef}
                          type="text"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onBlur={handleCellSave}
                          onKeyDown={handleKeyDown}
                          className="w-8/12 bg-white border border-[#6bbd45] px-1 py-0.5 rounded text-center text-xs"
                        />
                      ) : (
                        <span className={row[m] === "Sent" ? "text-blue-500 font-bold" : ""}>{row[m] || "—"}</span>
                      )}
                    </td>
                  ))}

                  {/* Total */}
                  <td className="p-3 font-black text-black">{row.total}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── 4. COORDINATION DRAWINGS STATUS TABLE ── */}
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Compass className="text-[#6bbd45] w-5 h-5" />
            <h3 className="text-md font-black uppercase tracking-widest text-slate-700">4. Coordination Drawings Status</h3>
          </div>
          {canEdit && (
            <button
              onClick={() => addRow("coordDrawing")}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-green-50 hover:bg-green-100 border border-green-200 text-green-700 rounded-lg text-xs font-bold uppercase transition-all shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Row
            </button>
          )}
        </div>

        <div className="overflow-x-auto border border-black/15 rounded-2xl bg-white shadow-sm custom-scrollbar max-w-full">
          <table className="w-full text-left border-collapse min-w-[800px] text-xs">
            <thead>
              <tr className="bg-slate-100 border-b border-black/10">
                <th className="p-3 font-black uppercase tracking-wider text-slate-500 border-r border-black/5">Drawing Name</th>
                <th className="p-3 font-black uppercase tracking-wider text-slate-500 border-r border-black/5 w-32">Stage</th>
                <th className="p-3 font-black uppercase tracking-wider text-slate-500 border-r border-black/5 w-36">Status</th>
                <th className="p-3 font-black uppercase tracking-wider text-slate-500 w-44">Date Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5">
              {coordDrawings.map((row, rowIndex) => (
                <tr key={row.id || rowIndex} className="hover:bg-slate-50 transition-all">
                  {/* Drawing Name */}
                  <td 
                    onClick={() => handleCellClick("coordDrawing", rowIndex, "title", row.title)}
                    className="p-3 font-black border-r border-black/5 cursor-pointer hover:bg-slate-100/50"
                  >
                    {activeCell?.table === "coordDrawing" && activeCell.rowIndex === rowIndex && activeCell.field === "title" ? (
                      <input
                        ref={inputRef}
                        type="text"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onBlur={handleCellSave}
                        onKeyDown={handleKeyDown}
                        className="w-full bg-white border border-[#6bbd45] px-2 py-1 rounded font-bold text-xs"
                      />
                    ) : (
                      <span className="uppercase">{row.title}</span>
                    )}
                  </td>

                  {/* Stage */}
                  <td 
                    onClick={() => handleCellClick("coordDrawing", rowIndex, "stage", row.stage)}
                    className="p-3 border-r border-black/5 font-semibold text-slate-600 cursor-pointer hover:bg-slate-100/50"
                  >
                    {activeCell?.table === "coordDrawing" && activeCell.rowIndex === rowIndex && activeCell.field === "stage" ? (
                      <select
                        ref={inputRef}
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onBlur={handleCellSave}
                        onKeyDown={handleKeyDown}
                        className="w-full bg-white border border-[#6bbd45] px-1 py-1 rounded text-xs uppercase font-black"
                      >
                        <option value="IFA">IFA</option>
                        <option value="IFC">IFC</option>
                        <option value="RE-IFA">RE-IFA</option>
                        <option value="RIFC">RIFC</option>
                      </select>
                    ) : (
                      <span>{row.stage}</span>
                    )}
                  </td>

                  {/* Status */}
                  <td 
                    onClick={() => handleCellClick("coordDrawing", rowIndex, "status", row.status)}
                    className="p-3 border-r border-black/5 font-black text-xs cursor-pointer hover:bg-slate-100/50"
                  >
                    {activeCell?.table === "coordDrawing" && activeCell.rowIndex === rowIndex && activeCell.field === "status" ? (
                      <select
                        ref={inputRef}
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onBlur={handleCellSave}
                        onKeyDown={handleKeyDown}
                        className="w-full bg-white border border-[#6bbd45] px-1 py-1 rounded text-xs uppercase font-black"
                      >
                        <option value="Pending">Pending</option>
                        <option value="In Review">In Review</option>
                        <option value="Approved">Approved</option>
                      </select>
                    ) : (
                      <span className={`px-2 py-1 rounded border border-black ${row.status === "Approved" ? "bg-green-50 text-green-700" : "bg-orange-50 text-orange-700"}`}>
                        {row.status}
                      </span>
                    )}
                  </td>

                  {/* Date Created */}
                  <td 
                    onClick={() => handleCellClick("coordDrawing", rowIndex, "createdAt", row.createdAt)}
                    className="p-3 font-semibold text-slate-600 cursor-pointer hover:bg-slate-100/50"
                  >
                    {activeCell?.table === "coordDrawing" && activeCell.rowIndex === rowIndex && activeCell.field === "createdAt" ? (
                      <input
                        ref={inputRef}
                        type="text"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onBlur={handleCellSave}
                        onKeyDown={handleKeyDown}
                        className="w-full bg-white border border-[#6bbd45] px-2 py-1 rounded text-xs"
                      />
                    ) : (
                      <span>{row.createdAt}</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
    </div>
  );
};

export default WorkProgressReport;
