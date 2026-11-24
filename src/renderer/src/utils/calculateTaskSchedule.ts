/**
 * Task Schedule Tracking and Progress Calculation Module
 *
 * Implements exact business rules:
 * - Dates normalized to UTC start-of-day.
 * - Total Planned Days: max(1, differenceInDays(approvalDate, createdAt))
 * - Elapsed Days: max(0, differenceInDays(currentDate, createdAt))
 * - plusDays: if !isSubmitted && currentDate > approvalDate, differenceInDays(currentDate, approvalDate), else 0
 * - taskPercent:
 *    1. if isSubmitted === true: 100
 *    2. if !isSubmitted && currentDate > approvalDate: 80 (20% reserved for final submission)
 *    3. if !isSubmitted && currentDate <= approvalDate: min(80, round((elapsedDays / totalPlannedDays) * 80))
 */

export type DateInput = string | number | Date;

export interface TaskScheduleInput {
  createdAt: DateInput;
  approvalDate: DateInput;
  isSubmitted: boolean;
  currentDate?: DateInput;
}

export interface TaskScheduleResult {
  totalDays: number;
  elapsedDays: number;
  plusDays: number;
  scheduleLabel: string;
  taskPercent: number;
  isOverdue: boolean;
}

const MS_PER_DAY = 86_400_000; // 24 * 60 * 60 * 1000

/**
 * Normalizes any Date, Timestamp, or ISO string to UTC start-of-day timestamp in milliseconds.
 * Prevents partial hours/time zones from skewing day calculations.
 */
export function normalizeToUtcStartOfDay(input: DateInput): number {
  if (input === null || input === undefined || input === '') {
    throw new TypeError(`Invalid date input: value is empty (${String(input)})`);
  }
  const date = new Date(input);
  if (isNaN(date.getTime())) {
    throw new TypeError(`Invalid date input: cannot parse "${String(input)}"`);
  }
  return Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
}

/**
 * Pure calculation function for task schedule and progress.
 */
export function calculateTaskSchedule({
  createdAt,
  approvalDate,
  isSubmitted,
  currentDate = new Date(),
}: TaskScheduleInput): TaskScheduleResult {
  const createdUtc = normalizeToUtcStartOfDay(createdAt);
  const approvalUtc = normalizeToUtcStartOfDay(approvalDate);
  const currentUtc = normalizeToUtcStartOfDay(currentDate);

  // 1. Total Planned Days: max(1, differenceInDays(approvalDate, createdAt))
  const rawPlannedDays = Math.floor((approvalUtc - createdUtc) / MS_PER_DAY);
  const totalDays = Math.max(1, rawPlannedDays);

  // 2. Elapsed Days: max(0, differenceInDays(currentDate, createdAt))
  const rawElapsedDays = Math.floor((currentUtc - createdUtc) / MS_PER_DAY);
  const elapsedDays = Math.max(0, rawElapsedDays);

  // 3. Overdue check & Schedule / Plus Days:
  // If isSubmitted is false AND currentDate > approvalDate
  const isOverdue = !isSubmitted && currentUtc > approvalUtc;
  const plusDays = isOverdue
    ? Math.max(1, Math.floor((currentUtc - approvalUtc) / MS_PER_DAY))
    : 0;

  // Schedule display label
  let scheduleLabel: string;
  if (isSubmitted) {
    scheduleLabel = 'Completed';
  } else if (isOverdue) {
    scheduleLabel = `+${plusDays} days`;
  } else {
    scheduleLabel = 'On Schedule';
  }

  // 4. Task Completion Percentage (taskPercent):
  let taskPercent: number;

  if (isSubmitted) {
    // Rule 1: If submitted, immediately 100%
    taskPercent = 100;
  } else if (isOverdue) {
    // Rule 2: If past due and unsubmitted, cap at 80% (20% reserved for final submission)
    taskPercent = 80;
  } else if (currentUtc < createdUtc) {
    // Edge case: currentDate < createdAt (future creation date) -> clamp to 0
    taskPercent = 0;
  } else {
    // Rule 3: Scale linearly from 0 to 80 based on elapsed time
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
