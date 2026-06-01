// @ts-nocheck
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
import Service from "../../../api/Service";
import { toast } from "react-toastify";
import * as XLSX from "xlsx";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import Logo from "../../../assets/logo.png";

import WprWeeksTable from "./WprWeeksTable";
import WprHeader from "./WprHeader";
import WprToolbar from "./WprToolbar";
import WprRfiTable from "./WprRfiTable";
import WprScheduleTable from "./WprScheduleTable";
import WprChangeOrderTable from "./WprChangeOrderTable";

const WorkProgressReport = ({
  projectId,
  project,
  milestones,
  rfiData,
  submittalData,
  changeOrderData,
  coordinationDrawings,
  onUpdate
}: any) => {
  const userRole = sessionStorage.getItem("userRole")?.toLowerCase() || "";
  const canEdit = false; // WPR is now fully read-only per user request

  // WPR Header Info state
  const [reportDate, setReportDate] = useState(new Date().toISOString().split("T")[0]);
  const [weekEnding, setWeekEnding] = useState("");
  const [isExportingPDF, setIsExportingPDF] = useState(false);
  const [formNo, setFormNo] = useState("WBT/PMO/WPR-001");
  const [version, setVersion] = useState("1.0");
  const [effDate, setEffDate] = useState("05/09/2024");
  const [wbtCirculatedTo, setWbtCirculatedTo] = useState("");
  const [fabCirculatedTo, setFabCirculatedTo] = useState("");
  const [software, setSoftware] = useState(project?.tools || "SDS2");
  const [fabProjectManager, setFabProjectManager] = useState(() => {
    if (project?.clientProjectManagers?.length > 0) {
      const pm = project.clientProjectManagers[0];
      return `${pm.firstName || ""} ${pm.lastName || ""}`.trim().toUpperCase();
    }
    return "MATT AURAND";
  });

  // Raw grids local states (unfiltered)
  const [rawRfis, setRawRfis] = useState<any[]>([]);
  const [rawScheduleRows, setRawScheduleRows] = useState<any[]>([]);
  const [rawCoRows, setRawCoRows] = useState<any[]>([]);
  const [rawCoordDrawings, setRawCoordDrawings] = useState<any[]>([]);

  // Selected week state
  const [selectedWeek, setSelectedWeek] = useState("All");
  const [viewMode, setViewMode] = useState<"weeksTable" | "reportView">("weeksTable");

  // Keyboard navigation & Editing Cell state
  // format: { table: 'rfi'|'schedule'|'co'|'coordDrawing', rowId: string, field: string }
  const [activeCell, setActiveCell] = useState<any>(null);
  const [editValue, setEditValue] = useState("");
  const inputRef = useRef<any>(null);

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

  // Initialize Circulated To from Fabricator POCs via RFQ
  useEffect(() => {
    const fetchFabricatorPOCs = async () => {
      try {
        let fabId = project?.fabricatorID || project?.fabricator?.id;

        // Try to get fabricator ID from RFQ if missing or to ensure tracking
        if (project?.rfqId) {
          const rfqRes = await Service.GetRFQbyId(project.rfqId);
          if (rfqRes?.data) {
            const rfq = rfqRes.data;
            const rfqFab = rfq.sender?.fabricator || rfq.fabricator;
            if (rfqFab?.id) fabId = rfqFab.id;
          }
        }

        if (fabId) {
          const fab = await Service.GetFabricatorByID(fabId);
          let clientAdmins: any[] = [];
          
          try {
            const clientsRes = await Service.FetchAllClientsByFabricatorID(fabId);
            if (clientsRes?.data) {
              const rawClients = Array.isArray(clientsRes.data) ? clientsRes.data : [];
              clientAdmins = rawClients.filter((c: any) => 
                c.role === "CLIENT_ADMIN" || c.role === "client_admin"
              );
            }
          } catch (err) {
            console.error("Failed to fetch clients for fabricator", err);
          }

          if (fab) {
            const wbtPOCs = fab.wbtFabricatorPointOfContact || fab.data?.wbtFabricatorPointOfContact;
            const fabPOCs = fab.pointOfContact || fab.data?.pointOfContact;

            if (wbtPOCs && wbtPOCs.length > 0) {
              const wbtPOC = wbtPOCs[0];
              setWbtCirculatedTo(`${wbtPOC.firstName || ""} ${wbtPOC.lastName || ""}`.trim().toUpperCase());
            }

            const clientPMs = project?.clientProjectManagers;
            if (clientPMs && Array.isArray(clientPMs) && clientPMs.length > 0) {
              const allPMs = clientPMs.map((pm: any) => `${pm.firstName || ""} ${pm.lastName || ""}`.trim().toUpperCase()).join(", ");
              setFabProjectManager(allPMs);
            } else if (fabPOCs && fabPOCs.length > 0) {
              const allPocs = fabPOCs.map((poc: any) => `${poc.firstName || ""} ${poc.lastName || ""}`.trim().toUpperCase()).join(", ");
              setFabProjectManager(allPocs);
            }
          }

          if (clientAdmins.length > 0) {
            const allAdmins = clientAdmins.map((c: any) => `${c.firstName || ""} ${c.lastName || ""}`.trim().toUpperCase()).join(", ");
            setFabCirculatedTo(allAdmins);
          }
        }
      } catch (err) {
        console.error("Failed to fetch fabricator for POCs", err);
      }
    };
    fetchFabricatorPOCs();
  }, [project?.rfqId, project?.fabricatorID, project?.fabricator?.id]);

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

  // Sync Form No, Version, and Eff Date based on selected week
  useEffect(() => {
    let weekNum = 1;
    let targetEnd = new Date();

    if (selectedWeek !== "All") {
      const match = selectedWeek.match(/Week (\d+)/i);
      if (match) weekNum = parseInt(match[1], 10);
      const wk = projectWeeks.find(w => w.label === selectedWeek);
      if (wk) targetEnd = wk.end;
    } else if (projectWeeks.length > 0) {
      const lastWeek = projectWeeks[projectWeeks.length - 1];
      const match = lastWeek.label.match(/Week (\d+)/i);
      if (match) weekNum = parseInt(match[1], 10);
      targetEnd = getSunday(new Date());
    } else {
      targetEnd = getSunday(new Date());
    }

    setVersion(`${weekNum}.0`);
    setFormNo(`WBT/PMO/WPR-${String(weekNum).padStart(3, "0")}`);
    setEffDate(targetEnd.toLocaleDateString("en-US", { month: "2-digit", day: "2-digit", year: "numeric" }));
  }, [selectedWeek, projectWeeks]);

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

    // Hide connection design RFIs
    rfiArray = rfiArray.filter(r => !(r.isConnectionDesign === true || String(r.isConnectionDesign).toLowerCase() === "true"));

    const formattedRFIs = rfiArray.map((r, index) => {
      const responses = r.rfiresponse || [];

      // Detect role from nested user object or responseState
      const isClientResponse = (res) => {
        const role = (res.user?.role || res.userRole || res.createdByRole || "").toUpperCase();
        return role === "CLIENT" || role === "CLIENT_ADMIN";
      };

      // Sort responses by date (oldest first) so we can separate Q & A
      const sorted = [...responses].sort(
        (a, b) => new Date(a.createdAt || a.date || 0) - new Date(b.createdAt || b.date || 0)
      );

      // Customer response = first SENT response from client, else latest non-wbt
      const customerRep = sorted.find(res => isClientResponse(res))
        || sorted.find(res => res.responseState === "SENT" && !isClientResponse(res));

      // WBT response = latest non-client response
      const wbtRep = [...sorted].reverse().find(res => !isClientResponse(res));

      let statusLabel = "PENDING";
      if (sorted.length > 0) {
        const latest = sorted[sorted.length - 1];
        const rfiStatus = latest.wbtStatus || latest.status;
        if (rfiStatus && typeof rfiStatus === "string") {
          statusLabel = rfiStatus.toUpperCase();
        }
      } else {
        statusLabel = r.status === true || r.status === "OPEN" || r.status === "PENDING" ? "PENDING" : "ANSWERED";
      }

      // Prefer `reason` field (actual API field), fallback to `description`
      const extractText = (res) =>
        ((res?.reason || res?.description || "").replace(/<[^>]+>/g, "")).trim();

      return {
        id: r.id || r._id,
        rfiNo: r.subject || r.serialNo || `RFI #${index + 1}`,
        sentDate: r.date ? new Date(r.date).toLocaleDateString("en-US") : "—",
        customerResponse: customerRep ? (extractText(customerRep) || "(no text)") : "Waiting...",
        responseReceivedDate: customerRep
          ? new Date(customerRep.createdAt || customerRep.date).toLocaleDateString("en-US")
          : "—",
        wbtResponse: wbtRep ? (extractText(wbtRep) || "Responded") : "—",
        status: statusLabel,
        rfiresponse: r.rfiresponse
      };
    });

    setRawRfis(formattedRFIs);
  }, [rfiData]);

  // Sync Schedule – one row per milestone (with stacked submittal entries), plus standalone submittals
  useEffect(() => {
    const processSchedule = async () => {
      // Hide connection design submittals
      const filteredSubmittalData = (submittalData || []).filter(sub => !(sub.isConnectionDesign === true || String(sub.isConnectionDesign).toLowerCase() === "true"));

      // Fetch BFA details for submittals marked as BFA_SENT
      const bfaCache: any = {};
      const subsToFetch = filteredSubmittalData.filter((sub: any) => sub.bfaStatus === true && sub.status === "BFA_SENT");

      await Promise.all(subsToFetch.map(async (sub: any) => {
        try {
          const res = await Service.GetBFABySubmittalId(sub.id || sub._id);
          if (res && res.data) {
            bfaCache[sub.id || sub._id] = res.data;
          }
        } catch (e) {
          console.error("Failed to fetch BFA for submittal", sub.id, e);
        }
      }));

      const linkedSubmittalIds = new Set();
      const fmt = (d: any) => d ? new Date(d).toLocaleDateString("en-US") : "—";
      const toEntry = (sub: any) => ({ subject: sub.subject || sub.serialNo || "—", date: fmt(sub.date || sub.createdAt) });
      const cleanHtml = (str: any) => (str || "").replace(/<[^>]+>/g, "").replace(/&nbsp;/gi, " ").trim();

      // ── Milestone rows ────────────────────────────────────────────────────────
      const milestoneRows = milestones.map((m: any) => {
        const mId = String(m.id || m._id);

        // A submittal belongs to this milestone if:
        //   1. Its mileStoneId / milestoneId matches, OR
        //   2. Its mileStoneIds[] (new field) contains this milestone ID, OR
        //   3. Its mileStoneLinks[] (legacy) contains a reference to this milestone
        const matchLink = (link: any) =>
          String(link) === mId ||
          String(link?.id) === mId ||
          String(link?.mileStoneId) === mId ||
          String(link?.milestoneId) === mId;

        const belongsToMilestone = (sub: any) => {
          if (String(sub.mileStoneId || sub.milestoneId || sub.milestone?.id) === mId) return true;
          if (Array.isArray(sub.mileStoneIds) && sub.mileStoneIds.some(matchLink)) return true;
          if (Array.isArray(sub.mileStoneLinks) && sub.mileStoneLinks.some(matchLink)) return true;
          return false;
        };

        const subs = filteredSubmittalData.filter(belongsToMilestone);
        subs.forEach((s: any) => linkedSubmittalIds.add(s.id || s._id));

        const ifaSubs = subs.filter((s: any) => String(s.stage || "").toUpperCase() === "IFA");
        const ifcSubs = subs.filter((s: any) => String(s.stage || "").toUpperCase() === "IFC");
        const corSubs = subs.filter((s: any) => ["CO", "COR"].includes(String(s.stage || "").toUpperCase()));

        const unifiedEntries = subs.map((s: any) => {
          const stage = String(s.stage || "").toUpperCase();
          const dateStr = s.createdAt || s.date || 0;

          let bfaDate = "—";
          const resList = s.submittalsResponse || [];
          if (resList.length > 0) {
            const latest = [...resList].sort((a: any, b: any) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())[0];
            if (latest && latest.createdAt) bfaDate = fmt(latest.createdAt);
          }
          if (s.bfaStatus === true && s.status === "BFA_SENT" && bfaCache[s.id || s._id]) {
            const bfaData = bfaCache[s.id || s._id];
            const bDate = bfaData.createdAt || bfaData.date;
            if (bDate) bfaDate = fmt(bDate);
          }

          let currentStatus = s.wbtStatus || s.status || "PENDING";
          if (bfaCache[s.id || s._id]) {
            const bfaData = bfaCache[s.id || s._id];
            if (bfaData.status) currentStatus = bfaData.status;
          }

          return {
            id: s.id || s._id,
            subject: s.subject || s.serialNo || "—",
            ifaDate: stage === "IFA" ? fmt(dateStr) : "—",
            bfaDate: bfaDate,
            ifcDate: stage === "IFC" ? fmt(dateStr) : "—",
            corDate: ["CO", "COR"].includes(stage) ? fmt(dateStr) : "—",
            status: currentStatus,
            date: dateStr
          };
        });

        const finalBfaRecdDate = unifiedEntries.find((e: any) => e.bfaDate !== "—")?.bfaDate || "—";
        const primarySub = subs.length > 0 ? [...subs].sort((a: any, b: any) => new Date(b.createdAt || b.date || 0).getTime() - new Date(a.createdAt || a.date || 0).getTime())[0] : null;
        const submittalStatus = primarySub ? (primarySub.wbtStatus || primarySub.status || "PENDING") : "—";

        return {
          id: m.id || m._id,
          _type: "milestone",
          phase: m.subject || "Unnamed Phase",
          startDate: m.date ? fmt(m.date) : (project?.startDate ? fmt(project.startDate) : "—"),
          unifiedEntries,
          bfaRecdDate: finalBfaRecdDate,
          submittalStatus,
          // flat dates kept for filtering/export
          ifaSubDate: unifiedEntries.find((e: any) => e.ifaDate !== "—")?.ifaDate || "—",
          ifcSubDate: unifiedEntries.find((e: any) => e.ifcDate !== "—")?.ifcDate || "—",
          corSubDate: unifiedEntries.find((e: any) => e.corDate !== "—")?.corDate || "—",
          comments: m.description ? cleanHtml(m.description) : (m.percentage ? `${m.percentage}% Completed` : "—"),
          types: m.types || "ANCHOR_BOLT",
          subSubject: "",
        };
      });

      // ── Standalone submittal rows (no milestone link of any kind) ─────────────
      const standaloneRows = filteredSubmittalData
        .filter((sub: any) => {
          if (linkedSubmittalIds.has(sub.id || sub._id)) return false;
          if (sub.mileStoneId || sub.milestoneId) return false;
          if (sub.mileStoneIds && sub.mileStoneIds.length > 0) return false;
          if (sub.mileStoneLinks && sub.mileStoneLinks.length > 0) return false;
          return true;
        })
        .map((sub: any) => {
          const responses = sub.submittalsResponse || [];
          const latestResponse = responses.sort((a: any, b: any) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())[0];
          const stage = String(sub.stage || "").toUpperCase();
          const entry = toEntry(sub);

          let finalBfaRecdDate = latestResponse ? fmt(latestResponse.createdAt || latestResponse.respondedAt) : "—";
          if (sub.bfaStatus === true && sub.status === "BFA_SENT" && bfaCache[sub.id || sub._id]) {
            const bfaData = bfaCache[sub.id || sub._id];
            const dateStr = bfaData.createdAt || bfaData.date;
            if (dateStr) finalBfaRecdDate = fmt(dateStr);
          }
          const bfaEntries = finalBfaRecdDate !== "—" ? [{ subject: sub.subject || sub.serialNo || "—", date: finalBfaRecdDate }] : [];
          let currentStatus = sub.wbtStatus || sub.status || "PENDING";
          if (bfaCache[sub.id || sub._id]) {
            const bfaData = bfaCache[sub.id || sub._id];
            if (bfaData.status) currentStatus = bfaData.status;
          }
          const statusEntries = [{
            subject: sub.subject || sub.serialNo || "—",
            status: currentStatus,
            date: sub.createdAt || sub.date || 0
          }];

          const dateStr = sub.createdAt || sub.date || 0;
          const unifiedEntries = [{
            id: sub.id || sub._id,
            subject: sub.subject || sub.serialNo || "—",
            ifaDate: stage === "IFA" ? fmt(dateStr) : "—",
            bfaDate: finalBfaRecdDate,
            ifcDate: stage === "IFC" ? fmt(dateStr) : "—",
            corDate: ["CO", "COR"].includes(stage) ? fmt(dateStr) : "—",
            status: currentStatus,
            date: dateStr
          }];

          return {
            id: sub.id || sub._id,
            _type: "submittal",
            phase: sub.subject || sub.serialNo || "Unnamed Submittal",
            startDate: fmt(sub.date || sub.createdAt),
            unifiedEntries,
            bfaRecdDate: finalBfaRecdDate,
            ifaSubDate: stage === "IFA" ? entry.date : "—",
            ifcSubDate: stage === "IFC" ? entry.date : "—",
            corSubDate: ["CO", "COR"].includes(stage) ? entry.date : "—",
            submittalStatus: sub.wbtStatus || sub.status || "PENDING",
            comments: latestResponse
              ? cleanHtml(latestResponse.description || latestResponse.reason) || "—"
              : "—",
            types: "ANCHOR_BOLT",
            subSubject: sub.subject || sub.serialNo || "",
          };
        });

      // ── Merge rows that share the same Phase / Subject ────────────────────────
      // (e.g. two milestones both named "ANCHOR BOLT" collapse into one row)
      const sortByDate = (entries: any) =>
        [...entries].sort((a: any, b: any) => {
          const da = a.date && a.date !== "—" ? new Date(a.date).getTime() : new Date(0).getTime();
          const db = b.date && b.date !== "—" ? new Date(b.date).getTime() : new Date(0).getTime();
          return da - db;
        });

      const mergeMap = new Map();
      [...milestoneRows, ...standaloneRows].forEach((row: any) => {
        const key = (row.phase || "").trim().toUpperCase();
        if (!mergeMap.has(key)) {
          mergeMap.set(key, {
            ...row,
            unifiedEntries: [...(row.unifiedEntries || [])],
          });
        } else {
          const base = mergeMap.get(key);
          base.unifiedEntries.push(...(row.unifiedEntries || []));
          // Keep earliest start date
          if (row.startDate && row.startDate !== "—" &&
            (base.startDate === "—" || new Date(row.startDate) < new Date(base.startDate))) {
            base.startDate = row.startDate;
          }
          // Keep latest BFA date
          if (row.bfaRecdDate && row.bfaRecdDate !== "—") {
            if (base.bfaRecdDate === "—" || new Date(row.bfaRecdDate) > new Date(base.bfaRecdDate)) {
              base.bfaRecdDate = row.bfaRecdDate;
            }
          }
          // Keep most meaningful status
          if (row.submittalStatus && row.submittalStatus !== "—") {
            base.submittalStatus = row.submittalStatus;
          }
          // Append unique comments
          if (row.comments && row.comments !== "—") {
            base.comments = base.comments === "—"
              ? row.comments
              : base.comments.includes(row.comments)
                ? base.comments
                : `${base.comments} | ${row.comments}`;
          }
        }
      });

      // Sort each entry list by date and update flat date fields
      const mergedRows = Array.from(mergeMap.values()).map((row: any) => {
        const sortedEntries = sortByDate(row.unifiedEntries || []);
        return {
          ...row,
          unifiedEntries: sortedEntries,
          ifaSubDate: sortedEntries.find((e: any) => e.ifaDate !== "—")?.ifaDate || "—",
          ifcSubDate: sortedEntries.find((e: any) => e.ifcDate !== "—")?.ifcDate || "—",
          corSubDate: sortedEntries.find((e: any) => e.corDate !== "—")?.corDate || "—",
        };
      });

      setRawScheduleRows(mergedRows);
    };

    processSchedule();
  }, [milestones, submittalData, project]);

  // Sync Change Orders Month-by-month
  useEffect(() => {
    const fetchCOs = async () => {
      try {
        let rawCOs: any[] = [];
        if (projectId && typeof projectId === "string" && !projectId.startsWith("temp-")) {
          const res = await Service.GetChangeOrder(projectId);
          rawCOs = res?.data || [];
        } else {
          rawCOs = changeOrderData || [];
        }

        const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

        const rows = rawCOs.map((co: any) => {
          let totalAmount = 0;
          const monthlyBreakdown: any = {};
          months.forEach(m => monthlyBreakdown[m] = "");

          if (Array.isArray(co.CoRefersTo) && co.CoRefersTo.length > 0) {
            const monthSums: any = {};
            let hasAnyAmount = false;

            co.CoRefersTo.forEach((item: any) => {
              const itemDate = item.createdAt ? new Date(item.createdAt) : (co.createdAt ? new Date(co.createdAt) : null);
              if (itemDate) {
                const mIdx = itemDate.getMonth();
                const mName = months[mIdx];
                monthSums[mName] = (monthSums[mName] || 0) + (Number(item.cost) || 0);
              }
            });

            months.forEach(m => {
              if (monthSums[m] > 0) {
                monthlyBreakdown[m] = `$${monthSums[m].toLocaleString()}`;
                totalAmount += monthSums[m];
                hasAnyAmount = true;
              }
            });

            if (!hasAnyAmount) {
              const fallbackMonthIdx = co.createdAt ? new Date(co.createdAt).getMonth() : -1;
              if (fallbackMonthIdx >= 0) {
                monthlyBreakdown[months[fallbackMonthIdx]] = "SENT";
              }
            }
          } else {
            const amount = Number(co.totalCost) || Number(co.amount) || 0;
            totalAmount = amount;
            const coDate = co.createdAt || co.date ? new Date(co.createdAt || co.date) : null;
            const coMonthIndex = coDate ? coDate.getMonth() : -1;

            if (coMonthIndex >= 0) {
              monthlyBreakdown[months[coMonthIndex]] = amount > 0 ? `$${amount.toLocaleString()}` : "SENT";
            }
          }

          return {
            id: co.id || co._id,
            createdAt: co.createdAt || co.date || new Date().toISOString(),
            changeOrder: co.changeOrderNumber ? `COR-${String(co.changeOrderNumber).padStart(3, "0")}` : "COR-New",
            ...monthlyBreakdown,
            total: totalAmount > 0 ? `$${totalAmount.toLocaleString()}` : "—"
          };
        });

        setRawCoRows(rows);
      } catch (e) {
        console.error("Error fetching change orders:", e);
      }
    };
    fetchCOs();
  }, [projectId, changeOrderData, project]);

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
  const handleCellClick = (table: string, rowId: string, field: string, value: string) => {
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
  const handleKeyDown = (e: any) => {
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
          types: row.types || "ANCHOR_BOLT",
          subSubject: row.subSubject || "string",
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
            status: ["OPEN", "PENDING", "PARTIAL"].includes(row.status?.toUpperCase()),
          };
          await Service.EditRFIByID(row.id, payload as any);
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
          formData.append("totalCost", sum.toString());
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
  const addRow = (table: string) => {
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
        comments: "—",
        types: "ANCHOR_BOLT",
        subSubject: "string"
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

  // Export spreadsheet using XLSX — mirrors the on-screen WPR component layout
  const exportToExcel = () => {
    try {
      const workbook = XLSX.utils.book_new();
      const wsData: any[][] = [];
      const merges: XLSX.Range[] = [];
      const COL_COUNT = 8; // total columns we'll use (A-H)

      // ─── Helper: push a row padded to COL_COUNT ───
      const pushRow = (cells: any[]) => {
        while (cells.length < COL_COUNT) cells.push("");
        wsData.push(cells);
      };

      // ─── Helper: merge cells (s=start, e=end, 0-indexed) ───
      const merge = (r: number, c1: number, r2: number, c2: number) => {
        merges.push({ s: { r, c: c1 }, e: { r: r2, c: c2 } });
      };

      // ═══════════════════════════════════════════
      // SECTION: HEADER BLOCK
      // ═══════════════════════════════════════════
      let row = 0;

      // Row 0: Title row
      pushRow(["WHITEBOARD TECHNOLOGIES", "", "", `Week Ending ${weekEnding}`, "", "", "FORM NO", formNo]);
      merge(row, 0, row, 2); // Logo/company across 3 cols
      merge(row, 3, row, 5); // Title across 3 cols
      row++;

      // Row 1: Version
      pushRow(["", "", "", "", "", "", "VERSION", version]);
      merge(row, 0, row, 5);
      row++;

      // Row 2: Eff Date
      pushRow(["", "", "", "", "", "", "EFF DATE", effDate]);
      merge(row, 0, row, 5);
      row++;

      // Row 3: Customer
      pushRow(["Customer", "", project?.fabricator?.fabName || "—", "", "", "", "", ""]);
      merge(row, 0, row, 1);
      merge(row, 2, row, COL_COUNT - 1);
      row++;

      // Row 4: Project Name | Fab PM
      const fabPMNames = project?.clientProjectManagers?.length > 0
        ? project.clientProjectManagers.map((pm: any) => `${pm.firstName || ""} ${pm.lastName || ""}`.trim()).join(", ")
        : fabProjectManager;
      pushRow(["Project Name", "", project?.projectName || project?.name || "—", "", "Fabricator Project Manager", "", fabPMNames || "—", ""]);
      merge(row, 0, row, 1);
      merge(row, 2, row, 3);
      merge(row, 4, row, 5);
      merge(row, 6, row, 7);
      row++;

      // Row 5: WBT PM | Report Circulated To
      const wbtPM = project?.manager ? `${project.manager.firstName} ${project.manager.lastName}` : "—";
      pushRow(["WBT Project Manager", "", wbtPM, "", "Report Circulated To", "", fabCirculatedTo || "—", ""]);
      merge(row, 0, row, 1);
      merge(row, 2, row, 3);
      merge(row, 4, row, 5);
      merge(row, 6, row, 7);
      row++;

      // Row 6: Report Circulated To | Software
      pushRow(["Report Circulated To", "", wbtCirculatedTo || "—", "", "Software", "", software || "SDS2", ""]);
      merge(row, 0, row, 1);
      merge(row, 2, row, 3);
      merge(row, 4, row, 5);
      merge(row, 6, row, 7);
      row++;

      // Row 7: Empty spacer
      pushRow([]);
      row++;

      // Row 8: Project dates
      const fmtDate = (d: any) => d ? new Date(d).toLocaleDateString() : "—";
      pushRow(["Project Awarded", fmtDate(project?.startDate), "", "Approval Date", fmtDate(project?.approvalDate), "", "Fab Released Date", fmtDate(project?.fabricationDate)]);
      row++;

      // Row 9: Empty spacer
      pushRow([]);
      row++;

      // ═══════════════════════════════════════════
      // SECTION 1: PROJECT SCHEDULE / MILESTONES
      // ═══════════════════════════════════════════
      pushRow(["1. PROJECT SCHEDULE / MILESTONES", "", "", "", "", "", "", ""]);
      merge(row, 0, row, COL_COUNT - 1);
      row++;

      // Schedule header
      pushRow(["Phase / Subject", "Start Date", "IFA - Submission Date", "BFA - Recd Date", "IFC - Sub Date", "COR Drawing Submission Date", "Comment", ""]);
      merge(row, 6, row, 7); // Comment spans 2 cols
      row++;

      // Schedule data rows
      (filteredScheduleRows || []).forEach((s: any) => {
        pushRow([
          s.phase || "—",
          s.startDate || "—",
          s.ifaSubDate || "—",
          s.bfaRecdDate || "—",
          s.ifcSubDate || "—",
          s.corSubDate || "—",
          s.comments || "—",
          ""
        ]);
        merge(row, 6, row, 7);
        row++;
      });

      // Empty spacer
      pushRow([]);
      row++;

      // ═══════════════════════════════════════════
      // SECTION 2: RFI STATUS OVERVIEW
      // ═══════════════════════════════════════════
      pushRow(["2. RFI STATUS OVERVIEW", "", "", "", "", "", "", ""]);
      merge(row, 0, row, COL_COUNT - 1);
      row++;

      // RFI header
      pushRow(["RFI No.", "Sent Date", "Customer Response", "", "Response Received", "Whiteboard Response", "", "Status"]);
      merge(row, 2, row, 3); // Customer Response spans 2 cols
      merge(row, 5, row, 6); // WBT Response spans 2 cols
      row++;

      // RFI data rows
      (filteredRfis || []).forEach((r: any) => {
        const custResp = r.customerResponse?.replace(/&NBSP;|&nbsp;/gi, ' ') || "—";
        const wbtResp = r.wbtResponse?.replace(/&NBSP;|&nbsp;/gi, ' ') || "—";
        pushRow([
          r.rfiNo || "—",
          r.sentDate || "—",
          custResp,
          "",
          r.responseReceivedDate || "—",
          wbtResp,
          "",
          r.status || "—"
        ]);
        merge(row, 2, row, 3);
        merge(row, 5, row, 6);
        row++;
      });

      // Empty spacer
      pushRow([]);
      row++;

      // ═══════════════════════════════════════════
      // SECTION 3: CHANGE ORDER AMOUNT ($) MONTHLY BREAKDOWN
      // ═══════════════════════════════════════════
      pushRow(["3. CHANGE ORDER AMOUNT ($) MONTHLY BREAKDOWN", "", "", "", "", "", "", ""]);
      merge(row, 0, row, COL_COUNT - 1);
      row++;

      // CO header - use all 8 cols: CO | Jan-Feb | Mar-Apr | May-Jun | Jul-Aug | Sep-Oct | Nov-Dec | FY Total
      const coHeader = ["Change Order", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec", "FY Total"];
      const maxCols = Math.max(COL_COUNT, coHeader.length);
      
      // Ensure all previous rows are padded
      wsData.forEach((r) => {
        while (r.length < maxCols) r.push("");
      });

      wsData.push(coHeader);
      row++;

      (filteredCoRows || []).forEach((c: any) => {
        const coRow = [
          c.changeOrder || "—",
          c.Jan || "—", c.Feb || "—", c.Mar || "—", c.Apr || "—",
          c.May || "—", c.Jun || "—", c.Jul || "—", c.Aug || "—",
          c.Sep || "—", c.Oct || "—", c.Nov || "—", c.Dec || "—",
          c.total || "—"
        ];
        wsData.push(coRow);
        row++;
      });

      // ─── Create the worksheet ───
      const ws = XLSX.utils.aoa_to_sheet(wsData);
      ws["!merges"] = merges;

      // ─── Column widths ───
      ws["!cols"] = [
        { wch: 22 }, // A
        { wch: 14 }, // B
        { wch: 28 }, // C
        { wch: 14 }, // D
        { wch: 14 }, // E
        { wch: 28 }, // F
        { wch: 22 }, // G
        { wch: 14 }, // H
        { wch: 10 }, // I (months)
        { wch: 10 }, // J
        { wch: 10 }, // K
        { wch: 10 }, // L
        { wch: 10 }, // M
        { wch: 12 }, // N (FY Total)
      ];

      XLSX.utils.book_append_sheet(workbook, ws, "WPR Report");

      XLSX.writeFile(workbook, `${project?.projectName || "Project"}_WPR_Report.xlsx`);
      toast.success("Excel sheet exported successfully!");
    } catch (err: any) {
      console.error("Excel export error:", err);
      toast.error("Failed to export Excel: " + (err.message || "Unknown error"));
    }
  };

  // Export layout to PDF using jsPDF and jspdf-autotable
  const exportToPDF = async () => {
    const toastId = toast.loading("Generating PDF, please wait...");
    
    try {
      setIsExportingPDF(true);
      
      // CRITICAL: Yield to the event loop so the Toast can actually render before we lock the thread!
      await new Promise(resolve => setTimeout(resolve, 150));
      
      // Helper to strip HTML and preserve line breaks
      const cleanHtmlText = (html: any) => {
        if (!html) return "—";
        let text = String(html).replace(/<br\s*[\/]?>/gi, '\n');
        text = text.replace(/<\/p>|<\/div>|<\/li>/gi, '\n');
        text = text.replace(/<li>/gi, '• ');
        const parser = new DOMParser();
        const doc = parser.parseFromString(text, 'text/html');
        return (doc.body.textContent || "").trim().replace(/\n{3,}/g, '\n\n') || "—";
      };

      // Helper to load Logo
      const loadLogo = (): Promise<HTMLImageElement | null> => {
        return new Promise((resolve) => {
          const img = new window.Image();
          img.src = Logo;
          img.onload = () => resolve(img);
          img.onerror = () => resolve(null);
        });
      };
      
      const logoImg = await loadLogo();
      
      const pdf = new jsPDF("l", "pt", "a4");
      const startX = 40;
      let finalY = 40;
      
      const fmtDate = (d: any) => d ? new Date(d).toLocaleDateString() : "—";
      const fabPMNames = project?.clientProjectManagers?.length > 0
        ? project.clientProjectManagers.map((pm: any) => `${pm.firstName || ""} ${pm.lastName || ""}`.trim()).join(", ")
        : fabProjectManager;
      const wbtPM = project?.manager ? `${project.manager.firstName} ${project.manager.lastName}` : "—";

      // Meta Table / Header Table
      autoTable(pdf, {
        startY: finalY,
        theme: 'grid',
        styles: { fontSize: 8, cellPadding: 3, textColor: [0, 0, 0], lineColor: [0, 0, 0], lineWidth: 0.5 },
        body: [
          [
            { content: "", rowSpan: 3, colSpan: 2, styles: { minCellWidth: 100 } }, 
            { content: `WEEK ENDING ${weekEnding.toUpperCase()}`, rowSpan: 3, colSpan: 4, styles: { halign: 'center', valign: 'middle', fontStyle: 'bold', fontSize: 12, fillColor: [230, 240, 255] } },
            { content: "FORM NO", styles: { fillColor: [255, 250, 230], fontSize: 6, fontStyle: 'bold' } }, 
            { content: formNo, styles: { fontSize: 6 } }
          ],
          [
            { content: "VERSION", styles: { fillColor: [255, 250, 230], fontSize: 6, fontStyle: 'bold' } }, 
            { content: version, styles: { fontSize: 6 } }
          ],
          [
            { content: "EFF DATE", styles: { fillColor: [255, 250, 230], fontSize: 6, fontStyle: 'bold' } }, 
            { content: effDate, styles: { fontSize: 6 } }
          ],
          [
            { content: "CUSTOMER", colSpan: 2, styles: { fontStyle: 'bold', fillColor: "#bbf7d0", halign: 'center', valign: 'middle' } },
            { content: project?.fabricator?.fabName || "—", colSpan: 6, styles: { valign: 'middle' } }
          ],
          [
            { content: "PROJECT NAME :", colSpan: 2, styles: { fontStyle: 'bold', fillColor: "#bbf7d0", halign: 'center', valign: 'middle' } },
            { content: project?.projectName || project?.name || "—", colSpan: 2, styles: { valign: 'middle' } },
            { content: "FABRICATOR PROJECT MANAGER", colSpan: 2, styles: { fontStyle: 'bold', fillColor: "#bbf7d0", halign: 'center', valign: 'middle' } },
            { content: fabPMNames || "—", colSpan: 2, styles: { valign: 'middle' } }
          ],
          [
            { content: "WBT PROJECT MANAGER", colSpan: 2, styles: { fontStyle: 'bold', fillColor: "#bbf7d0", halign: 'center', valign: 'middle' } },
            { content: wbtPM, colSpan: 2, styles: { valign: 'middle' } },
            { content: "REPORT CIRCULATED TO", colSpan: 2, styles: { fontStyle: 'bold', fillColor: "#bbf7d0", halign: 'center', valign: 'middle' } },
            { content: fabCirculatedTo || "—", colSpan: 2, styles: { valign: 'middle' } }
          ],
          [
            { content: "REPORT CIRCULATED TO", colSpan: 2, styles: { fontStyle: 'bold', fillColor: "#bbf7d0", halign: 'center', valign: 'middle' } },
            { content: wbtCirculatedTo || "—", colSpan: 2, styles: { valign: 'middle' } },
            { content: "SOFTWARE", colSpan: 2, styles: { fontStyle: 'bold', fillColor: "#bbf7d0", halign: 'center', valign: 'middle' } },
            { content: software || "SDS2", colSpan: 2, styles: { valign: 'middle' } }
          ],
          [
            { content: "PROJECT AWARDED", colSpan: 1, styles: { fontStyle: 'bold', halign: 'center', valign: 'middle' } },
            { content: fmtDate(project?.startDate), colSpan: 2, styles: { valign: 'middle', halign: 'center' } },
            { content: "APPROVAL DATE", colSpan: 1, styles: { fontStyle: 'bold', halign: 'center', valign: 'middle' } },
            { content: fmtDate(project?.approvalDate), colSpan: 1, styles: { valign: 'middle', halign: 'center' } },
            { content: "FAB RELEASED DATE", colSpan: 2, styles: { fontStyle: 'bold', halign: 'center', valign: 'middle' } },
            { content: fmtDate(project?.fabricationDate), colSpan: 1, styles: { valign: 'middle', halign: 'center' } }
          ]
        ],
        didDrawCell: function(data) {
          if (data.row.index === 0 && data.column.index === 0 && logoImg) {
            const cell = data.cell;
            const padding = 5;
            const availableW = cell.width - (padding * 2);
            const availableH = cell.height - (padding * 2);
            const imgRatio = logoImg.width / logoImg.height;
            let drawW = availableW;
            let drawH = drawW / imgRatio;
            if (drawH > availableH) {
              drawH = availableH;
              drawW = drawH * imgRatio;
            }
            const x = cell.x + (cell.width - drawW) / 2;
            const y = cell.y + (cell.height - drawH) / 2;
            pdf.addImage(logoImg, 'PNG', x, y, drawW, drawH);
          }
        }
      });
      finalY = (pdf as any).lastAutoTable.finalY + 20;

      // 1. PROJECT SCHEDULE / MILESTONES
      pdf.setFontSize(10);
      pdf.setFont("helvetica", "bold");
      pdf.text("1. PROJECT SCHEDULE / MILESTONES", startX, finalY);
      finalY += 10;
      
      const safeScheduleRows = Array.isArray(filteredScheduleRows) ? filteredScheduleRows : [];
      autoTable(pdf, {
        startY: finalY,
        theme: 'grid',
        styles: { fontSize: 7, cellPadding: 3, overflow: 'linebreak', textColor: [0, 0, 0], lineColor: [0, 0, 0], lineWidth: 0.5 },
        headStyles: { fillColor: [241, 245, 249], textColor: [0, 0, 0], fontStyle: 'bold' },
        head: [["Phase / Subject", "Start Date", "IFA - Submission Date", "BFA - Recd Date", "IFC - Sub Date", "COR Drawing Submission Date", "Comment"]],
        body: safeScheduleRows.map((s: any) => [
          s?.phase || "—",
          s?.startDate || "—",
          s?.ifaSubDate || "—",
          s?.bfaRecdDate || "—",
          s?.ifcSubDate || "—",
          s?.corSubDate || "—",
          cleanHtmlText(s?.comments)
        ]),
      });
      finalY = (pdf as any).lastAutoTable.finalY + 20;

      // 2. RFI STATUS OVERVIEW
      pdf.setFontSize(10);
      pdf.setFont("helvetica", "bold");
      pdf.text("2. RFI STATUS OVERVIEW", startX, finalY);
      finalY += 10;
      
      const safeRfis = Array.isArray(filteredRfis) ? filteredRfis : [];
      autoTable(pdf, {
        startY: finalY,
        theme: 'grid',
        styles: { fontSize: 7, cellPadding: 3, overflow: 'linebreak', textColor: [0, 0, 0], lineColor: [0, 0, 0], lineWidth: 0.5 },
        headStyles: { fillColor: [241, 245, 249], textColor: [0, 0, 0], fontStyle: 'bold' },
        head: [["RFI No.", "Sent Date", "Customer Response", "Response Received", "Whiteboard Response", "Status"]],
        body: safeRfis.map((r: any) => [
          r?.rfiNo || "—",
          r?.sentDate || "—",
          cleanHtmlText(r?.customerResponse),
          r?.responseReceivedDate || "—",
          cleanHtmlText(r?.wbtResponse),
          r?.status || "—"
        ]),
      });
      finalY = (pdf as any).lastAutoTable.finalY + 20;

      // 3. CHANGE ORDER AMOUNT
      pdf.setFontSize(10);
      pdf.setFont("helvetica", "bold");
      pdf.text("3. CHANGE ORDER AMOUNT ($) MONTHLY BREAKDOWN", startX, finalY);
      finalY += 10;

      const safeCoRows = Array.isArray(filteredCoRows) ? filteredCoRows : [];
      autoTable(pdf, {
        startY: finalY,
        theme: 'grid',
        styles: { fontSize: 7, cellPadding: 3, overflow: 'linebreak', textColor: [0, 0, 0], lineColor: [0, 0, 0], lineWidth: 0.5, halign: 'center' },
        headStyles: { fillColor: [241, 245, 249], textColor: [0, 0, 0], fontStyle: 'bold', halign: 'center' },
        columnStyles: { 0: { halign: 'left' } },
        head: [["Change Order", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec", "FY Total"]],
        body: safeCoRows.map((c: any) => [
          c?.changeOrder || "—",
          c?.Jan || "—", c?.Feb || "—", c?.Mar || "—", c?.Apr || "—",
          c?.May || "—", c?.Jun || "—", c?.Jul || "—", c?.Aug || "—",
          c?.Sep || "—", c?.Oct || "—", c?.Nov || "—", c?.Dec || "—",
          c?.total || "—"
        ]),
      });

      pdf.save(`${project?.projectName || "Project"}_WPR_Report.pdf`);
      toast.update(toastId, { render: "PDF report exported successfully!", type: "success", isLoading: false, autoClose: 3000 });
    } catch (err: any) {
      console.error("Failed to export PDF", err);
      toast.update(toastId, { render: "Failed to export PDF: " + (err.message || "Unknown error"), type: "error", isLoading: false, autoClose: 5000 });
    } finally {
      setIsExportingPDF(false);
    }
  };

  // Print layout handler
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="w-full">
      {viewMode === "weeksTable" ? (
        <WprWeeksTable
          projectWeeks={projectWeeks}
          currentWeekLabel={projectWeeks.length > 0 ? projectWeeks[projectWeeks.length - 1].label : undefined}
          onSelectWeek={(label) => {
            handleWeekChange(label);
            setViewMode("reportView");
          }}
          onDownloadWeek={(label) => {
            handleWeekChange(label);
            setViewMode("reportView");
            // Wait for DOM to update and render the report view before PDF export
            setTimeout(() => {
              exportToPDF();
            }, 500);
          }}
        />
      ) : (
        <div className="space-y-8 p-1 animate-in fade-in slide-in-from-bottom-2 duration-500">
          <WprToolbar
            canEdit={canEdit}
            saving={saving}
            selectedWeekLabel={selectedWeek}
            onBackToWeeks={() => setViewMode("weeksTable")}
            onSaveChanges={handleSaveChanges}
            onExportPDF={exportToPDF}
            exportingPDF={isExportingPDF}
            onPrint={handlePrint}
          />
          <div id="wpr-report-content" className="space-y-8 bg-white p-2">
            <div id="section-header">
              <WprHeader
                weekEnding={weekEnding}
                project={project}
                fabProjectManager={fabProjectManager}
                setFabProjectManager={setFabProjectManager}
                wbtCirculatedTo={wbtCirculatedTo}
                setWbtCirculatedTo={setWbtCirculatedTo}
                fabCirculatedTo={fabCirculatedTo}
                setFabCirculatedTo={setFabCirculatedTo}
                software={software}
                setSoftware={setSoftware}
                formNo={formNo}
                setFormNo={setFormNo}
                version={version}
                setVersion={setVersion}
                effDate={effDate}
                setEffDate={setEffDate}
              />
            </div>
            <div id="section-rfi">
              <WprRfiTable
                rfis={filteredRfis}
                canEdit={canEdit}
                activeCell={activeCell}
                editValue={editValue}
                setEditValue={setEditValue}
                inputRef={inputRef}
                onCellClick={handleCellClick}
                onCellSave={handleCellSave}
                onKeyDown={handleKeyDown}
                onAddRow={() => addRow("rfi")}
              />
            </div>
            <div id="section-schedule">
              <WprScheduleTable
                scheduleRows={filteredScheduleRows}
                canEdit={canEdit}
                activeCell={activeCell}
                editValue={editValue}
                setEditValue={setEditValue}
                inputRef={inputRef}
                onCellClick={handleCellClick}
                onCellSave={handleCellSave}
                onKeyDown={handleKeyDown}
                onAddRow={() => addRow("schedule")}
              />
            </div>
           
            <div id="section-co">
              <WprChangeOrderTable
                coRows={filteredCoRows}
                canEdit={canEdit}
                activeCell={activeCell}
                editValue={editValue}
                setEditValue={setEditValue}
                inputRef={inputRef}
                onCellClick={handleCellClick}
                onCellSave={handleCellSave}
                onKeyDown={handleKeyDown}
                onAddRow={() => addRow("co")}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkProgressReport;
