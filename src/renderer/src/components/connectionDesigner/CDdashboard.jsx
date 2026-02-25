import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Service from "../../api/Service";
import CDSnapshotCards from "./components/CDSnapshotCards";
import CDNetworkOverview from "./components/CDNetworkOverview";
import CDCapacityTable from "./components/CDCapacityTable";
// import CDInsightsList from "./components/CDInsightsList"; // Removed based on feedback/redundancy
import GetConnectionDesignerByID from "./designer/GetConnectionDesignerByID";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronRight } from "lucide-react";

const DashboardSkeleton = () => (
    <div className="p-6 space-y-6 animate-pulse ">
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
        <>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
                className="h-full p-4 sm:p-6 flex flex-col gap-12 sm:gap-8 bg-transparent overflow-y-auto custom-scrollbar relative"
            >
                {/* Header */}
             
                    {/* <div className="flex items-center gap-4">
                        <button
                            onClick={() => window.history.back()}
                            className="p-2.5 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-all shadow-xs"
                        >
                            <ChevronRight size={20} className="rotate-180 text-gray-600" />
                        </button>
                        <h1 className="text-xl font-black text-gray-900 uppercase tracking-[0.2em]">Connection Designer</h1>
                    </div> */}

                    {/* <div className="flex items-center gap-3">
                        <button className="px-6 py-2.5 bg-green-50 border border-green-200 rounded-xl text-xs font-black text-green-700 uppercase tracking-widest hover:bg-green-100 transition-all shadow-sm">
                            Connection Designer Home
                        </button>
                        <button className="px-6 py-2.5 bg-white border border-gray-200 rounded-xl text-xs font-black text-gray-400 uppercase tracking-widest hover:bg-gray-50 transition-all shadow-sm">
                            Add Connection Designer
                        </button>
                    </div> */}
              

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
                    className="space-y-8"
                >
                    <CDCapacityTable recentActivity={recentActivity} />
                </motion.div>

            </motion.div>

            {/* DETAILS MODAL - Moved outside to escape parent transform if any, and ensure fixed positioning relative to viewport */}
            {/* DETAILS MODAL - Portaled to document.body to ensure full overlay over Sidebar/Layout */}
            {createPortal(
                <AnimatePresence>
                    {selectedDesignerId && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
                            onClick={() => setSelectedDesignerId(null)}
                        >
                            <motion.div
                                initial={{ scale: 0.95, y: 20 }}
                                animate={{ scale: 1, y: 0 }}
                                exit={{ scale: 0.95, y: 20 }}
                                onClick={(e) => e.stopPropagation()} // Prevent close on content click
                                className="bg-white rounded-xl shadow-2xl w-[95vw] h-[90vh] overflow-hidden relative flex flex-col"
                            >
                                <button
                                    onClick={() => setSelectedDesignerId(null)}
                                    className="absolute top-4 right-4 p-2 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors z-10"
                                >
                                    <X size={18} className="text-gray-400" />
                                </button>

                                <div className="flex-1 overflow-y-auto custom-scrollbar">
                                    <GetConnectionDesignerByID
                                        id={selectedDesignerId}
                                        onClose={() => setSelectedDesignerId(null)}
                                    />
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>,
                document.body
            )}
        </>
    );
};

export default CDdashboard;
