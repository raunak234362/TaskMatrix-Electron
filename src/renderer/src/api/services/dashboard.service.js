import api from '../api'

class DashboardService {
  // Dashboard Data
  static async GetDashboardData() {
    try {
      const response = await api.get(`dashBoardData/`)
      console.log('Dashboard data fetched:', response.data)
      return response.data
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
      throw error
    }
  }

  // Dashboard Number for Pending Approval(Submittals, RFI, CO)
  static async GetDashboardNumber() {
    try {
      const response = await api.get(`dashBoardData/unapproved-lists`)
      console.log('Dashboard data fetched:', response.data)
      return response.data
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
      throw error
    }
  }

  // pm dashboard
  static async GetPMDashboard() {
    try {
      const response = await api.get('dashBoardData/projectManager', {
        headers: {
          'Content-Type': 'application/json'
        }
      })
      console.log('PM dashboard fetched:', response.data)
      return response.data
    } catch (error) {
      console.error('Error fetching PM dashboard:', error)
      throw error
    }
  }

  // dashboard route :
  static async getOperationExecutiveDashboard() {
    try {
      const response = await api.get(`dashboardData/operationExecutive`)
      return response.data
    } catch (error) {
      console.error('Error fetching operation executive dashboard:', error)
      throw error
    }
  }

  // dashboard route for client estimator
  static async GetClientEstimatorDashboardData() {
    try {
      const response = await api.get(`dashBoardData/clientEstimator`)
      return response.data
    } catch (error) {
      console.error('Error fetching client estimator dashboard:', error)
      throw error
    }
  }

  // sales dashboard
  static async SalesDashboard() {
    try {
      const response = await api.get(`dashBoardData/sales`)
      return response.data
    } catch (error) {
      console.error('Error fetching sales dashboard:', error)
      throw error
    }
  }

  // dashboard data Project Manager
  static async DashboardDataProjectManager(id) {
    try {
      const response = await api.get(`dashBoardData/departmentManager`, {
        headers: {
          'Content-Type': 'application/json'
        }
      })
      console.log('🚀 API Response: Department Manager Dashboard Data', response.data)
      return response.data
    } catch (error) {
      console.log(error)
    }
  }

  // Get Admin analytics for manager dashboard
  static async GetAdminAnalyticsForManagerDashboard(data) {
    try {
      const response = await api.post(`analytics/scores/admin/analytics/manager/dashboard`, data)
      return response.data
    } catch (error) {
      console.error('Error fetching admin analytics for manager dashboard:', error)
      throw error
    }
  }

  // Get Admin MEAS analytics trendline
  static async GetAdminMEASAnalyticsTrendline(data) {
    try {
      const response = await api.post(`analytics/scores/admin/analytics/meas/trendline`, data)
      return response.data
    } catch (error) {
      console.error('Error fetching admin meas analytics trendline:', error)
      throw error
    }
  }

  // Get Employee EPS
  static async GetEmployeeEPS(data) {
    try {
      const response = await api.post(`analytics/scores/admin/analytics/employee/eps`, data)
      return response.data
    } catch (error) {
      console.error('Error fetching employee EPS:', error)
      throw error
    }
  }

  // Get Manager Bias
  static async GetManagerBias(data) {
    try {
      const response = await api.post(`analytics/scores/manager/bias`, data)
      return response.data
    } catch (error) {
      console.error('Error fetching manager bias:', error)
      throw error
    }
  }

  // Run Meas Manually
  static async RunMeasManually(data) {
    try {
      const response = await api.post(`analytics/scores/meas/run-manually`, data)
      return response.data
    } catch (error) {
      console.error('Error running meas manually:', error)
      throw error
    }
  }

  // Run Meas Monthly
  static async RunMeasMonthly(data) {
    try {
      const response = await api.post(`analytics/scores/meas/run-monthly`, data)
      return response.data
    } catch (error) {
      console.error('Error running meas monthly:', error)
      throw error
    }
  }
}

export default DashboardService
