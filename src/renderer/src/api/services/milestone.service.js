import api from '../api'

class MilestoneService {
  // Add Project Milestone
  static async AddProjectMilestone(data) {
    try {
      const response = await api.post(`mileStone/`, data, {
        headers: {
          'Content-Type': 'application/json'
        }
      })
      console.log(response)
      return response.data
    } catch (error) {
      console.log(error)
    }
  }

  // Get Project Milestone By ID
  static async GetProjectMilestoneById(id) {
    try {
      const response = await api.get(`mileStone/project/${id}`, {
        headers: {
          'Content-Type': 'application/json'
        }
      })
      console.log(response)
      return response.data
    } catch (error) {
      console.log(error)
    }
  }

  // Get mileston by ID
  static async GetMilestoneById(id) {
    try {
      const response = await api.get(`mileStone/${id}`, {
        headers: {
          'Content-Type': 'application/json'
        }
      })
      console.log(response)
      return response.data
    } catch (error) {
      console.log(error)
    }
  }

  // update exsting milestone y Id
  static async EditExistingMilestoneByID(id, data) {
    try {
      const response = await api.put(`mileStone/existing/${id}`, data, {
        headers: {
          'Content-Type': 'application/json'
        }
      })
      console.log(response)
      return response.data
    } catch (error) {
      console.log(error)
    }
  }

  // edit milestone by ID
  static async EditMilestoneById(id, data) {
    try {
      const response = await api.put(`mileStone/${id}`, data, {
        headers: {
          'Content-Type': 'application/json'
        }
      })
      console.log(response)
      return response.data
    } catch (error) {
      console.log(error)
    }
  }

  // Update the completion percent by milestone id
  static async UpdateCompletionPercentById(id, data) {
    try {
      const response = await api.put(`mileStone/completion/${id}`, data, {
        headers: {
          'Content-Type': 'application/json'
        }
      })
      console.log(response)
      return response.data
    } catch (error) {
      console.log(error)
    }
  }

  // Milestone Responses
  static async addMilestoneResponse(formData) {
    const token = sessionStorage.getItem('token')
    try {
      const response = await api.post(`mileStone/responses`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      })
      return response.data
    } catch (error) {
      console.error('Error adding milestone response:', error)
      throw error
    }
  }

  // Milestone response by id
  static async GetMilestoneResponseById(id) {
    try {
      const response = await api.get(`mileStone/responses/${id}`, {
        headers: {
          'Content-Type': 'application/json'
        }
      })
      return response.data
    } catch (error) {
      console.error('Error fetching milestone response:', error)
      throw error
    }
  }

  static async UpdateMilestoneResponseStatus(parentResponseId, data) {
    const token = sessionStorage.getItem('token')
    try {
      const response = await api.patch(`mileStone/responses/${parentResponseId}/status`, data, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      return response.data
    } catch (error) {
      console.error('Error updating milestone response status:', error)
      throw error
    }
  }

  static async ViewMilestoneResponseFile(responseId, fileId) {
    try {
      const response = await api.get(`mileStone/response/${responseId}/viewFile/${fileId}`, {
        headers: {
          'Content-Type': 'application/json'
        },
        responseType: 'blob'
      })
      return response.data
    } catch (error) {
      console.error('Error viewing milestone response file:', error)
      throw error
    }
  }

  static async DeleteMilestoneById(id) {
    try {
      const response = await api.delete(`mileStone/${id}`, {
        headers: {
          'Content-Type': 'application/json'
        }
      })
      return response.data
    } catch (error) {
      console.error('Error deleting milestone:', error)
      throw error
    }
  }
}

export default MilestoneService
