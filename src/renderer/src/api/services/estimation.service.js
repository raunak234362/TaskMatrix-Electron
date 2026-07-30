import api from '../api'

class EstimationService {
  // Add Estimation
  static async AddEstimation(formData) {
    try {
      const response = await api.post(`estimation/estimations`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })
      console.log(response)
      return response.data
    } catch (error) {
      console.log(error)
    }
  }

  // Add Estimation
  static async AllEstimation() {
    try {
      const response = await api.get(`estimation/estimations`, {
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

  // Get Estimation By ID
  static async GetEstimationById(id) {
    try {
      const response = await api.get(`estimation/estimations/${id}`, {
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

  // Update Estimation By ID
  static async UpdateEstimationById(id, formData) {
    try {
      const response = await api.put(`estimation/estimations/${id}`, formData, {
        headers: {
          'Content-Type': 'application/json'
        }
      })
      console.log(response)
      return response.data
    } catch (error) {
      console.log(error)
      throw error
    }
  }

  // estimation response
  static async AddEstimationResponse(formData, id) {
    try {
      const response = await api.post(`estimation/estimations/${id}/responses`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })
      console.log(response)
      return response.data
    } catch (error) {
      console.log(error)
    }
  }

  // Get Estimation Response by ID
  static async GetEstimationResponseById(id) {
    try {
      const response = await api.get(`estimation/responses/${id}`, {
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

  // Get file attached to an estimation response (download)
  static async GetEstimationResponseFile(estimationResId, fileId) {
    try {
      const response = await api.get(`estimation/responses/${estimationResId}/files/${fileId}`, {
        responseType: 'blob'
      })
      console.log(response)
      return response.data
    } catch (error) {
      console.log(error)
    }
  }

  // Get inline view URL for an estimation response file
  static GetEstimationResponseFileViewUrl(estimationResId, fileId) {
    const baseURL = api.defaults.baseURL || ''
    return `${baseURL}estimation/response/viewFile/${estimationResId}/${fileId}`
  }

  // Add Estimation Task
  static async AddEstimationTask(formData) {
    try {
      const response = await api.post(`estimation/estimation-tasks`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })
      console.log(response)
      return response.data
    } catch (error) {
      console.log(error)
    }
  }

  // Estimation Task For Assignee
  static async GetEstimationTaskForME() {
    try {
      const response = await api.get(`estimation/estimation-tasks/my`, {
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

  // Get all assigned estimation task
  static async GetAllAssignedEstimationTaskForME() {
    try {
      const response = await api.get(`estimation/estimation-tasks/my/all`, {
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

  // get all estimation tasks
  static async GetAllEstimationTasks() {
    try {
      const response = await api.get(`estimation/estimation-tasks`, {
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

  // Update Estimation Task By ID
  static async UpdateEstimationTaskById(id, data) {
    try {
      const response = await api.patch(`estimation/estimation-tasks/${id}`, data, {
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

  // Review Estimation Task By ID
  static async ReviewEstimationTaskById(id, data) {
    try {
      const response = await api.patch(`estimation/estimation-tasks/${id}/review`, data, {
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

  // Get Estimation Task By ID
  static async GetEstimationTaskById(id) {
    try {
      const response = await api.get(`estimation/estimation-tasks/${id}`, {
        headers: {
          'Content-Type': 'application/json'
        }
      })
      return response.data
    } catch (error) {
      console.log(error)
    }
  }

  // Estimation Task Start by ID
  static async StartEstimationTaskById(id) {
    try {
      const response = await api.post(`task/EST/start/${id}`, {
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

  // Estimation Task Pause By ID
  static async PauseEstimationTaskById(id, data) {
    try {
      const response = await api.patch(`task/EST/pause/${id}`, data, {
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

  // Estimation Task Resume By ID
  static async ResumeEstimationTaskById(id) {
    try {
      const response = await api.post(`task/EST/resume/${id}`, {
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

  // Estimation Task End by ID
  static async EndEstimationTaskById(id, data) {
    try {
      const response = await api.post(`task/EST/end/${id}`, data, {
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

  // Summary Estimation Task By ID
  static async SummaryEstimationTaskById(id) {
    try {
      const response = await api.get(`task/EST/${id}`, {
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

  // Line Item Group
  static async CreateLineItemGroup(data) {
    try {
      const response = await api.post(`estimation/line-items`, data, {
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

  // fetch Group by ID
  static async FetchGroupById(id) {
    try {
      const response = await api.get(`estimation/line-items/group/${id}`, {
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

  // update Group by ID
  static async UpdateGroupById(id, data) {
    try {
      const response = await api.put(`estimation/line-items/${id}`, data, {
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

  // fetch Line item group
  static async FetchLineItemGroup(id) {
    try {
      const response = await api.get(`estimation/line-items/groups/${id}`, {
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

  // fetch Line item group List
  static async FetchLineItemGroupList(id) {
    try {
      const response = await api.get(`estimation/line-items/Bygroup/${id}`, {
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

  // Update Line Item By ID
  static async UpdateLineItemById(id, data) {
    try {
      const response = await api.put(`estimation/line-items/update/${id}`, data, {
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

  // add new Line Item
  static async AddLineItem(data) {
    try {
      const response = await api.post(`estimation/line-items/item`, data, {
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
}

export default EstimationService
