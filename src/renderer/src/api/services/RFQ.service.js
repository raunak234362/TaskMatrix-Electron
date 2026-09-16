import api from '../api'

const token = sessionStorage.getItem('token')

class RFQService {
  //Add new RFQ
  static async addRFQ(formData, fabricatorName, rfqProjectName) {
    const token = sessionStorage.getItem('token')

    const response = await api.post(`rfq?fabricatorName=${encodeURIComponent(fabricatorName)}&rfqProjectName=${encodeURIComponent(rfqProjectName)}`, formData, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'multipart/form-data'
      }
    })

    return response.data
  }

  // Helper to build query parameters for RFQ list requests
  static _buildParams(page, limit = 10, ...rest) {
    const params = {}
    if (page !== undefined && page !== null) params.page = page
    if (limit !== undefined && limit !== null) params.limit = limit

    if (rest.length > 0) {
      if (typeof rest[0] === 'object' && rest[0] !== null) {
        const opts = rest[0]
        Object.keys(opts).forEach((key) => {
          const val = opts[key]
          if (
            val !== undefined &&
            val !== null &&
            val !== '' &&
            val !== 'ALL' &&
            val !== 'ALL FABRICATOR' &&
            val !== 'All Fabricators' &&
            val !== 'All Statuses'
          ) {
            params[key] = val
          }
        })
      } else {
        const [searchByProjectName, status, fabricatorName, startDate, endDate, mtoType] = rest
        if (searchByProjectName) params.searchByProjectName = searchByProjectName
        if (status && status !== 'ALL' && status !== 'All Statuses') params.status = status
        if (fabricatorName && fabricatorName !== 'ALL FABRICATOR' && fabricatorName !== 'All Fabricators') {
          params.fabricatorName = fabricatorName
        }
        if (startDate) {
          params.startDate = startDate
          params.createdDate = startDate
          params.createdAt = startDate
        }
        if (endDate) {
          params.endDate = endDate
          params.dueDate = endDate
          params.estimationDate = endDate
        }
        if (mtoType && mtoType !== 'ALL') {
          params.mtoType = mtoType
        }
      }
    }

    return params
  }

  //Fetch all the RFQ
  static async FetchAllRFQ(page, limit = 10, ...rest) {
    try {
      const params = RFQService._buildParams(page, limit, ...rest)
      const response = await api.get(`rfq/all`, {
        params,
        headers: {
          'Content-Type': 'application/json'
        }
      })
      console.log(' All Data fetched:', response.data)
      return response.data
    } catch (error) {
      console.error('cannot find rfqs', error)
    }
  }

  // api for sents :
  static async RfqSent(page, limit = 10, ...rest) {
    try {
      const params = RFQService._buildParams(page, limit, ...rest)
      const response = await api.get(`rfq/sents`, {
        params,
        headers: {
          'Content-Type': 'application/json'
        }
      })
      console.log(' RFQ sents:', response.data)
      return response.data
    } catch (error) {
      console.error('cannot find rfqs', error)
    }
  }

  //api for recieved:
  static async RFQRecieved(page, limit = 10, ...rest) {
    try {
      const params = RFQService._buildParams(page, limit, ...rest)
      const token = sessionStorage.getItem('token')
      const response = await api.get(`rfq/received`, {
        params,
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      console.log('  RFQ received:', response.data)
      return response.data
    } catch (error) {
      console.error('cannot find rfqs', error)
    }
  }

  //getting rfqbyID
  static async GetRFQbyId(rfqId) {
    try {
      const response = await api.get(`rfq/getById/${rfqId}`, {
        headers: {
          'Content-Type': 'application/json'
        }
      })
      console.log(' All rfq fetched by rfq ID:', response.data)
      return response.data
    } catch (error) {
      console.error('cannot find rfq', error)
    }
  }

  //Delete RFQ by ID
  static async DeleteRFQById(rfqId) {
    try {
      const response = await api.delete(`rfq/delete/${rfqId}`)
      console.log('RFQ deleted:', response.data)
      return response.data
    } catch (error) {
      console.error('cannot delete rfq', error)
      throw error
    }
  }

  // GET RFQ responses by ID
  static async getRFQResponses(rfqId) {
    try {
      const response = await api.get(`rfq/${rfqId}/responses`)
      console.log('RFQ responses fetched:', response.data)
      return response.data
    } catch (error) {
      console.error('cannot find rfq responses', error)
      throw error
    }
  }

  // GET single RFQ response by ID
  static async getRFQResponseById(id) {
    try {
      const response = await api.get(`rfq/responses/${id}`)
      console.log('RFQ response fetched by ID:', response.data)
      return response.data
    } catch (error) {
      console.error('cannot find rfq response by ID', error)
      throw error
    }
  }

  // Update RFQ by ID
  static async UpdateRFQById(rfqId, data, fabricatorName, rfqProjectName) {
    try {
      const response = await api.put(`rfq/update/${rfqId}?fabricatorName=${encodeURIComponent(fabricatorName)}&rfqProjectName=${encodeURIComponent(rfqProjectName)}`, data)
      console.log('RFQ updated:', response.data)
      return response.data
    } catch (error) {
      console.error('cannot update rfq', error)
    }
  }

  //RESPONSES
  //response post request
  static async addResponse(formData, responseId, fabricatorName, rfqProjectName) {
    const token = sessionStorage.getItem('token')

    const response = await api.post(`rfq/${responseId}/responses?fabricatorName=${encodeURIComponent(fabricatorName)}&rfqProjectName=${encodeURIComponent(rfqProjectName)}`, formData, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'multipart/form-data'
      }
    })

    return response.data
  }

  //rfq followups:
  static async addRFQFollowups(formData, rfqId, fabricatorName, rfqProjectName) {
    try {
      const response = await api.post(`rfq/${rfqId}/followups?fabricatorName=${encodeURIComponent(fabricatorName)}&rfqProjectName=${encodeURIComponent(rfqProjectName)}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })
      console.log('RFQ followups added:', response.data)
      return response.data
    } catch (error) {
      console.error('cannot add RFQ followups', error)
    }
  }

  //rfq file
  static async viewRfqFile(Id, fileId) {
    try {
      const response = await api.get(`rfq/followups/viewFile/${Id}/${fileId}`, {
        responseType: 'blob'
      })
      console.log('RFQ file fetched:', response.data)
      return response.data
    } catch (error) {
      console.error('cannot fetch RFQ file', error)
    }
  }

  //pending rfq
  static async GetPendingRfq() {
    try {
      const response = await api.get(`rfq/pendingRFQs`)
      return response.data
    } catch (error) {
      console.error('Error fetching pending rfq:', error)
      throw error
    }
  }

  //pending rfq clientSide
  static async GetPendingRfqClientSide() {
    try {
      const response = await api.get(`rfq/pending/clientSide`)
      return response.data
    } catch (error) {
      console.error('Error fetching pending rfq:', error)
      throw error
    }
  }

  //pending rfq operation executive
  static async GetPendingRfqOperationExecutive() {
    try {
      const response = await api.get(`rfq/pending/operationExecutive`)
      return response.data
    } catch (error) {
      console.error('Error fetching pending rfq:', error)
      throw error
    }
  }
}

export default RFQService
