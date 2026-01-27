import { useEffect, useState } from "react";
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
} from "lucide-react";

import DataTable from "../../ui/table";



const FabricatorDashboard = ({ fabricator }) => {
  const [projects, setProjects] = useState([]);
  const [rfqs, setRfqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalProjects: 0,
    activeProjects: 0,
    pendingRFIs: 0,
    pendingSubmittals: 0,
    pendingCOs: 0,
    totalRFQs: 0,
  });

  useEffect(() => {
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

    fetchDashboardData();
  }, [fabricator.id]);

  const columns = [
    { accessorKey: "projectNumber", header: "Project #" },
    {
      accessorKey: "name",
      header: "Project Name",
      cell: ({ row }) => (
        <div className="max-w-[150px] truncate font-medium text-gray-800" title={row.original.name}>
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
          className={`px-2 py-1 rounded-full text-xs font-medium ${row.original.status === "ACTIVE"
            ? "bg-green-100 text-green-700"
            : "bg-gray-100 text-gray-700"
            }`}
        >
          {row.original.status}
        </span>
      ),
    },
    {
      id: "actions",
      header: "Stats",
      cell: ({ row }) => (
        <div className="flex gap-3 text-xs text-gray-500">
          <span title="RFIs" className="flex items-center gap-1">
            <MessageSquare size={12} /> {row.original.rfi?.length || 0}
          </span>
          <span title="Submittals" className="flex items-center gap-1">
            <FileCheck size={12} /> {row.original.submittals?.length || 0}
          </span>
        </div>
      ),
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-green-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <StatCard
          icon={<Briefcase className="text-blue-600" />}
          label="Total Projects"
          value={stats.totalProjects}
          color="bg-blue-50"
        />
        <StatCard
          icon={<TrendingUp className="text-green-600" />}
          label="Active Projects"
          value={stats.activeProjects}
          color="bg-green-50"
        />
        <StatCard
          icon={<MessageSquare className="text-orange-600" />}
          label="Pending RFIs"
          value={stats.pendingRFIs}
          color="bg-orange-50"
        />
        <StatCard
          icon={<FileCheck className="text-purple-600" />}
          label="Submittals"
          value={stats.pendingSubmittals}
          color="bg-purple-50"
        />
        <StatCard
          icon={<AlertCircle className="text-red-600" />}
          label="Change Orders"
          value={stats.pendingCOs}
          color="bg-red-50"
        />
        <StatCard
          icon={<FileText className="text-cyan-600" />}
          label="Total RFQs"
          value={stats.totalRFQs}
          color="bg-cyan-50"
        />
      </div>

      {/* Projects Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 w-full overflow-hidden">
        <div className="p-4 border-b border-gray-50 flex flex-wrap items-center justify-between gap-2 bg-gray-50/50">
          <h3 className="font-bold text-gray-800 flex items-center gap-2">
            <LayoutDashboard size={18} className="text-green-600" />
            Project Overview
          </h3>
        </div>
        <div>
          <DataTable
            columns={columns}
            data={projects}
          />
        </div>
      </div>

      {/* RFQs Section (Simplified) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
            <FileText size={18} className="text-cyan-600" />
            Recent RFQs
          </h3>
          <div className="space-y-3">
            {rfqs.slice(0, 5).map((rfq) => (
              <div
                key={rfq.id}
                className="flex items-center justify-between p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
              >
                <div>
                  <p className="font-medium text-gray-800">{rfq.projectName}</p>
                  <p className="text-xs text-gray-500">
                    {new Date(rfq.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <span className="text-xs font-semibold text-cyan-700 bg-cyan-50 px-2 py-1 rounded">
                  {rfq.status || "PENDING"}
                </span>
              </div>
            ))}
            {rfqs.length === 0 && (
              <p className="text-gray-500 text-center py-4 text-sm">
                No RFQs found
              </p>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Clock size={18} className="text-orange-600" />
            Timeline Summary
          </h3>
          <div className="space-y-4">
            <TimelineItem
              label="Latest Project"
              value={projects[0]?.name || "N/A"}
              date={projects[0]?.startDate}
              icon={<CheckCircle2 className="text-green-500" size={16} />}
            />
            <TimelineItem
              label="Upcoming Deadline"
              value={projects.find((p) => p.status === "ACTIVE")?.name || "N/A"}
              date={projects.find((p) => p.status === "ACTIVE")?.endDate}
              icon={<Clock className="text-orange-500" size={16} />}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({
  icon,
  label,
  value,
  color,
}) => (
  <div
    className={`${color} p-3 sm:p-4 rounded-xl border border-white/50 shadow-sm flex flex-col items-center justify-center text-center transition-transform hover:scale-105`}
  >
    <div className="mb-2 p-2 bg-white rounded-full shadow-sm">{icon}</div>
    <p className="text-xl sm:text-2xl font-bold text-gray-800">{value}</p>
    <p className="text-[10px] uppercase tracking-wider font-semibold text-gray-500">
      {label}
    </p>
  </div>
);

const TimelineItem = ({
  label,
  value,
  date,
  icon,
}) => (
  <div className="flex gap-3">
    <div className="mt-1">{icon}</div>
    <div>
      <p className="text-xs font-semibold text-gray-500 uppercase">{label}</p>
      <p className="text-sm font-medium text-gray-800">{value}</p>
      {date && (
        <p className="text-[10px] text-gray-400">
          {new Date(date).toLocaleDateString()}
        </p>
      )}
    </div>
  </div>
);

export default FabricatorDashboard;
