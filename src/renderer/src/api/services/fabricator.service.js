import api from '../api'

const token = sessionStorage.getItem('token')

class FabricatorService {
  // Add fabricator
  static async AddFabricator(fabricatorData) {
    try {
      const response = await api.post(`fabricator`, fabricatorData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      console.log(' Fabricator API Response:', response)
      return response.data
    } catch (error) {
      console.error(' Error while adding New Fabricator:', error)
      throw error
    }
  }

  static async GetAllFabricators(page, limit, search, stage, contactId) {
    try {
      const response = await api.get(`fabricator/all`, {
        params: {
          page,
          limit,
          search: search || undefined,
          stage: stage !== "All Stages" ? stage : undefined,
          contactId: contactId !== "All WBT Contacts" ? contactId : undefined,
        },
        headers: {
          'Content-Type': 'application/json'
        }
      })
      console.log(' All Fabricators fetched:', response.data)
      return response.data
    } catch (error) {
      console.error('cannot find fabricators', error)
    }
  }

  // Fetch Fabricator by ID
  static async GetFabricatorByID(id) {
    try {
      const response = await api.get(`fabricator/${id}`, {
        headers: {
          'Content-Type': 'application/json'
        }
      })
      console.log(' Fabricator fetched by ID:', response.data)
      return response.data
    } catch (error) {
      console.error('cannot find fabricators', error)
    }
  }

  // Fetch Fabricator Branch by Branch ID
  static async GetFabricatorBranchByID(id) {
    try {
      const response = await api.get(`fabricator/branch/${id}`, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
      })
      return response.data
    } catch (error) {
      console.error('Error fetching fabricator branch by ID:', error)
    }
  }

  // Fetch Fabricator Branches by Fabricator ID
  static async GetFabricatorBranchesByFabricatorID(fabricatorId) {
    try {
      const response = await api.get(`fabricator/branch/fabricator/${fabricatorId}`, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
      })
      return response.data
    } catch (error) {
      console.error('Error fetching fabricator branches by fabricator ID:', error)
    }
  }

  // Fetch Projects by Fabricator ID
  static async GetProjectsByFabricatorID(fabricatorId) {
    try {
      const response = await api.get(`project/projects/fabricator/${fabricatorId}`, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
      })
      return response.data
    } catch (error) {
      console.error('Error fetching projects by fabricator ID:', error)
    }
  }

  // Update Fabricator by ID
  static async EditFabricatorByID(id, data) {
    try {
      const response = await api.put(`fabricator/update/${id}`, data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      console.log('Fabricators Edited:', response.data)
      return response.data
    } catch (error) {
      console.error('cannot find fabricators', error)
    }
  }

  // Add branch by Fabricator ID
  static async AddBranchByFabricator(data) {
    try {
      const response = await api.post(`fabricator/branch`, data, {
        headers: {
          'Content-Type': 'application/json'
        }
      })
      console.log(' All Fabricators fetched:', response.data)
      return response.data
    } catch (error) {
      console.error('cannot find fabricators', error)
    }
  }

  // Delete Fabricator by ID
  static async DeleteFabricatorByID(id) {
    try {
      const response = await api.delete(`fabricator/id/${id}`, {
        headers: {
          'Content-Type': 'application/json'
        }
      })
      console.log('Fabricator deleted:', response.data)
      return response.data
    } catch (error) {
      console.error('Error deleting Fabricator:', error)
      throw error
    }
  }

  // Delete branch by branch ID
  static async DeleteBranchByBranchID(id) {
    try {
      const response = await api.delete(`fabricator/branch/${id}`, {
        headers: {
          'Content-Type': 'application/json'
        }
      })
      console.log('Fabricator branch deleted:', response.data)
      return response.data
    } catch (error) {
      console.error('Error deleting Fabricator branch:', error)
      throw error
    }
  }

  // Fetch POC by Fabricator ID
  static async GetFabricatorPOC(fabricatorId) {
    try {
      const response = await api.get(`fabricator/${fabricatorId}/poc`, {
        headers: {
          'Content-Type': 'application/json'
        }
      })
      console.log(' Fabricator POC fetched:', response.data)
      return response.data
    } catch (error) {
      console.error('cannot find fabricator pocs', error)
    }
  }

  // Add Client by Fabricator ID
  static async AddClientByFabricator(fabricatorId, data) {
    try {
      const response = await api.post(`client/${fabricatorId}`, data, {
        headers: {
          'Content-Type': 'application/json'
        }
      })
      console.log(' Client added by Fabricator ID:', response.data)
      return response.data
    } catch (error) {
      console.error('cannot find fabricators', error)
    }
  }

  // Fetch All Clients by Fabricator ID
  static async FetchAllClientsByFabricatorID(fabricatorId) {
    try {
      const response = await api.get(`client/byFabricator/${fabricatorId}`, {
        headers: {
          'Content-Type': 'application/json'
        }
      })
      console.log(' All Clients fetched by Fabricator ID:', response.data)
      return response.data
    } catch (error) {
      console.error('cannot find clients', error)
    }
  }

  // Fetch Client by ID
  static async FetchClientByID(clientID) {
    try {
      const response = await api.get(`client/byFabricator/${clientID}`, {
        headers: {
          'Content-Type': 'application/json'
        }
      })
      console.log(' All Clients fetched by Fabricator ID:', response.data)
      return response.data
    } catch (error) {
      console.error('cannot find clients', error)
    }
  }
}

export default FabricatorService
