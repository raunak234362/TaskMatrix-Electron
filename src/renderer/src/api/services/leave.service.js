import api from '../api'

class LeaveService {
  static async GetMyLeaveBalances() {
    const response = await api.get('hr/me/balances')
    return response.data
  }

  static async GetMyLeaveRequests() {
    const response = await api.get('hr/me/requests')
    return response.data
  }

  static async GetLeaveRequests() {
    const response = await api.get('hr/requests')
    return response.data
  }

  static async GetTeamLeaveRequests(teamId) {
    const response = await api.get(`hr/teams/${encodeURIComponent(teamId)}/requests`)
    return response.data
  }

  static async GetTeamLeaveRequestsByManager(teamId, managerId) {
    const response = await api.get(`hr/teams/${encodeURIComponent(teamId)}/manager/${encodeURIComponent(managerId)}/requests`)
    return response.data
  }

  static async ApproveTeamLeaveRequest(teamId, requestId, decision = {}) {
    const response = await api.patch(`hr/teams/${encodeURIComponent(teamId)}/requests/${requestId}/approve`, decision)
    return response.data
  }

  static async RejectTeamLeaveRequest(teamId, requestId, decision = {}) {
    const response = await api.patch(`hr/teams/${encodeURIComponent(teamId)}/requests/${requestId}/reject`, decision)
    return response.data
  }

  static async LopTeamLeaveRequest(teamId, requestId, decision) {
    const response = await api.patch(`hr/teams/${encodeURIComponent(teamId)}/requests/${requestId}/lop`, decision)
    return response.data
  }

  static async GetLeavePolicies() {
    const response = await api.get('hr/policies')
    return response.data
  }

  static async CreateLeavePolicy(payload) {
    const response = await api.post(`hr/policies/${encodeURIComponent(payload.type)}`, {
      userType: payload.userType,
      annualAllowance: payload.annualAllowance,
      isProbation: payload.isProbation,
      employeeStage: payload.employeeStage,
    })
    return response.data
  }

  static async UpdateLeavePolicy(type, payload) {
    const response = await api.put(`hr/policies/${encodeURIComponent(type)}`, payload)
    return response.data
  }

  static async DeleteLeavePolicy(type, userType = 'ALL', employeeStage = 'Permanent employee') {
    const response = await api.delete(`hr/policies/${encodeURIComponent(type)}`, { params: { userType, employeeStage } })
    return response.data
  }

  static async ApplyForLeave(payload) {
    const response = await api.post('hr/requests', payload)
    return response.data
  }

  static async CancelLeaveRequest(requestId) {
    const response = await api.patch(`hr/requests/${requestId}/cancel`)
    return response.data
  }

  static async ApproveLeaveRequest(requestId, decision = {}) {
    const response = await api.patch(`hr/requests/${requestId}/approve`, decision)
    return response.data
  }

  static async RejectLeaveRequest(requestId, decision) {
    const response = await api.patch(`hr/requests/${requestId}/reject`, decision)
    return response.data
  }

  static async LopLeaveRequest(requestId, decision) {
    const response = await api.patch(`hr/requests/${requestId}/lop`, decision)
    return response.data
  }

  static async GetAttendanceCalendar(params) {
    const response = await api.get('hr/reports/attendance-calendar', { params })
    return response.data
  }

  static async GetLeaveReport(params) {
    const response = await api.get('hr/reports/leave', { params })
    return response.data
  }
}

export default LeaveService
