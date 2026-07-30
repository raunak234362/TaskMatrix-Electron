import api from '../api'

const token = sessionStorage.getItem('token')

class EmployeeService {
  //Get Logged-In User Detail
  static async GetUserByToken() {
    try {
      const response = await api.get(`user/me`, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
      })
      console.log('Signed In User detail-', response)
      return response.data
    } catch (error) {
      console.log('Error while fetching logged-in user Detail', error)
    }
  }

  //Add New Employee
  static async AddEmployee(employeeData) {
    try {
      const response = await api.post(`employee`, employeeData, {
        headers: {
          'Content-Type': 'application/json'
        }
      })
      console.log(response)
      return response?.data
    } catch (error) {
      console.log('Error while adding New User', error)
      throw error
    }
  }

  // fetch all the users-
  static async FetchAllUsers() {
    try {
      const response = await api.get(`user/getAllUsers`, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
      })
      console.log(response)
      return response.data
    } catch (error) {
      console.log('Error fetching all users', error)
    }
  }

  //Fetch All Employee
  static async FetchAllEmployee() {
    try {
      const response = await api.get(`employee`, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
      })
      console.log(response)
      return response.data
    } catch (error) {
      console.log('Error fetching all Employee', error)
    }
  }

  //Fetch Employee by ROLE
  static async FetchEmployeeByRole(role) {
    try {
      const response = await api.get(`employee/role/${role}`, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
      })
      console.log(response)
      return response.data
    } catch (error) {
      console.log('Error fetching all Employee', error)
    }
  }

  //
  static async FetchManagementUser() {
    try {
      const response = await api.get(`user/management-users`, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
      })
      console.log(response)
      return response.data
    } catch (error) {
      console.log('Error fetching management user', error)
    }
  }

  // Fetch Employee by ID
  static async FetchEmployeeByID(id) {
    try {
      const response = await api.get(`employee/${id}`, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
      })
      console.log(response)
      return response.data
    } catch (error) {
      console.log('Error fetching Employee by ID', error)
    }
  }

  //Edit Employee By ID
  static async EditEmployeeByID(id, data) {
    try {
      const response = await api.put(`employee/update/${id}`, data, {
        headers: {
          'Content-Type': 'application/json'
        }
      })
      console.log(response)
      return response.data
    } catch (error) {
      console.log('Error updating Employee by ID', error)
      throw error
    }
  }

  //delete employee by id
  static async DeleteEmployeeByID(id, data = {}) {
    try {
      const response = await api.delete(`employee/id/${id}`, {
        data: data,
        headers: {
          'Content-Type': 'application/json'
        }
      })
      console.log(response)
      return response.data
    } catch (error) {
      console.log('Error deleting Employee by ID', error)
      throw error
    }
  }

  // Get User Stats
  static async getUsersStats(userId) {
    try {
      const response = await api.get(`task/user/stats/${userId}`)
      return response.data
    } catch (error) {
      console.error(`Error fetching stats for user ${userId}:`, error)
      throw error
    }
  }
}

export default EmployeeService
