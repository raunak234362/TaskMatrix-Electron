import { useEffect, useState } from "react";
import Service from "../../api/Service";
import EstimationStats from "./components/EstimationStats";
import FabricatorProjectChart from "./components/FabricatorProjectChart";
import AllEstimation from "./AllEstimation";

const EstimationDashboard = () => {
    const [loading, setLoading] = useState(true);
    const [estimations, setEstimations] = useState([]);
    const [stats, setStats] = useState({
        totalEstimated: 0,
        totalAwarded: 0,
        totalHours: 0,
    });

    const [chartData, setChartData] = useState([]);
    const [chartFabricators, setChartFabricators] = useState([]);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const response = await Service.AllEstimation();
            const allEstimations = Array.isArray(response)
                ? response
                : response?.data || [];

            setEstimations(allEstimations);
            calculateStats(allEstimations);
            processChartData(allEstimations);
        } catch (error) {
            console.error("Failed to fetch estimation data", error);
        } finally {
            setLoading(false);
        }
    };

    const calculateStats = (data) => {
        if (!data) return;

        const totalEstimated = data.length;
        const totalAwarded = data.filter(
            (e) =>
                e.status?.toUpperCase() === "AWARDED" ||
                e.status?.toUpperCase() === "COMPLETED"
        ).length;

        const totalHours = data.reduce((sum, e) => {
            const hours = e.estimatedHours || e.finalHours || e.totalAgreatedHours || 0;
            return sum + Number(hours);
        }, 0);

        setStats({
            totalEstimated,
            totalAwarded,
            totalHours,
        });
    };

    const processChartData = (data) => {
        if (!data) return;

        const monthlyData = {};
        const allFabricators = new Set();

        data.forEach((e) => {
            const dateStr = e.estimateDate || e.createdAt;
            if (!dateStr) return;

            const date = new Date(dateStr);
            const monthYear = date.toLocaleString("default", {
                month: "short",
                year: "2-digit",
            });

            const sortKey = `${date.getFullYear()}-${String(
                date.getMonth() + 1
            ).padStart(2, "0")}`;

            if (!monthlyData[sortKey]) {
                monthlyData[sortKey] = { name: monthYear, sortKey };
            }

            const fabName = e.fabricator?.fabName || e.fabricatorName || "Unknown";
            allFabricators.add(fabName);

            if (!monthlyData[sortKey][fabName]) {
                monthlyData[sortKey][fabName] = 0;
            }
            monthlyData[sortKey][fabName] += 1;
        });

        const sortedData = Object.values(monthlyData).sort((a, b) =>
            a.sortKey.localeCompare(b.sortKey)
        );

        setChartData(sortedData);
        setChartFabricators(Array.from(allFabricators));
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-full min-h-[400px]">
                <div className="w-12 h-12 border-4 border-teal-200 border-t-teal-600 rounded-full animate-spin"></div>
                <p className="mt-4 text-gray-500 font-medium">
                    Loading Estimation Dashboard...
                </p>
            </div>
        );
    }

    return (
        <div className="h-full p-4 rounded-xl space-y-6 bg-gray-50 overflow-y-auto min-h-screen">
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                <div className="xl:col-span-2">
                    <EstimationStats
                        stats={{ ...stats, totalHours: stats.totalHours.toFixed(2) }}
                    />
                </div>
            </div>

            <div className="w-full h-96">
                <FabricatorProjectChart
                    data={chartData}
                    fabricators={chartFabricators}
                />
            </div>

            <div className="pt-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 px-1">
                    All Estimations
                </h3>
                <AllEstimation estimations={estimations} onRefresh={fetchData} />
            </div>
        </div>
    );
};

export default EstimationDashboard;
