/* eslint-disable react/prop-types */
import { useEffect, useState, useMemo, useRef } from "react";
import Service from "../../api/Service";
import AddVendor from "./designer/AddVendor";
import GetVendorByID from "./designer/GetVendorByID";
import DataTable from "../ui/table";
import { motion, AnimatePresence } from "framer-motion";
import { LayoutDashboard, UserPlus, Building2, MapPin, Globe, Phone } from "lucide-react";

// ═══════════════════════════════════════
// Skeleton
// ═══════════════════════════════════════
const TableSkeleton = () => (
    <div className="animate-pulse space-y-3 p-4">
        <div className="h-10 bg-gray-100 rounded-lg w-full" />
        {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-14 bg-gray-100 rounded-lg w-full" />
        ))}
    </div>
);

// ═══════════════════════════════════════
// Stat Card
// ═══════════════════════════════════════
const StatCard = ({ icon: Icon, label, value, color }) => (
    <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-4 shadow-sm">
        <div className={`p-3 rounded-xl ${color}`}>
            <Icon size={20} className="text-white" />
        </div>
        <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">{label}</p>
            <p className="text-2xl font-bold text-gray-800">{value}</p>
        </div>
    </div>
);

// ═══════════════════════════════════════
// Vendor Home
// ═══════════════════════════════════════
const VendorHome = ({ onViewVendor, refreshRef }) => {
    const [vendors, setVendors] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchVendors = async () => {
        try {
            setLoading(true);
            console.log("[VendorHome] Calling Service.GetAllVendors...");
            const response = await Service.GetAllVendors();
            console.log("[VendorHome] Raw response:", response);

            let data = [];
            if (Array.isArray(response)) data = response;
            else if (Array.isArray(response?.data)) data = response.data;

            console.log("[VendorHome] Parsed vendors list:", data);
            setVendors(data);
        } catch (error) {
            console.error("[VendorHome] Failed to fetch vendors:", error);
        } finally {
            setLoading(false);
        }
    };

    // expose refresh to parent via ref
    useEffect(() => {
        if (refreshRef) refreshRef.current = fetchVendors;
    }, [refreshRef]);

    useEffect(() => { fetchVendors(); }, []);

    const totalStates = useMemo(() => {
        const s = new Set();
        vendors.forEach((v) => { if (Array.isArray(v.state)) v.state.forEach((st) => s.add(st)); });
        return s.size;
    }, [vendors]);

    const columns = useMemo(() => [
        {
            accessorKey: "name", header: "Vendor Name",
            cell: ({ row }) => <span className="font-semibold text-gray-800">{row.original.name}</span>,
        },
        { accessorKey: "email", header: "Email" },
        { accessorKey: "contactInfo", header: "Contact" },
        { accessorKey: "location", header: "Location" },
        {
            accessorKey: "state", header: "States",
            cell: ({ row }) => {
                const states = row.original.state;
                if (!Array.isArray(states) || states.length === 0) return <span className="text-gray-400">—</span>;
                return (
                    <div className="flex flex-wrap gap-1">
                        {states.slice(0, 2).map((s) => (
                            <span key={s} className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">{s}</span>
                        ))}
                        {states.length > 2 && <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">+{states.length - 2}</span>}
                    </div>
                );
            },
        },
        {
            accessorKey: "websiteLink", header: "Website",
            cell: ({ row }) => row.original.websiteLink
                ? <a href={row.original.websiteLink} target="_blank" rel="noreferrer"
                    className="text-cyan-600 underline hover:text-cyan-800 text-xs truncate max-w-[130px] block"
                    onClick={(e) => e.stopPropagation()}>{row.original.websiteLink}</a>
                : <span className="text-gray-400">—</span>,
        },
        {
            accessorKey: "isDeleted", header: "Status",
            cell: ({ row }) => (
                <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${row.original.isDeleted ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"}`}>
                    {row.original.isDeleted ? "Inactive" : "Active"}
                </span>
            ),
        },
    ], []);

    const handleRowClick = (row) => {
        const id = row?.id ?? row?.original?.id;
        console.log("[VendorHome] Row clicked, vendor ID:", id);
        if (id) onViewVendor(id);
    };

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard icon={Building2} label="Total Vendors" value={vendors.length} color="bg-green-500" />
                <StatCard icon={MapPin} label="States Covered" value={totalStates} color="bg-blue-500" />
                <StatCard icon={Globe} label="With Website" value={vendors.filter((v) => v.websiteLink).length} color="bg-purple-500" />
                <StatCard icon={Phone} label="With Contact" value={vendors.filter((v) => v.contactInfo).length} color="bg-orange-500" />
            </div>

            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                    <h3 className="text-base font-bold text-gray-800 uppercase tracking-wide">All Vendors</h3>
                    <span className="text-xs text-gray-400">{vendors.length} record{vendors.length !== 1 ? "s" : ""}</span>
                </div>
                {loading ? (
                    <TableSkeleton />
                ) : vendors.length > 0 ? (
                    <div className="p-4">
                        <DataTable columns={columns} data={vendors} onRowClick={handleRowClick} />
                    </div>
                ) : (
                    <div className="text-center py-16 text-gray-400">
                        <Building2 size={42} className="mx-auto mb-3 opacity-25" />
                        <p className="font-semibold text-gray-500">No vendors found</p>
                        <p className="text-sm mt-1">Use the &quot;Add Vendor&quot; tab to register one.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

// ═══════════════════════════════════════
// Main Shell
// ═══════════════════════════════════════
const VendorDashboard = () => {
    const [activeTab, setActiveTab] = useState("home");
    const [selectedVendorId, setSelectedVendorId] = useState(null);
    const vendorRefreshRef = useRef(null);

    const tabs = [
        { key: "home", label: "Vendor Home", icon: LayoutDashboard },
        { key: "add", label: "Add Vendor", icon: UserPlus },
    ];

    return (
        <div className="h-full bg-transparent flex flex-col">

            {/* ── Tab Bar ── */}
            <div className="px-6 pt-6 border-b border-gray-200/60 bg-white/30 backdrop-blur-md sticky top-0 z-20">
                <div className="flex gap-8">
                    {tabs.map(({ key, label, icon: Icon }) => (
                        <button
                            key={key}
                            onClick={() => setActiveTab(key)}
                            className={`flex items-center gap-2 pb-4 text-sm font-semibold transition-all relative ${activeTab === key ? "text-green-600" : "text-gray-500 hover:text-gray-700"
                                }`}
                        >
                            <Icon size={17} />
                            {label}
                            {activeTab === key && (
                                <motion.div layoutId="vendorTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-green-600 rounded-full" />
                            )}
                        </button>
                    ))}
                </div>
            </div>

            {/* ── Content ── */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
                <AnimatePresence mode="wait">
                    {activeTab === "home" ? (
                        <motion.div key="home" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.18 }}>
                            <VendorHome onViewVendor={(id) => setSelectedVendorId(id)} refreshRef={vendorRefreshRef} />
                        </motion.div>
                    ) : (
                        <motion.div key="add" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.18 }}>
                            <AddVendor />
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* ── Vendor Detail — self-contained full-screen overlay ── */}
            {selectedVendorId && (
                <GetVendorByID
                    id={selectedVendorId}
                    onClose={() => setSelectedVendorId(null)}
                    onDeleted={() => {
                        setSelectedVendorId(null);
                        vendorRefreshRef.current?.();
                    }}
                />
            )}
        </div>
    );
};

export default VendorDashboard;
