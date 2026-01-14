import { useEffect, useState, Suspense, lazy } from "react";
import Service from "../../api/Service";
import { useSelector } from "react-redux";

// Lazy load components
const ProjectStats = lazy(() => import("./components/ProjectStats"));
const PendingActions = lazy(() => import("./components/PendingActions"));
const InvoiceTrends = lazy(() => import("./components/InvoiceTrends"));
const UpcomingSubmittals = lazy(
  () => import("./components/UpcomingSubmittals")
);
const ProjectListModal = lazy(() => import("./components/ProjectListModal"));
const ProjectDetailsModal = lazy(
  () => import("./components/ProjectDetailsModal")
);
const SubmittalListModal = lazy(
  () => import("./components/SubmittalListModal")
);

const DashboardSkeleton = () => (
  <div className="animate-pulse space-y-6 p-4">
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
      <div className="h-64 bg-gray-200 rounded-2xl"></div>
      <div className="h-64 bg-gray-200 rounded-2xl"></div>
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="h-80 bg-gray-200 rounded-2xl"></div>
      <div className="h-80 bg-gray-200 rounded-2xl"></div>
    </div>
  </div>
);

const WBTDashboard = () => {
  const employees = useSelector((state) => state.userInfo?.staffData || []);
  const fabricators = useSelector(
    (state) => state.fabricatorInfo?.fabricatorData || []
  );
  const projects = useSelector(
    (state) => state.projectInfo?.projectData || []
  );
  const [dashboardStats, setDashboardStats] = useState(null);

  const [stats, setStats] = useState({
    employees: 0,
    fabricators: 0,
    rfqSent: 0,
    rfqReceived: 0,
    totalProjects: 0,
    activeProjects: 0,
    completedProjects: 0,
    onHoldProjects: 0,
  });
  const [loading, setLoading] = useState(true);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmittalModalOpen, setIsSubmittalModalOpen] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState("");
  const [filteredProjects, setFilteredProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);

  // Invoice Chart state
  const [invoices, setInvoices] = useState([]);

  // Pending Submittals state
  const [pendingSubmittals, setPendingSubmittals] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [
          sent,
          received,
          pendingSubmittalsRes,
          allInvoices,
        ] = await Promise.all([
          Service.RfqSent(),
          Service.RFQRecieved(),
          Service.GetPendingSubmittal(),
          Service.GetAllInvoice(),
        ]);

        setPendingSubmittals(
          Array.isArray(pendingSubmittalsRes)
            ? pendingSubmittalsRes
            : pendingSubmittalsRes?.data || []
        );
        setInvoices(
          Array.isArray(allInvoices) ? allInvoices : allInvoices?.data || []
        );

        try {
          const dashboardData = await Service.GetDashboardData();
          setDashboardStats(dashboardData.data);
        } catch (e) {
          console.warn("Dashboard data fetch failed", e);
        }

        const sentCount = sent?.length || 0;
        const receivedCount = received?.length || 0;

        const totalProjects = projects.length;
        const activeProjects = projects.filter(
          (p) => p.status === "ACTIVE"
        ).length;
        const completedProjects = projects.filter(
          (p) => p.status === "COMPLETED"
        ).length;
        const onHoldProjects = projects.filter(
          (p) => p.status === "ON_HOLD"
        ).length;

        setStats({
          employees: employees.length,
          fabricators: fabricators.length,
          rfqSent: sentCount,
          rfqReceived: receivedCount,
          totalProjects,
          activeProjects,
          completedProjects,
          onHoldProjects,
        });
      } catch (error) {
        console.error("Failed to fetch dashboard data", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [employees.length, fabricators.length, projects.length]);

  const handleCardClick = (status) => {
    const filtered = projects.filter((p) => p.status === status);
    setFilteredProjects(filtered);
    setSelectedStatus(status);
    setIsModalOpen(true);
  };

  const handleActionClick = (actionType) => {
    if (actionType === "PENDING_SUBMITTALS") {
      setIsSubmittalModalOpen(true);
    }
  };

  if (loading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="h-full p-2 rounded-xl space-y-6 bg-gray-50 overflow-y-auto">
      <Suspense fallback={<DashboardSkeleton />}>
        {/* Stats Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <ProjectStats stats={stats} onCardClick={handleCardClick} />
          <PendingActions
            dashboardStats={dashboardStats}
            onActionClick={handleActionClick}
          />
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <InvoiceTrends invoices={invoices} />
          <UpcomingSubmittals
            pendingSubmittals={pendingSubmittals}
            invoices={invoices}
          />
        </div>

        {/* Modals */}
        <ProjectListModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          status={selectedStatus}
          projects={filteredProjects}
          onProjectSelect={(project) => setSelectedProject(project)}
        />

        <SubmittalListModal
          isOpen={isSubmittalModalOpen}
          onClose={() => setIsSubmittalModalOpen(false)}
          data={pendingSubmittals}
        />

        <ProjectDetailsModal
          project={selectedProject}
          onClose={() => setSelectedProject(null)}
        />
      </Suspense>
    </div>
  );
};

export default WBTDashboard;