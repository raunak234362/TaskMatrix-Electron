import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import { CheckCircle2, Clock, AlertTriangle, Calendar } from 'lucide-react';
import { calculateTaskSchedule } from '../../utils/calculateTaskSchedule';

/**
 * TaskScheduleProgress
 *
 * Renders a clean progress bar + schedule pill badge based on task schedule rules:
 * - 0% to 80% scaled by elapsed time vs planned duration.
 * - Capped at 80% if overdue and unsubmitted (amber/red highlight).
 * - 100% when submitted (green highlight).
 */
export const TaskScheduleProgress = ({
  createdAt,
  approvalDate,
  isSubmitted,
  status,
  currentDate,
  title,
  showDetails = true,
  className = '',
}) => {
  // Support both boolean isSubmitted and status string ("Completed", "Submitted")
  const submittedBool = useMemo(() => {
    if (typeof isSubmitted === 'boolean') return isSubmitted;
    if (typeof status === 'string') {
      const s = status.trim().toUpperCase();
      return s === 'COMPLETED' || s === 'SUBMITTED' || s === 'APPROVED';
    }
    return false;
  }, [isSubmitted, status]);

  const schedule = useMemo(() => {
    try {
      return calculateTaskSchedule({
        createdAt,
        approvalDate,
        isSubmitted: submittedBool,
        currentDate,
      });
    } catch (err) {
      console.error('[TaskScheduleProgress] Calculation error:', err);
      return {
        totalDays: 1,
        elapsedDays: 0,
        plusDays: 0,
        scheduleLabel: 'N/A',
        taskPercent: 0,
        isOverdue: false,
      };
    }
  }, [createdAt, approvalDate, submittedBool, currentDate]);

  const { totalDays, elapsedDays, plusDays, scheduleLabel, taskPercent, isOverdue } = schedule;

  // Determine styling based on schedule status
  const badgeConfig = useMemo(() => {
    if (submittedBool) {
      return {
        pillClass: 'bg-emerald-50 text-emerald-700 border-emerald-300',
        barClass: 'bg-emerald-600',
        textClass: 'text-emerald-700',
        icon: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />,
        caption: 'Submission complete',
      };
    }
    if (isOverdue) {
      return {
        pillClass: 'bg-rose-50 text-rose-700 border-rose-300 animate-pulse',
        barClass: 'bg-gradient-to-r from-amber-500 to-rose-500',
        textClass: 'text-rose-700',
        icon: <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />,
        caption: 'Overdue · Capped at 80% (20% for submission)',
      };
    }
    return {
      pillClass: 'bg-blue-50 text-blue-700 border-blue-200',
      barClass: 'bg-blue-600',
      textClass: 'text-blue-700',
      icon: <Clock className="w-3.5 h-3.5 text-blue-600" />,
      caption: 'In progress · Up to 80% until submitted',
    };
  }, [submittedBool, isOverdue]);

  return (
    <div className={`flex flex-col gap-2 p-3 bg-white rounded-xl border border-gray-100 shadow-sm ${className}`}>
      {/* Header Row: Title & Schedule Badge */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          {title && (
            <span className="text-xs font-bold text-gray-800 tracking-tight">
              {title}
            </span>
          )}
          {/* Schedule Pill Badge */}
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border shadow-xs transition-all ${badgeConfig.pillClass}`}
          >
            {badgeConfig.icon}
            <span>{scheduleLabel}</span>
          </span>
        </div>

        {/* Percentage Number */}
        <div className="flex items-baseline gap-1">
          <span className={`text-base font-black ${badgeConfig.textClass}`}>
            {taskPercent}%
          </span>
          {!submittedBool && (
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
              / 80% Max
            </span>
          )}
        </div>
      </div>

      {/* Progress Bar Container */}
      <div className="relative w-full bg-gray-100 rounded-full h-2.5 overflow-hidden border border-gray-200">
        {/* 80% Submission Gate Marker Line */}
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-gray-400/50 z-10"
          style={{ left: '80%' }}
          title="80% Submittal Gate: 20% reserved for final submission"
        />

        {/* Active Fill Bar */}
        <div
          className={`h-full rounded-full transition-all duration-500 ease-out ${badgeConfig.barClass}`}
          style={{ width: `${Math.min(100, Math.max(0, taskPercent))}%` }}
        />
      </div>

      {/* Footer Details */}
      {showDetails && (
        <div className="flex items-center justify-between text-[11px] text-gray-500 font-medium pt-0.5">
          <span className="flex items-center gap-1 truncate max-w-[65%]">
            <Calendar className="w-3 h-3 text-gray-400 shrink-0" />
            <span>
              {submittedBool
                ? 'Completed'
                : `Day ${Math.min(elapsedDays, totalDays)} of ${totalDays} planned`}
              {isOverdue && ` (${plusDays}d overdue)`}
            </span>
          </span>

          <span className="text-right text-[10px] text-gray-400 font-semibold truncate">
            {badgeConfig.caption}
          </span>
        </div>
      )}
    </div>
  );
};

TaskScheduleProgress.propTypes = {
  createdAt: PropTypes.oneOfType([PropTypes.string, PropTypes.number, PropTypes.instanceOf(Date)]).isRequired,
  approvalDate: PropTypes.oneOfType([PropTypes.string, PropTypes.number, PropTypes.instanceOf(Date)]).isRequired,
  isSubmitted: PropTypes.bool,
  status: PropTypes.string,
  currentDate: PropTypes.oneOfType([PropTypes.string, PropTypes.number, PropTypes.instanceOf(Date)]),
  title: PropTypes.string,
  showDetails: PropTypes.bool,
  className: PropTypes.string,
};

export default TaskScheduleProgress;
