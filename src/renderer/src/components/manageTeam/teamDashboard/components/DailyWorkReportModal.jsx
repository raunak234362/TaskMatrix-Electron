import { useEffect } from "react";
import { X, FileText, Download, User } from "lucide-react";
import Button from "../../../fields/Button";
import { useDispatch } from "react-redux";
import {
  incrementModalCount,
  decrementModalCount,
} from "../../../../store/uiSlice";

const DailyWorkReportModal = ({
  isOpen,
  onClose,
  members,
}) => {
  const dispatch = useDispatch();

  useEffect(() => {
    if (isOpen) {
      dispatch(incrementModalCount());
      return () => {
        dispatch(decrementModalCount());
      };
    }
  }, [isOpen, dispatch]);

  if (!isOpen) return null;

  const formatWorkedHours = (workingHourTask) => {
    const totalMinutes = (workingHourTask || []).reduce((sum, entry) => {
      if (entry.duration_seconds) return sum + entry.duration_seconds / 60;
      return sum + (entry.duration || 0);
    }, 0);
    const hrs = Math.floor(totalMinutes / 60);
    const mins = Math.round(totalMinutes % 60);
    return `${hrs.toString().padStart(2, "0")}:${mins
      .toString()
      .padStart(2, "0")}`;
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-[98%] max-w-[95vw] h-[95vh] rounded-2xl shadow-2xl border border-gray-200 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 flex items-center justify-between bg-white shrink-0">
          <div>
            <h2 className="text-xl font-black text-black tracking-tight uppercase flex items-center gap-2">
              <FileText className="text-[#6bbd45]" size={24} />
              Daily Work Report
            </h2>
            <p className="text-[10px] font-black text-black uppercase tracking-[0.2em] mt-1">
              SUMMARY OF ACTIVITIES FOR THE SELECTED PERIOD
            </p>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-red-50 border border-red-600 text-black font-black text-[10px] uppercase tracking-widest rounded-lg hover:bg-red-100 transition-all"
          >
            Close
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {members.map((member) => (
            <div
              key={member.id}
              className="border border-gray-100 rounded-2xl p-4 hover:shadow-md transition-all"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                    <User size={20} />
                  </div>
                  <div>
                    <h4 className=" text-gray-700">
                      {member.f_name} {member.l_name}
                    </h4>
                    <p className="text-xs text-gray-700">
                      {member.role || "Team Member"}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-400 uppercase tracking-wider ">
                    Tasks
                  </p>
                  <p className="text-lg  text-green-600">
                    {member.tasks?.length || 0}
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                {member.tasks?.map((task, idx) => (
                  <div
                    key={idx}
                    className="bg-gray-50 rounded-xl p-3 flex items-center justify-between"
                  >
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-gray-700">
                        {task.subject || task.name}
                      </p>
                      <p className="text-xs text-gray-700">
                        {task.project?.name || "No Project"}
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-[10px] text-gray-400 uppercase">
                          Duration
                        </p>
                        <p className="text-xs  text-gray-700">
                          {task.duration || "00:00"}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] text-gray-400 uppercase">
                          Worked
                        </p>
                        <p className="text-xs  text-indigo-600">
                          {formatWorkedHours(task.workingHourTask)}
                        </p>
                      </div>
                      <span
                        className={`px-2 py-1 rounded-lg text-[10px]  ${task.status === "COMPLETE"
                          ? "bg-green-100 text-green-700"
                          : "bg-blue-100 text-blue-700"
                          }`}
                      >
                        {task.status}
                      </span>
                    </div>
                  </div>
                ))}
                {(!member.tasks || member.tasks.length === 0) && (
                  <p className="text-center py-4 text-sm text-gray-400 italic">
                    No tasks recorded for this period.
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 bg-white flex justify-end gap-3 shrink-0">
          <button
            onClick={onClose}
            className="px-8 py-3 bg-gray-50 border border-gray-300 hover:bg-gray-100 text-black rounded-lg text-[10px] font-black uppercase tracking-[0.2em] transition-all"
          >
            Close
          </button>
          <button className="px-8 py-3 bg-[#6bbd45]/15 hover:bg-[#6bbd45]/30 text-black border border-black rounded-lg text-[10px] font-black uppercase tracking-[0.2em] shadow-sm transition-all flex items-center gap-2 active:scale-95">
            <Download size={18} />
            Export PDF
          </button>
        </div>
      </div>
    </div>
  );
};

export default DailyWorkReportModal;
