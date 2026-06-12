import { useEffect, useState, useMemo } from "react";
import Service from "../../../api/Service";
import {
  Loader2,
  Briefcase,
  TrendingUp,
  FileText,
  MessageSquare,
  FileCheck,
  AlertCircle,
  Clock,
  CheckCircle2,
  Search,
  X,
} from "lucide-react";

import DataTable from "../../ui/table";
import GetProjectById from "../../project/GetProjectById";

const FabricatorDashboard = ({ fabricator }) => {
  const [projects, setProjects] = useState([]);
  const [rfqs, setRfqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalProjects: 0,
    activeProjects: 0,
    totalRFQs: 0,
  });

  // Filters State
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [selectedStage, setSelectedStage] = useState("");

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // 1. Get Projects for this fabricator (Prioritize fabricator.project prop if available)
      let fabProjects = [];
      if (fabricator.project) {
        fabProjects = Array.isArray(fabricator.project)
          ? fabricator.project
          : Object.values(fabricator.project);
      } else {
        const allProjectsResponse = await Service.GetAllProjects();
        fabProjects = (allProjectsResponse || []).filter(
          (p) => p.fabricatorID === fabricator.id
        );
      }
      setProjects(fabProjects);

      // 2. Fetch RFQs for this fabricator
      const rfqReceived = await Service.RFQRecieved();
      const fabRfqs = (rfqReceived?.data || rfqReceived || []).filter(
        (r) =>
          r.recipientId === fabricator.id || r.senderId === fabricator.id
      );
      setRfqs(fabRfqs);

      // 3. Calculate Stats
      const active = fabProjects.filter(
        (p) => p.status === "ACTIVE"
      ).length;

      setStats({
        totalProjects: fabProjects.length,
        activeProjects: active,
        totalRFQs: fabRfqs.length,
      });
    } catch (error) {
      console.error("Error fetching fabricator dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [fabricator.id]);

  // Extract unique stages and statuses for filters
  const stages = useMemo(() => {
    const uniqueStages = new Set(projects.map(p => p.stage).filter(Boolean));
    return Array.from(uniqueStages);
  }, [projects]);

  const statuses = useMemo(() => {
    const uniqueStatuses = new Set(projects.map(p => p.status).filter(Boolean));
    return Array.from(uniqueStatuses);
  }, [projects]);

  // Filtered projects
  const filteredProjects = useMemo(() => {
    return projects.filter(p => {
      const matchesSearch =
        (p.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.projectCode || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.serialNo || "").toString().includes(searchTerm);
      const matchesStatus = !selectedStatus || p.status === selectedStatus;
      const matchesStage = !selectedStage || p.stage === selectedStage;
      return matchesSearch && matchesStatus && matchesStage;
    });
  }, [projects, searchTerm, selectedStatus, selectedStage]);

  const columns = [
    { accessorKey: "serialNo", header: "Serial #" },
    {
      accessorKey: "projectCode",
      header: "Project Code",
      cell: ({ row }) => (
        <span className="font-mono text-sm font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-100 tracking-normal">
          {row.original.projectCode || "N/A"}
        </span>
      )
    },
    {
      accessorKey: "name",
      header: "Project Name",
      cell: ({ row }) => (
        <div className="max-w-[180px] truncate text-sm font-bold text-black uppercase tracking-normal" title={row.original.name}>
          {row.original.name}
        </div>
      ),
    },
    {
      accessorKey: "IFAComepletionPercentage",
      header: "IFA %",
      cell: ({ row }) => (
        <div className="flex flex-col gap-1 w-20">
          <div className="flex justify-between text-sm font-black italic tracking-normal">
            <span>{row.original.IFAComepletionPercentage || 0}%</span>
          </div>
          <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden border border-black/5">
            <div
              className="h-full bg-green-500 transition-all duration-500"
              style={{ width: `${Math.min(100, row.original.IFAComepletionPercentage || 0)}%` }}
            />
          </div>
        </div>
      )
    },
    { accessorKey: "stage", header: "Stage" },
    {
      accessorKey: "dates",
      header: "Timeline",
      cell: ({ row }) => (
        <div className="flex flex-col text-sm font-bold text-black/50 uppercase tracking-normal leading-tight">
          <div className="flex items-center gap-1">
            <span className="text-sm opacity-40">S:</span> {row.original.startDate ? new Date(row.original.startDate).toLocaleDateString() : "—"}
          </div>
          <div className="flex items-center gap-1">
            <span className="text-sm opacity-40">E:</span> {row.original.endDate ? new Date(row.original.endDate).toLocaleDateString() : "—"}
          </div>
        </div>
      )
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => (
        <span
          className={`px-3 py-1 rounded-full text-sm font-black uppercase tracking-normal border border-black ${row.original.status === "ACTIVE"
            ? "bg-green-100 text-black"
            : "bg-gray-100 text-black/50"
            }`}
        >
          {row.original.status}
        </span>
      ),
    },
    {
      id: "stats",
      header: "Stats",
      cell: ({ row }) => (
        <div className="flex gap-4 text-sm font-bold text-black/60 uppercase tracking-normal">
          <span title="RFIs" className="flex items-center gap-1.5">
            <MessageSquare size={13} className="text-orange-500" /> {row.original.rfi?.length || 0}
          </span>
          <span title="Submittals" className="flex items-center gap-1.5">
            <FileCheck size={13} className="text-purple-500" /> {row.original.submittals?.length || 0}
          </span>
          <span title="Change Orders" className="flex items-center gap-1.5">
            <AlertCircle size={13} className="text-red-500" /> {
              Array.isArray(row.original.changeOrders)
                ? row.original.changeOrders.length
                : row.original.changeOrders ? 1 : 0
            }
          </span>
        </div>
      ),
    },
  ];

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-3">
        <Loader2 className="w-10 h-10 animate-spin text-green-600" />
        <p className="text-sm font-black uppercase tracking-normal text-black/40">Loading Dashboard Data...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        <StatCard
          icon={Briefcase}
          label="Total Projects"
          value={stats.totalProjects}
        />
        <StatCard
          icon={TrendingUp}Total Project
          label="Active Projects"
          value={stats.activeProjects}
        />
        <StatCard
          icon={FileText}
          label="Total RFQs"
          value={stats.totalRFQs}
        />
      </div>

      {/* Projects Section */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden animate-in fade-in duration-300">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <h3 className="text-sm font-black text-black uppercase tracking-normal flex items-center gap-2">
            <Briefcase size={18} className="text-green-600" />
            Projects Overview
          </h3>

          {/* Table Filters */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Search */}
            <div className="w-full sm:w-[260px] h-11 flex items-center gap-2 px-4 bg-white border border-gray-200 rounded-xl focus-within:border-green-500 focus-within:ring-4 focus-within:ring-green-500/5 transition-all shadow-sm">
              <Search className="w-4 h-4 text-gray-400 shrink-0" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search projects..."
                className="flex-1 px-1 py-1 bg-transparent text-gray-800 placeholder-gray-400 focus:outline-none font-medium text-sm"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="p-1 text-gray-300 hover:text-gray-500 transition-colors shrink-0"
                >
                  <X size={16} />
                </button>
              )}
            </div>

            {/* Status Filter */}
            <div className="w-full sm:w-auto min-w-[150px]">
              <select
                className="w-full h-11 text-sm font-semibold text-gray-700 bg-white border border-gray-200 rounded-xl px-4 cursor-pointer focus:outline-none focus:border-green-500 focus:ring-4 focus:ring-green-500/5 transition-all shadow-sm"
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
              >
                <option value="">All Statuses</option>
                {statuses.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            {/* Stage Filter */}
            <div className="w-full sm:w-auto min-w-[150px]">
              <select
                className="w-full h-11 text-sm font-semibold text-gray-700 bg-white border border-gray-200 rounded-xl px-4 cursor-pointer focus:outline-none focus:border-green-500 focus:ring-4 focus:ring-green-500/5 transition-all shadow-sm"
                value={selectedStage}
                onChange={(e) => setSelectedStage(e.target.value)}
              >
                <option value="">All Stages</option>
                {stages.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            {/* Clear Filters Button */}
            {(searchTerm || selectedStatus || selectedStage) && (
              <button
                onClick={() => {
                  setSearchTerm("");
                  setSelectedStatus("");
                  setSelectedStage("");
                }}
                className="h-11 px-5 rounded-xl text-sm font-bold uppercase tracking-normal border-2 border-red-700/80 bg-red-50 text-black hover:bg-red-100 transition-all shadow-sm active:scale-95 flex items-center justify-center gap-1 shrink-0"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        <DataTable
          columns={columns}
          data={filteredProjects}
          detailComponent={({ row, close }) => <GetProjectById id={row.id} onClose={close} />}
        />
      </div>

      {/* Grid for Recent RFQs and Timeline Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent RFQs */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50/50 flex items-center justify-between">
            <h3 className="text-sm font-black text-black uppercase tracking-normal flex items-center gap-2">
              <FileText size={18} className="text-green-600" />
              Recent RFQs
            </h3>
          </div>
          <div className="p-4 space-y-3">
            {rfqs.slice(0, 5).map((rfq) => (
              <div
                key={rfq.id}
                className="flex items-center justify-between px-4 py-3 rounded-xl bg-gray-50 hover:bg-green-50/50 transition-all border border-transparent hover:border-black/5 group"
              >
                <div>
                  <p className="font-bold text-black uppercase text-sm tracking-normal">{rfq.projectName}</p>
                  <p className="text-sm text-black/40 font-black uppercase tracking-normal mt-1">
                    {new Date(rfq.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <span className="text-sm font-black uppercase tracking-normal text-green-700 bg-green-50 px-3 py-1 rounded-full border border-green-200">
                  {rfq.status || "PENDING"}
                </span>
              </div>
            ))}
            {rfqs.length === 0 && (
              <div className="text-center py-10">
                <FileText size={40} className="mx-auto text-gray-200 mb-2" />
                <p className="text-black/40 font-black uppercase tracking-normal text-sm">No RFQs Found</p>
              </div>
            )}
          </div>
        </div>

        {/* Timeline Summary */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50/50">
            <h3 className="text-sm font-black text-black uppercase tracking-normal flex items-center gap-2">
              <Clock size={18} className="text-green-600" />
              Timeline Summary
            </h3>
          </div>
          <div className="p-6 space-y-6">
            <TimelineItem
              label="Latest Project"
              value={projects[0]?.name || "N/A"}
              date={projects[0]?.startDate}
              icon={<CheckCircle2 className="text-green-500" size={20} />}
            />
            <TimelineItem
              label="Upcoming Deadline"
              value={projects.find((p) => p.status === "ACTIVE")?.name || "N/A"}
              date={projects.find((p) => p.status === "ACTIVE")?.endDate}
              icon={<Clock className="text-green-500" size={20} />}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ icon: Icon, label, value }) => (
  <div
    className="bg-white p-6 rounded-2xl border border-gray-300 flex items-center justify-between shadow-sm w-full transition-all cursor-default"
  >
    <div className="flex items-center gap-5 flex-1 min-w-0">
      <div className="p-3 bg-green-50 rounded-xl text-green-600 border border-green-300 flex items-center justify-center shadow-sm shrink-0">
        <Icon size={20} strokeWidth={2.5} />
      </div>
      <p className="text-sm font-bold text-black uppercase tracking-normal text-left truncate">
        {label}
      </p>
    </div>
    <p className="text-xl font-bold text-black tracking-normal ml-4">
      {value}
    </p>
  </div>
);

const TimelineItem = ({
  label,
  value,
  date,
  icon,
}) => (
  <div className="flex gap-4 group">
    <div className="mt-1 transition-transform group-hover:scale-110 duration-300">
      {icon}
    </div>
    <div className="flex-1">
      <p className="text-sm font-black text-black/40 uppercase tracking-normal mb-1">{label}</p>
      <p className="text-sm font-bold text-black uppercase tracking-normal">{value}</p>
      {date && (
        <p className="text-sm font-black text-green-700/60 uppercase tracking-normal mt-1">
          {new Date(date).toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric"
          })}
        </p>
      )}
    </div>
  </div>
);

export default FabricatorDashboard;
