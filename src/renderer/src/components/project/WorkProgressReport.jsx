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

  // Raw grids local states (unfiltered)
  const [rawRfis, setRawRfis] = useState([]);
  const [rawScheduleRows, setRawScheduleRows] = useState([]);
  const [rawCoRows, setRawCoRows] = useState([]);
  const [rawCoordDrawings, setRawCoordDrawings] = useState([]);

  // Selected week state
  const [selectedWeek, setSelectedWeek] = useState("All");

  // Keyboard navigation & Editing Cell state
  // format: { table: 'rfi'|'schedule'|'co'|'coordDrawing', rowId: string, field: string }
  const [activeCell, setActiveCell] = useState(null);
  const [editValue, setEditValue] = useState("");
  const inputRef = useRef(null);

  // Date helper functions for week calculation
  const getMonday = (d) => {
    const date = new Date(d);
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
    const monday = new Date(date.setDate(diff));
    monday.setHours(0, 0, 0, 0);
    return monday;
  };

  const getSunday = (d) => {
    const mon = getMonday(d);
    const sun = new Date(mon);
    sun.setDate(mon.getDate() + 6);
    sun.setHours(23, 59, 59, 999);
    return sun;
  };

  const isWithinWeek = (dateStr, start, end) => {
    if (!dateStr || dateStr === "—" || dateStr === "Waiting...") return false;
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return false;
    return d >= start && d <= end;
  };

  // Generate Available Weeks from Project Start Date to End Date / Today
  const projectWeeks = useMemo(() => {
    if (!project || !project.startDate) return [];
    
    const start = new Date(project.startDate);
    if (isNaN(start.getTime())) return [];
    
    let end = new Date();
    if (project.fabricationDate) {
      const fabDate = new Date(project.fabricationDate);
      if (!isNaN(fabDate.getTime())) {
        end = fabDate;
      }
    } else if (project.endDate) {
      const eDate = new Date(project.endDate);
      if (!isNaN(eDate.getTime())) {
        end = eDate;
      }
    }
    
    // Ensure the current week is always covered
    const todaySunday = getSunday(new Date());
    if (end < todaySunday) {
      end = todaySunday;
    }
    
    const startMon = getMonday(start);
    const endSun = getSunday(end);
    
    const weeks = [];
    let currentMon = new Date(startMon);
    
    while (currentMon <= endSun) {
      const currentSun = getSunday(currentMon);
      const label = `Week ${weeks.length + 1} (${currentMon.toLocaleDateString("en-US", { month: "short", day: "numeric" })} - ${currentSun.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })})`;
      
      weeks.push({
        index: weeks.length + 1,
        start: new Date(currentMon),
        end: new Date(currentSun),
        label
      });
      
      currentMon.setDate(currentMon.getDate() + 7);
    }
    
    return weeks;
  }, [project]);

  // Set default week ending date to current week
  useEffect(() => {
    if (projectWeeks.length > 0 && selectedWeek === "All") {
      const today = new Date();
      const current = projectWeeks.find(w => today >= w.start && today <= w.end);
      if (current) {
        setSelectedWeek(current.label);
        setWeekEnding(current.end.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }));
      } else {
        setSelectedWeek("All");
        const sunday = getSunday(today);
        setWeekEnding(sunday.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }));
      }
    } else if (selectedWeek === "All") {
      const d = new Date();
      const sunday = getSunday(d);
      setWeekEnding(sunday.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }));
    }
  }, [projectWeeks]);

  const handleWeekChange = (label) => {
    setSelectedWeek(label);
    if (label === "All") {
      const d = new Date();
      const sunday = getSunday(d);
      setWeekEnding(sunday.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }));
    } else {
      const wk = projectWeeks.find(w => w.label === label);
      if (wk) {
        setWeekEnding(wk.end.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }));
      }
    }
  };

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

    setRawRfis(formattedRFIs);
  }, [rfiData]);

  // Sync Schedule (Milestones mapped to Submittals)
  useEffect(() => {
    const rows = milestones.map((m) => {
      const milestoneSubmittals = submittalData.filter(
        sub => String(sub.mileStoneId || sub.milestoneId || sub.milestone?.id) === String(m.id || m._id)
      );

      const ifaSub = milestoneSubmittals.find(s => String(s.stage).toUpperCase() === "IFA");
      const ifcSub = milestoneSubmittals.find(s => String(s.stage).toUpperCase() === "IFC");
      const corSub = milestoneSubmittals.find(s => ["CO", "COR"].includes(String(s.stage).toUpperCase()));

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

    setRawScheduleRows(rows);
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
        createdAt: co.createdAt || co.date || new Date().toISOString(),
        changeOrder: co.changeOrderNumber ? `COR-${co.changeOrderNumber.slice(-3)}` : "COR-New",
        ...monthlyBreakdown,
        total: amount > 0 ? `$${amount.toLocaleString()}` : "—"
      };
    });

    setRawCoRows(rows);
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
      setRawCoordDrawings(formattedDrawings);
    }
  }, [coordinationDrawings]);

  // Filtered Datasets based on selected week
  const activeWeekRange = useMemo(() => {
    if (selectedWeek === "All") return null;
    return projectWeeks.find(w => w.label === selectedWeek) || null;
  }, [selectedWeek, projectWeeks]);

  const filteredRfis = useMemo(() => {
    if (!activeWeekRange) return rawRfis;
    return rawRfis.filter(r => 
      isWithinWeek(r.sentDate, activeWeekRange.start, activeWeekRange.end) ||
      isWithinWeek(r.responseReceivedDate, activeWeekRange.start, activeWeekRange.end)
    );
  }, [rawRfis, activeWeekRange]);

  const filteredScheduleRows = useMemo(() => {
    if (!activeWeekRange) return rawScheduleRows;
    return rawScheduleRows.filter(s => 
      isWithinWeek(s.startDate, activeWeekRange.start, activeWeekRange.end) ||
      isWithinWeek(s.ifaSubDate, activeWeekRange.start, activeWeekRange.end) ||
      isWithinWeek(s.bfaRecdDate, activeWeekRange.start, activeWeekRange.end) ||
      isWithinWeek(s.ifcSubDate, activeWeekRange.start, activeWeekRange.end) ||
      isWithinWeek(s.corSubDate, activeWeekRange.start, activeWeekRange.end)
    );
  }, [rawScheduleRows, activeWeekRange]);

  const filteredCoRows = useMemo(() => {
    if (!activeWeekRange) return rawCoRows;
    return rawCoRows.filter(c => isWithinWeek(c.createdAt, activeWeekRange.start, activeWeekRange.end));
  }, [rawCoRows, activeWeekRange]);

  const filteredCoordDrawings = useMemo(() => {
    if (!activeWeekRange) return rawCoordDrawings;
    return rawCoordDrawings.filter(cd => isWithinWeek(cd.createdAt, activeWeekRange.start, activeWeekRange.end));
  }, [rawCoordDrawings, activeWeekRange]);

  // Handle cell double-click
  const handleCellClick = (table, rowId, field, value) => {
    if (!canEdit) return;
    setActiveCell({ table, rowId, field });
    setEditValue(value);
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  // Save cell edit
  const handleCellSave = () => {
    if (!activeCell) return;
    const { table, rowId, field } = activeCell;

    if (table === "rfi") {
      const updated = rawRfis.map(row => {
        if (row.id === rowId) {
          return { ...row, [field]: editValue };
        }
        return row;
      });
      setRawRfis(updated);
    } else if (table === "schedule") {
      const updated = rawScheduleRows.map(row => {
        if (row.id === rowId) {
          return { ...row, [field]: editValue };
        }
        return row;
      });
      setRawScheduleRows(updated);
    } else if (table === "co") {
      const updated = rawCoRows.map(row => {
        if (row.id === rowId) {
          const newRow = { ...row, [field]: editValue };
          // Recompute total if month was changed
          const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
          let sum = 0;
          months.forEach(m => {
            const val = newRow[m]?.replace(/[^0-9.]/g, "");
            if (val) sum += Number(val);
          });
          newRow.total = sum > 0 ? `$${sum.toLocaleString()}` : "—";
          return newRow;
        }
        return row;
      });
      setRawCoRows(updated);
    } else if (table === "coordDrawing") {
      const updated = rawCoordDrawings.map(row => {
        if (row.id === rowId) {
          return { ...row, [field]: editValue };
        }
        return row;
      });
      setRawCoordDrawings(updated);
    }
    setActiveCell(null);
  };

  // Keyboard Navigation inside table cells
  const handleKeyDown = (e) => {
    if (!activeCell) return;
    const { table, rowId, field } = activeCell;
    const tableData = 
      table === "rfi" 
        ? filteredRfis 
        : table === "schedule" 
        ? filteredScheduleRows 
        : table === "co" 
        ? filteredCoRows 
        : filteredCoordDrawings;
    const rowIndex = tableData.findIndex(row => row.id === rowId);
    if (rowIndex === -1) return;

    const fields = Object.keys(tableData[0]).filter(k => k !== "id" && k !== "createdAt");
    const fieldIndex = fields.indexOf(field);

    if (e.key === "Enter") {
      handleCellSave();
      if (rowIndex < tableData.length - 1) {
        const nextRow = tableData[rowIndex + 1];
        handleCellClick(table, nextRow.id, field, nextRow[field]);
      }
    } else if (e.key === "Tab") {
      e.preventDefault();
      handleCellSave();
      if (fieldIndex < fields.length - 1) {
        const nextField = fields[fieldIndex + 1];
        handleCellClick(table, rowId, nextField, tableData[rowIndex][nextField]);
      } else if (rowIndex < tableData.length - 1) {
        const nextRow = tableData[rowIndex + 1];
        const nextField = fields[0];
        handleCellClick(table, nextRow.id, nextField, nextRow[nextField]);
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
      for (const row of rawScheduleRows) {
        const payload = {
          projectId: projectId,
          subject: row.phase,
          description: row.comments,
          date: row.startDate !== "—" ? new Date(row.startDate).toISOString() : new Date().toISOString(),
          approvalDate: row.ifaSubDate !== "—" ? new Date(row.ifaSubDate).toISOString() : undefined,
          CDApprovalDate: row.ifcSubDate !== "—" ? new Date(row.ifcSubDate).toISOString() : undefined,
        };
        if (row.id && !String(row.id).startsWith("temp-")) {
          await Service.EditMilestoneById(row.id, payload);
        } else {
          await Service.AddProjectMilestone(payload);
        }
      }

      // Sync RFIs to backend
      for (const row of rawRfis) {
        if (row.id && !String(row.id).startsWith("temp-")) {
          const payload = {
            subject: row.rfiNo,
            status: row.status === "OPEN",
          };
          await Service.EditRFIByID(row.id, payload);
        } else {
          const formData = new FormData();
          formData.append("projectId", projectId);
          formData.append("subject", row.rfiNo);
          formData.append("description", "Created from Weekly Progress Report");
          formData.append("date", row.sentDate !== "—" ? new Date(row.sentDate).toISOString() : new Date().toISOString());
          await Service.addRFI(formData);
        }
      }

      // Sync Coordination Drawings to backend
      for (const row of rawCoordDrawings) {
        if (row.id && !String(row.id).startsWith("temp-")) {
          const payload = {
            title: row.title,
            stage: row.stage,
            status: row.status
          };
          await Service.updateCoordinationDrawing(row.id, payload);
        } else {
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

      // Sync Change Orders
      for (const row of rawCoRows) {
        if (row.id && String(row.id).startsWith("temp-")) {
          const formData = new FormData();
          formData.append("projectId", projectId);
          formData.append("changeOrderNumber", row.changeOrder.replace("COR-", ""));
          formData.append("description", "Created from Weekly Progress Report");
          let sum = 0;
          const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
          months.forEach(m => {
            const val = row[m]?.replace(/[^0-9.]/g, "");
            if (val) sum += Number(val);
          });
          formData.append("totalCost", sum);
          await Service.ChangeOrder(formData);
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
    const defaultDate = activeWeekRange 
      ? activeWeekRange.start.toLocaleDateString("en-US")
      : new Date().toLocaleDateString("en-US");

    const tempId = `temp-${Date.now()}`;

    if (table === "rfi") {
      setRawRfis([...rawRfis, {
        id: tempId,
        rfiNo: `RFI #${rawRfis.length + 1}`,
        sentDate: defaultDate,
        customerResponse: "—",
        responseReceivedDate: "—",
        wbtResponse: "—",
        status: "OPEN"
      }]);
    } else if (table === "schedule") {
      setRawScheduleRows([...rawScheduleRows, {
        id: tempId,
        phase: `New Phase #${rawScheduleRows.length + 1}`,
        startDate: defaultDate,
        ifaSubDate: "—",
        bfaRecdDate: "—",
        ifcSubDate: "—",
        corSubDate: "—",
        comments: "—"
      }]);
    } else if (table === "co") {
      setRawCoRows([...rawCoRows, {
        id: tempId,
        changeOrder: `COR-${String(rawCoRows.length + 1).padStart(3, "0")}`,
        createdAt: activeWeekRange ? activeWeekRange.start.toISOString() : new Date().toISOString(),
        Jan: "", Feb: "", Mar: "", Apr: "", May: "", Jun: "", Jul: "", Aug: "", Sep: "", Oct: "", Nov: "", Dec: "",
        total: "—"
      }]);
    } else if (table === "coordDrawing") {
      setRawCoordDrawings([...rawCoordDrawings, {
        id: tempId,
        title: `Drawing #${rawCoordDrawings.length + 1}`,
        stage: "IFA",
        status: "Pending",
        createdAt: defaultDate
      }]);
    }
  };

  // Export spreadsheet using XLSX
  const exportToExcel = () => {
    const workbook = XLSX.utils.book_new();

    // Sheet 1: RFI
    const rfiWS = XLSX.utils.json_to_sheet(filteredRfis.map(r => ({
      "RFI No.": r.rfiNo,
      "Sent Date": r.sentDate,
      "Customer Response": r.customerResponse,
      "Response Received Date": r.responseReceivedDate,
      "Whiteboard Response": r.wbtResponse,
      "Status": r.status
    })));
    XLSX.utils.book_append_sheet(workbook, rfiWS, "RFI Status");

    // Sheet 2: Schedule
    const schedWS = XLSX.utils.json_to_sheet(filteredScheduleRows.map(s => ({
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
    const coWS = XLSX.utils.json_to_sheet(filteredCoRows.map(c => {
      const { id, createdAt, ...rest } = c;
      return rest;
    }));
    XLSX.utils.book_append_sheet(workbook, coWS, "Change Orders");

    // Sheet 4: Coordination Drawings
    const coordWS = XLSX.utils.json_to_sheet(filteredCoordDrawings.map(cd => ({
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
      body: filteredScheduleRows.map(s => [s.phase, s.startDate, s.ifaSubDate, s.bfaRecdDate, s.ifcSubDate, s.corSubDate, s.comments]),
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
      body: filteredRfis.map(r => [r.rfiNo, r.sentDate, r.customerResponse, r.responseReceivedDate, r.wbtResponse, r.status]),
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
      body: filteredCoRows.map(c => [
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
      body: filteredCoordDrawings.map(cd => [cd.title, cd.stage, cd.status, cd.createdAt]),
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
          {projectWeeks.length > 0 && (
            <div className="flex items-center gap-2 ml-4">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Select Week:</span>
              <select
                value={selectedWeek}
                onChange={(e) => handleWeekChange(e.target.value)}
                className="px-3 py-1.5 bg-white border border-black rounded-lg text-[10px] font-black uppercase tracking-widest outline-none focus:border-[#6bbd45] transition-all cursor-pointer font-bold"
              >
                <option value="All">All Weeks</option>
                {projectWeeks.map((w) => (
                  <option key={w.label} value={w.label}>
                    {w.label}
                  </option>
                ))}
              </select>
            </div>
          )}
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
              {filteredScheduleRows.map((row) => (
                <tr key={row.id} className="hover:bg-slate-50 transition-all">
                  {/* Phase cell */}
                  <td 
                    onClick={() => handleCellClick("schedule", row.id, "phase", row.phase)}
                    className="p-3 font-black border-r border-black/5 cursor-pointer hover:bg-slate-100/50"
                  >
                    {activeCell?.table === "schedule" && activeCell.rowId === row.id && activeCell.field === "phase" ? (
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
                    onClick={() => handleCellClick("schedule", row.id, "startDate", row.startDate)}
                    className="p-3 border-r border-black/5 font-semibold text-slate-600 cursor-pointer hover:bg-slate-100/50"
                  >
                    {activeCell?.table === "schedule" && activeCell.rowId === row.id && activeCell.field === "startDate" ? (
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
                    onClick={() => handleCellClick("schedule", row.id, "ifaSubDate", row.ifaSubDate)}
                    className="p-3 border-r border-black/5 font-semibold text-slate-600 cursor-pointer hover:bg-slate-100/50"
                  >
                    {activeCell?.table === "schedule" && activeCell.rowId === row.id && activeCell.field === "ifaSubDate" ? (
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
                    onClick={() => handleCellClick("schedule", row.id, "bfaRecdDate", row.bfaRecdDate)}
                    className="p-3 border-r border-black/5 font-semibold text-slate-600 cursor-pointer hover:bg-slate-100/50"
                  >
                    {activeCell?.table === "schedule" && activeCell.rowId === row.id && activeCell.field === "bfaRecdDate" ? (
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
                    onClick={() => handleCellClick("schedule", row.id, "ifcSubDate", row.ifcSubDate)}
                    className="p-3 border-r border-black/5 font-semibold text-slate-600 cursor-pointer hover:bg-slate-100/50"
                  >
                    {activeCell?.table === "schedule" && activeCell.rowId === row.id && activeCell.field === "ifcSubDate" ? (
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
                    onClick={() => handleCellClick("schedule", row.id, "corSubDate", row.corSubDate)}
                    className="p-3 border-r border-black/5 font-semibold text-slate-600 cursor-pointer hover:bg-slate-100/50"
                  >
                    {activeCell?.table === "schedule" && activeCell.rowId === row.id && activeCell.field === "corSubDate" ? (
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
                    onClick={() => handleCellClick("schedule", row.id, "comments", row.comments)}
                    className="p-3 font-semibold text-slate-700 cursor-pointer hover:bg-slate-100/50"
                  >
                    {activeCell?.table === "schedule" && activeCell.rowId === row.id && activeCell.field === "comments" ? (
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
              {filteredRfis.map((row) => (
                <tr key={row.id} className="hover:bg-slate-50 transition-all">
                  {/* RFI No. */}
                  <td 
                    onClick={() => handleCellClick("rfi", row.id, "rfiNo", row.rfiNo)}
                    className="p-3 font-black border-r border-black/5 cursor-pointer hover:bg-slate-100/50"
                  >
                    {activeCell?.table === "rfi" && activeCell.rowId === row.id && activeCell.field === "rfiNo" ? (
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
                    onClick={() => handleCellClick("rfi", row.id, "sentDate", row.sentDate)}
                    className="p-3 border-r border-black/5 font-semibold text-slate-600 cursor-pointer hover:bg-slate-100/50"
                  >
                    {activeCell?.table === "rfi" && activeCell.rowId === row.id && activeCell.field === "sentDate" ? (
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
                    onClick={() => handleCellClick("rfi", row.id, "customerResponse", row.customerResponse)}
                    className="p-3 border-r border-black/5 font-semibold text-slate-700 cursor-pointer hover:bg-slate-100/50"
                  >
                    {activeCell?.table === "rfi" && activeCell.rowId === row.id && activeCell.field === "customerResponse" ? (
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
                    onClick={() => handleCellClick("rfi", row.id, "responseReceivedDate", row.responseReceivedDate)}
                    className="p-3 border-r border-black/5 font-semibold text-slate-600 cursor-pointer hover:bg-slate-100/50"
                  >
                    {activeCell?.table === "rfi" && activeCell.rowId === row.id && activeCell.field === "responseReceivedDate" ? (
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
                    onClick={() => handleCellClick("rfi", row.id, "wbtResponse", row.wbtResponse)}
                    className="p-3 border-r border-black/5 font-semibold text-slate-700 cursor-pointer hover:bg-slate-100/50"
                  >
                    {activeCell?.table === "rfi" && activeCell.rowId === row.id && activeCell.field === "wbtResponse" ? (
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
                    onClick={() => handleCellClick("rfi", row.id, "status", row.status)}
                    className="p-3 font-black text-xs cursor-pointer hover:bg-slate-100/50"
                  >
                    {activeCell?.table === "rfi" && activeCell.rowId === row.id && activeCell.field === "status" ? (
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
              {filteredCoRows.map((row) => (
                <tr key={row.id} className="hover:bg-slate-50 transition-all">
                  {/* CO number name */}
                  <td 
                    onClick={() => handleCellClick("co", row.id, "changeOrder", row.changeOrder)}
                    className="p-3 text-left font-black text-black border-r border-black/5 cursor-pointer hover:bg-slate-100/50"
                  >
                    {activeCell?.table === "co" && activeCell.rowId === row.id && activeCell.field === "changeOrder" ? (
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
                      onClick={() => handleCellClick("co", row.id, m, row[m])}
                      className="p-3 border-r border-black/5 cursor-pointer hover:bg-slate-100/50 text-slate-800"
                    >
                      {activeCell?.table === "co" && activeCell.rowId === row.id && activeCell.field === m ? (
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
              {filteredCoordDrawings.map((row) => (
                <tr key={row.id} className="hover:bg-slate-50 transition-all">
                  {/* Drawing Name */}
                  <td 
                    onClick={() => handleCellClick("coordDrawing", row.id, "title", row.title)}
                    className="p-3 font-black border-r border-black/5 cursor-pointer hover:bg-slate-100/50"
                  >
                    {activeCell?.table === "coordDrawing" && activeCell.rowId === row.id && activeCell.field === "title" ? (
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
                    onClick={() => handleCellClick("coordDrawing", row.id, "stage", row.stage)}
                    className="p-3 border-r border-black/5 font-semibold text-slate-600 cursor-pointer hover:bg-slate-100/50"
                  >
                    {activeCell?.table === "coordDrawing" && activeCell.rowId === row.id && activeCell.field === "stage" ? (
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
                    onClick={() => handleCellClick("coordDrawing", row.id, "status", row.status)}
                    className="p-3 border-r border-black/5 font-black text-xs cursor-pointer hover:bg-slate-100/50"
                  >
                    {activeCell?.table === "coordDrawing" && activeCell.rowId === row.id && activeCell.field === "status" ? (
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
                    onClick={() => handleCellClick("coordDrawing", row.id, "createdAt", row.createdAt)}
                    className="p-3 font-semibold text-slate-600 cursor-pointer hover:bg-slate-100/50"
                  >
                    {activeCell?.table === "coordDrawing" && activeCell.rowId === row.id && activeCell.field === "createdAt" ? (
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
