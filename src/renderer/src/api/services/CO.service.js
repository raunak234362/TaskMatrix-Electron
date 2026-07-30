import api from '../api'

class COService {
  static async DeleteChangeOrderById(id) {
    try {
      const response = await api.delete(`changeOrder/delete/${id}`, {
        headers: {
          'Content-Type': 'application/json'
        }
      })
      return response.data
    } catch (error) {
      console.error('Error deleting change order:', error)
      throw error
    }
  }

  //change Order ---------------------------------------------
  static async ChangeOrder(formData, fabricatorName, projectName) {
    const token = sessionStorage.getItem('token')
    try {
      const response = await api.post(`changeOrder/?fabricatorName=${encodeURIComponent(fabricatorName)}&projectName=${encodeURIComponent(projectName)}`, formData, {
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

  // pending Co
  static async PendingCo() {
    try {
      const response = await api.get(`changeOrder/pendingCOs`, {
        headers: {
          'Content-Type': 'application/json'
        }
      })
      console.log(' Pending Co:', response.data)
      return response.data
    } catch (error) {
      console.error('cannot find Co', error)
    }
  }

  //pending CO for Project Manager
  static async PendingCoForProjectManager() {
    try {
      const response = await api.get(`changeOrder/pending/projectManager`, {
        headers: {
          'Content-Type': 'application/json'
        }
      })
      console.log(' Pending Co for Project Manager:', response.data)
      return response.data
    } catch (error) {
      console.error('cannot find Co for Project Manager', error)
    }
  }

  //change order by id
  static async GetChangeOrderByID(ID) {
    try {
      const response = await api.get(`changeOrder/ById/${ID}`, {
        headers: {
          'Content-Type': 'application/json'
        }
      })
      console.log(' All Co fetched by ID:', response.data)
      return response.data
    } catch (error) {
      console.error('cannot find CO', error)
    }
  }

  static async GetChangeOrder(projectId) {
    try {
      const response = await api.get(`changeOrder/project/${projectId}`, {
        headers: {
          'Content-Type': 'application/json'
        }
      })
      console.log(' All Co fetched by projectID:', response.data)
      return response.data
    } catch (error) {
      console.error('cannot find CO', error)
    }
  }

  //update Co
  static async EditCoById(id, data, fabricatorName, projectName) {
    try {
      const response = await api.put(`changeOrder/${id}?fabricatorName=${encodeURIComponent(fabricatorName)}&projectName=${encodeURIComponent(projectName)}`, data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      console.log('co Edited:', response.data)
      return response.data
    } catch (error) {
      console.error('cannot find CO', error)
    }
  }

  //response routes
  static async addCOResponse(formData, responseId, fabricatorName, projectName) {
    const token = sessionStorage.getItem('token')

    const response = await api.post(`changeOrder/${responseId}/responses?fabricatorName=${encodeURIComponent(fabricatorName)}&projectName=${encodeURIComponent(projectName)}`, formData, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'multipart/form-data'
      }
    })

    return response.data
  }

  //change order response by id
  static async UpdateCOTableById(ID, data) {
    try {
      const response = await api.put(`changeOrder/table/${ID}`, data, {
        headers: {
          'Content-Type': 'application/json'
        }
      })
      console.log(' All Co fetched by ID:', response.data)
      return response.data
    } catch (error) {
      console.error('cannot find CO', error)
    }
  }

  // Change Order Table Methods
  static async GetAllCOTableRows(coId) {
    try {
      const response = await api.get(`changeOrder/${coId}/table`, {
        headers: {
          'Content-Type': 'application/json'
        }
      })
      return response.data
    } catch (error) {
      console.error('Error fetching CO table rows:', error)
    }
  }

  static async addCOTable(data, coId) {
    try {
      const response = await api.post(`changeOrder/${coId}/table`, data, {
        headers: {
          'Content-Type': 'application/json'
        }
      })
      return response.data
    } catch (error) {
      console.error('Error saving CO table:', error)
      throw error
    }
  }

  // changeorders
  static async GetPendingChangeOrdersDeptManager() {
    try {
      const response = await api.get(`changeOrder/pending/departmentManager`)
      return response.data
    } catch (error) {
      console.error('Error fetching pending change orders:', error)
      throw error
    }
  }

  //pending CO
  static async GetPendingChangeOrders() {
    try {
      const response = await api.get(`changeOrder/pendingCOs`)
      return response.data
    } catch (error) {
      console.error('Error fetching pending change orders:', error)
      throw error
    }
  }

  //unapproved CO
  static async GetUnapprovedChangeOrders() {
    try {
      const response = await api.get(`changeOrder/unapproved`)
      return response.data
    } catch (error) {
      console.error('Error fetching unapproved change orders:', error)
      throw error
    }
  }

  //pending change orders operation executive
  static async GetPendingChangeOrdersOperationExecutive() {
    try {
      const response = await api.get(`changeOrder/pending/operationExecutive`)
      return response.data
    } catch (error) {
      console.error('Error fetching pending change orders:', error)
      throw error
    }
  }

  //pending change order clientSide
  static async GetPendingChangeOrdersClientSide() {
    try {
      const response = await api.get(`changeOrder/pending/clientSide`)
      return response.data
    } catch (error) {
      console.error('Error fetching pending change orders:', error)
      throw error
    }
  }
}

export default COService
