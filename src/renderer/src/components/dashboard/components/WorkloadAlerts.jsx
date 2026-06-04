import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const WorkloadAlerts = ({ memberStats }) => {
  const notAssigned = memberStats.filter(m => Number(m.assignedHours) === 0);
  const underAssigned = memberStats.filter(m => Number(m.assignedHours) > 0 && Number(m.assignedHours) < 8);

  const [isNotAssignedOpen, setIsNotAssignedOpen] = useState(false);
  const [isUnderAssignedOpen, setIsUnderAssignedOpen] = useState(false);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
      {/* Not Assigned Card */}
      <div className="bg-white rounded-none border-2 border-green-700 shadow-soft overflow-hidden h-fit">
        <button 
          type="button"
          onClick={() => setIsNotAssignedOpen(!isNotAssignedOpen)}
          className="w-full px-8 py-6 flex items-center justify-between bg-green-200 text-left cursor-pointer hover:bg-green-50/50 transition-all "
        >
          <span className="text-xl font-semibold text-black uppercase tracking-normal">Not Assigned</span>
          <div className="flex items-center gap-3">
            <span className="text-lg font-bold text-black">{notAssigned.length}</span>
            <ChevronDown size={20} className={`text-black transition-transform duration-300 ${isNotAssignedOpen ? 'rotate-180' : ''}`} />
          </div>
        </button>
        
        <AnimatePresence initial={false}>
          {isNotAssignedOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="p-8 max-h-[250px] overflow-y-auto custom-scrollbar border-t border-black/5 bg-white">
                {notAssigned.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {notAssigned.map(m => (
                      <div key={m.id} className="px-4 py-2 bg-gray-100 border border-black/10 rounded-none text-xs font-semibold uppercase tracking-normal text-black shadow-sm transition-all hover:bg-white hover:border-black/20">
                        {m.name}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-black/40 font-bold uppercase tracking-normal text-xs">
                    Everyone has tasks assigned
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Under Assigned Card */}
      <div className="bg-white rounded-none border-2 border-green-700 shadow-soft overflow-hidden h-fit">
        <button 
          type="button"
          onClick={() => setIsUnderAssignedOpen(!isUnderAssignedOpen)}
          className="w-full px-8 py-6 flex items-center justify-between bg-green-200 text-left cursor-pointer hover:bg-green-50/50 transition-all border-b border-black/5"
        >
          <span className="text-xl font-semibold text-black uppercase tracking-normal">Under Assigned</span>
          <div className="flex items-center gap-3">
            <span className="text-lg font-bold text-black">{underAssigned.length}</span>
            <ChevronDown size={20} className={`text-black transition-transform duration-300 ${isUnderAssignedOpen ? 'rotate-180' : ''}`} />
          </div>
        </button>

        <AnimatePresence initial={false}>
          {isUnderAssignedOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="p-8 max-h-[250px] overflow-y-auto custom-scrollbar border-t border-black/5 bg-white">
                {underAssigned.length > 0 ? (
                  <div className="grid grid-cols-1 gap-3">
                    {underAssigned.map(m => (
                      <div key={m.id} className="flex items-center justify-between px-5 py-3 relative bg-gray-50 border border-black/10 rounded-none shadow-sm overflow-hidden group hover:border-green-600/30 transition-all">
                        <div className="absolute left-0 top-0 w-1 h-full bg-green-600/50" />
                        <span className="text-xs font-bold uppercase tracking-normal text-black">{m.name}</span>
                        <div className="flex items-center gap-4">
                          <span className="text-xs font-bold text-black uppercase tracking-normal">{m.assignedHours} hrs</span>
                          <div className="w-20 h-2 bg-gray-200 rounded-none overflow-hidden border border-black/10">
                            <div 
                              className="bg-green-600 h-full shadow-[0_0_8px_rgba(107,189,69,0.4)]" 
                              style={{ width: `${Math.min(100, (Number(m.assignedHours) / 8) * 100)}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-black/40 font-bold uppercase tracking-normal text-xs">
                    No workload capacity issues
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default WorkloadAlerts;
