import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, Phone, ChevronRight, Search, MapPin } from "lucide-react";

const CDNetworkOverview = ({
  designers,
  onSelect,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [hoveredId, setHoveredId] = useState(null);

  const filteredDesigners = designers.filter(
    (d) =>
      d.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.email?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="w-full">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-white rounded-3xl shadow-sm border border-gray-100 flex flex-col overflow-hidden min-h-[500px]"
      >
        <div className="p-6 sm:p-8 border-b border-gray-50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div>
            <h3 className="text-lg font-black text-black uppercase tracking-widest">
              Connection Designer Directory
            </h3>
            <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mt-1">
              CLICK TO VIEW DETAILS • HOVER TO SEE STATES
            </p>
          </div>
          <div className="relative w-full sm:w-auto">
            <Search
              className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
              size={16}
            />
            <input
              type="text"
              placeholder="Search by name, email, etc..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-12 pr-6 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none w-full sm:w-80 transition-all font-medium"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3 custom-scrollbar bg-gray-50/30">
          {filteredDesigners.map((designer) => {
            const designerId = designer.id || designer._id;
            const states = Array.isArray(designer.state) ? designer.state : [];

            return (
              <div key={designerId} className="relative">
                <motion.div
                  onMouseEnter={() => setHoveredId(designerId)}
                  onMouseLeave={() => setHoveredId(null)}
                  onClick={() => onSelect(designerId)}
                  className="group flex items-center justify-between p-4 sm:p-5 bg-white rounded-2xl border border-gray-100 shadow-xs hover:shadow-md hover:border-green-500/30 transition-all duration-300 cursor-pointer"
                >
                  <div className="flex items-center gap-5 min-w-0">
                    <div className="w-12 h-12 shrink-0 rounded-2xl bg-gray-50 flex items-center justify-center text-gray-400 font-black text-lg border border-gray-100 group-hover:bg-green-50 group-hover:text-green-600 transition-colors">
                      {designer.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="text-base font-black text-black tracking-tight group-hover:text-green-700 transition-colors">
                        {designer.name}
                      </h4>
                      <div className="flex flex-wrap items-center gap-4 mt-1">
                        {designer.email && (
                          <span className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-wider">
                            <Mail size={12} className="text-gray-300" /> {designer.email}
                          </span>
                        )}
                        {designer.contactInfo && (
                          <span className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-wider">
                            <Phone size={12} className="text-gray-300" /> {designer.contactInfo}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 shrink-0">
                    <div className="px-3 py-1 bg-gray-50 rounded-lg border border-gray-100">
                      <span className="text-xs font-black text-gray-600">
                        {states.length}
                      </span>
                    </div>
                    <div className="w-8 h-8 rounded-full flex items-center justify-center bg-gray-50 group-hover:bg-green-600 group-hover:text-white transition-all">
                      <ChevronRight size={18} />
                    </div>
                  </div>
                </motion.div>

                {/* HOVER POPUP */}
                <AnimatePresence>
                  {hoveredId === designerId && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9, y: 10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.9, y: 10 }}
                      className="absolute right-0 bottom-full mb-2 z-50 bg-white p-4 rounded-2xl shadow-2xl border border-gray-100 w-64 pointer-events-none"
                    >
                      <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-50">
                        <div className="p-1.5 bg-green-50 rounded-lg text-green-600">
                          <MapPin size={12} strokeWidth={3} />
                        </div>
                        <span className="text-[10px] font-black text-black uppercase tracking-widest">
                          Service States
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {states.length > 0 ? (
                          states.map((s, i) => (
                            <span
                              key={i}
                              className="text-[9px] font-black bg-gray-50 text-gray-600 px-2 py-1 rounded-lg border border-gray-100 uppercase tracking-wider"
                            >
                              {s}
                            </span>
                          ))
                        ) : (
                          <span className="text-[10px] text-gray-400 font-bold uppercase italic">
                            No states listed
                          </span>
                        )}
                      </div>
                      {/* Arrow Down */}
                      <div className="absolute -bottom-1.5 right-6 w-3 h-3 bg-white border-b border-r border-gray-100 rotate-45"></div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}

          {filteredDesigners.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-gray-400">
              <Search size={48} className="mb-4 opacity-10" />
              <p className="text-sm font-black uppercase tracking-[0.2em]">No designers found</p>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default CDNetworkOverview;

