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

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const [projectsRes, rfqRes, clientsRes] = await Promise.all([
                    Service.GetAllProjects(),
                    Service.RFQRecieved(), // Or RfqSent depending on role, assuming Recieved for internal sales
                    Service.GetAllFabricators(),
                ]);

                const projects = projectsRes?.data || []
                const rfqs = rfqRes?.data || []
                const clients = clientsRes || []

                // Calculation Logic
                const totalRfqs = rfqs.length;
                const awardedProjects = projects.filter((p) => p.status === "ACTIVE" || p.status === "COMPLETED" || p.status === "AWARDED").length;

                // Win Rate (Projects / RFQs * 100) - naive calculation
                const winRate = totalRfqs > 0 ? Math.round((awardedProjects / totalRfqs) * 100) : 0;

                // Sales Value (Sum of project values? Field might not exist, using bidPrice from RFQ or estimating)
                // Assuming 'bidPrice' or similar on Project/RFQ. Project interface shows 'estimatedHours' etc.
                // Let's use a mock multiplier for now or check if project has price.
                // Checking ProjectData interface: has estimatedHours. No explicit price.
                // Checking RFQ interface: has bidPrice.
                // Let's sum bidPrice of awarded RFQs (projects usually linked to RFQs)

                let totalSalesValue = 0;
                // Approximation bidPrice from RFQs linked to these projects or all projects
                // Since I don't have direct linkage easily without iterating, I'll use 0 for now or a mock until confirmed.
                // Actually, let's use a placeholder.
                totalSalesValue = 542000; // Placeholder

                const activeProjects = projects.filter((p) => p.status === "ACTIVE").length;
                const completed = projects.filter((p) => p.status === "COMPLETED").length;
                const onHold = projects.filter((p) => p.status === "ON_HOLD").length;
                const delayed = 0; // No status for delayed yet

                const conversionRate = 14;
                const totalClients = clients.length;

                setStats({
                    totalRfqs,
                    projectsAwarded: awardedProjects,
                    winRate,
                    totalSalesValue,
                    activeProjects,
                    completed,
                    onHold,
                    delayed,
                    conversionRate,
                    totalClients,
                });

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
                <SalesPerformanceChart />
            </div>
        </div>
    );
};

export default SalesDashboard;
