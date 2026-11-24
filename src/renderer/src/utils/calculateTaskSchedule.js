/**
 * Task Schedule Tracking and Progress Calculation Module (JavaScript version)
 */

const MS_PER_DAY = 86_400_000;

export function normalizeToUtcStartOfDay(input) {
  if (input === null || input === undefined || input === '') {
    throw new TypeError(`Invalid date input: value is empty (${String(input)})`);
  }
  const date = new Date(input);
  if (isNaN(date.getTime())) {
    throw new TypeError(`Invalid date input: cannot parse "${String(input)}"`);
  }
  return Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
}

export function calculateTaskSchedule({
  createdAt,
  approvalDate,
  isSubmitted,
  currentDate = new Date(),
}) {
  const createdUtc = normalizeToUtcStartOfDay(createdAt);
  const approvalUtc = normalizeToUtcStartOfDay(approvalDate);
  const currentUtc = normalizeToUtcStartOfDay(currentDate);

  const rawPlannedDays = Math.floor((approvalUtc - createdUtc) / MS_PER_DAY);
  const totalDays = Math.max(1, rawPlannedDays);

  const rawElapsedDays = Math.floor((currentUtc - createdUtc) / MS_PER_DAY);
  const elapsedDays = Math.max(0, rawElapsedDays);

  const isOverdue = !isSubmitted && currentUtc > approvalUtc;
  const plusDays = isOverdue
    ? Math.max(1, Math.floor((currentUtc - approvalUtc) / MS_PER_DAY))
    : 0;

  let scheduleLabel;
  if (isSubmitted) {
    scheduleLabel = 'Completed';
  } else if (isOverdue) {
    scheduleLabel = `+${plusDays} days`;
  } else {
    scheduleLabel = 'On Schedule';
  }

  let taskPercent;
  if (isSubmitted) {
    taskPercent = 100;
  } else if (isOverdue) {
    taskPercent = 80;
  } else if (currentUtc < createdUtc) {
    taskPercent = 0;
  } else {
    const ratio = elapsedDays / totalDays;
    taskPercent = Math.max(0, Math.min(80, Math.round(ratio * 80)));
  }

  return {
    totalDays,
    elapsedDays,
    plusDays,
    scheduleLabel,
    taskPercent,
    isOverdue,
  };
}

export default calculateTaskSchedule;
