import api from '../api'

class RFIService {
  static async DeleteRFIById(id) {
    try {
      const response = await api.delete(`rfi/delete/${id}`, {
        headers: {
          'Content-Type': 'application/json'
        }
      })
      return response.data
    } catch (error) {
      console.error('Error deleting RFI:', error)
      throw error
    }
  }

  //Add new RFI
  static async addRFI(formData, fabricatorName, projectName) {
    const token = sessionStorage.getItem('token')

    const response = await api.post(`rfi?fabricatorName=${encodeURIComponent(fabricatorName)}&projectName=${encodeURIComponent(projectName)}`, formData, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'multipart/form-data'
      }
    })

    return response.data
  }

  //pending RFIs
  static async pendingRFIs() {
    try {
      const response = await api.get(`rfi/pendingRFIs`, {
        headers: {
          'Content-Type': 'application/json'
        }
      })
      console.log('pending RFIs:', response.data)
      return response.data
    } catch (error) {
      console.error('cannot find pending RFIs', error)
    }
  }

  //pending RFIs for ProjectManager
  static async pendingRFIsForProjectManager() {
    try {
      const response = await api.get(`rfi/pending/projectManager`, {
        headers: {
          'Content-Type': 'application/json'
        }
      })
      console.log('pending RFIs for ProjectManager:', response.data)
      return response.data
    } catch (error) {
      console.error('cannot find pending RFIs for ProjectManager', error)
    }
  }

  static async RfiSent() {
    try {
      const response = await api.get(`rfi/sents`, {
        headers: {
          'Content-Type': 'application/json'
        }
      })
      console.log(' RFI sents:', response.data)
      return response.data
    } catch (error) {
      console.error('cannot find rfIs', error)
    }
  }

  static async RfiRecieved() {
    try {
      const response = await api.get(`rfi/received`, {
        headers: {
          'Content-Type': 'application/json'
        }
      })

      console.log('  RFI received:', response.data)
      return response.data
    } catch (error) {
      console.error("cannot find rfi's", error)
    }
  }

  static async GetRFIbyId(rfiId) {
    try {
      const response = await api.get(`rfi/getById/${rfiId}`, {
        headers: {
          'Content-Type': 'application/json'
        }
      })
      console.log(' All rfi fetched by rfi ID:', response.data)
      return response.data
    } catch (error) {
      console.error('cannot find rfi', error)
    }
  }

  //getrfisentbyproId
  static async GetRFISentByProId(projectId) {
    try {
      const response = await api.get(`rfi/sent/${projectId}`, {
        headers: {
          'Content-Type': 'application/json'
        }
      })
      console.log(' All rfi fetched by rfi ID:', response.data)
      return response.data
    } catch (error) {
      console.error('cannot find rfi', error)
    }
  }

  //get RFI by ProjectId
  static async GetRFIByProjectId(projectId) {
    try {
      const response = await api.get(`rfi/project/${projectId}`, {
        headers: {
          'Content-Type': 'application/json'
        }
      })
      console.log(' All rfi fetched by rfi ID:', response.data)
      return response.data
    } catch (error) {
      console.error('cannot find rfi', error)
    }
  }

  static async EditRFIByID(id, data, fabricatorName, projectName) {
    try {
      const response = await api.put(`rfi/${id}?fabricatorName=${encodeURIComponent(fabricatorName)}&projectName=${encodeURIComponent(projectName)}`, data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      console.log('RFI Edited:', response.data)
      return response.data
    } catch (error) {
      console.error('cannot find RFI', error)
    }
  }

  //RFI responses
  static async addRFIResponse(formData, responseId, fabricatorName, projectName) {
    const token = sessionStorage.getItem('token')

    const response = await api.post(`rfi/${responseId}/responses?fabricatorName=${encodeURIComponent(fabricatorName)}&projectName=${encodeURIComponent(projectName)}`, formData, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'multipart/form-data'
      }
    })

    return response.data
  }

  static async GetRFIResponsebyId(rfiId) {
    const token = sessionStorage.getItem('token')
    try {
      const response = await api.get(`rfi/responses/${rfiId}`, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
      })
      console.log(' All rfq fetched by rfq ID:', response.data)
      return response.data
    } catch (error) {
      console.error('cannot find rfq', error)
    }
  }

  // rfis
  static async GetPendingRfiDeptManager() {
    try {
      const response = await api.get(`rfi/pending/departmentManager`)
      return response.data
    } catch (error) {
      console.error('Error fetching pending rfi:', error)
      throw error
    }
  }

  //pending rfi operation executive
  static async GetPendingRfiOperationExecutive() {
    try {
      const response = await api.get(`rfi/pending/operationExecutive`)
      return response.data
    } catch (error) {
      console.error('Error fetching pending rfi:', error)
      throw error
    }
  }

  //pendig rfi clientSide
  static async GetPendingRfiClientSide() {
    try {
      const response = await api.get(`rfi/pending/clientSide`)
      return response.data
    } catch (error) {
      console.error('Error fetching pending rfi:', error)
      throw error
    }
  }
}

export default RFIService
