import React, { useState, useMemo } from "react";
import {
  ClipboardList,
  AlertCircle,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Search,
  X,
  Calendar,
  Clock,
  Building2,
  Layers,
  DollarSign,
  Filter,
  CheckCircle2,
} from "lucide-react";

const UpcomingSubmittals = ({
  pendingSubmittals = [],
  invoices = [],
  onSubmittalClick,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState("submittals");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("ALL"); // ALL, OVERDUE, DUE_SOON
  const [collapsedProjects, setCollapsedProjects] = useState({});

  const userRole = sessionStorage.getItem("userRole")?.toLowerCase() || "";
  const isPMO = userRole === "project_manager_officer";

  // Calculate date information and urgency
  const getDateInfo = (dateString) => {
    if (!dateString) {
      return {
        formattedDate: "No Date",
        isOverdue: false,
        isToday: false,
        isDueSoon: false,
        diffDays: null,
        label: "No Date",
      };
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const targetDate = new Date(dateString);
    if (isNaN(targetDate.getTime())) {
      return {
        formattedDate: "Invalid Date",
        isOverdue: false,
        isToday: false,
        isDueSoon: false,
        diffDays: null,
        label: "Invalid Date",
      };
    }

    const formattedDate = targetDate.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });

    const targetZero = new Date(targetDate);
    targetZero.setHours(0, 0, 0, 0);

    const diffTime = targetZero.getTime() - today.getTime();
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      const days = Math.abs(diffDays);
      return {
        formattedDate,
        isOverdue: true,
        isToday: false,
        isDueSoon: false,
        diffDays,
        label: days === 1 ? "Overdue by 1 day" : `Overdue by ${days} days`,
      };
    }

    if (diffDays === 0) {
      return {
        formattedDate,
        isOverdue: false,
        isToday: true,
        isDueSoon: true,
        diffDays: 0,
        label: "Due Today",
      };
    }

    if (diffDays <= 7) {
      return {
        formattedDate,
        isOverdue: false,
        isToday: false,
        isDueSoon: true,
        diffDays,
        label: diffDays === 1 ? "Due tomorrow" : `Due in ${diffDays} days`,
      };
    }

    return {
      formattedDate,
      isOverdue: false,
      isToday: false,
      isDueSoon: false,
      diffDays,
      label: `Due in ${diffDays} days`,
    };
  };

  const getProjectName = (item) => {
    return (
      item.project?.name ||
      item.projectName ||
      item.name ||
      "Other Projects"
    );
  };

  const getProjectNumber = (item) => {
    return item.project?.projectNumber || item.projectNumber || "";
  };

  const getFabricator = (item) => {
    return (
      item.fabricator?.fabName ||
      item.project?.fabricator?.fabName ||
      item.fabName ||
      "—"
    );
  };

  const getSubject = (item) => {
    return item.subject || item.name || "No Subject";
  };

  const getSubSubject = (item) => {
    return item.subSubject || "";
  };

  const getStage = (item) => {
    return item.stage || item.submittalStage || "";
  };

  // Overall metrics
  const stats = useMemo(() => {
    let overdue = 0;
    let dueSoon = 0;

    pendingSubmittals.forEach((submittal) => {
      const dateVal =
        submittal.approvalDate || submittal.dueDate || submittal.date;
      const info = getDateInfo(dateVal);
      if (info.isOverdue) overdue++;
      else if (info.isDueSoon) dueSoon++;
    });

    const uniqueProjects = new Set(
      pendingSubmittals.map((s) => getProjectName(s))
    );

    return {
      total: pendingSubmittals.length,
      overdue,
      dueSoon,
      projectsCount: uniqueProjects.size,
    };
  }, [pendingSubmittals]);

  // Filtered submittals
  const filteredSubmittals = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    return pendingSubmittals.filter((submittal) => {
      const dateVal =
        submittal.approvalDate || submittal.dueDate || submittal.date;
      const dateInfo = getDateInfo(dateVal);

      // Filter pill logic
      if (filterType === "OVERDUE" && !dateInfo.isOverdue) return false;
      if (filterType === "DUE_SOON" && !dateInfo.isDueSoon) return false;

      // Search query logic
      if (q) {
        const proj = getProjectName(submittal).toLowerCase();
        const projNum = getProjectNumber(submittal).toLowerCase();
        const subj = getSubject(submittal).toLowerCase();
        const subSubj = getSubSubject(submittal).toLowerCase();
        const fab = getFabricator(submittal).toLowerCase();
        const stage = getStage(submittal).toLowerCase();

        const match =
          proj.includes(q) ||
          projNum.includes(q) ||
          subj.includes(q) ||
          subSubj.includes(q) ||
          fab.includes(q) ||
          stage.includes(q);

        if (!match) return false;
      }

      return true;
    });
  }, [pendingSubmittals, searchQuery, filterType]);

  // Grouped submittals sorted by due date
  const groupedSubmittals = useMemo(() => {
    const groups = {};

    filteredSubmittals.forEach((submittal) => {
      const projName = getProjectName(submittal);
      if (!groups[projName]) {
        groups[projName] = {
          projectName: projName,
          projectNumber: getProjectNumber(submittal),
          items: [],
          overdueCount: 0,
        };
      }

      const dateVal =
        submittal.approvalDate || submittal.dueDate || submittal.date;
      const info = getDateInfo(dateVal);
      if (info.isOverdue) {
        groups[projName].overdueCount++;
      }

      groups[projName].items.push({
        ...submittal,
        _dateInfo: info,
      });
    });

    // Sort items within each group: overdue first, then by earliest diffDays
    Object.values(groups).forEach((group) => {
      group.items.sort((a, b) => {
        const aDays = a._dateInfo.diffDays ?? 9999;
        const bDays = b._dateInfo.diffDays ?? 9999;
        return aDays - bDays;
      });
    });

    return groups;
  }, [filteredSubmittals]);

  // Invoices needing to be raised
  const invoiceNeedRaise = useMemo(() => {
    return invoices.filter((inv) => !inv.paymentStatus);
  }, [invoices]);

  const toggleProjectCollapse = (projectName) => {
    setCollapsedProjects((prev) => ({
      ...prev,
      [projectName]: !prev[projectName],
    }));
  };

  const toggleAllProjects = () => {
    const projectNames = Object.keys(groupedSubmittals);
    const allCollapsed = projectNames.every((name) => collapsedProjects[name]);

    const updated = {};
    projectNames.forEach((name) => {
      updated[name] = !allCollapsed;
    });
    setCollapsedProjects(updated);
  };

  const isAllCollapsed =
    Object.keys(groupedSubmittals).length > 0 &&
    Object.keys(groupedSubmittals).every((name) => collapsedProjects[name]);

  return (
    <div className="bg-white flex flex-col h-full w-full rounded-xl overflow-hidden">
      {/* Top Header */}
      <div className="px-6 py-4 border-b border-gray-100 bg-white shrink-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Title & Tabs */}
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-sm">
              <ClipboardList className="w-5 h-5 text-primary" strokeWidth={2.2} />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="text-base font-black text-gray-900 tracking-tight uppercase">
                  Upcoming Submittals
                </h2>
                <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-primary/10 text-primary border border-primary/20">
                  {stats.total}
                </span>
                {stats.overdue > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-red-50 text-red-600 border border-red-200 flex items-center gap-1 animate-pulse">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                    {stats.overdue} Overdue
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-500 font-medium">
                Milestones & submittals scheduled across active projects
              </p>
            </div>
          </div>

          {isPMO && (
            <div className="flex items-center bg-gray-100 p-1 rounded-lg border border-gray-200 text-xs font-bold ml-2">
              <button
                onClick={() => setActiveTab("submittals")}
                className={`px-3 py-1.5 rounded-md transition-all ${
                  activeTab === "submittals"
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-500 hover:text-gray-800"
                }`}
              >
                Submittals ({stats.total})
              </button>
              <button
                onClick={() => setActiveTab("invoices")}
                className={`px-3 py-1.5 rounded-md transition-all ${
                  activeTab === "invoices"
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-500 hover:text-gray-800"
                }`}
              >
                Invoices to Raise ({invoiceNeedRaise.length})
              </button>
            </div>
          )}
        </div>

        {/* Search & Modal Close */}
        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search project, subject, fab..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-8 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs font-medium text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 text-gray-400 hover:text-gray-600 rounded-full"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {onClose && (
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors border border-transparent hover:border-gray-200 cursor-pointer"
              title="Close (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Filter Toolbar & Summary Metrics */}
      {activeTab === "submittals" && (
        <div className="px-6 py-2.5 bg-slate-50/80 border-b border-gray-100 flex flex-wrap items-center justify-between gap-3 shrink-0">
          {/* Quick Filters */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5 mr-1">
              <Filter className="w-3 h-3 text-gray-400" /> Filter:
            </span>

            <button
              onClick={() => setFilterType("ALL")}
              className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all ${
                filterType === "ALL"
                  ? "bg-primary text-white shadow-sm"
                  : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"
              }`}
            >
              All ({stats.total})
            </button>

            <button
              onClick={() => setFilterType(filterType === "OVERDUE" ? "ALL" : "OVERDUE")}
              className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all flex items-center gap-1.5 ${
                filterType === "OVERDUE"
                  ? "bg-red-600 text-white shadow-sm"
                  : stats.overdue > 0
                  ? "bg-red-50 text-red-700 hover:bg-red-100 border border-red-200"
                  : "bg-white text-gray-400 hover:bg-gray-100 border border-gray-200"
              }`}
            >
              <AlertCircle className="w-3.5 h-3.5" />
              Overdue ({stats.overdue})
            </button>

            <button
              onClick={() => setFilterType(filterType === "DUE_SOON" ? "ALL" : "DUE_SOON")}
              className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all flex items-center gap-1.5 ${
                filterType === "DUE_SOON"
                  ? "bg-amber-500 text-white shadow-sm"
                  : stats.dueSoon > 0
                  ? "bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200"
                  : "bg-white text-gray-400 hover:bg-gray-100 border border-gray-200"
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              Due in 7 Days ({stats.dueSoon})
            </button>
          </div>

          {/* Right Action: Expand/Collapse All */}
          {Object.keys(groupedSubmittals).length > 0 && (
            <button
              onClick={toggleAllProjects}
              className="text-xs font-bold text-gray-500 hover:text-primary transition-colors flex items-center gap-1 cursor-pointer"
            >
              {isAllCollapsed ? (
                <>
                  <ChevronDown className="w-3.5 h-3.5" /> Expand All Projects
                </>
              ) : (
                <>
                  <ChevronUp className="w-3.5 h-3.5" /> Collapse All Projects
                </>
              )}
            </button>
          )}
        </div>
      )}

      {/* Main Body */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-6 bg-slate-50/40">
        {activeTab === "submittals" ? (
          filteredSubmittals.length > 0 ? (
            <div className="space-y-4 max-w-6xl mx-auto">
              {Object.entries(groupedSubmittals).map(([projectName, group]) => {
                const isCollapsed = !!collapsedProjects[projectName];

                return (
                  <div
                    key={projectName}
                    className="bg-white border border-gray-200 rounded-xl shadow-xs overflow-hidden transition-all duration-200 hover:border-gray-300"
                  >
                    {/* Project Accordion Header */}
                    <div
                      onClick={() => toggleProjectCollapse(projectName)}
                      className="px-5 py-3.5 bg-gradient-to-r from-gray-50/80 via-white to-gray-50/50 border-b border-gray-100 flex items-center justify-between gap-4 cursor-pointer select-none hover:bg-gray-50/80 transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-2.5 h-2.5 rounded-full bg-primary ring-4 ring-primary/10 shrink-0"></div>
                        <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 min-w-0">
                          <h3 className="text-xs sm:text-sm font-black text-gray-900 uppercase tracking-wider truncate">
                            {projectName}
                          </h3>
                          {group.projectNumber && (
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-2 py-0.5 bg-gray-100 rounded border border-gray-200 w-fit">
                              {group.projectNumber}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2.5 shrink-0">
                        {group.overdueCount > 0 && (
                          <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-red-50 text-red-600 border border-red-200 flex items-center gap-1">
                            <AlertCircle className="w-3 h-3 text-red-500" />
                            {group.overdueCount} Overdue
                          </span>
                        )}
                        <span className="px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-gray-100 text-gray-600 border border-gray-200">
                          {group.items.length}{" "}
                          {group.items.length === 1 ? "Item" : "Items"}
                        </span>
                        <div className="w-6 h-6 rounded-md flex items-center justify-center text-gray-400 hover:text-gray-600 transition-transform">
                          {isCollapsed ? (
                            <ChevronDown className="w-4 h-4" />
                          ) : (
                            <ChevronUp className="w-4 h-4" />
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Submittals List */}
                    {!isCollapsed && (
                      <div>
                        {/* Table Header Bar */}
                        <div className="hidden lg:grid grid-cols-12 gap-4 px-5 py-2 bg-gray-50/60 border-b border-gray-100 text-[10px] font-black text-gray-400 uppercase tracking-wider">
                          <div className="col-span-5">Subject / Milestone</div>
                          <div className="col-span-2">Stage</div>
                          <div className="col-span-3">Fabricator</div>
                          <div className="col-span-2 text-right">Due Date</div>
                        </div>

                        {/* Rows */}
                        <div className="divide-y divide-gray-100">
                          {group.items.map((submittal, index) => {
                            const dateInfo = submittal._dateInfo;
                            const subject = getSubject(submittal);
                            const subSubject = getSubSubject(submittal);
                            const fabricator = getFabricator(submittal);
                            const stage = getStage(submittal);

                            return (
                              <div
                                key={submittal.id || submittal._id || index}
                                onClick={() =>
                                  onSubmittalClick && onSubmittalClick(submittal)
                                }
                                className="group px-5 py-3.5 flex flex-col lg:grid lg:grid-cols-12 gap-3 lg:gap-4 items-start lg:items-center hover:bg-slate-50/80 transition-all cursor-pointer relative"
                              >
                                {/* Active hover accent bar */}
                                <div className="absolute left-0 top-0 bottom-0 w-1 bg-transparent group-hover:bg-primary transition-colors"></div>

                                {/* Subject & Urgency Status */}
                                <div className="lg:col-span-5 flex items-start gap-3 min-w-0 w-full">
                                  <div
                                    className={`p-2 rounded-lg shrink-0 mt-0.5 transition-transform group-hover:scale-105 ${
                                      dateInfo.isOverdue
                                        ? "bg-red-50 text-red-600 border border-red-200"
                                        : dateInfo.isToday
                                        ? "bg-amber-50 text-amber-600 border border-amber-200"
                                        : "bg-primary/10 text-primary border border-primary/20"
                                    }`}
                                  >
                                    {dateInfo.isOverdue ? (
                                      <AlertCircle className="w-4 h-4" />
                                    ) : dateInfo.isToday ? (
                                      <Clock className="w-4 h-4" />
                                    ) : (
                                      <ClipboardList className="w-4 h-4" />
                                    )}
                                  </div>

                                  <div className="flex flex-col min-w-0 flex-1">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <span
                                        className={`text-xs sm:text-sm font-bold tracking-tight truncate ${
                                          dateInfo.isOverdue
                                            ? "text-red-700 group-hover:text-red-800"
                                            : "text-gray-900 group-hover:text-primary"
                                        }`}
                                        title={
                                          subSubject
                                            ? `${subject} - ${subSubject}`
                                            : subject
                                        }
                                      >
                                        {subject}
                                      </span>

                                      {/* Mobile-only stage badge */}
                                      {stage && (
                                        <span className="lg:hidden px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200 uppercase">
                                          {stage}
                                        </span>
                                      )}
                                    </div>

                                    {subSubject && (
                                      <span className="text-xs text-gray-500 font-medium truncate mt-0.5">
                                        {subSubject}
                                      </span>
                                    )}

                                    {/* Mobile meta info */}
                                    <div className="flex items-center gap-2 mt-1.5 lg:hidden text-[11px] text-gray-500">
                                      <span className="flex items-center gap-1 font-medium truncate max-w-[180px]">
                                        <Building2 className="w-3 h-3 text-gray-400" />
                                        {fabricator}
                                      </span>
                                      <span>•</span>
                                      <span
                                        className={`font-semibold ${
                                          dateInfo.isOverdue
                                            ? "text-red-600 font-bold"
                                            : "text-gray-600"
                                        }`}
                                      >
                                        {dateInfo.label}
                                      </span>
                                    </div>
                                  </div>
                                </div>

                                {/* Stage Column (Desktop) */}
                                <div className="hidden lg:flex lg:col-span-2 items-center">
                                  {stage ? (
                                    <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-gray-100 text-gray-700 border border-gray-200 uppercase tracking-wide">
                                      {stage}
                                    </span>
                                  ) : (
                                    <span className="text-xs text-gray-400 font-medium">
                                      —
                                    </span>
                                  )}
                                </div>

                                {/* Fabricator Column (Desktop) */}
                                <div className="hidden lg:flex lg:col-span-3 items-center gap-2 min-w-0">
                                  <Building2 className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                                  <span
                                    className="text-xs font-medium text-gray-700 truncate"
                                    title={fabricator}
                                  >
                                    {fabricator}
                                  </span>
                                </div>

                                {/* Due Date & Action Column (Desktop) */}
                                <div className="hidden lg:flex lg:col-span-2 items-center justify-end gap-3 text-right">
                                  <div className="flex flex-col items-end">
                                    <span
                                      className={`text-xs font-bold ${
                                        dateInfo.isOverdue
                                          ? "text-red-600"
                                          : dateInfo.isToday
                                          ? "text-amber-600"
                                          : "text-gray-800"
                                      }`}
                                    >
                                      {dateInfo.formattedDate}
                                    </span>
                                    <span
                                      className={`text-[10px] font-semibold mt-0.5 ${
                                        dateInfo.isOverdue
                                          ? "text-red-500"
                                          : dateInfo.isToday
                                          ? "text-amber-500"
                                          : "text-gray-400"
                                      }`}
                                    >
                                      {dateInfo.label}
                                    </span>
                                  </div>

                                  <div className="w-7 h-7 rounded-lg bg-gray-50 group-hover:bg-primary/10 border border-gray-200 group-hover:border-primary/30 flex items-center justify-center text-gray-400 group-hover:text-primary transition-all shrink-0">
                                    <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <EmptyState
              icon={ClipboardList}
              title={
                searchQuery || filterType !== "ALL"
                  ? "No matching submittals found"
                  : "No upcoming submittals"
              }
              description={
                searchQuery || filterType !== "ALL"
                  ? "Try clearing your search query or changing active filters."
                  : "All project milestones and submittals are currently up to date."
              }
              action={
                (searchQuery || filterType !== "ALL") && (
                  <button
                    onClick={() => {
                      setSearchQuery("");
                      setFilterType("ALL");
                    }}
                    className="mt-3 px-4 py-1.5 rounded-lg bg-white border border-gray-300 text-xs font-bold text-gray-700 hover:bg-gray-50 shadow-xs cursor-pointer transition-all"
                  >
                    Clear Filters
                  </button>
                )
              }
            />
          )
        ) : (
          /* Invoices to Raise Tab (for PMO) */
          <div className="max-w-5xl mx-auto">
            {invoiceNeedRaise.length > 0 ? (
              <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-xs">
                <div className="px-5 py-3.5 bg-gray-50/80 border-b border-gray-100 flex items-center justify-between">
                  <h3 className="text-xs font-black text-gray-900 uppercase tracking-wider">
                    Invoices Pending Generation ({invoiceNeedRaise.length})
                  </h3>
                  <span className="text-[11px] font-semibold text-gray-400">
                    Payment status pending
                  </span>
                </div>

                <div className="divide-y divide-gray-100">
                  {invoiceNeedRaise.map((invoice, index) => (
                    <div
                      key={invoice.id || invoice._id || index}
                      className="px-5 py-4 flex items-center justify-between hover:bg-slate-50/80 transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-200 shrink-0">
                          <DollarSign className="w-4 h-4" />
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="text-sm font-bold text-gray-900 truncate">
                            {invoice.invoiceNumber || "Invoice Draft"}
                          </span>
                          <span className="text-xs text-gray-500 font-medium truncate mt-0.5">
                            {invoice.project?.name ||
                              invoice.projectName ||
                              "General Project"}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-6">
                        <div className="flex flex-col items-end">
                          <span className="text-sm font-black text-emerald-600">
                            ${Number(invoice.totalInvoiceValue || 0).toLocaleString(
                              undefined,
                              { minimumFractionDigits: 2, maximumFractionDigits: 2 }
                            )}
                          </span>
                          {invoice.dueDate && (
                            <span className="text-[10px] font-medium text-gray-400 mt-0.5">
                              Due:{" "}
                              {new Date(invoice.dueDate).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              })}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <EmptyState
                icon={DollarSign}
                title="No invoices pending"
                description="All project invoices have been successfully raised."
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
};

const EmptyState = ({ icon: Icon, title, description, action }) => (
  <div className="flex flex-col items-center justify-center p-12 text-center my-8 bg-white border border-dashed border-gray-200 rounded-2xl max-w-lg mx-auto">
    <div className="w-14 h-14 rounded-2xl bg-gray-50 border border-gray-200 flex items-center justify-center text-gray-400 mb-3 shadow-xs">
      <Icon className="w-7 h-7" strokeWidth={1.5} />
    </div>
    <h3 className="text-sm font-black text-gray-800 uppercase tracking-wider mb-1">
      {title}
    </h3>
    {description && (
      <p className="text-xs text-gray-500 max-w-xs">{description}</p>
    )}
    {action}
  </div>
);

export default UpcomingSubmittals;
