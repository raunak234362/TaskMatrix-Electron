import React, { useState, useEffect, useMemo } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { toast } from 'react-toastify'
import { useSelector } from 'react-redux'
import {
  ClipboardList,
  CalendarDays,
  Flag,
  Users,
  Tag,
  RotateCcw,
  Save,
  ArrowLeft,
  UserCheck,
  CheckCircle2,
  AlertCircle
} from 'lucide-react'

import SelfTaskService from '../../../api/services/selftask.service'

const PRIORITY_OPTIONS = [
  { value: 1, label: 'Low', badge: 'bg-emerald-50 text-emerald-700 border-emerald-300' },
  { value: 2, label: 'Medium', badge: 'bg-blue-50 text-blue-700 border-blue-300' },
  { value: 3, label: 'High', badge: 'bg-amber-50 text-amber-700 border-amber-300' },
  { value: 4, label: 'Critical', badge: 'bg-rose-50 text-rose-700 border-rose-300' }
]

const QUICK_CATEGORIES = [
  'Training',
  'Task Assignment',
  'Meeting',
  'Report Update',
  'Operations',
  'Research',
  'Daily Server Check',
  'Hourly Basis Report',
  'Development',
  'Bug Fix',
  'Code Review',
  'Documentation',
  'Testing',
]

const normalizeAccessValue = (value) =>
  String(value || '').toLowerCase().trim().replace(/[\s-]+/g, '_')

const SELF_TASK_ROLES = [
  'admin',
  'dept_manager',
  'deputy_manager',
  'operation_executive',
  'project_manager_officer',
  'human_resource',
  'project_manager'
]

const SELF_TASK_DESIGNATIONS = [
  'software_developer',
  'software_developer_trainee',
  'system_admin',
  'hr_recruiter'
]

const canCreateSelfTask = (user) =>
  SELF_TASK_ROLES.includes(normalizeAccessValue(user?.role)) ||
  (normalizeAccessValue(user?.role) === 'staff' &&
    SELF_TASK_DESIGNATIONS.includes(normalizeAccessValue(user?.designation)))

const getUserTeam = (record) => {
  const membership = record?.teamMember?.[0] || record?.teamMembers?.[0]
  const team = record?.team || membership?.team || record?.managedTeam?.[0]
  const id = record?.teamId || team?.id || team?._id || membership?.teamId
  return id ? { id: String(id), name: team?.name || '' } : null
}

