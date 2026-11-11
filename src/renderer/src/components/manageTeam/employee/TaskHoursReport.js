import autoTable from "jspdf-autotable";

const monthKeyFor = (date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;

const monthNameFor = (date) =>
  date.toLocaleString("default", { month: "long", year: "numeric" });

const groupMonthlyHours = (rows) => {
  const months = new Map();
  rows.forEach((row) => {
    if (!months.has(row.monthKey)) {
      months.set(row.monthKey, { month: row.month, rows: [] });
    }
    months.get(row.monthKey).rows.push(row);
  });
  return Array.from(months.values());
};

const groupMonthlyWbs = (rows) => {
  const months = new Map();
  rows.forEach((row) => {
    if (!months.has(row.monthKey)) {
      months.set(row.monthKey, { month: row.month, projects: new Map() });
    }
    const month = months.get(row.monthKey);
    if (!month.projects.has(row.projectId)) {
      month.projects.set(row.projectId, { projectName: row.projectName, rows: [] });
    }
    month.projects.get(row.projectId).rows.push(row);
  });
  return Array.from(months.values()).map((month) => ({
    ...month,
    projects: Array.from(month.projects.values())
  }));
};

const buildMonthlyHoursSummary = (taskList, { getTaskDate, getTaskProjectName, allocToSec, calcWorkedSec }) => {
  const monthlyHours = new Map();

  taskList.forEach((task) => {
    const date = getTaskDate(task);
    if (Number.isNaN(date.getTime())) return;

    const monthKey = monthKeyFor(date);
    const projectName = getTaskProjectName(task);
    const key = `${monthKey}:${projectName}`;
    const row = monthlyHours.get(key) || {
      month: monthNameFor(date),
      monthKey,
      projectName,
      assignedSec: 0,
      workedSec: 0
    };
    row.assignedSec += allocToSec(task.allocatedHours || task.allocationLog?.allocatedHours);
    row.workedSec += calcWorkedSec(task.workingHourTask);
    monthlyHours.set(key, row);
  });

  return Array.from(monthlyHours.values()).sort((a, b) =>
    a.monthKey.localeCompare(b.monthKey) || a.projectName.localeCompare(b.projectName)
  );
};

const buildMonthlyWbsSummary = (
  taskList,
  { milestonesByProject, getTaskDate, getTaskProjectId, getTaskProjectName, getTaskMilestoneId, allocToSec, calcWorkedSec, cleanReportText }
) => {
  const monthlyItems = new Map();

  taskList.forEach((task) => {
    const date = getTaskDate(task);
    if (Number.isNaN(date.getTime())) return;

    const projectId = getTaskProjectId(task);
    const projectName = getTaskProjectName(task);
    const monthKey = monthKeyFor(date);
    const wbsType = String(task.wbsType || "").trim() || "Other activities";
    const milestoneId = getTaskMilestoneId(task);
    const milestone = milestoneId
      ? milestonesByProject.get(`${projectId}:${milestoneId}`) || task.milestone || task.mileStone
      : task.milestone || task.mileStone;
    const milestoneSubject = milestone?.subject || milestone?.name || milestone?.title || "No milestone";
    const itemKey = `${monthKey}:${projectId}:${wbsType.toLowerCase()}:${String(milestoneSubject).toLowerCase()}`;
    const item = monthlyItems.get(itemKey) || {
      month: monthNameFor(date),
      monthKey,
      projectId,
      projectName,
      wbsType,
      milestoneSubject,
      assignedSec: 0,
      workedSec: 0,
      descriptions: new Set()
    };
    item.assignedSec += allocToSec(task.allocatedHours || task.allocationLog?.allocatedHours);
    item.workedSec += calcWorkedSec(task.workingHourTask);
    [milestone?.description, task.description]
      .map(cleanReportText)
      .filter(Boolean)
      .forEach((description) => item.descriptions.add(description));
    monthlyItems.set(itemKey, item);
  });

  return Array.from(monthlyItems.values())
    .map((item) => ({ ...item, description: Array.from(item.descriptions).join("; ") }))
    .sort((a, b) =>
      a.monthKey.localeCompare(b.monthKey) ||
      a.projectName.localeCompare(b.projectName) ||
      a.wbsType.localeCompare(b.wbsType) ||
      a.milestoneSubject.localeCompare(b.milestoneSubject)
    );
};

export const buildMonthlyTaskHoursReport = (taskList, helpers) => ({
  projectHours: buildMonthlyHoursSummary(taskList, helpers),
  wbsHours: buildMonthlyWbsSummary(taskList, helpers)
});

export const appendMonthlyTaskHoursToPdf = (doc, report, { startY, secToHms }) => {
  let y = startY;

  doc.setFontSize(10.5);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(17, 24, 39);
  doc.text("5. MONTH-BY-MONTH WBS & MILESTONE HOURS", 14, y);
  y += 7;

  groupMonthlyWbs(report.wbsHours).forEach(({ month, projects }) => {
    if (y > 260) {
      doc.addPage();
      y = 20;
    }
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(17, 24, 39);
    doc.text(month.toUpperCase(), 14, y);
    y += 6;

    projects.forEach((project) => {
      if (y > 255) {
        doc.addPage();
        y = 20;
      }
      doc.setFontSize(8.5);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(22, 101, 52);
      doc.text(project.projectName, 14, y);
      y += 2;

      const assignedTotal = project.rows.reduce((sum, row) => sum + row.assignedSec, 0);
      const workedTotal = project.rows.reduce((sum, row) => sum + row.workedSec, 0);
      autoTable(doc, {
        head: [["WBS Type", "Milestone", "Merged Description", "Assigned", "Worked"]],
        body: [
          ...project.rows.map((row) => [
            row.wbsType,
            row.milestoneSubject,
            row.description || "—",
            secToHms(row.assignedSec),
            secToHms(row.workedSec)
          ]),
          ["", "PROJECT TOTAL", "", secToHms(assignedTotal), secToHms(workedTotal)]
        ],
        startY: y,
        theme: "striped",
        styles: { fontSize: 6.5, cellPadding: 1.5, overflow: "linebreak" },
        headStyles: { fillColor: [22, 163, 74], textColor: [255, 255, 255], fontStyle: "bold" },
        columnStyles: {
          0: { cellWidth: 26 },
          1: { cellWidth: 33 },
          2: { cellWidth: 82 },
          3: { cellWidth: 20 },
          4: { cellWidth: 20 }
        },
        didParseCell: (data) => {
          if (data.section === "body" && data.row.index === project.rows.length) {
            data.cell.styles.fontStyle = "bold";
            data.cell.styles.fillColor = [240, 253, 244];
          }
        },
        margin: { left: 14, right: 14 }
      });
      y = (doc.lastAutoTable?.finalY || y + 20) + 5;
    });
    y += 2;
  });

  if (y > 270) {
    doc.addPage();
    y = 20;
  }

  doc.setFontSize(10.5);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(17, 24, 39);
  doc.text("6. MONTH-BY-MONTH PROJECT HOURS", 14, y);
  y += 7;

  groupMonthlyHours(report.projectHours).forEach(({ month, rows }) => {
    if (y > 260) {
      doc.addPage();
      y = 20;
    }
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(22, 101, 52);
    doc.text(month.toUpperCase(), 14, y);
    y += 2;

    const assignedTotal = rows.reduce((sum, row) => sum + row.assignedSec, 0);
    const workedTotal = rows.reduce((sum, row) => sum + row.workedSec, 0);
    autoTable(doc, {
      head: [["Project", "Assigned Hours", "Worked Hours"]],
      body: [
        ...rows.map((row) => [
          row.projectName,
          secToHms(row.assignedSec),
          secToHms(row.workedSec)
        ]),
        ["MONTH TOTAL", secToHms(assignedTotal), secToHms(workedTotal)]
      ],
      startY: y,
      theme: "striped",
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [22, 163, 74], textColor: [255, 255, 255], fontStyle: "bold" },
      didParseCell: (data) => {
        if (data.section === "body" && data.row.index === rows.length) {
          data.cell.styles.fontStyle = "bold";
          data.cell.styles.fillColor = [240, 253, 244];
        }
      },
      margin: { left: 14, right: 14 }
    });
    y = (doc.lastAutoTable?.finalY || y + 20) + 5;
  });

  if (y > 270) {
    doc.addPage();
    return 20;
  }
  return y;
};

