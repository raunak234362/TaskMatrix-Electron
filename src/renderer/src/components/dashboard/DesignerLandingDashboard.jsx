/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useMemo } from "react";
import { useSelector } from "react-redux";
import {
  Briefcase,
  Clock,
  CheckCircle2,
  Layout,
  User,
  FileText,
  MessageSquare,
  MapPin,
  Users,
  ArrowRight,
} from "lucide-react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";


const DesignerLandingDashboard = () => {
  const navigate = useNavigate();
  const userDetail = useSelector(
    (state) => state.userInfo.userDetail,
  );
  const projects = useSelector(
    (state) => state.projectInfo?.projectData || []
  );

  // Filter projects for this designer
  // Note connectionDesignerID or similar field exists on project.
  // If not explicitly filtered by backend, we filter here.
  const myProjects = useMemo(() => {
    if (!userDetail?.id) return []
    return projects.filter((p) => p.connectionDesignerID === userDetail.id);
  }, [projects, userDetail?.id]);

  const stats = useMemo(() => {
    return {
      active: myProjects.filter((p) => p.status === "ACTIVE").length,
      pending: myProjects.filter(
        (p) => p.stage === "IN_PROGRESS" || p.stage === "PLANNING",
      ).length,
      completed: myProjects.filter((p) => p.status === "COMPLETED").length,
    };
  }, [myProjects]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
    },
  };

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="p-6 space-y-8 max-w-7xl mx-auto laptop-fit"
    >
      {/* Welcome Section */}
      <motion.section variants={itemVariants} className="space-y-2">
        <h1 className="text-3xl  text-gray-800 tracking-tight">
          Welcome back,{" "}
          <span className="text-green-600">
            {userDetail?.firstName || "Designer"}
          </span>
          !
        </h1>
        <p className="text-gray-500 text-lg font-medium">
          Here’s a quick look at what’s happening with your projects today.
        </p>
      </motion.section>

      {/* Quick Actions */}
      <motion.section
        variants={itemVariants}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        <QuickActionCard
          icon={<Briefcase className="w-5 h-5" />}
          label="My Projects"
          onClick={() => navigate("/dashboard/projects")}
          color="bg-blue-50 text-blue-600"
        />
        <QuickActionCard
          icon={<FileText className="w-5 h-5" />}
          label="View RFQs"
          onClick={() => navigate("/dashboard/rfq")}
          color="bg-amber-50 text-amber-600"
        />
        <QuickActionCard
          icon={<User className="w-5 h-5" />}
          label="Update Profile"
          onClick={() => navigate("/dashboard/profile")}
          color="bg-purple-50 text-purple-600"
        />
        <QuickActionCard
          icon={<MessageSquare className="w-5 h-5" />}
          label="Support"
          onClick={() => { }} // Add support logic if needed
          color="bg-green-50 text-green-600"
        />
      </motion.section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Project Snapshot */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl  text-gray-800 flex items-center gap-2">
              <Layout className="w-5 h-5 text-green-600" />
              My Projects Snapshot
            </h2>
            <button
              onClick={() => navigate("/dashboard/projects")}
              className="text-sm font-semibold text-green-600 hover:text-green-700 flex items-center gap-1 transition-colors"
            >
              View All <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatCard
              label="Active"
              value={stats.active}
              icon={<ActivityIcon className="w-6 h-6" />}
              color="text-blue-600"
              bgColor="bg-blue-50"
            />
            <StatCard
              label="In Review"
              value={stats.pending}
              icon={<Clock className="w-6 h-6" />}
              color="text-amber-600"
              bgColor="bg-amber-50"
            />
            <StatCard
              label="Completed"
              value={stats.completed}
              icon={<CheckCircle2 className="w-6 h-6" />}
              color="text-green-600"
              bgColor="bg-green-50"
            />
          </div>

          {/* Recent Projects */}
          <div className="space-y-4">
            <h3 className="text-sm  text-gray-400 uppercase tracking-wider">
              Recently Updated
            </h3>
            <div className="grid grid-cols-1 gap-4">
              {myProjects.slice(0, 2).map((project) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  onClick={() => navigate(`/dashboard/projects`)}
                />
              ))}
              {myProjects.length === 0 && (
                <div className="p-8 text-center bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                  <p className="text-gray-400 font-medium">
                    No projects assigned yet.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar Info */}
        <div className="space-y-8">
          {/* Coverage Summary */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-6">
            <h2 className="text-lg  text-gray-800">My Coverage</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white rounded-lg shadow-sm">
                    <MapPin className="w-4 h-4 text-green-600" />
                  </div>
                  <span className="text-sm font-semibold text-gray-600">
                    States Covered
                  </span>
                </div>
                <span className="text-lg  text-gray-800">
                  {userDetail?.state ? 1 : 0}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white rounded-lg shadow-sm">
                    <Users className="w-4 h-4 text-blue-600" />
                  </div>
                  <span className="text-sm font-semibold text-gray-600">
                    Linked Engineers
                  </span>
                </div>
                <span className="text-lg  text-gray-800">0</span>
              </div>
            </div>
          </div>

          {/* Recent Activity (Placeholder) */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-6">
            <h2 className="text-lg  text-gray-800">Recent Activity</h2>
            <div className="space-y-4">
              <ActivityItem
                label="Profile Updated"
                time="2 days ago"
                icon={<User className="w-3 h-3" />}
              />
              <ActivityItem
                label="Logged In"
                time="Today"
                icon={<Clock className="w-3 h-3" />}
              />
              <p className="text-xs text-center text-gray-400 font-medium">
                More activity will appear as you work
              </p>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

const QuickActionCard = ({ icon, label, onClick, color }) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-3 p-4 rounded-2xl transition-all hover:shadow-md hover:-translate-y-1 bg-white border border-gray-100 group`}
  >
    <div
      className={`p-2 rounded-xl ${color} group-hover:scale-110 transition-transform`}
    >
      {icon}
    </div>
    <span className=" text-gray-700">{label}</span>
  </button>
);

const StatCard = ({ label, value, icon, color, bgColor }) => (
  <div
    className={`p-6 rounded-2xl border border-gray-100 bg-white shadow-sm space-y-4`}
  >
    <div
      className={`w-12 h-12 ${bgColor} ${color} rounded-xl flex items-center justify-center`}
    >
      {icon}
    </div>
    <div>
      <p className="text-sm  text-gray-400 uppercase tracking-wider">
        {label}
      </p>
      <p className={`text-3xl  ${color}`}>{value}</p>
    </div>
  </div>
);

const ProjectCard = ({ project, onClick }) => (
  <div
    onClick={onClick}
    className="p-4 bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-md transition-all cursor-pointer flex items-center justify-between group"
  >
    <div className="flex items-center gap-4">
      <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center text-green-600 ">
        {project.name[0]}
      </div>
      <div>
        <h4 className=" text-gray-800 group-hover:text-green-600 transition-colors">
          {project.name}
        </h4>
        <p className="text-xs text-gray-400 font-medium">
          #{project.projectNumber}
        </p>
      </div>
    </div>
    <div className="flex items-center gap-4">
      <span
        className={`px-3 py-1 rounded-full text-[10px]  uppercase tracking-wider ${project.status === "ACTIVE"
          ? "bg-green-100 text-green-700"
          : "bg-gray-100 text-gray-600"
          }`}
      >
        {project.status}
      </span>
      <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-green-600 group-hover:translate-x-1 transition-all" />
    </div>
  </div>
);

const ActivityItem = ({ label, time, icon }) => (
  <div className="flex items-start gap-3">
    <div className="mt-1 p-1.5 bg-gray-100 rounded-full text-gray-500">
      {icon}
    </div>
    <div>
      <p className="text-sm  text-gray-700">{label}</p>
      <p className="text-[10px] text-gray-400 font-medium">{time}</p>
    </div>
  </div>
);

const ActivityIcon = ({ className }) => (
  <svg
    className={className}
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M13 10V3L4 14h7v7l9-11h-7z"
    />
  </svg>
);

export default DesignerLandingDashboard;
