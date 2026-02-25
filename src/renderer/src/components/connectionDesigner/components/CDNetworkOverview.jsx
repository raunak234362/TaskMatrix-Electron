import React, { useState } from "react";
import {
  PieChart,
  Pie,
  Cell,
  Legend,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, Phone, MapPin, ChevronRight, Search } from "lucide-react";


const CDNetworkOverview = ({
  designers,
  stateData,
  onSelect,
}) => {
  const COLORS = [
    "#10b981",
    "#3b82f6",
    "#f59e0b",
    "#8b5cf6",
    "#ec4899",
    "#14b8a6",
    "#6366f1",
    "#ef4444",
    "#84cc16",
    "#0ea5e9",
    "#d946ef",
    "#f97316",
    "#64748b",
    "#a855f7",
  ];
  const [hoveredId, setHoveredId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const pieCenterX = "50%";
  const pieCenterY = "50%"; // slightly lower looks visually perfect

  const filteredDesigners = designers.filter(
    (d) =>
      d.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.email?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="flex flex-col gap-6 mb-8">
      {/* LEFT Designer Directory (Interactive List) */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-white rounded-3xl shadow-sm border border-gray-100 flex flex-col overflow-hidden"
      >
        <div className="p-6 border-b border-gray-50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-black text-gray-800 uppercase tracking-widest">
              Connection Designer Directory
            </h3>
            <p className="text-[10px] font-bold text-gray-400 mt-1 uppercase tracking-tight">
              Click to view details • Hover to see states
            </p>
          </div>
          <div className="relative w-full sm:w-80">
            <Search
              className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
              size={16}
            />
            <input
              type="text"
              placeholder="Search by name, email, contact..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-12 pr-4 py-3 bg-gray-50/50 border border-gray-100 rounded-xl text-sm focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none w-full transition-all"
            />
          </div>
        </div>

        <div className="flex-1 p-4 space-y-3">
          {filteredDesigners.map((designer) => {
            // Parse states for this designer
            let states = [];
            if (Array.isArray(designer.state)) states = designer.state;
            else if (typeof designer.state === "string") {
              try {
                states = designer.state.startsWith("[")
                  ? JSON.parse(designer.state)
                  : [designer.state];
              } catch {
                states = [designer.state];
              }
            }
            states = states.filter(Boolean);

            return (
              <motion.div
                key={designer.id || designer._id}
                onMouseEnter={() => setHoveredId(designer.id || designer._id)}
                onMouseLeave={() => setHoveredId(null)}
                onClick={() => onSelect(designer.id || designer._id)}
                className="group relative flex items-center justify-between p-4 rounded-2xl hover:bg-gray-50 transition-all border border-gray-100 hover:border-green-200 cursor-pointer"
              >
                {/* Main Info */}
                <div className="flex items-center gap-6 min-w-0">
                  <div className="w-12 h-12 shrink-0 rounded-xl bg-green-50 border border-green-100 flex items-center justify-center text-green-600 font-black text-lg shadow-sm">
                    {designer.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="text-base font-black text-gray-800 group-hover:text-green-600 transition-colors">
                      {designer.name}
                    </h4>
                    <div className="flex flex-wrap items-center gap-4 mt-1">
                      {designer.email && (
                        <span className="flex items-center gap-2 text-[11px] font-bold text-gray-400 uppercase tracking-tight">
                          <Mail size={12} className="text-gray-300" /> {designer.email}
                        </span>
                      )}
                      {designer.contactInfo && (
                        <span className="flex items-center gap-2 text-[11px] font-bold text-gray-400 uppercase tracking-tight">
                          <Phone size={12} className="text-gray-300" /> {designer.contactInfo}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right Arrow / State Count */}
                <div className="flex items-center gap-4 shrink-0">
                  <div className="px-3 py-1 bg-white border border-gray-200 rounded-lg shadow-xs flex items-center gap-2">
                    <span className="text-xs font-black text-gray-700">{states.length}</span>
                    <ChevronRight size={14} className="text-gray-300 group-hover:text-green-500 transition-colors" />
                  </div>
                </div>

                {/* HOVER POPOVER (Floating State List) */}
                <AnimatePresence>
                  {hoveredId === (designer.id || designer._id) && (
                    <motion.div
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      className="absolute right-24 top-1/2 -translate-y-1/2 z-50 bg-white p-4 rounded-2xl shadow-2xl border border-gray-100 w-64 pointer-events-none"
                    >
                      <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-50">
                        <MapPin size={14} className="text-green-500" />
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                          Coverage Area
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {states.length > 0 ? (
                          states.slice(0, 10).map((s, i) => (
                            <span
                              key={i}
                              className="text-[10px] font-bold bg-green-50/50 text-green-700 px-2.5 py-1 rounded-lg border border-green-100"
                            >
                              {s}
                            </span>
                          ))
                        ) : (
                          <span className="text-[10px] font-bold text-gray-400 uppercase">
                            No states listed
                          </span>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
};

export default CDNetworkOverview;
