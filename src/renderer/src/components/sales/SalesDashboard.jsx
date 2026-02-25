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
        <div className="min-h-screen bg-[#fcfdfc] p-4 lg:p-6 space-y-8 font-sans laptop-fit">
            {/* Optimized Header Area */}
            <div className="bg-white p-5 rounded-3xl border-2 border-black shadow-[4px_4px_0px_#000] flex justify-between items-center transition-all">
                <div className="flex items-center gap-6">
                    <button className="p-2.5 bg-white border border-gray-100 rounded-xl shadow-sm hover:border-black transition-all active:scale-95 group">
                        <ChevronLeft size={20} className="text-black transition-colors" />
                    </button>
                    <div className="space-y-1">
                        <h1 className="text-2xl font-black text-black tracking-tight uppercase leading-none">Sales Dashboard</h1>
                        <p className="text-[11px] font-black text-black/40 tracking-[0.2em] uppercase">
                            Welcome Back, <span className="text-black">{userName}</span>
                        </p>
                    </div>
                </div>
                <div className="p-3 bg-white text-black rounded-2xl border-2 border-black relative hover:bg-gray-50 transition-all cursor-pointer group shadow-[2px_2px_0px_#000]">
                    <Bell size={20} strokeWidth={3} className="group-hover:scale-110 transition-transform" />
                    <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-black animate-pulse"></span>
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
            <div className="bg-white p-8 rounded-3xl border border-gray-200 border-l-4 border-l-green-600 shadow-sm transition-all duration-500">
                <div className="flex justify-between items-center mb-10 px-1">
                    <div>
                        <h3 className="text-base font-black text-black uppercase tracking-[0.15em]">Monthly Performance</h3>
                        <p className="text-[11px] font-black text-black/40 uppercase tracking-widest mt-1">RFQ Pipeline & Conversion Analysis</p>
                    </div>
                    <div className="flex gap-2">
                        <div className="w-2 h-2 rounded-full bg-green-500/20"></div>
                        <div className="w-2 h-2 rounded-full bg-green-500/40"></div>
                        <div className="w-2 h-2 rounded-full bg-green-500"></div>
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

