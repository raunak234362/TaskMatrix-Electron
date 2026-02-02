/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
import Service from "../../api/Service";
import { motion } from "framer-motion";
import SalesStatsCards from "./components/SalesStatsCards";
import SalesSecondaryStats from "./components/SalesSecondaryStats";
import SalesPerformanceChart from "./components/SalesPerformanceChart";
import { Download, Filter } from "lucide-react";

const SalesDashboard = () => {
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        totalRfqs: 0,
        projectsAwarded: 0,
        winRate: 0,
        totalSalesValue: 0,
        activeProjects: 0,
        completed: 0,
        onHold: 0,
        delayed: 0,
        conversionRate: 0,
        totalClients: 0,
    });

    const [chartData, setChartData] = useState([]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const [projectsRes, rfqRes, clientsRes] = await Promise.all([
                    Service.GetAllProjects(),
                    Service.RFQRecieved(),
                    Service.GetAllFabricators(),
                ]);

                const projects = (projectsRes?.data || projectsRes || []).filter(p => !p.isDeleted);
                const rfqs = (rfqRes?.data || rfqRes || []).filter(r => !r.isDeleted);
                const clients = clientsRes?.data || clientsRes || [];

                // Calculation Logic
                const totalRfqs = rfqs.length;
                const awardedProjects = projects.filter((p) =>
                    ["ACTIVE", "COMPLETED", "AWARDED"].includes(p.status)
                ).length;

                // Win Rate (Awarded Projects / Total RFQs * 100)
                const winRate = totalRfqs > 0 ? Math.round((awardedProjects / totalRfqs) * 100) : 0;

                // Total Sales Value (Sum of bidPrice from RFQs that are awarded/turned into projects)
                // We'll sum bidPrice for all RFQs that have an associated project or are in a state that implies sale
                // Since linking might be tricky, let's sum bidPrice of all RFQs as "Pipeline Value" 
                // and maybe only AWARDED ones for "Total Sales Value".
                // For now, let's sum bidPrice of all projects if they have it, or RFQs with status 'AWARDED'.
                const totalSalesValue = rfqs.reduce((sum, rfq) => {
                    const price = parseFloat(rfq.bidPrice) || 0;
                    return sum + price;
                }, 0);

                const activeProjects = projects.filter((p) => p.status === "ACTIVE").length;
                const completedCount = projects.filter((p) => p.status === "COMPLETED").length;
                const onHold = projects.filter((p) => p.status === "ON_HOLD").length;

                // Check for delayed projects (e.g. status is delayed or end date passed)
                const delayed = projects.filter((p) => p.status === "DELAYED" || (p.endDate && new Date(p.endDate) < new Date() && p.status !== "COMPLETED")).length;

                // Conversion Rate: Awarded / RFQs
                const conversionRate = totalRfqs > 0 ? Math.round((awardedProjects / totalRfqs) * 100) : 0;
                const totalClients = clients.length;

                setStats({
                    totalRfqs,
                    projectsAwarded: awardedProjects,
                    winRate,
                    totalSalesValue,
                    activeProjects,
                    completed: completedCount,
                    onHold,
                    delayed,
                    conversionRate,
                    totalClients,
                });

                // Prepare Monthly Performance Data
                const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
                const monthlyData = months.map((month, index) => {
                    const monthRfqs = rfqs.filter(r => new Date(r.createdAt).getMonth() === index).length;
                    const monthAwarded = projects.filter(p =>
                        new Date(p.createdAt).getMonth() === index &&
                        ["ACTIVE", "COMPLETED", "AWARDED"].includes(p.status)
                    ).length;
                    const monthCompleted = projects.filter(p =>
                        new Date(p.updatedAt).getMonth() === index &&
                        p.status === "COMPLETED"
                    ).length;

                    return {
                        name: month,
                        RFQs: monthRfqs,
                        Awarded: monthAwarded,
                        Completed: monthCompleted
                    };
                });
                setChartData(monthlyData);

                setLoading(false);
            } catch (error) {
                console.error("Error fetching sales data", error);
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

    return (
        <div className="h-full p-8 space-y-10 font-sans text-slate-800">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">

                <div className="flex gap-4">
                    <button className="flex items-center gap-2 px-4 py-1 bg-white border border-gray-100 rounded-[1.25rem] text-gray-600 font-semibold hover:bg-green-50 hover:text-green-700 hover:border-green-200 transition-all shadow-sm">
                        <Filter size={20} />
                        All Time
                    </button>
                    <button className="flex items-center gap-2 px-4 py-1 bg-green-500 text-white rounded-[1.25rem] font-semibold hover:bg-green-600 transition-all shadow-[0_8px_20px_-4px_rgba(34,197,94,0.4)] hover:shadow-[0_12px_24px_-4px_rgba(34,197,94,0.5)]">
                        <Download size={20} />
                        Export Report
                    </button>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-10 border-b-2 border-gray-100 pb-0.5">
                {['Overview'].map((tab, i) => (
                    <button key={tab} className={`pb-2 text-base font-bold transition-all relative px-2 ${i === 0 ? 'text-green-700' : 'text-gray-400 hover:text-gray-600'}`}>
                        {tab}
                        {i === 0 && <motion.div layoutId="activeTab" className="absolute -bottom-1 left-0 right-0 h-1 bg-green-600 rounded-full" />}
                    </button>
                ))}
            </div>

            {/* Stats Cards */}
            <SalesStatsCards stats={stats} />

            {/* Secondary Stats */}
            <div className="pt-2">
                <SalesSecondaryStats stats={stats} />
            </div>

            {/* Charts & Details Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-1 gap-8 pt-4">
                <SalesPerformanceChart data={chartData} />
            </div>
        </div>
    );
};

export default SalesDashboard;