const AddSelfTask = ({ onCancel, onSuccess }) => {
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Redux state
  const userDetail = useSelector((state) => state.userInfo?.userDetail)
  const staffData = useSelector((state) => state.userInfo?.staffData || [])

  // Auto-fetch User ID from user details / session
  const currentUserId = useMemo(() => {
    return (
      userDetail?.id ||
      userDetail?._id ||
      sessionStorage.getItem('userId') ||
      ''
    )
  }, [userDetail])

  const currentUserRoleValue = normalizeAccessValue(
    userDetail?.role || sessionStorage.getItem('userRole')
  )
  const canAssignToOtherUser = [
    'admin',
    'deputy_manager',
    'operation_executive'
  ].includes(currentUserRoleValue)
  const eligibleAssignees = useMemo(
    () =>
      staffData
        .filter((staff) => {
          const id = staff?.id ?? staff?._id ?? staff?.userId ?? staff?.user_id
          return (
            id != null &&
            String(id) !== String(currentUserId) &&
            canCreateSelfTask(staff)
          )
        })
        .sort((a, b) =>
          `${a.firstName || ''} ${a.lastName || ''}`.localeCompare(
            `${b.firstName || ''} ${b.lastName || ''}`
          )
        ),
    [staffData, currentUserId]
  )

  // Current user display name
  const currentUserName = useMemo(() => {
    if (userDetail?.firstName || userDetail?.lastName) {
      return `${userDetail.firstName || ''} ${userDetail.lastName || ''}`.trim()
    }
    return (
      sessionStorage.getItem('firstName') ||
      sessionStorage.getItem('username') ||
      'Current User'
    )
  }, [userDetail])

  // Current user role
  const currentUserRole = useMemo(() => {
    return (
      userDetail?.role ||
      userDetail?.designation ||
      sessionStorage.getItem('designation') ||
      sessionStorage.getItem('userRole') ||
      'Staff'
    )
  }, [userDetail])

  // Find matched staff record if available for department fallback
  const matchedStaff = useMemo(() => {
    if (!currentUserId && !sessionStorage.getItem('username')) return null
    return staffData.find(
      (s) =>
        (currentUserId &&
          (String(s.id) === String(currentUserId) ||
            String(s._id) === String(currentUserId))) ||
        (s.username &&
          String(s.username).toUpperCase() ===
            String(sessionStorage.getItem('username') || '').toUpperCase())
    )
  }, [staffData, currentUserId])

  const resolvedTeam = useMemo(
    () => getUserTeam(userDetail) || getUserTeam(matchedStaff),
    [userDetail, matchedStaff]
  )

  // Today's date in YYYY-MM-DD
  const todayDate = useMemo(() => new Date().toISOString().split('T')[0], [])

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    control,
    formState: { errors }
  } = useForm({
    defaultValues: {
      name: '',
      description: '',
      priority: 2,
      start_date: todayDate,
      teamId: canAssignToOtherUser ? '' : resolvedTeam?.id || '',
      categoryTag: '',
      user_id: canAssignToOtherUser ? '' : currentUserId
    }
  })

  const watchedPriority = watch('priority')
  const watchedCategoryTag = watch('categoryTag')
  const selectedUserId = watch('user_id')
  const selectedAssignee = eligibleAssignees.find((staff) =>
    [staff.id, staff._id, staff.userId, staff.user_id]
      .filter(Boolean)
      .some((id) => String(id) === String(selectedUserId))
  )
  const assignedUserName = selectedAssignee
    ? `${selectedAssignee.firstName || ''} ${selectedAssignee.lastName || ''}`.trim() ||
      selectedAssignee.username ||
      'Selected User'
    : currentUserName
  const assignedTeam = useMemo(
    () =>
      canAssignToOtherUser
        ? selectedAssignee
          ? getUserTeam(selectedAssignee)
          : null
        : resolvedTeam,
    [canAssignToOtherUser, selectedAssignee, resolvedTeam]
  )

  // Keep form values in sync with fetched user details
  useEffect(() => {
    setValue('teamId', assignedTeam?.id || '')
    if (currentUserId && !canAssignToOtherUser) {
      setValue('user_id', currentUserId)
    }
    if (!watch('start_date')) {
      setValue('start_date', todayDate)
    }
  }, [assignedTeam, currentUserId, canAssignToOtherUser, todayDate, setValue])

  const handleQuickCategory = (cat) => {
    setValue('categoryTag', cat, { shouldValidate: true })
  }

  const onSubmit = async (data) => {
    try {
      setIsSubmitting(true)

      const finalUserId = canAssignToOtherUser
        ? data.user_id
        : currentUserId || sessionStorage.getItem('userId') || ''
      if (!finalUserId) {
        throw new Error(
          canAssignToOtherUser
            ? 'Select an eligible user for this task.'
            : 'Could not determine the task owner.'
        )
      }
      const finalTeamId = canAssignToOtherUser
        ? assignedTeam?.id || ''
        : data.teamId || resolvedTeam?.id || ''
      const finalPriority = Number(data.priority) || 2
      const finalStartDate = data.start_date || todayDate

      const payload = {
        name: data.name.trim(),
        description: data.description?.trim() || '',
        status: 'ASSIGNED',
        priority: finalPriority,
        start_date: finalStartDate,
        categoryTag: data.categoryTag.trim(),
        user_id: String(finalUserId).trim()
      }
      if (String(finalTeamId).trim()) {
        payload.teamId = String(finalTeamId).trim()
      }

      console.log('Sending Self-Task Payload:', payload)

      const response = await SelfTaskService.addSelfTask(payload)

      if (
        !response ||
        response.success === false ||
        response.status === false ||
        response.status === 'error' ||
        response.error
      ) {
        throw new Error(response?.message || 'Failed to create self task.')
      }

      toast.success('Self task created successfully!')

      // Reset form with defaults
      reset({
        name: '',
        description: '',
        priority: 2,
        start_date: todayDate,
        teamId: canAssignToOtherUser ? '' : resolvedTeam?.id || '',
        categoryTag: '',
        user_id: canAssignToOtherUser ? '' : currentUserId
      })

      if (onSuccess) {
        onSuccess(response)
      }
    } catch (error) {
      console.error('Error creating self task:', error)
      toast.error(
        error?.response?.data?.message ||
          error?.message ||
          'Failed to create self task. Please try again.'
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  const inputBaseClass =
    'w-full px-3.5 py-2.5 bg-white border border-gray-300 rounded-lg text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-600 transition'
  const labelClass = 'block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5'
  const errorClass = 'text-xs text-red-500 font-medium mt-1 flex items-center gap-1'

  return (
    <div className="w-full mx-auto py-2 px-1">
      <div className="bg-white border border-gray-200 rounded-xl shadow-xs overflow-hidden">
        {/* Form Header */}
        

        {/* User Details & Team Context Banner */}
        <div className="px-6 py-3 bg-gray-50/80 border-b border-gray-200 text-xs flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-1.5 text-gray-700">
              <UserCheck className="w-4 h-4 text-green-600" />
              <span className="font-bold text-gray-500 uppercase tracking-wider text-[11px]">
                Assigned To:
              </span>
              <span className="font-semibold text-gray-900 bg-white px-2 py-0.5 rounded-md border border-gray-200">
                {assignedUserName} ({selectedAssignee?.role || currentUserRole})
              </span>
            </div>

            <div className="flex items-center gap-1.5 text-gray-700">
              <Users className="w-4 h-4 text-blue-600" />
              <span className="font-bold text-gray-500 uppercase tracking-wider text-[11px]">
                Team:
              </span>
              <span className="font-semibold text-gray-900 bg-white px-2 py-0.5 rounded-md border border-gray-200">
                {assignedTeam?.name || 'No team assigned'}
              </span>
            </div>
          </div>

          <div className="text-[11px] text-gray-500 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
            {canAssignToOtherUser ? 'Assigned to selected eligible user' : 'Auto-linked to your profile'}
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
          {canAssignToOtherUser ? (
            <div>
              <label className={labelClass}>
                Assign To <span className="text-red-500">*</span>
              </label>
              <select
                className={inputBaseClass}
                {...register('user_id', {
                  required: 'Select an eligible user'
                })}
              >
                <option value="">Select an eligible user...</option>
                {eligibleAssignees.map((staff) => {
                  const id = staff.id ?? staff._id ?? staff.userId ?? staff.user_id
                  const name =
                    `${staff.firstName || ''} ${staff.lastName || ''}`.trim() ||
                    staff.username ||
                    'Unnamed User'
                  return (
                    <option key={id} value={id}>
                      {name} ({staff.role || staff.designation})
                    </option>
                  )
                })}
              </select>
              {errors.user_id && (
                <p className={errorClass}>
                  <AlertCircle className="w-3.5 h-3.5" />
                  {errors.user_id.message}
                </p>
              )}
            </div>
          ) : (
            <input type="hidden" {...register('user_id')} />
          )}

          {/* Task Name */}
          <div>
            <label className={labelClass}>
              Task Name <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="e.g. Prepare architectural shop drawings for Phase 1..."
                className={inputBaseClass}
                {...register('name', {
                  required: 'Task name is required',
                  validate: (v) => v.trim().length > 0 || 'Task name cannot be empty'
                })}
              />
            </div>
            {errors.name && (
              <p className={errorClass}>
                <AlertCircle className="w-3.5 h-3.5" />
                {errors.name.message}
              </p>
            )}
          </div>

          {/* Description */}
          <div>
            <label className={labelClass}>
              Task Description
            </label>
            <textarea
              rows={4}
              placeholder="Provide complete details, scope, instructions, or deliverables for this task..."
              className={`${inputBaseClass} resize-y min-h-[100px]`}
              {...register('description')}
            />
          </div>

          {/* Two-Column Grid: Category & Priority */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Category Tag */}
            <div>
              <label className={labelClass}>
                <span className="inline-flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-green-600" />
                  Category Tag <span className="text-red-500">*</span>
                </span>
              </label>
              <input
                type="text"
                placeholder="e.g. Development, Code Review, Design..."
                className={inputBaseClass}
                {...register('categoryTag', {
                  required: 'Category is required',
                  validate: (v) => v.trim().length > 0 || 'Category cannot be empty'
                })}
              />
              {errors.categoryTag && (
                <p className={errorClass}>
                  <AlertCircle className="w-3.5 h-3.5" />
                  {errors.categoryTag.message}
                </p>
              )}

              {/* Quick Suggestion Chips */}
              <div className="mt-2 flex flex-wrap items-center gap-1.5">
                <span className="text-[11px] text-gray-400 font-medium">Suggestions:</span>
                {QUICK_CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => handleQuickCategory(cat)}
                    className={`px-2 py-0.5 text-[11px] rounded-md border transition cursor-pointer ${
                      watchedCategoryTag === cat
                        ? 'bg-green-100 text-green-800 border-green-300 font-semibold'
                        : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Priority */}
            <div>
              <label className={labelClass}>
                <span className="inline-flex items-center gap-1.5">
                  <Flag className="w-3.5 h-3.5 text-green-600" />
                  Priority <span className="text-red-500">*</span>
                </span>
              </label>

              <Controller
                name="priority"
                control={control}
                rules={{ required: 'Priority is required' }}
                render={({ field }) => (
                  <div className="grid grid-cols-4 gap-2">
                    {PRIORITY_OPTIONS.map((opt) => {
                      const isSelected = Number(field.value) === opt.value
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => field.onChange(opt.value)}
                          className={`py-2 px-2 rounded-lg border text-xs font-bold uppercase transition flex flex-col items-center justify-center gap-1 cursor-pointer ${
                            isSelected
                              ? `${opt.badge} shadow-xs ring-2 ring-green-600/30`
                              : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                          }`}
                        >
                          <Flag
                            className={`w-3.5 h-3.5 ${
                              opt.value === 1
                                ? 'text-emerald-600'
                                : opt.value === 2
                                  ? 'text-blue-600'
                                  : opt.value === 3
                                    ? 'text-amber-600'
                                    : 'text-rose-600'
                            }`}
                          />
                          <span>{opt.label}</span>
                        </button>
                      )
                    })}
                  </div>
                )}
              />
              <p className="text-[11px] text-gray-400 mt-1.5">
                Standard priority scale (Low: 1, Medium: 2, High: 3, Critical: 4)
              </p>
            </div>
          </div>

          {/* Start Date */}
          <div className="grid grid-cols-1 gap-5">
            {/* Start Date */}
            <div>
              <label className={labelClass}>
                <span className="inline-flex items-center gap-1.5">
                  <CalendarDays className="w-3.5 h-3.5 text-green-600" />
                  Start Date <span className="text-red-500">*</span>
                </span>
              </label>
              <input
                type="date"
                min={todayDate}
                className={inputBaseClass}
                {...register('start_date', {
                  required: 'Start date is required'
                })}
              />
              {errors.start_date && (
                <p className={errorClass}>
                  <AlertCircle className="w-3.5 h-3.5" />
                  {errors.start_date.message}
                </p>
              )}
            </div>

          </div>

          {/* Actions Bar */}
          <div className="pt-4 border-t border-gray-200 flex flex-wrap items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => {
                reset({
                  name: '',
                  description: '',
                  priority: 2,
                  start_date: todayDate,
                  teamId: resolvedTeam?.id || '',
                  categoryTag: '',
                  user_id: currentUserId
                })
              }}
              disabled={isSubmitting}
              className="px-4 py-2 border border-gray-300 rounded-lg text-xs font-bold uppercase tracking-wider text-gray-700 bg-white hover:bg-gray-50 transition flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs font-bold uppercase tracking-wider shadow-sm transition flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Creating Task...
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" />
                  Create Self Task
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default AddSelfTask
