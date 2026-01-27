import { useEffect, useState } from "react";
import Service from "../../api/Service";
import CDSnapshotCards from "./components/CDSnapshotCards";
import CDNetworkOverview from "./components/CDNetworkOverview";
import CDCapacityTable from "./components/CDCapacityTable";
// import CDInsightsList from "./components/CDInsightsList"; // Removed based on feedback/redundancy
import GetConnectionDesignerByID from "./designer/GetConnectionDesignerByID";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

const DashboardSkeleton = () => (
    <div className="p-6 space-y-6 animate-pulse">
        {/* Snapshot Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-28 bg-gray-200 rounded-2xl"></div>
            ))}
        </div>
        {/* Network Overview Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[500px]">
            <div className="lg:col-span-2 bg-gray-200 rounded-2xl"></div>
            <div className="lg:col-span-1 bg-gray-200 rounded-2xl"></div>
        </div>
        {/* Bottom Skeleton */}
        <div className="h-48 bg-gray-200 rounded-2xl"></div>
    </div>
);

const CDdashboard = () => {
    const [loading, setLoading] = useState(true);
    const [cdData, setCdData] = useState([]);
    const [selectedDesignerId, setSelectedDesignerId] = useState(null);

    // Processed Data States
    const [stats, setStats] = useState({
        totalCDs: 0,
        totalCountries: 0,
        totalStates: 0,
        totalEngineers: 0,
        activeRFQs: 0
    });
    const [stateDist, setStateDist] = useState([]);
    const [recentActivity, setRecentActivity] = useState([]);

    // Insights removed from view, but logic kept if needed later

    useEffect(() => {
        const fetchData = async () => {
            try {
                // setLoading(true); // Already true init
                const response = await Service.FetchAllConnectionDesigner();
                const data = Array.isArray(response) ? response : (response?.data || []);
                setCdData(data);
                processData(data);

                // Simulate a slight delay for smooth skeleton transition if data is too fast
                setTimeout(() => setLoading(false), 800);
            } catch (error) {
                console.error("Failed to fetch CD data", error);
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const processData = (data) => {
        if (!data) return;

        // 1. Snapshot Stats
        const totalCDs = data.length;
        const allCountries = new Set();
        const allStates = new Set();
        let totalEngineers = 0;
        const stateCounts = {};

        data.forEach(cd => {
            // Location Processing
            let statesArr = [];
            if (Array.isArray(cd.state)) {
                statesArr = cd.state;
            } else if (typeof cd.state === 'string') {
                try {
                    if (cd.state.startsWith('[')) {
                        statesArr = JSON.parse(cd.state);
                    } else {
                        statesArr = [cd.state];
                    }
                } catch {
                    statesArr = [cd.state];
                }
            }

            statesArr.forEach(s => {
                if (s) {
                    allStates.add(s);
                    stateCounts[s] = (stateCounts[s] || 0) + 1;
                }
            });

            // Country Processing
            let country = cd.country || "";
            if (!country && cd.location && cd.location.includes(',')) {
                country = cd.location.split(',')[1].trim();
            } else if (!country && cd.location) {
                country = cd.location; // Fallback
            }
            if (country) {
                allCountries.add(country);
            }

            // Engineers
            const engineers = cd.CDEngineers || [];
            const engCount = engineers.length;
            totalEngineers += engCount;
        });

        setStats({
            totalCDs,
            totalCountries: allCountries.size,
            totalStates: allStates.size,
            totalEngineers,
            activeRFQs: 0
        });

        // 2. Charts Data (State)
        const sortedStates = Object.entries(stateCounts)
            .map(([name, count]) => ({ name, count }))
            .sort((a, b) => b.count - a.count);

        setStateDist(sortedStates);

        // 3. Recent Activity (Sort by updatedAt)
        const sortedByUpdate = [...data].sort((a, b) => {
            return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
        });

        setRecentActivity(sortedByUpdate.map(cd => ({
            id: cd._id || cd.id,
            name: cd.name,
            updatedAt: cd.updatedAt
        })));
    };

    if (loading) {
        return <DashboardSkeleton />;
    }

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="h-full p-4 sm:p-6 space-y-4 sm:space-y-8 bg-transparent overflow-y-auto custom-scrollbar relative"
        >
            {/* Header if needed */}

            {/* SECTION B — EXECUTIVE SNAPSHOT */}
            <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.1 }}
            >
                <CDSnapshotCards stats={stats} />
            </motion.div>

            {/* SECTION C — LOCATION INTELLIGENCE (Redesigned) */}
            {/* New component on Left, Pie on Right */}
            <CDNetworkOverview
                designers={cdData}
                stateData={stateDist}
                onSelect={(id) => setSelectedDesignerId(id)}
            />

            {/* SECTION D — RECENT ACTIVITY */}
            <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
            >
                <CDCapacityTable recentActivity={recentActivity} />
            </motion.div>

            {/* DETAILS MODAL */}

            <AnimatePresence>
                {selectedDesignerId && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
                        onClick={() => setSelectedDesignerId(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.95, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.95, y: 20 }}
                            onClick={(e) => e.stopPropagation()} // Prevent close on content click
                            className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto relative"
                        >
                            <button
                                onClick={() => setSelectedDesignerId(null)}
                                className="absolute top-4 right-4 p-2 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors z-10"
                            >
                                <X size={20} className="text-gray-600" />
                            </button>

                            <div className="p-1">
                                <GetConnectionDesignerByID id={selectedDesignerId} />
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

        </motion.div>
    );
};

export default CDdashboard;
