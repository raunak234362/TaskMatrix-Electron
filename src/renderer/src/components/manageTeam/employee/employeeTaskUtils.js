export const secToHms = (seconds) => {
  if (!seconds || isNaN(seconds) || seconds === 0) return "0 hrs 00 mins";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return `${h} hrs ${String(m).padStart(2, "0")} mins`;
};

export const calcWorkedSec = (workingHourTask) => {
  if (!Array.isArray(workingHourTask) || workingHourTask.length === 0) return 0;
  return workingHourTask.reduce((sum, session) => sum + (Number(session.duration_seconds) || 0), 0);
};

export const allocToSec = (allocatedHours) => {
  const duration = String(allocatedHours ?? "").trim();
  let hours = parseFloat(duration);
  if (/^\d+:\d{1,2}$/.test(duration)) {
    const [wholeHours, minutes] = duration.split(":").map(Number);
    hours = wholeHours + minutes / 60;
  }
  return isNaN(hours) ? 0 : hours * 3600;
};

export const COMPLETION_LABEL = {
  RANGE_0_10: "0–10%",
  RANGE_11_25: "11–25%",
  RANGE_26_50: "26–50%",
  RANGE_51_75: "51–75%",
  RANGE_76_90: "76–90%",
  RANGE_91_100: "91–100%"
};

export const STATUS_META = {
  COMPLETED: { label: "Completed", color: "bg-green-100 text-green-700 border-green-200" },
  VALIDATE_COMPLETE: { label: "Validate Complete", color: "bg-teal-100 text-teal-700 border-teal-200" },
  IN_PROGRESS: { label: "In Progress", color: "bg-blue-100 text-blue-700 border-blue-200" },
  PAUSED: { label: "Paused", color: "bg-yellow-100 text-yellow-700 border-yellow-200" },
  PENDING: { label: "Pending", color: "bg-gray-100 text-gray-600 border-gray-200" },
  OVERRUN: { label: "Overrun", color: "bg-red-100 text-red-600 border-red-200" },
  REJECTED: { label: "Rejected", color: "bg-rose-100 text-rose-600 border-rose-200" },
  COMPLETE: { label: "Complete", color: "bg-green-100 text-green-700 border-green-200" }
};

export const statusMeta = (status) =>
  STATUS_META[status] || {
    label: status || "Unknown",
    color: "bg-gray-100 text-gray-500 border-gray-200"
  };
