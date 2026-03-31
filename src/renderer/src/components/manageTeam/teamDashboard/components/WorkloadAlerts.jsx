import { UserMinus, Clock } from "lucide-react";
import { motion } from "framer-motion";

const WorkloadAlerts = ({ memberStats, onFilterChange }) => {
  const notAssigned = memberStats.filter(m => Number(m.assignedHours) === 0);
  const underAssigned = memberStats.filter(m => Number(m.assignedHours) > 0 && Number(m.assignedHours) < 8);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
      {/* Not Assigned Card */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-[2.5rem] border border-black/5 shadow-soft overflow-hidden"
      >
        <div className="px-8 py-6 border-b border-black/5 flex items-center justify-between bg-orange-50/30">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-orange-100 text-orange-600 rounded-2xl border border-orange-200">
              <UserMinus size={24} strokeWidth={2.5} />
            </div>
            <div>
              <h3 className="text-xl font-black text-black uppercase tracking-tight">Not Assigned</h3>
              <p className="text-[10px] font-black text-orange-600 uppercase tracking-widest mt-1">Available for new tasks</p>
            </div>
          </div>
          <button 
            type="button"
            onClick={() => onFilterChange("not_assigned")}
            className="text-[10px] font-black text-black uppercase tracking-tight hover:underline"
          >
            See all ({notAssigned.length})
          </button>
        </div>
        <div className="p-8 max-h-[250px] overflow-y-auto custom-scrollbar">
          {notAssigned.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {notAssigned.map(m => (
                <div key={m.id} className="px-4 py-2 bg-gray-100 border border-black/5 rounded-xl text-[11px] font-black uppercase tracking-wider text-black shadow-sm transition-all hover:bg-white hover:border-black/20">
                  {m.name}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-black/20 font-black uppercase tracking-widest text-xs">
              Everyone has tasks assigned
            </div>
          )}
        </div>
      </motion.div>

      {/* Under Assigned Card */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-[2.5rem] border border-black/5 shadow-soft overflow-hidden"
      >
        <div className="px-8 py-6 border-b border-black/5 flex items-center justify-between bg-yellow-50/30">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-yellow-100 text-yellow-600 rounded-2xl border border-yellow-200">
              <Clock size={24} strokeWidth={2.5} />
            </div>
            <div>
              <h3 className="text-xl font-black text-black uppercase tracking-tight">Under Assigned</h3>
              <p className="text-[10px] font-black text-yellow-600 uppercase tracking-widest mt-1">Less than 8 hours workload</p>
            </div>
          </div>
          <button 
            type="button"
            onClick={() => onFilterChange("under_assigned")}
            className="text-[10px] font-black text-black uppercase tracking-tight hover:underline"
          >
            See all ({underAssigned.length})
          </button>
        </div>
        <div className="p-8 max-h-[250px] overflow-y-auto custom-scrollbar">
          {underAssigned.length > 0 ? (
            <div className="grid grid-cols-1 gap-3">
              {underAssigned.map(m => (
                <div key={m.id} className="flex items-center justify-between px-5 py-3 relative bg-gray-50 border border-black/5 rounded-2xl shadow-sm overflow-hidden group hover:border-[#6bbd45]/30 transition-all">
                  <div className="absolute left-0 top-0 w-1 h-full bg-yellow-500/50" />
                  <span className="text-xs font-black uppercase tracking-tight text-black">{m.name}</span>
                  <div className="flex items-center gap-4">
                    <span className="text-[10px] font-black text-black/40 uppercase tracking-widest">{m.assignedHours} hrs</span>
                    <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden border border-black/5">
                      <div 
                        className="bg-yellow-500 h-full shadow-[0_0_8px_rgba(234,179,8,0.4)]" 
                        style={{ width: `${Math.min(100, (Number(m.assignedHours) / 8) * 100)}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-black/20 font-black uppercase tracking-widest text-xs">
              No workload capacity issues
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default WorkloadAlerts;
