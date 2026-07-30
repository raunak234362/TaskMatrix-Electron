import api from '../api'

class SubmittalsService {
  static async DeleteSubmittalById(id) {
    try {
      const response = await api.delete(`submittal/delete/${id}`, {
        headers: {
          'Content-Type': 'application/json'
        }
      })
      return response.data
    } catch (error) {
      console.error('Error deleting submittal:', error)
      throw error
    }
  }

  // submitals route ----------------------------------------------
  static async AddSubmittal(formData, fabricatorName, projectName) {
    const token = sessionStorage.getItem('token')
    try {
      const response = await api.post(`submittal/?fabricatorName=${encodeURIComponent(fabricatorName)}&projectName=${encodeURIComponent(projectName)}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`
        }
      })
      console.log(response)
      return response.data
    } catch (error) {
      console.log(error)
    }
  }

  //pending submittals
  static async PendingSubmittal() {
    try {
      const response = await api.get(`submittal/pendingSubmittal`, {
        headers: {
          'Content-Type': 'application/json'
        }
      })
      console.log(' Pending submittals:', response.data)
      return response.data
    } catch (error) {
      console.error('cannot find submittals', error)
    }
  }

  //Pending submittals for Project Manager
  static async PendingSubmittalForProjectManager() {
    try {
      const response = await api.get(`submittal/pending/projectManager`, {
        headers: {
          'Content-Type': 'application/json'
        }
      })
      console.log(' Pending submittals for Project Manager:', response.data)
      return response.data
    } catch (error) {
      console.error('cannot find submittals for Project Manager', error)
    }
  }

  //All Submitals
  static async SubmittalSent() {
    try {
      const response = await api.get(`submittal/sent`, {
        headers: {
          'Content-Type': 'application/json'
        }
      })
      console.log(' Submittals sents:', response.data)
      return response.data
    } catch (error) {
      console.error('cannot find submittals', error)
    }
  }

  static async SubmittalRecieved() {
    try {
      const response = await api.get(`submittal/received`, {
        headers: {
          'Content-Type': 'application/json'
        }
      })

      console.log('  Submittal received:', response.data)
      return response.data
    } catch (error) {
      console.error("cannot find submittal's", error)
    }
  }

  static async GetSubmittalbyId(Id) {
    try {
      const response = await api.get(`submittal/${Id}`, {
        headers: {
          'Content-Type': 'application/json'
        }
      })
      console.log(' All submittal fetched by submittalID:', response.data)
      return response.data
    } catch (error) {
      console.error('cannot find submittal', error)
    }
  }

  static async addSubmittalResponse(formData, fabricatorName, projectName) {
    const token = sessionStorage.getItem('token')

    const response = await api.post(`submittal/responses/?fabricatorName=${encodeURIComponent(fabricatorName)}&projectName=${encodeURIComponent(projectName)}`, formData, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })

    return response.data
  }

  static async GetSubmittalResponsebyId(subId) {
    try {
      const response = await api.get(`submittal/responses/${subId}`, {
        headers: {
          'Content-Type': 'application/json'
        }
      })
      console.log(' All submittals fetched by sub ID:', response.data)
      return response.data
    } catch (error) {
      console.error('cannot find sub', error)
    }
  }

  // submittalsentbyprojectid:
  static async SubmittalSentByProjectId(projectId) {
    try {
      const response = await api.get(`submittal/sents/${projectId}`, {
        headers: {
          'Content-Type': 'application/json'
        }
      })
      console.log(' All submittals fetched by project ID:', response.data)
      return response.data
    } catch (error) {
      console.error('cannot find submittal', error)
    }
  }

  //submittal by project id :
  static async GetSubmittalByProjectId(projectId) {
    try {
      const response = await api.get(`submittal/project/${projectId}`, {
        headers: {
          'Content-Type': 'application/json'
        }
      })
      console.log(' All submittals fetched by project ID:', response.data)
      return response.data?.data || []
    } catch (error) {
      console.error('cannot find submittal', error)
    }
  }

  //update  submittal version by ID
  static async updateSubmittalVersionById(id, data, fabricatorName, projectName) {
    try {
      const response = await api.post(`submittal/${id}/versions?fabricatorName=${encodeURIComponent(fabricatorName)}&projectName=${encodeURIComponent(projectName)}`, data, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })
      console.log('Submittal version updated:', response.data)
      return response.data
    } catch (error) {
      console.error('cannot update submittal version', error)
      throw error
    }
  }

  //Update submittal patch method by id (partial update, e.g. milestone ID only)
  static async updateSubmittalById(id, data) {
    try {
      const response = await api.patch(`submittal/${id}`, data)
      console.log('Submittal updated:', response.data)
      return response.data
    } catch (error) {
      console.error('cannot update submittal', error)
      throw error
    }
  }

  // upcomping submittal
  static async GetPendingSubmittal() {
    try {
      const response = await api.get(`mileStone/pendingSubmittals`)
      console.log('Upcoming submittal fetched:', response.data)
      return response.data
    } catch (error) {
      console.error('Error fetching upcoming submittal:', error)
      throw error
    }
  }

  // upcoming Submittal for PRoject Manager
  static async GetPendingSubmittalForPM() {
    try {
      const response = await api.get(`mileStone/pendingSubmittals/projectManager`)
      console.log('Upcoming submittal fetched:', response.data)
      return response.data
    } catch (error) {
      console.error('Error fetching upcoming submittal:', error)
      throw error
    }
  }

  // submittals
  static async GetPendingSubmittalDeptManager() {
    try {
      const response = await api.get(`submittal/pending/departmentManager`)
      return response.data
    } catch (error) {
      console.error('Error fetching pending submittals:', error)
      throw error
    }
  }

  //pending submittal operation executive
  static async GetPendingSubmittalOperationExecutive() {
    try {
      const response = await api.get(`submittal/pending/operationExecutive`)
      return response.data
    } catch (error) {
      console.error('Error fetching pending submittals:', error)
      throw error
    }
  }

  //pending submittal clientSide
  static async GetPendingSubmittalClientSide() {
    try {
      const response = await api.get(`submittal/pending/clientSide`)
      return response.data
    } catch (error) {
      console.error('Error fetching pending submittals:', error)
      throw error
    }
  }
}

export default SubmittalsService
