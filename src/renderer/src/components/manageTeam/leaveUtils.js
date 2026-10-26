export const extractList = (response, keys) => {
  const candidates = [response, response?.data, response?.data?.data]
  for (const candidate of candidates) {
    if (Array.isArray(candidate)) return candidate
    for (const key of keys) {
      if (Array.isArray(candidate?.[key])) return candidate[key]
    }
  }
  return []
}

export const getLeaveType = (item) =>
  item?.leaveType || item?.type || item?.leave_type || item?.policy?.type || 'Leave'

export const getRequestId = (item) => item?.id ?? item?._id

export const getRequestStatus = (item) =>
  String(item?.status || 'PENDING')
    .replaceAll('_', ' ')
    .toUpperCase()

export const formatLeaveDate = (value) => {
  if (!value) return '—'
  const date = new Date(value)
  return Number.isNaN(date.getTime())
    ? String(value)
    : date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}

export const getEmployeeName = (request) => {
  const employee = request?.employee || request?.user || request?.requester
  const name = [employee?.firstName, employee?.lastName].filter(Boolean).join(' ')
  return name || employee?.name || employee?.username || request?.employeeName || 'Employee'
}
