/* eslint-disable react/prop-types */
import { useEffect, useState, Suspense, lazy } from "react";
import Service from "../../api/Service";
import { useSelector } from "react-redux";
import EstimationTaskByID from "../Estimation/estimationTask/EstimationTaskByID";
import { format, subMonths, isSameMonth } from 'date-fns';

// Lazy load components
const UserStatsWidget = lazy(() => import("./components/UserStatsWidget"));
const CurrentTaskWidget = lazy(() => import("./components/CurrentTaskWidget"));
const UpcomingDeadlinesWidget = lazy(() => import("./components/UpcomingDeadlinesWidget"));
const PersonalNotesWidget = lazy(() => import("./components/PersonalNotesWidget"));
const EfficiencyChart = lazy(() => import("./components/EfficiencyChart"));

const DashboardSkeleton = () => (
  <div className="animate-pulse space-y-8 p-6">
    <div className="h-10 w-1/3 bg-gray-200 rounded-lg"></div>
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="h-32 bg-gray-200 rounded-2xl"></div>
      ))}
    </div>
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
      <div className="h-96 bg-gray-200 rounded-2xl xl:col-span-2"></div>
      <div className="h-96 bg-gray-200 rounded-2xl"></div>
    </div>
  </div>
);

const WBTDashboard = () => {
  const user = useSelector((state) => state.userInfo?.userDetail);
  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState([]);
  const [detailTaskId, setDetailTaskId] = useState(null);
  const [efficiencyData, setEfficiencyData] = useState([]);

  // User Stats State
  const [userStats, setUserStats] = useState({
    totalTasks: 0,
    completedTasks: 0,
    pendingTasks: 0,
    totalHours: 0,
    projectsCount: 0,
    efficiency: 100,
  });

  const calculateEfficiencyTrend = (tasks) => {
    // Generate last 6 months buckets
    const months = [];
    for (let i = 5; i >= 0; i--) {
      months.push(subMonths(new Date(), i));
    }

    const data = months.map(date => {
      const monthTasks = tasks.filter(t => {
        const taskDate = new Date(t.endDate || t.createdAt);
        return isSameMonth(taskDate, date);
      });

      const completed = monthTasks.filter(t => t.status === 'COMPLETED').length;
      const total = monthTasks.length;
      const efficiency = total > 0 ? Math.round((completed / total) * 100) : 0;

      return {
        month: format(date, 'MMM'),
        efficiency,
        completed
      };
    });

    return data;
  };

  const fetchData = async () => {
    if (tasks.length === 0) setLoading(true);

    try {
      const userTasks = await Service.GetAllAssignedEstimationTask();

      if (userTasks?.data && Array.isArray(userTasks.data)) {
        const fetchedTasks = userTasks.data;
        setTasks(fetchedTasks);

        const completed = fetchedTasks.filter((t) => t.status === "COMPLETED").length;
        const uniqueProjects = new Set(fetchedTasks.map((t) => t.estimationId)).size;
        const hours = fetchedTasks.reduce(
          (acc, t) => acc + (Number(t.totalHours) || 0),
          0
        );

        setUserStats({
          totalTasks: fetchedTasks.length,
          completedTasks: completed,
          pendingTasks: fetchedTasks.length - completed,
          totalHours: hours,
          projectsCount: uniqueProjects,
          efficiency:
            fetchedTasks.length > 0
              ? Math.round((completed / fetchedTasks.length) * 100)
              : 100,
        });

        // Calculate efficiency trend
        const trendData = calculateEfficiencyTrend(fetchedTasks);
        setEfficiencyData(trendData);
      }
    } catch (error) {
      console.error("Failed to fetch dashboard data", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Derived state for widgets
  const currentTask = tasks.find(t => t.status === 'IN_PROGRESS');

  // Greeting logic
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 18) return "Good Afternoon";
    return "Good Evening";
  };

  return (
    <div className="h-full p-6 space-y-8 bg-gray-50/50 overflow-y-auto custom-scrollbar">
      <Suspense fallback={<DashboardSkeleton />}>
        {/* Header Section */}
        <div className="flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">
              {getGreeting()}, {user?.name?.split(' ')[0] || "User"}
            </h1>
            <p className="text-gray-500 mt-1">Here's what's happening with your projects today.</p>
          </div>

          <div className="text-right hidden sm:block">
            <p className="text-sm font-medium text-gray-400">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </p>
          </div>
        </div>

        {/* 1. Stats Overview Row */}
        <UserStatsWidget stats={userStats} loading={loading} />

        {/* 2. Main Content Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* Left Column: Chart & Tasks (2/3 width on large screens) */}
          <div className="xl:col-span-2 space-y-8">
            {/* Current Active Task and Efficiency Chart Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Current Focus */}
              <div className="w-full">
                <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                  Current Focus
                </h2>
                <CurrentTaskWidget
                  task={currentTask}
                  onTaskUpdate={() => setDetailTaskId(currentTask?.id)}
                />
              </div>

              {/* Efficiency Chart */}
              <div className="w-full pt-10"> {/* Added padding top to align with Current Focus tile roughly if needed, or just standard */}
                <EfficiencyChart data={efficiencyData} />
              </div>
            </div>

            {/* Recent/Upcoming Tasks List */}
            <div className="h-[400px]">
              <UpcomingDeadlinesWidget tasks={tasks} />
            </div>
          </div>

          {/* Right Column: Sidebar (1/3 width) - Notes */}
          <div className="xl:col-span-1 space-y-8 h-full">
            <div className="h-full min-h-[500px]">
              <PersonalNotesWidget />
            </div>
          </div>
        </div>

        {/* Task Detail Modal */}
        {detailTaskId && (
          <EstimationTaskByID
            id={detailTaskId}
            onClose={() => setDetailTaskId(null)}
            refresh={fetchData}
          />
        )}
      </Suspense>
    </div>
  );
};

export default WBTDashboard;