import { useEffect, useState } from "react";
import Service from "../../api/Service";
import { motion } from "framer-motion";
import SalesStatsCards from "./components/SalesStatsCards";
import SalesSecondaryStats from "./components/SalesSecondaryStats";
import SalesPerformanceChart from "./components/SalesPerformanceChart";
import { Bell, ChevronLeft, Download, Filter } from "lucide-react";

const SalesDashboard = () => {
    const [loading, setLoading] = useState(true);
    const [dashboardData, setDashboardData] = useState(null);
    const userName = sessionStorage.getItem('firstName') + " " + sessionStorage.getItem('lastName') || "Admin User";

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const response = await Service.SalesDashboard();
                console.log("sales dashboard data", response);

                if (response && response.success) {
                    setDashboardData(response);
                }
                setLoading(false);
            } catch (error) {
                console.error("Error fetching sales dashboard data:", error);
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full min-h-screen">
                <div className="w-12 h-12 border-4 border-green-200 border-t-green-600 rounded-full animate-spin"></div>
            </div>
        )
    }

    if (!dashboardData) {
        return (
            <div className="flex items-center justify-center h-full min-h-screen">
                <p className="text-gray-500 font-bold uppercase tracking-widest">No data available</p>
            </div>
        )
    }

    const data = dashboardData.data;

    const statusChartData = [
        { name: 'Total', value: data.totalRFQs || 0 },
        { name: 'Pipeline', value: data.inPipelineRFQs || 0 },
        { name: 'Quoted', value: data.quotedRFQs || 0 },
        { name: 'Responded', value: data.respondedRFQs || 0 },
        { name: 'Awarded', value: data.awardedRFQs || 0 },
        { name: 'Rejected', value: data.rejectedRFQs || 0 },
    ];

    return (
        <div className="min-h-screen bg-[#fcfdfc] p-6 lg:p-8 space-y-8 font-sans">
            {/* Optimized Header Area */}
            <div className="bg-white p-5 rounded-3xl border border-gray-200 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.04)] flex justify-between items-center transition-all">
                <div className="flex items-center gap-6">
                    <button className="p-3 bg-white border border-gray-100 rounded-2xl shadow-sm hover:bg-gray-50 hover:border-gray-300 transition-all active:scale-95 group">
                        <ChevronLeft size={20} className="text-gray-400 group-hover:text-gray-700 transition-colors" />
                    </button>
                    <div className="space-y-1">
                        <h1 className="text-xl font-black text-gray-900 tracking-tighter uppercase leading-none">Sales</h1>
                        <p className="text-sm font-bold text-gray-400 tracking-wide uppercase">
                            Welcome Back, <span className="text-gray-800 font-black">{userName}</span>
                        </p>
                    </div>
                </div>
                <div className="p-3 bg-green-50/50 text-green-600 rounded-2xl border border-green-100/50 relative hover:bg-green-100 transition-colors cursor-pointer group">
                    <Bell size={24} className="group-hover:scale-110 transition-transform" />
                    <span className="absolute top-3 right-3 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white animate-pulse"></span>
                </div>
            </div>

            {/* Top Row KPIs */}
            <SalesStatsCards data={data} />

            {/* Middle Row Detailed Stats */}
            <SalesSecondaryStats
                data={data}
                activeProjects={data.activeProjectsFromSales}
                totalProjects={data.totalProjectsFromSales}
                completedProjects={data.completedProjectsFromSales}
            />

            {/* Performance Visualization Section */}
            <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-[0_8px_40px_-12px_rgba(0,0,0,0.03)]">
                <div className="flex justify-between items-center mb-10 pl-2">
                    <h3 className="text-lg font-black text-gray-800 uppercase tracking-widest">Monthly Performance</h3>
                    <div className="flex gap-2.5">
                        <div className="w-2.5 h-2.5 rounded-full bg-green-500/30"></div>
                        <div className="w-2.5 h-2.5 rounded-full bg-green-500/60"></div>
                        <div className="w-2.5 h-2.5 rounded-full bg-green-500"></div>
                    </div>
                </div>
                <div className="h-[400px]">
                    <SalesPerformanceChart data={statusChartData} />
                </div>
            </div>
        </div>
    );
};

export default SalesDashboard;

