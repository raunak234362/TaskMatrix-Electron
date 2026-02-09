import React from "react";
import { X, FileText, Download, User } from "lucide-react";
import Button from "../../../fields/Button";


const DailyWorkReportModal = ({
  isOpen,
  onClose,
  members,
}) => {
  if (!isOpen) return null;

  const formatWorkedHours = (workingHourTask) => {
    const totalMinutes = (workingHourTask || []).reduce(
      (sum, entry) => sum + (entry.duration || 0),
      0
    );
    const hrs = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;
    return `${hrs.toString().padStart(2, "0")}:${mins
      .toString()
      .padStart(2, "0")}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white w-fit max-w-[80%] max-h-[90vh] rounded-3xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
          <div>
            <h2 className="text-xl  text-gray-700 flex items-center gap-2">
              <FileText className="text-green-600" size={24} />
              Daily Work Report
            </h2>
            <p className="text-sm text-gray-700">
              Summary of activities for the selected period
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-200 rounded-full transition-colors"
          >
            <X size={20} className="text-gray-700" />
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
        <div className="p-6 border-t border-gray-100 bg-gray-50/50 flex justify-end gap-3">
          <Button
            onClick={onClose}
            className="bg-white border border-gray-200 text-gray-700 hover:bg-gray-50"
          >
            Close
          </Button>
          <Button className="bg-green-600 text-white hover:bg-green-700 flex items-center gap-2">
            <Download size={18} />
            Export PDF
          </Button>
        </div>
      </div>
    </div>
  );
};

export default DailyWorkReportModal;
