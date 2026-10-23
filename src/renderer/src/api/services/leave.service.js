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

  static async GetLeavePolicies() {
    const response = await api.get('hr/policies')
    return response.data
  }

  static async CreateLeavePolicy(payload) {
    const response = await api.post(`hr/policies/${encodeURIComponent(payload.type)}`, {
      userType: payload.userType,
      annualAllowance: payload.annualAllowance,
      isProbation: payload.isProbation,
    })
    return response.data
  }

  static async UpdateLeavePolicy(type, payload) {
    const response = await api.put(`hr/policies/${encodeURIComponent(type)}`, payload)
    return response.data
  }

  static async DeleteLeavePolicy(type, userType = 'ALL', isProbation = false) {
    const response = await api.delete(`hr/policies/${encodeURIComponent(type)}`, { params: { userType, isProbation } })
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

  static async ApproveLeaveRequest(requestId) {
    const response = await api.patch(`hr/requests/${requestId}/approve`)
    return response.data
  }

  static async RejectLeaveRequest(requestId) {
    const response = await api.patch(`hr/requests/${requestId}/reject`)
    return response.data
  }

  static async GetLeaveReport(params) {
    const response = await api.get('hr/reports/leave', { params })
    return response.data
  }
}

export default LeaveService
