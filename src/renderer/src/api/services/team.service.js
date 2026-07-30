import { toast } from 'react-toastify'
import api from '../api'

class TeamService {
  //Add Department
  static async AddDepartment(departmentData) {
    try {
      const response = await api.post(`department`, departmentData, {
        headers: {
          'Content-Type': 'application/json'
        }
      })
      console.log(response)
      return response?.data
    } catch (error) {
      console.log('Error while adding New User', error)
    }
  }

  //All Departments
  static async AllDepartments() {
    try {
      const response = await api.get(`department`, {
        headers: {
          'Content-Type': 'application/json'
        }
      })
      console.log(response)
      return response.data
    } catch (error) {
      console.log('Error fetching all Employee', error)
    }
  }

  // Fetch Department by ID
  static async FetchDepartmentByID(id) {
    try {
      const response = await api.get(`department/department/${id}`, {
        headers: {
          'Content-Type': 'application/json'
        }
      })
      console.log(response)
      return response.data
    } catch (error) {
      console.log('Error fetching Employee by ID', error)
    }
  }

  //update department by ID
  static async UpdateDepartmentByID(id, data) {
    try {
      const response = await api.put(`department/update/${id}`, data, {
        headers: {
          'Content-Type': 'application/json'
        }
      })
      console.log(response)
      return response.data
    } catch (error) {
      console.log('Error fetching Employee by ID', error)
    }
  }

  // Add team
  static async AddTeam(teamDataPayload) {
    try {
      const response = await api.post(`team`, teamDataPayload, {
        headers: { 'Content-Type': 'application/json' }
      })
      console.log(response?.data)
      toast.success('Successfully added Team')
    } catch (error) {
      console.log('Error adding team', error)
    }
  }

  // Fetch All Team
  static async AllTeam() {
    try {
      const response = await api.get(`team`)
      console.log(response?.data)
      return response?.data
    } catch (error) {
      console.log('Error Fetching All Team', error)
    }
  }

  //Fetch team by Id
  static async GetTeamByID(id) {
    try {
      const response = await api.get(`team/${id}`)
      console.log(response?.data)
      return response?.data
    } catch (error) {
      console.log('Error Fetching All Team', error)
    }
  }

  // Add Team Members
  static async AddTeamMembers(role, data) {
    try {
      const response = await api.post(`team/addMembers/${role}`, data, {
        headers: {
          'Content-Type': 'application/json'
        }
      })
      console.log(response?.data)
      return response?.data
    } catch (error) {
      console.log(error)
    }
  }

  // Update role of Team Member
  static async UpdateTeamMemberRole(teamId, MemberData) {
    try {
      const response = await api.put(`team/updateRole/${teamId}`, MemberData, {
        headers: {
          'Content-Type': 'application/json'
        }
      })
      console.log(response?.data)
      return response?.data
    } catch (error) {
      console.log(error)
      console.log('Error while updating team member role', error)
    }
  }

  //delete team member
  static async DeleteTeamMember(data) {
    try {
      const response = await api.delete(`team/removeMembers`, {
        data: data,
        headers: {
          'Content-Type': 'application/json'
        }
      })
      toast.success('Successfully deleted team member')
      console.log(response?.data)
      return response?.data
    } catch (error) {
      console.log(error)
      console.log('Error while deleting team member', error)
      toast.error('Error while deleting team member')
    }
  }

  //delete team
  static async DeleteTeam(teamId) {
    try {
      const response = await api.delete(`team/${teamId}`, {
        headers: {
          'Content-Type': 'application/json'
        }
      })
      toast.success('Successfully deleted team')
      return response?.data
    } catch (error) {
      console.log(error)
      console.log('Error while deleting team', error)
      toast.error('Error while deleting team')
    }
  }

  //edit team
  static async EditTeam(teamId, teamData) {
    try {
      const response = await api.put(`team/${teamId}`, teamData, {
        headers: {
          'Content-Type': 'application/json'
        }
      })
      console.log(response?.data)
      return response?.data
    } catch (error) {
      console.log(error)
      console.log('Error while editing team', error)
    }
  }
}

export default TeamService