export const appendMonthlyTaskHoursToWorkbook = (workbook, XLSX, report, secToHms) => {
  if (report.projectHours.length === 0) return;

  const monthlySheet = XLSX.utils.aoa_to_sheet([]);
  monthlySheet["!cols"] = [{ wch: 38 }, { wch: 20 }, { wch: 20 }];
  monthlySheet["!merges"] = [];
  let rowIndex = 0;

  groupMonthlyHours(report.projectHours).forEach(({ month, rows }) => {
    XLSX.utils.sheet_add_aoa(monthlySheet, [[month.toUpperCase()]], { origin: { r: rowIndex, c: 0 } });
    monthlySheet["!merges"].push({ s: { r: rowIndex, c: 0 }, e: { r: rowIndex, c: 2 } });
    rowIndex += 1;
    XLSX.utils.sheet_add_aoa(
      monthlySheet,
      [["Project Name", "Assigned Hours", "Worked Hours"]],
      { origin: { r: rowIndex, c: 0 } }
    );
    rowIndex += 1;

    const projectRows = rows.map((row) => [
      row.projectName,
      secToHms(row.assignedSec),
      secToHms(row.workedSec)
    ]);
    const assignedTotal = rows.reduce((sum, row) => sum + row.assignedSec, 0);
    const workedTotal = rows.reduce((sum, row) => sum + row.workedSec, 0);
    projectRows.push(["MONTH TOTAL", secToHms(assignedTotal), secToHms(workedTotal)]);
    XLSX.utils.sheet_add_aoa(monthlySheet, projectRows, { origin: { r: rowIndex, c: 0 } });
    rowIndex += projectRows.length + 1;
  });
  XLSX.utils.book_append_sheet(workbook, monthlySheet, "Monthly Project Hours");

  if (report.wbsHours.length === 0) return;
  const monthlyWbsSheet = XLSX.utils.aoa_to_sheet([]);
  monthlyWbsSheet["!cols"] = [
    { wch: 24 },
    { wch: 32 },
    { wch: 54 },
    { wch: 20 },
    { wch: 20 }
  ];
  monthlyWbsSheet["!merges"] = [];
  let wbsRowIndex = 0;

  groupMonthlyWbs(report.wbsHours).forEach(({ month, projects }) => {
    monthlyWbsSheet["!merges"].push({
      s: { r: wbsRowIndex, c: 0 },
      e: { r: wbsRowIndex, c: 4 }
    });
    XLSX.utils.sheet_add_aoa(monthlyWbsSheet, [[month.toUpperCase()]], {
      origin: { r: wbsRowIndex, c: 0 }
    });
    wbsRowIndex += 1;

    projects.forEach((project) => {
      monthlyWbsSheet["!merges"].push({
        s: { r: wbsRowIndex, c: 0 },
        e: { r: wbsRowIndex, c: 4 }
      });
      XLSX.utils.sheet_add_aoa(monthlyWbsSheet, [[project.projectName]], {
        origin: { r: wbsRowIndex, c: 0 }
      });
      wbsRowIndex += 1;
      XLSX.utils.sheet_add_aoa(
        monthlyWbsSheet,
        [["WBS Type", "Milestone", "Merged Description", "Assigned Hours", "Worked Hours"]],
        { origin: { r: wbsRowIndex, c: 0 } }
      );
      wbsRowIndex += 1;

      const projectRows = project.rows.map((row) => [
        row.wbsType,
        row.milestoneSubject,
        row.description || "—",
        secToHms(row.assignedSec),
        secToHms(row.workedSec)
      ]);
      const assignedTotal = project.rows.reduce((sum, row) => sum + row.assignedSec, 0);
      const workedTotal = project.rows.reduce((sum, row) => sum + row.workedSec, 0);
      projectRows.push(["", "PROJECT TOTAL", "", secToHms(assignedTotal), secToHms(workedTotal)]);
      XLSX.utils.sheet_add_aoa(monthlyWbsSheet, projectRows, {
        origin: { r: wbsRowIndex, c: 0 }
      });
      wbsRowIndex += projectRows.length + 1;
    });
    wbsRowIndex += 1;
  });
  XLSX.utils.book_append_sheet(workbook, monthlyWbsSheet, "Monthly WBS & Milestone");
};
