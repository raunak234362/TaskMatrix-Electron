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
    const [dashboardData, setDashboardData] = useState(null);

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
                <p className="text-gray-500">No data available</p>
            </div>
        )
    }

    const { data, activeProjectsFromSales, completedProjectsFromSales } = dashboardData;

    // Prepare status distribution data for the graph
    const statusChartData = [
        { name: 'Total', value: data.totalRFQs || 0 },
        { name: 'Pipeline', value: data.inPipelineRFQs || 0 },
        { name: 'Quoted', value: data.quotedRFQs || 0 },
        { name: 'Responded', value: data.respondedRFQs || 0 },
        { name: 'Awarded', value: data.awardedRFQs || 0 },
        { name: 'Rejected', value: data.rejectedRFQs || 0 },
    ];

    return (
        <div className="h-full p-8 space-y-10 font-sans text-slate-800">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Sales Dashboard</h1>
                    <p className="text-gray-500 mt-1 font-medium">Real-time performance metrics</p>
                </div>
                <div className="flex gap-4">
                    <button className="flex items-center gap-2 px-4 py-1.5 bg-white border border-gray-300 rounded-xl text-gray-600 font-bold hover:bg-green-50 hover:text-green-700 hover:border-green-400 transition-all shadow-sm uppercase text-[10px] tracking-widest">
                        <Filter size={16} />
                        Filter
                    </button>
                    <button className="flex items-center gap-2 px-4 py-1.5 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 transition-all shadow-md uppercase text-[10px] tracking-widest">
                        <Download size={16} />
                        Export
                    </button>
                </div>
            </div>

            {/* Stats Cards - Primary KPIs */}
            <SalesStatsCards data={data} />

            {/* Performance Chart */}
            <div className="pt-4">
                <SalesPerformanceChart data={statusChartData} />
            </div>

            {/* Secondary Stats - Detailed Metrics */}
            <SalesSecondaryStats
                data={data}
                activeProjects={activeProjectsFromSales}
                completedProjects={completedProjectsFromSales}
            />
        </div>
    );
};

export default SalesDashboard;
