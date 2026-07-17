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
import "jspdf-autotable";
import Logo from '../../../assets/logo.png';

const WorkProgressReport = ({
  projectId,
  project,
  milestones = [],
  rfiData = [],
  submittalData = [],
  changeOrderData = [],
  coordinationDrawings = [],
  onUpdate
}) => {
  const userRole = sessionStorage.getItem("userRole")?.toLowerCase() || "";
  const canEdit = !["client", "staff", "estimator"].includes(userRole);

  // WPR Header Info state
  const [reportDate, setReportDate] = useState(new Date().toISOString().split("T")[0]);
  const [weekEnding, setWeekEnding] = useState("");
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
          if (fab) {
            const wbtPOCs = fab.wbtFabricatorPointOfContact || fab.data?.wbtFabricatorPointOfContact;
            const fabPOCs = fab.pointOfContact || fab.data?.pointOfContact;

            if (wbtPOCs && wbtPOCs.length > 0) {
              const wbtPOC = wbtPOCs[0];
              setWbtCirculatedTo(`${wbtPOC.firstName || ""} ${wbtPOC.lastName || ""}`.trim().toUpperCase());
            }
            if (fabPOCs && fabPOCs.length > 0) {
              const fabPOC = fabPOCs[0];
              setFabCirculatedTo(`${fabPOC.firstName || ""} ${fabPOC.lastName || ""}`.trim().toUpperCase());
            }
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
      const flattenResponses = (list) => {
        const flat = [];
        list.forEach((res) => {
          flat.push(res);
          if (res.childResponses && res.childResponses.length > 0) {
            flat.push(...flattenResponses(res.childResponses));
          }
        });
        return flat;
      };

      const responses = flattenResponses(r.rfiresponse || []);

      // Detect role from nested user object or responseState
      const isClientResponse = (res) => {
        const role = String(res.user?.role || res.userRole || res.createdByRole || "").toUpperCase();
        if (role.includes("CLIENT")) return true;

        const wbtStatusUpper = String(res.wbtStatus || "").toUpperCase();
        if (wbtStatusUpper === "RECEIVED") return true;

        const responderId = res.userId || res.user?.id || res.user?._id;
        if (responderId) {
          const responderIdStr = String(responderId).toLowerCase();
          const recepId = String(r.recepient_id || r.recipient_id || r.recepients || "").toLowerCase();
          if (recepId && recepId === responderIdStr) return true;

          const recipients = r.multipleRecipients || [];
          if (recipients.some((rep) => String(rep.id || rep._id || "").toLowerCase() === responderIdStr)) {
            return true;
          }
        }
        return false;
      };

      // Sort responses by date (oldest first) so we can separate Q & A
      const sorted = [...responses].sort(
        (a, b) => new Date(a.createdAt || a.date || 0) - new Date(b.createdAt || b.date || 0)
      );

      // Customer response = latest response from client, else latest non-wbt
      const customerRep = [...sorted].reverse().find(res => isClientResponse(res))
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
      const bfaCache = {};
      const subsToFetch = filteredSubmittalData.filter(sub => sub.bfaStatus === true && sub.status === "BFA_SENT");

      await Promise.all(subsToFetch.map(async (sub) => {
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
      const fmt = (d) => d ? new Date(d).toLocaleDateString("en-US") : "—";
      const toEntry = (sub) => ({ subject: sub.subject || sub.serialNo || "—", date: fmt(sub.date || sub.createdAt) });
      const cleanHtml = (str) => (typeof str === 'string' ? str : "").replace(/<[^>]+>/g, "").replace(/&nbsp;/gi, " ").trim();

      // ── Milestone rows ────────────────────────────────────────────────────────
      const milestoneRows = milestones.map((m) => {
        const mId = String(m.id || m._id);

        // A submittal belongs to this milestone if:
        //   1. Its mileStoneId / milestoneId matches, OR
        //   2. Its mileStoneIds[] (new field) contains this milestone ID, OR
        //   3. Its mileStoneLinks[] (legacy) contains a reference to this milestone
        const matchLink = (link) =>
          String(link) === mId ||
          String(link?.id) === mId ||
          String(link?.mileStoneId) === mId ||
          String(link?.milestoneId) === mId;

        const belongsToMilestone = (sub) => {
          if (String(sub.mileStoneId || sub.milestoneId || sub.milestone?.id) === mId) return true;
          if (Array.isArray(sub.mileStoneIds) && sub.mileStoneIds.some(matchLink)) return true;
          if (Array.isArray(sub.mileStoneLinks) && sub.mileStoneLinks.some(matchLink)) return true;
          return false;
        };

        const subs = filteredSubmittalData.filter(belongsToMilestone);
        subs.forEach(s => linkedSubmittalIds.add(s.id || s._id));

        const ifaSubs = subs.filter(s => String(s.stage || "").toUpperCase() === "IFA");
        const ifcSubs = subs.filter(s => String(s.stage || "").toUpperCase() === "IFC");
        const corSubs = subs.filter(s => ["CO", "COR"].includes(String(s.stage || "").toUpperCase()));

        const unifiedEntries = subs.map(s => {
          const stage = String(s.stage || "").toUpperCase();
          const dateStr = s.createdAt || s.date || 0;

          let bfaDate = "—";
          const resList = s.submittalsResponse || [];
          if (resList.length > 0) {
            const latest = [...resList].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))[0];
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
          
          if (stage === "IFC") {
            currentStatus = "COMPLETED";
          }

          return {
            id: s.id || s._id,
            subject: s.subject || s.serialNo || "—",
            stage: s.stage || "IFA",
            ifaDate: !["IFC", "CO", "COR"].includes(stage) ? fmt(dateStr) : "—",
            bfaDate: bfaDate,
            ifcDate: stage === "IFC" ? fmt(dateStr) : "—",
            corDate: ["CO", "COR"].includes(stage) ? fmt(dateStr) : "—",
            status: currentStatus,
            date: dateStr,
            notes: s.notes || ""
          };
        });

        const finalBfaRecdDate = unifiedEntries.find(e => e.bfaDate !== "—")?.bfaDate || "—";
        const primarySub = subs.length > 0 ? [...subs].sort((a, b) => new Date(b.createdAt || b.date || 0) - new Date(a.createdAt || a.date || 0))[0] : null;
        let submittalStatus = "—";
        if (primarySub) {
          const matchingEntry = unifiedEntries.find(e => String(e.id) === String(primarySub.id || primarySub._id));
          submittalStatus = matchingEntry ? matchingEntry.status : (primarySub.wbtStatus || primarySub.status || "PENDING");
        }

        const subNotesList = subs
          .map(s => s.notes)
          .filter(n => typeof n === "string" && n.trim() !== "");
        const subNotesStr = subNotesList.length > 0 ? subNotesList.join(" | ") : "";

        const milestoneComments = subNotesStr || "—";

        return {
          id: m.id || m._id,
          _type: "milestone",
          phase: m.subject || "Unnamed Phase",
          startDate: m.date ? fmt(m.date) : (project?.startDate ? fmt(project.startDate) : "—"),
          unifiedEntries,
          bfaRecdDate: finalBfaRecdDate,
          submittalStatus,
          // flat dates kept for filtering/export
          ifaSubDate: unifiedEntries.find(e => e.ifaDate !== "—")?.ifaDate || "—",
          ifcSubDate: unifiedEntries.find(e => e.ifcDate !== "—")?.ifcDate || "—",
          corSubDate: unifiedEntries.find(e => e.corDate !== "—")?.corDate || "—",
          comments: milestoneComments,
          types: m.types || "ANCHOR_BOLT",
          subSubject: "",
        };
      });

      // ── Standalone submittal rows (no milestone link of any kind) ─────────────
      const standaloneRows = filteredSubmittalData
        .filter(sub => {
          if (linkedSubmittalIds.has(sub.id || sub._id)) return false;
          if (sub.mileStoneId || sub.milestoneId) return false;
          if (sub.mileStoneIds && sub.mileStoneIds.length > 0) return false;
          if (sub.mileStoneLinks && sub.mileStoneLinks.length > 0) return false;
          return true;
        })
        .map((sub) => {
          const responses = sub.submittalsResponse || [];
          const latestResponse = responses.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))[0];
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

          if (stage === "IFC") {
            currentStatus = "COMPLETED";
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
            stage: sub.stage || "IFA",
            ifaDate: !["IFC", "CO", "COR"].includes(stage) ? fmt(dateStr) : "—",
            bfaDate: finalBfaRecdDate,
            ifcDate: stage === "IFC" ? fmt(dateStr) : "—",
            corDate: ["CO", "COR"].includes(stage) ? fmt(dateStr) : "—",
            status: currentStatus,
            date: dateStr,
            notes: sub.notes || ""
          }];

          const subNotes = typeof sub.notes === "string" ? sub.notes.trim() : "";
          const finalComments = subNotes || "—";

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
            comments: finalComments,
            types: "ANCHOR_BOLT",
            subSubject: sub.subject || sub.serialNo || "",
          };
        });

      // ── Merge rows that share the same Phase / Subject ────────────────────────
      // (e.g. two milestones both named "ANCHOR BOLT" collapse into one row)
      const sortByDate = (entries) =>
        [...entries].sort((a, b) => {
          const da = a.date && a.date !== "—" ? new Date(a.date) : new Date(0);
          const db = b.date && b.date !== "—" ? new Date(b.date) : new Date(0);
          return da - db;
        });

      const mergeMap = new Map();
      [...milestoneRows, ...standaloneRows].forEach((row) => {
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
      const mergedRows = Array.from(mergeMap.values()).map((row) => {
        const sortedEntries = sortByDate(row.unifiedEntries || []);
        return {
          ...row,
          unifiedEntries: sortedEntries,
          ifaSubDate: sortedEntries.find(e => e.ifaDate !== "—")?.ifaDate || "—",
          ifcSubDate: sortedEntries.find(e => e.ifcDate !== "—")?.ifcDate || "—",
          corSubDate: sortedEntries.find(e => e.corDate !== "—")?.corDate || "—",
        };
      });

      setRawScheduleRows(mergedRows);
    };

    processSchedule();
  }, [milestones, submittalData, project]);

  // Sync Change Orders Month-by-month
  useEffect(() => {
    const rawCOs = changeOrderData || [];
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    const rows = rawCOs.map((co) => {
      let totalAmount = 0;
      const monthlyBreakdown = {};
      months.forEach(m => monthlyBreakdown[m] = "");

      if (Array.isArray(co.CoRefersTo) && co.CoRefersTo.length > 0) {
        const monthSums = {};
        let hasAnyAmount = false;

        co.CoRefersTo.forEach(item => {
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
  }, [changeOrderData, project]);

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
    const fabricatorName = project?.fabricator?.fabName || project?.fabricatorName || "";
    const projectName = project?.projectName || project?.name || "";
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
          await Service.EditRFIByID(row.id, payload, fabricatorName, projectName);
        } else {
          const formData = new FormData();
          formData.append("projectId", projectId);
          formData.append("subject", row.rfiNo);
          formData.append("description", "Created from Weekly Progress Report");
          formData.append("date", row.sentDate !== "—" ? new Date(row.sentDate).toISOString() : new Date().toISOString());
          await Service.addRFI(formData, fabricatorName, projectName);
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
          await Service.updateCoordinationDrawing(row.id, payload, fabricatorName, projectName);
        } else {
          const formData = new FormData();
          formData.append("projectId", projectId);
          formData.append("title", row.title);
          formData.append("description", `Created from Weekly Progress Report on ${new Date().toLocaleDateString()}`);
          formData.append("stage", row.stage || "IFA");

          const res = await Service.createCoordinationDrawing(formData, fabricatorName, projectName);
          if (res && res.data && row.status !== "Pending") {
            const newId = res.data.id || res.data._id;
            if (newId) {
              await Service.updateCoordinationDrawing(newId, { status: row.status }, fabricatorName, projectName);
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
          await Service.ChangeOrder(formData, fabricatorName, projectName);
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
      "COR Drawing Submission Date": s.corSubDate,
      "Comments": (() => {
        const statusPrefix = s.submittalStatus && s.submittalStatus !== "—" ? `[${s.submittalStatus}]` : "";
        const commentText = s.comments && s.comments !== "—" ? s.comments : "";
        return statusPrefix && commentText ? `${statusPrefix} ${commentText}` : statusPrefix || commentText || "—";
      })()
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
      body: filteredScheduleRows.map(s => {
        const statusPrefix = s.submittalStatus && s.submittalStatus !== "—" ? `[${s.submittalStatus}]` : "";
        const commentText = s.comments && s.comments !== "—" ? s.comments : "";
        const combined = statusPrefix && commentText ? `${statusPrefix}\n${commentText}` : statusPrefix || commentText || "—";
        return [s.phase, s.startDate, s.ifaSubDate, s.bfaRecdDate, s.ifcSubDate, s.corSubDate, combined];
      }),
      theme: "grid",
      styles: { fontSize: 8 },
      headStyles: { fillColor: "#bbf7d0" }
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
      headStyles: { fillColor: "#bbf7d0" }
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
      headStyles: { fillColor: "#bbf7d0" }
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
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-2.5 h-6 bg-[#6bbd45] rounded-none" />
          <h2 className="text-sm font-bold uppercase tracking-wider text-black">WPR Spreadsheet Control</h2>
          {projectWeeks.length > 0 && (
            <div className="flex items-center gap-2 ml-4">
              <span className="text-xs font-bold uppercase tracking-wider text-black">Select Week:</span>
              <select
                value={selectedWeek}
                onChange={(e) => handleWeekChange(e.target.value)}
                className="px-3 py-1.5 bg-white border border-black rounded-none text-xs font-bold uppercase tracking-wider outline-none focus:border-[#6bbd45] transition-all cursor-pointer"
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
          <button
            onClick={exportToPDF}
            className="flex items-center gap-2 px-5 py-2 bg-red-50 text-black border-2 border-red-700/80 hover:bg-red-100 rounded-none text-sm font-bold uppercase tracking-tight shadow-sm transition-all cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            PDF Export
          </button>

        </div>
      </div>

      {/* ── REPORT METADATA GRID (SPREADSHEET HEADER) ── */}
      <div className="border border-black overflow-hidden mb-6 bg-white shadow-sm mt-4">
        <table className="w-full border-collapse text-xs text-black">
          <tbody>
            {/* Header Row */}
            <tr className="bg-[#eaf4fe] border-b border-black">
              <td className="w-1/4 p-4 border-r border-black text-center bg-white align-middle">
                <div className="flex items-center justify-center">
                  <img src={Logo} alt="WBT Whiteboard Logo" className="h-12 w-auto object-contain mix-blend-multiply" />
                </div>
              </td>
              <td colSpan="2" className="p-4 border-r border-black text-center text-lg font-bold bg-[#eaf4fe]">
                Week Ending {weekEnding}
              </td>
              <td className="w-[30%] p-0 bg-[#eaf4fe] align-top">
                <table className="w-full h-full border-collapse text-[10px]">
                  <tbody>
                    <tr>
                      <td className="p-1.5 border-b border-r border-black bg-[#fef2cd] w-1/3">FORM NO</td>
                      <td className="p-1.5 border-b border-black font-normal">WBT/PMO/WPR-001</td>
                    </tr>
                    <tr>
                      <td className="p-1.5 border-b border-r border-black bg-[#fef2cd]">VERSION</td>
                      <td className="p-1.5 border-b border-black font-normal">1.0</td>
                    </tr>
                    <tr>
                      <td className="p-1.5 border-r border-black bg-[#fef2cd]">EFF DATE</td>
                      <td className="p-1.5 font-normal">05/09/2024</td>
                    </tr>
                  </tbody>
                </table>
              </td>
            </tr>

            {/* Row 1: Customer */}
            <tr className="border-b border-black">
              <td className="p-2 border-r border-black bg-green-200 text-center font-bold">Customer</td>
              <td colSpan="3" className="p-2 bg-white font-normal">
                {project?.fabricator?.fabName || "—"}
              </td>
            </tr>

            {/* Row 2: Project Name | Fab PM */}
            <tr className="border-b border-black">
              <td className="p-2 border-r border-black bg-green-200 text-center font-bold">Project Name :</td>
              <td className="p-2 border-r border-black bg-white font-normal">
                {project?.projectName || project?.name || "—"}
              </td>
              <td className="p-2 border-r border-black bg-green-200 text-center font-bold w-1/4">Fabricator Project Manager</td>
              <td className="p-0 bg-white font-normal">
                <input
                  type="text"
                  value={fabProjectManager}
                  onChange={(e) => setFabProjectManager(e.target.value)}
                  className="w-full h-full p-2 outline-none uppercase bg-transparent"
                />
              </td>
            </tr>

            {/* Row 3: WBT PM | Fab Report Circulated To */}
            <tr className="border-b border-black">
              <td className="p-2 border-r border-black bg-green-200 text-center font-bold">WBT Project Manager</td>
              <td className="p-2 border-r border-black bg-white font-normal">
                {project?.manager ? `${project.manager.firstName} ${project.manager.lastName}` : "—"}
              </td>
              <td className="p-2 border-r border-black bg-green-200 text-center font-bold">Report Circulated to</td>
              <td className="p-0 bg-white font-normal">
                <input
                  type="text"
                  value={fabCirculatedTo}
                  onChange={(e) => setFabCirculatedTo(e.target.value)}
                  className="w-full h-full p-2 outline-none uppercase bg-transparent"
                />
              </td>
            </tr>

            {/* Row 4: WBT Report Circulated To | Software */}
            <tr className="border-b border-black">
              <td className="p-2 border-r border-black bg-green-200 text-center font-bold">Report Circulated to</td>
              <td className="p-0 border-r border-black bg-white font-normal">
                <input
                  type="text"
                  value={wbtCirculatedTo}
                  onChange={(e) => setWbtCirculatedTo(e.target.value)}
                  className="w-full h-full p-2 outline-none uppercase bg-transparent"
                />
              </td>
              <td className="p-2 border-r border-black bg-green-200 text-center font-bold">Software</td>
              <td className="p-0 bg-white font-normal">
                <input
                  type="text"
                  value={software}
                  onChange={(e) => setSoftware(e.target.value)}
                  className="w-full h-full p-2 outline-none uppercase bg-transparent"
                />
              </td>
            </tr>
            {/* Spacer Line */}
            <tr className="border-b border-black bg-white">
              <td colSpan="4" className="h-6"></td>
            </tr>
            {/* Row 5: Dates */}
            <tr className="border-b border-black">
              <td colSpan="4" className="p-0">
                <table className="w-full h-full border-collapse text-xs">
                  <tbody>
                    <tr>
                      <td className="w-1/6 p-2 border-r border-black text-center font-bold">Project Awarded</td>
                      <td className="w-1/6 p-2 border-r border-black bg-white font-normal">
                        {project?.startDate ? new Date(project.startDate).toLocaleDateString() : "—"}
                      </td>
                      <td className="w-1/6 p-2 border-r border-black text-center font-bold">Approval Date</td>
                      <td className="w-1/6 p-2 bg-white font-normal border-r border-black">
                        {project?.approvalDate ? new Date(project.approvalDate).toLocaleDateString() : "—"}
                      </td>
                      <td className="w-1/6 p-2 border-r border-black text-center font-bold">Fab Released Date</td>
                      <td className="w-1/6 p-2 bg-white font-normal">
                        {project?.fabricationDate ? new Date(project.fabricationDate).toLocaleDateString() : "—"}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* ── 2. RFIs OVERVIEW TABLE ── */}
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <HelpCircle className="text-black w-5 h-5" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-black">2. RFI Status Overview</h3>
          </div>
          {canEdit && (
            <button
              onClick={() => addRow("rfi")}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-green-50 hover:bg-green-100 border border-green-200 text-green-700 rounded-none text-xs font-bold uppercase transition-all shadow-sm cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Row
            </button>
          )}
        </div>

        <div className="overflow-x-auto border border-black rounded-none bg-white shadow-sm custom-scrollbar max-w-full">
          <table className="w-full text-left border-collapse min-w-[800px] text-xs">
            <thead>
              <tr className="bg-slate-100 border-b border-black">
                <th className="p-3 font-bold uppercase tracking-wider text-black border-r border-black/10 w-24">RFI No.</th>
                <th className="p-3 font-bold uppercase tracking-wider text-black border-r border-black/10 w-28">Sent Date</th>
                <th className="p-3 font-bold uppercase tracking-wider text-black border-r border-black/10">Customer Response</th>
                <th className="p-3 font-bold uppercase tracking-wider text-black border-r border-black/10 w-36">Response Received</th>
                <th className="p-3 font-bold uppercase tracking-wider text-black border-r border-black/10">Whiteboard Response</th>
                <th className="p-3 font-bold uppercase tracking-wider text-black w-24">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/10">
              {filteredRfis.map((row) => (
                <tr key={row.id} className="hover:bg-slate-50 transition-all">
                  {/* RFI No. */}
                  <td
                    onClick={() => handleCellClick("rfi", row.id, "rfiNo", row.rfiNo)}
                    className="p-3 font-bold border-r border-black/10 cursor-pointer hover:bg-slate-100/50 text-black"
                  >
                    {activeCell?.table === "rfi" && activeCell.rowId === row.id && activeCell.field === "rfiNo" ? (
                      <input
                        ref={inputRef}
                        type="text"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onBlur={handleCellSave}
                        onKeyDown={handleKeyDown}
                        className="w-full bg-white border border-black px-2 py-1 rounded-none font-bold text-xs text-black"
                      />
                    ) : (
                      <span>{row.rfiNo}</span>
                    )}
                  </td>

                  {/* Sent Date */}
                  <td
                    onClick={() => handleCellClick("rfi", row.id, "sentDate", row.sentDate)}
                    className="p-3 border-r border-black/10 font-bold text-black cursor-pointer hover:bg-slate-100/50"
                  >
                    {activeCell?.table === "rfi" && activeCell.rowId === row.id && activeCell.field === "sentDate" ? (
                      <input
                        ref={inputRef}
                        type="text"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onBlur={handleCellSave}
                        onKeyDown={handleKeyDown}
                        className="w-full bg-white border border-black px-2 py-1 rounded-none text-xs text-black"
                      />
                    ) : (
                      <span>{row.sentDate}</span>
                    )}
                  </td>

                  {/* Customer Response */}
                  <td
                    onClick={() => handleCellClick("rfi", row.id, "customerResponse", row.customerResponse)}
                    className="p-3 border-r border-black/10 font-bold text-black cursor-pointer hover:bg-slate-100/50"
                  >
                    {activeCell?.table === "rfi" && activeCell.rowId === row.id && activeCell.field === "customerResponse" ? (
                      <textarea
                        ref={inputRef}
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onBlur={handleCellSave}
                        onKeyDown={handleKeyDown}
                        className="w-full bg-white border border-black px-2 py-1 rounded-none text-xs text-black"
                      />
                    ) : (
                      <span>{row.customerResponse?.replace(/&NBSP;|&nbsp;/gi, ' ')}</span>
                    )}
                  </td>

                  {/* Response Recd Date */}
                  <td
                    onClick={() => handleCellClick("rfi", row.id, "responseReceivedDate", row.responseReceivedDate)}
                    className="p-3 border-r border-black/10 font-bold text-black cursor-pointer hover:bg-slate-100/50"
                  >
                    {activeCell?.table === "rfi" && activeCell.rowId === row.id && activeCell.field === "responseReceivedDate" ? (
                      <input
                        ref={inputRef}
                        type="text"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onBlur={handleCellSave}
                        onKeyDown={handleKeyDown}
                        className="w-full bg-white border border-black px-2 py-1 rounded-none text-xs text-black"
                      />
                    ) : (
                      <span>{row.responseReceivedDate}</span>
                    )}
                  </td>

                  {/* WBT Response */}
                  <td
                    onClick={() => handleCellClick("rfi", row.id, "wbtResponse", row.wbtResponse)}
                    className="p-3 border-r border-black/10 font-bold text-black cursor-pointer hover:bg-slate-100/50"
                  >
                    {activeCell?.table === "rfi" && activeCell.rowId === row.id && activeCell.field === "wbtResponse" ? (
                      <textarea
                        ref={inputRef}
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onBlur={handleCellSave}
                        onKeyDown={handleKeyDown}
                        className="w-full bg-white border border-black px-2 py-1 rounded-none text-xs text-black"
                      />
                    ) : (
                      <span>{row.wbtResponse?.replace(/&NBSP;|&nbsp;/gi, ' ')}</span>
                    )}
                  </td>

                  {/* Status */}
                  <td
                    onClick={() => handleCellClick("rfi", row.id, "status", row.status)}
                    className="p-3 font-bold text-xs cursor-pointer hover:bg-slate-100/50 text-black"
                  >
                    {activeCell?.table === "rfi" && activeCell.rowId === row.id && activeCell.field === "status" ? (
                      <select
                        ref={inputRef}
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onBlur={handleCellSave}
                        onKeyDown={handleKeyDown}
                        className="w-full bg-white border border-black px-1 py-1 rounded-none text-xs uppercase font-bold text-black"
                      >
                        <option value="OPEN">OPEN</option>
                        <option value="PARTIAL">PARTIAL</option>
                        <option value="COMPLETE">COMPLETE</option>
                        <option value="PENDING">PENDING</option>
                        <option value="ANSWERED">ANSWERED</option>
                      </select>
                    ) : (
                      <span className={`px-2 py-1 rounded-none border border-black ${row.status === "OPEN" ? "bg-blue-50 text-blue-700" :
                        row.status === "PARTIAL" ? "bg-orange-50 text-orange-700" :
                          row.status === "COMPLETE" ? "bg-green-50 text-green-700" :
                            row.status === "PENDING" ? "bg-green-50 text-green-700" :
                              row.status === "ANSWERED" ? "bg-orange-50 text-orange-700" :
                                "bg-slate-50 text-slate-700"
                        }`}>
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

      {/* ── 1. PROJECT SCHEDULE & MILESTONES TABLE ── */}
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <CheckCircle className="text-black w-5 h-5" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-black">1. Project Schedule / Milestones</h3>
          </div>
          {canEdit && (
            <button
              onClick={() => addRow("schedule")}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-green-50 hover:bg-green-100 border border-green-200 text-green-750 rounded-none text-xs font-bold uppercase transition-all shadow-sm cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Row
            </button>
          )}
        </div>

        <div className="overflow-x-auto border border-black rounded-none bg-white shadow-sm custom-scrollbar max-w-full">
          <table className="w-full text-left border-collapse min-w-[800px] text-xs">
            <thead>
              <tr className="bg-slate-100 border-b border-black">
                <th className="p-3 font-bold uppercase tracking-wider text-black border-r border-black/10 w-56">Phase / Subject</th>
                <th className="p-3 font-bold uppercase tracking-wider text-black border-r border-black/10 w-28">Start Date</th>
                <th className="p-3 font-bold uppercase tracking-wider text-black border-r border-black/10 min-w-[15rem]">IFA - Submission Date</th>
                <th className="p-3 font-bold uppercase tracking-wider text-black border-r border-black/10 min-w-[15rem]">BFA - Recd Date</th>
                <th className="p-3 font-bold uppercase tracking-wider text-black border-r border-black/10 min-w-[15rem]">IFC - Sub Date</th>
                <th className="p-3 font-bold uppercase tracking-wider text-black border-r border-black/10 min-w-[16rem]">COR Drawing Submission Date</th>
                <th className="p-3 font-bold uppercase tracking-wider text-black min-w-[20rem]">Status & Comment</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/10">
              {filteredScheduleRows.map((row) => (
                <tr
                  key={row.id}
                  className={`border-b border-black transition-all ${row._type === "milestone"
                    ? "bg-[#f0f7ed] hover:bg-[#e6f3e2]"
                    : "bg-white hover:bg-slate-50"
                    }`}
                >
                  {/* Phase cell */}
                  <td
                    onClick={() => handleCellClick("schedule", row.id, "phase", row.phase)}
                    className="p-3 font-bold border-r border-black/10 cursor-pointer hover:bg-slate-100/50 text-black"
                  >
                    {activeCell?.table === "schedule" && activeCell.rowId === row.id && activeCell.field === "phase" ? (
                      <input
                        ref={inputRef}
                        type="text"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onBlur={handleCellSave}
                        onKeyDown={handleKeyDown}
                        className="w-full bg-white border border-black px-2 py-1 rounded-none font-bold uppercase text-xs text-black"
                      />
                    ) : (
                      <span className="uppercase">{row.phase}</span>
                    )}
                  </td>



                  {/* Start Date */}
                  <td
                    onClick={() => handleCellClick("schedule", row.id, "startDate", row.startDate)}
                    className="p-3 border-r border-black/10 font-bold text-black cursor-pointer hover:bg-slate-100/50"
                  >
                    {activeCell?.table === "schedule" && activeCell.rowId === row.id && activeCell.field === "startDate" ? (
                      <input
                        ref={inputRef}
                        type="text"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onBlur={handleCellSave}
                        onKeyDown={handleKeyDown}
                        className="w-full bg-white border border-black px-2 py-1 rounded-none text-xs text-black"
                      />
                    ) : (
                      <span>{row.startDate}</span>
                    )}
                  </td>

                  {/* IFA submission date – stacked entries: Subject – Date */}
                  <td className="p-0 border-r border-black/10 align-top">
                    {activeCell?.table === "schedule" && activeCell.rowId === row.id && activeCell.field === "ifaSubDate" ? (
                      <div className="p-3">
                        <input
                          ref={inputRef}
                          type="text"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onBlur={handleCellSave}
                          onKeyDown={handleKeyDown}
                          className="w-full bg-white px-2 rounded-none text-xs text-black"
                        />
                      </div>
                    ) : row.unifiedEntries && row.unifiedEntries.length > 0 ? (
                      <div className="flex flex-col h-full">
                        {row.unifiedEntries.map((entry, i) => (
                          <div key={i} className="flex flex-col flex-1 justify-center p-2">
                            {entry.ifaDate !== "—" ? (
                              <>
                                <span className="text-[11px] font-bold text-blue-800 leading-tight">
                                  {entry.subject}
                                </span>
                                <span className="text-[11px] text-blue-600 font-semibold leading-tight">
                                  {entry.ifaDate}
                                </span>
                              </>
                            ) : (
                              <span className="text-gray-400">—</span>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <span className="block p-2 text-gray-400">—</span>
                    )}
                  </td>

                  {/* BFA date */}
                  <td
                    onClick={() => handleCellClick("schedule", row.id, "bfaRecdDate", row.bfaRecdDate)}
                    className="p-0 border-r border-black/10 align-top cursor-pointer hover:bg-slate-100/50"
                  >
                    {activeCell?.table === "schedule" && activeCell.rowId === row.id && activeCell.field === "bfaRecdDate" ? (
                      <div className="p-2">
                        <input
                          ref={inputRef}
                          type="text"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onBlur={handleCellSave}
                          onKeyDown={handleKeyDown}
                          className="w-full bg-white border border-black px-2 py-1 rounded-none text-xs text-black"
                        />
                      </div>
                    ) : row.unifiedEntries && row.unifiedEntries.length > 0 ? (
                      <div className="flex flex-col h-full">
                        {row.unifiedEntries.map((entry, i) => (
                          <div key={i} className="flex flex-col flex-1 justify-center p-2">
                            {entry.bfaDate !== "—" ? (
                              <>
                                <span className="text-[11px] font-bold text-blue-800 leading-tight">
                                  {entry.subject}
                                </span>
                                <span className="text-[11px] text-blue-600 font-semibold leading-tight">
                                  {entry.bfaDate}
                                </span>
                              </>
                            ) : (
                              <span className="text-gray-400">—</span>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <span className="block p-2 text-gray-400">—</span>
                    )}
                  </td>

                  {/* IFC sub date – stacked entries */}
                  <td className="p-0 border-r border-black/10 align-top">
                    {activeCell?.table === "schedule" && activeCell.rowId === row.id && activeCell.field === "ifcSubDate" ? (
                      <div className="p-2">
                        <input
                          ref={inputRef}
                          type="text"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onBlur={handleCellSave}
                          onKeyDown={handleKeyDown}
                          className="w-full bg-white border border-black px-2 py-1 rounded-none text-xs text-black"
                        />
                      </div>
                    ) : row.unifiedEntries && row.unifiedEntries.length > 0 ? (
                      <div className="flex flex-col h-full">
                        {row.unifiedEntries.map((entry, i) => (
                          <div key={i} className="flex flex-col flex-1 justify-center p-2">
                            {entry.ifcDate !== "—" ? (
                              <>
                                <span className="text-[11px] font-bold text-blue-800 leading-tight">
                                  {entry.subject}
                                </span>
                                <span className="text-[11px] text-blue-600 font-semibold leading-tight">
                                  {entry.ifcDate}
                                </span>
                              </>
                            ) : (
                              <span className="text-gray-400">—</span>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <span className="block p-2 text-gray-400">—</span>
                    )}
                  </td>

                  {/* COR Drawing Sub date – stacked entries */}
                  <td className="p-0 border-r border-black/10 align-top">
                    {activeCell?.table === "schedule" && activeCell.rowId === row.id && activeCell.field === "corSubDate" ? (
                      <div className="p-2">
                        <input
                          ref={inputRef}
                          type="text"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onBlur={handleCellSave}
                          onKeyDown={handleKeyDown}
                          className="w-full bg-white border border-black px-2 py-1 rounded-none text-xs text-black"
                        />
                      </div>
                    ) : row.unifiedEntries && row.unifiedEntries.length > 0 ? (
                      <div className="flex flex-col h-full">
                        {row.unifiedEntries.map((entry, i) => (
                          <div key={i} className="flex flex-col flex-1 justify-center p-2">
                            {entry.corDate !== "—" ? (
                              <>
                                <span className="text-[11px] font-bold text-blue-800 leading-tight">
                                  {entry.subject}
                                </span>
                                <span className="text-[11px] text-blue-600 font-semibold leading-tight">
                                  {entry.corDate}
                                </span>
                              </>
                            ) : (
                              <span className="text-gray-400">—</span>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <span className="block p-2 text-gray-400">—</span>
                    )}
                  </td>

                  {/* Status & Comment */}
                  <td className="p-0 align-top">
                    {(() => {
                      const STATUS_LABELS = {
                        WAITING_FOR_BFA: "Waiting for BFA",
                        BFA_RECEIVED: "BFA RECEIVED",
                        BFA_SENT: "BFA SENT",
                        SUBMITTED_TO_EOR: "Submitted to EOR",
                        RELEASE_FOR_FABRICATION: "Release for Fab",
                        NOT_APPROVED: "Not Approved",
                        REVISED_RESUBMITTAL: "Revised & Resubmitted",
                        REVISED_RESUBMIT_FOR_FABRICATION: "Revised & Resub for Fab",
                        PENDING: "Pending",
                        COMPLETE: "BFA - Complete",
                        COMPLETED: "BFA - Complete",
                        PARTIAL: "BFA - Partial",
                        SUCCESS: "BFA - Success",
                      };
                      const STATUS_COLORS = {
                        WAITING_FOR_BFA: "bg-purple-100 text-purple-700 border-purple-200",
                        BFA_RECEIVED: "bg-emerald-100 text-emerald-700 border-emerald-200",
                        BFA_SENT: "bg-indigo-100 text-indigo-700 border-indigo-200",
                        SUBMITTED_TO_EOR: "bg-blue-100 text-blue-700 border-blue-200",
                        RELEASE_FOR_FABRICATION: "bg-green-100 text-green-700 border-green-200",
                        NOT_APPROVED: "bg-red-100 text-red-700 border-red-200",
                        REVISED_RESUBMITTAL: "bg-orange-100 text-orange-700 border-orange-200",
                        REVISED_RESUBMIT_FOR_FABRICATION: "bg-orange-100 text-orange-700 border-orange-200",
                        PENDING: "bg-yellow-100 text-yellow-700 border-yellow-200",
                        COMPLETE: "bg-teal-100 text-teal-700 border-teal-200",
                        COMPLETED: "bg-teal-100 text-teal-700 border-teal-200",
                        PARTIAL: "bg-amber-100 text-amber-700 border-amber-200",
                        SUCCESS: "bg-emerald-100 text-emerald-700 border-emerald-200",
                      };

                      const renderBadge = (rawStatus) => {
                        if (!rawStatus || rawStatus === "—") return null;
                        const st = String(rawStatus).toUpperCase();
                        const label = STATUS_LABELS[st] || rawStatus;
                        const colors = STATUS_COLORS[st] || "bg-gray-100 text-gray-700 border-gray-200";
                        return (
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-none text-[10px] font-black uppercase tracking-widest border shrink-0 ${colors}`}>
                            {label}
                          </span>
                        );
                      };

                      if (row.unifiedEntries && row.unifiedEntries.length > 0) {
                        const allDone = row.unifiedEntries.every(entry => {
                          const st = String(entry.status || "—").toUpperCase();
                          return entry.bfaDate !== "—" || ["COMPLETE", "COMPLETED", "SUCCESS", "BFA_RECEIVED", "RELEASE_FOR_FABRICATION"].includes(st);
                        });

                        const hasAnyNotes = row.unifiedEntries.some(entry => entry.notes && typeof entry.notes === "string" && entry.notes.trim() !== "");

                        if (allDone && !hasAnyNotes) {
                          return (
                            <div className="flex h-full items-center gap-2 p-3">
                              {renderBadge("COMPLETE")}
                            </div>
                          );
                        }

                        return (
                          <div className="flex flex-col h-full">
                            {row.unifiedEntries.map((entry, i) => {
                              const hasNote = entry.notes && typeof entry.notes === "string" && entry.notes.trim() !== "";
                              return (
                                <div key={i} className="flex flex-col flex-1 justify-center gap-1.5 p-3 border-b border-black/5 last:border-b-0">
                                  <div>{renderBadge(allDone ? "COMPLETE" : entry.status)}</div>
                                  {hasNote && (
                                    <div className="text-[11px] text-gray-700 font-normal break-words">
                                      {entry.notes}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        );
                      }

                      const hasComments = row.comments && row.comments !== "—" && typeof row.comments === "string" && row.comments.trim() !== "";
                      return (
                        <div className="flex flex-col justify-center gap-1.5 p-3 h-full">
                          <div>{renderBadge(row.submittalStatus)}</div>
                          {hasComments && (
                            <div className="text-[11px] text-gray-700 break-words font-normal">
                              {row.comments}
                            </div>
                          )}
                        </div>
                      );
                    })()}
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
            <Clock className="text-black w-5 h-5" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-black">3. Change Order Amount ($) Monthly Breakdown</h3>
          </div>
          {canEdit && (
            <button
              onClick={() => addRow("co")}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-green-50 hover:bg-green-100 border border-green-200 text-green-700 rounded-none text-xs font-bold uppercase transition-all shadow-sm cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Row
            </button>
          )}
        </div>

        <div className="overflow-x-auto border border-black rounded-none bg-white shadow-sm custom-scrollbar max-w-full">
          <table className="w-full text-center border-collapse min-w-[1000px] text-xs">
            <thead>
              <tr className="bg-slate-100 border-b border-black">
                <th className="p-3 text-left font-bold uppercase tracking-wider text-black border-r border-black/10">Change Order</th>
                {["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"].map(m => (
                  <th key={m} className="p-3 font-bold uppercase tracking-wider text-black border-r border-black/10">{m}</th>
                ))}
                <th className="p-3 font-bold uppercase tracking-wider text-black">FY Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/10 font-bold text-black">
              {filteredCoRows.map((row) => (
                <tr key={row.id} className="hover:bg-slate-50 transition-all">
                  {/* CO number name */}
                  <td
                    onClick={() => handleCellClick("co", row.id, "changeOrder", row.changeOrder)}
                    className="p-3 text-left font-bold text-black border-r border-black/10 cursor-pointer hover:bg-slate-100/50"
                  >
                    {activeCell?.table === "co" && activeCell.rowId === row.id && activeCell.field === "changeOrder" ? (
                      <input
                        ref={inputRef}
                        type="text"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onBlur={handleCellSave}
                        onKeyDown={handleKeyDown}
                        className="w-full bg-white border border-black px-2 py-1 rounded-none font-bold text-xs text-black"
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
                      className="p-3 border-r border-black/10 cursor-pointer hover:bg-slate-100/50 text-black"
                    >
                      {activeCell?.table === "co" && activeCell.rowId === row.id && activeCell.field === m ? (
                        <input
                          ref={inputRef}
                          type="text"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onBlur={handleCellSave}
                          onKeyDown={handleKeyDown}
                          className="w-8/12 bg-white border border-black px-1 py-0.5 rounded-none text-center text-xs text-black"
                        />
                      ) : (
                        <span className={row[m] === "Sent" ? "text-blue-600 font-bold" : ""}>{row[m] || "—"}</span>
                      )}
                    </td>
                  ))}

                  {/* Total */}
                  <td className="p-3 font-bold text-black">{row.total}</td>
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
