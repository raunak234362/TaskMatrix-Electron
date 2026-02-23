import { useEffect, useState, useMemo } from "react";
import Service from "../../../api/Service";
import {
  Loader2,
  LayoutDashboard,
  Briefcase,
  FileCheck,
  MessageSquare,
  AlertCircle,
  TrendingUp,
  Clock,
  CheckCircle2,
  FileText,
  FolderOpen,
} from "lucide-react";

import DataTable from "../../ui/table";
import AllRFI from "../../rfi/AllRfi";
import AllSubmittals from "../../submittals/AllSubmittals";
import AllCO from "../../co/AllCO";
import GetProjectById from "../../project/GetProjectById";

const FabricatorDashboard = ({ fabricator }) => {
  const [projects, setProjects] = useState([]);
  const [rfqs, setRfqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [stats, setStats] = useState({
    totalProjects: 0,
    activeProjects: 0,
    pendingRFIs: 0,
    pendingSubmittals: 0,
    pendingCOs: 0,
    totalRFQs: 0,
  });

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Fetch projects for this fabricator
      const allProjectsResponse = await Service.GetAllProjects();
      const fabProjects = (allProjectsResponse || []).filter(
        (p) => p.fabricatorID === fabricator.id
      );
      setProjects(fabProjects);

      // Fetch RFQs for this fabricator
      const rfqReceived = await Service.RFQRecieved();
      const fabRfqs = (rfqReceived || []).filter(
        (r) =>
          r.recipientId === fabricator.id || r.senderId === fabricator.id
      );
      setRfqs(fabRfqs);

      // Calculate Stats
      const active = fabProjects.filter(
        (p) => p.status === "ACTIVE"
      ).length;

      let rfiCount = 0;
      let submittalCount = 0;
      let coCount = 0;

      fabProjects.forEach((p) => {
        rfiCount += p.rfi?.length || 0;
        submittalCount += p.submittals?.length || 0;
        if (Array.isArray(p.changeOrders)) {
          coCount += p.changeOrders.length;
        } else if (p.changeOrders) {
          coCount += 1;
        }
      });

      setStats({
        totalProjects: fabProjects.length,
        activeProjects: active,
        pendingRFIs: rfiCount,
        pendingSubmittals: submittalCount,
        pendingCOs: coCount,
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

  // Aggregated data for tabs
  const allRfis = useMemo(() => {
    return projects.flatMap(p => (p.rfi || []).map(r => ({
      ...r,
      projectName: p.name,
      projectSerialNo: p.serialNo
    })));
  }, [projects]);

  const allSubmittals = useMemo(() => {
    return projects.flatMap(p => (p.submittals || []).map(s => ({
      ...s,
      projectName: p.name,
      projectSerialNo: p.serialNo
    })));
  }, [projects]);

  const allCos = useMemo(() => {
    return projects.flatMap(p => {
      const cos = Array.isArray(p.changeOrders)
        ? p.changeOrders
        : p.changeOrders
          ? [p.changeOrders]
          : [];
      return cos.map(c => ({
        ...c,
        projectName: p.name,
        projectSerialNo: p.serialNo
      }));
    });
  }, [projects]);

  const columns = [
    { accessorKey: "serialNo", header: "Serial #" },
    {
      accessorKey: "name",
      header: "Project Name",
      cell: ({ row }) => (
        <div className="max-w-[200px] truncate font-bold text-black uppercase tracking-tight" title={row.original.name}>
          {row.original.name}
        </div>
      ),
    },
    { accessorKey: "stage", header: "Stage" },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => (
        <span
          className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-black ${row.original.status === "ACTIVE"
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
        <div className="flex gap-4 text-[11px] font-bold text-black/60 uppercase tracking-widest">
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
        <p className="text-sm font-black uppercase tracking-widest text-black/40">Loading Dashboard Data...</p>
      </div>
    );
  }

  const tabs = [
    { id: "overview", label: "Overview", icon: LayoutDashboard },
    { id: "projects", label: "Projects", icon: Briefcase },
    { id: "rfis", label: "RFIs", icon: MessageSquare, count: stats.pendingRFIs },
    { id: "submittals", label: "Submittals", icon: FileCheck, count: stats.pendingSubmittals },
    { id: "cos", label: "Change Orders", icon: AlertCircle, count: stats.pendingCOs },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <StatCard
          icon={<Briefcase className="text-blue-600" size={20} />}
          label="Total Projects"
          value={stats.totalProjects}
          color="bg-blue-50"
          onClick={() => setActiveTab("projects")}
        />
        <StatCard
          icon={<TrendingUp className="text-green-600" size={20} />}
          label="Active Projects"
          value={stats.activeProjects}
          color="bg-green-50"
          onClick={() => setActiveTab("projects")}
        />
        <StatCard
          icon={<MessageSquare className="text-orange-600" size={20} />}
          label="Pending RFIs"
          value={stats.pendingRFIs}
          color="bg-orange-50"
          onClick={() => setActiveTab("rfis")}
        />
        <StatCard
          icon={<FileCheck className="text-purple-600" size={20} />}
          label="Submittals"
          value={stats.pendingSubmittals}
          color="bg-purple-50"
          onClick={() => setActiveTab("submittals")}
        />
        <StatCard
          icon={<AlertCircle className="text-red-600" size={20} />}
          label="Change Orders"
          value={stats.pendingCOs}
          color="bg-red-50"
          onClick={() => setActiveTab("cos")}
        />
        <StatCard
          icon={<FileText className="text-cyan-600" size={20} />}
          label="Total RFQs"
          value={stats.totalRFQs}
          color="bg-cyan-50"
        />
      </div>

      {/* Tabs Navigation */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide border-b border-black/5">
        {tabs.map(({ id, label, icon: Icon, count }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`
              flex items-center gap-2.5 px-5 py-2.5 rounded-xl text-[12px] font-black uppercase tracking-widest transition-all whitespace-nowrap border
              ${activeTab === id
                ? "bg-green-100 text-black border-black shadow-sm"
                : "bg-white text-black/50 border-transparent hover:bg-gray-50 hover:text-black"
              }
            `}
          >
            <Icon size={16} />
            {label}
            {count > 0 && (
              <span className="ml-1 px-2 py-0.5 bg-black/10 rounded-full text-[10px]">
                {count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="min-h-[400px]">
        {activeTab === "overview" && (
          <div className="space-y-8 animate-in slide-in-from-bottom-2 duration-300">
            {/* Recent Activity Summary */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-2xl shadow-sm border border-black/10 overflow-hidden">
                <div className="px-6 py-4 border-b border-black/5 bg-gray-50/50 flex items-center justify-between">
                  <h3 className="text-sm font-black text-black uppercase tracking-widest flex items-center gap-2">
                    <FileText size={18} className="text-cyan-600" />
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
                        <p className="font-bold text-black uppercase text-xs tracking-tight">{rfq.projectName}</p>
                        <p className="text-[10px] text-black/40 font-black uppercase tracking-widest mt-1">
                          {new Date(rfq.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-widest text-cyan-700 bg-cyan-50 px-3 py-1 rounded-full border border-cyan-200">
                        {rfq.status || "PENDING"}
                      </span>
                    </div>
                  ))}
                  {rfqs.length === 0 && (
                    <div className="text-center py-10">
                      <FileText size={40} className="mx-auto text-gray-200 mb-2" />
                      <p className="text-black/40 font-black uppercase tracking-widest text-[10px]">No RFQs Found</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-sm border border-black/10 overflow-hidden">
                <div className="px-6 py-4 border-b border-black/5 bg-gray-50/50">
                  <h3 className="text-sm font-black text-black uppercase tracking-widest flex items-center gap-2">
                    <Clock size={18} className="text-orange-600" />
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
                    icon={<Clock className="text-orange-500" size={20} />}
                  />
                </div>
              </div>
            </div>

            {/* Project Quick View */}
            <div className="bg-white rounded-2xl shadow-sm border border-black/10 overflow-hidden">
              <div className="px-6 py-4 border-b border-black/5 bg-gray-50/50 flex items-center justify-between">
                <h3 className="text-sm font-black text-black uppercase tracking-widest flex items-center gap-2">
                  <FolderOpen size={18} className="text-black" />
                  Project Quick View
                </h3>
                <button
                  onClick={() => setActiveTab("projects")}
                  className="text-[10px] font-black uppercase tracking-widest text-black/40 hover:text-black transition-colors"
                >
                  View All &rarr;
                </button>
              </div>
              <DataTable
                columns={columns.slice(0, 4)} // Show fewer columns in overview
                data={projects.slice(0, 5)}
                detailComponent={({ row }) => <GetProjectById id={row.id} onClose={null} />}
              />
            </div>
          </div>
        )}

        {activeTab === "projects" && (
          <div className="bg-white rounded-2xl shadow-sm border border-black/10 overflow-hidden animate-in slide-in-from-right-2 duration-300">
            <div className="px-6 py-4 border-b border-black/5 bg-gray-50/50">
              <h3 className="text-sm font-black text-black uppercase tracking-widest flex items-center gap-2">
                <Briefcase size={18} />
                All Projects
              </h3>
            </div>
            <DataTable
              columns={columns}
              data={projects}
              detailComponent={({ row }) => <GetProjectById id={row.id} onClose={null} />}
            />
          </div>
        )}

        {activeTab === "rfis" && (
          <div className="animate-in slide-in-from-right-2 duration-300">
            <AllRFI rfiData={allRfis} />
          </div>
        )}

        {activeTab === "submittals" && (
          <div className="animate-in slide-in-from-right-2 duration-300">
            <AllSubmittals submittalData={allSubmittals} />
          </div>
        )}

        {activeTab === "cos" && (
          <div className="animate-in slide-in-from-right-2 duration-300">
            <AllCO changeOrderData={allCos} />
          </div>
        )}
      </div>
    </div>
  );
};

const StatCard = ({ icon, label, value, color, onClick }) => (
  <button
    onClick={onClick}
    className={`
      ${color}
      px-4 py-5
      rounded-2xl
      border border-black/5
      shadow-sm
      flex flex-col
      items-center
      justify-center
      text-center
      transition-all
      hover:shadow-md
      hover:-translate-y-1
      active:scale-95
      group
      ${onClick ? "cursor-pointer" : "cursor-default"}
    `}
  >
    <div className="mb-3 p-2.5 bg-white rounded-xl shadow-sm border border-black/5 group-hover:border-black/10 transition-colors">
      {icon}
    </div>

    <p className="text-2xl font-black text-black tracking-tight mb-1">
      {value}
    </p>

    <p className="text-[10px] uppercase tracking-widest font-black text-black/40">
      {label}
    </p>
  </button>
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
      <p className="text-[10px] font-black text-black/40 uppercase tracking-widest mb-1">{label}</p>
      <p className="text-xs font-bold text-black uppercase tracking-tight">{value}</p>
      {date && (
        <p className="text-[10px] font-black text-orange-600/60 uppercase tracking-widest mt-1">
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
