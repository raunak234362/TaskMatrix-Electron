import api from '../api'

class InvoiceService {
  // Add Account Info / Bank Account -> POST /invoice/account
  static async AddBankAccount(data) {
    try {
      const response = await api.post(`invoice/account`, data, {
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

  // Update Account Info -> PUT /invoice/account/{id}
  static async UpdateBankAccount(id, data) {
    try {
      const response = await api.put(`invoice/account/${id}`, data, {
        headers: {
          'Content-Type': 'application/json'
        }
      })
      return response.data
    } catch (error) {
      console.error('Error updating account info:', error)
      throw error
    }
  }

  // Delete Account Info -> DELETE /invoice/account/{id}
  static async DeleteBankAccount(id) {
    try {
      const response = await api.delete(`invoice/account/${id}`)
      return response.data
    } catch (error) {
      console.error('Error deleting account info:', error)
      throw error
    }
  }

  // Add Invoice -> POST /invoice/create
  static async AddInvoice(data) {
    try {
      const response = await api.post(`invoice/create`, data, {
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

  // Get Invoice By ID -> GET /invoice/byId/{id}
  static async GetInvoiceById(id) {
    try {
      const response = await api.get(`invoice/byId/${id}`, {
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

  // Update Invoice by ID -> PUT /invoice/{id}
  static async UpdateInvoiceById(id, data) {
    try {
      const response = await api.put(`invoice/${id}`, data, {
        headers: {
          'Content-Type': 'application/json'
        }
      })
      console.log('Invoice updated:', response.data)
      return response.data
    } catch (error) {
      console.error('Error updating invoice:', error)
      throw error
    }
  }

  // Delete Invoice -> DELETE /invoice/{id}
  static async DeleteInvoiceById(id) {
    try {
      const response = await api.delete(`invoice/${id}`)
      return response.data
    } catch (error) {
      console.error('Error deleting invoice:', error)
      throw error
    }
  }

  // Get All Invoices -> GET /invoice/AllInvoices
  static async GetAllInvoice() {
    try {
      const response = await api.get(`invoice/AllInvoices`, {
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

  // Get All Account Info -> GET /invoice/accounts/all
  static async GetBankAccounts() {
    try {
      const response = await api.get(`invoice/accounts/all`, {
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

  // Get Account Info By ID -> GET /invoice/account/{id}
  static async GetBankAccountById(id) {
    try {
      const response = await api.get(`invoice/account/${id}`, {
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

  // Get Account Info by ID / Fabricator ID -> GET /invoice/account/{id}
  static async GetAccountById(id) {
    try {
      const response = await api.get(`invoice/account/${id}`, {
        headers: {
          'Content-Type': 'application/json'
        }
      })
      console.log('GetAccountById response:', response.data)
      return response.data
    } catch (error) {
      console.error('Error fetching account info by ID:', error)
      throw error
    }
  }

  // Get pending invoices for authenticated client -> GET /invoice/client
  static async GetClientPendingInvoices() {
    try {
      const response = await api.get(`invoice/client`, {
        headers: {
          'Content-Type': 'application/json'
        }
      })
      return response.data
    } catch (error) {
      console.error('Error fetching client pending invoices:', error)
      throw error
    }
  }

  // Get all invoices for authenticated client -> GET /invoice/client/all
  static async GetAllClientInvoices() {
    try {
      const response = await api.get(`invoice/client/all`, {
        headers: {
          'Content-Type': 'application/json'
        }
      })
      return response.data
    } catch (error) {
      console.error('Error fetching all client invoices:', error)
      throw error
    }
  }

  // Get invoices for logged-in fabricator -> GET /invoice/fabricators/me
  static async GetFabricatorInvoicesMe() {
    try {
      const response = await api.get(`invoice/fabricators/me`, {
        headers: {
          'Content-Type': 'application/json'
        }
      })
      return response.data
    } catch (error) {
      console.error('Error fetching fabricator invoices:', error)
      throw error
    }
  }

  // Get pending invoices for client -> GET /invoice/pending/client
  static async GetPendingInvoicesForClient() {
    try {
      const response = await api.get(`invoice/pending/client`, {
        headers: {
          'Content-Type': 'application/json'
        }
      })
      return response.data
    } catch (error) {
      console.error('Error fetching pending invoices for client:', error)
      throw error
    }
  }

  // Get pending invoices for fabricator -> GET /invoice/pending/fabricator
  static async GetPendingInvoicesForFabricator() {
    try {
      const response = await api.get(`invoice/pending/fabricator`, {
        headers: {
          'Content-Type': 'application/json'
        }
      })
      return response.data
    } catch (error) {
      console.error('Error fetching pending invoices for fabricator:', error)
      throw error
    }
  }

  // Wire Transfer API methods
  static async GetAllWireTransfers() {
    try {
      const response = await api.get(`wireTransfer`)
      return response.data
    } catch (error) {
      console.error('Cannot find wire transfers', error)
    }
  }

  static async GetWireTransfersByInvoiceId(invoiceId) {
    try {
      const response = await api.get(`wireTransfer/invoice/${invoiceId}`)
      return response.data
    } catch (error) {
      console.error('Cannot find wire transfers by invoice ID', error)
    }
  }

  static async GetMyWireTransfers() {
    try {
      const response = await api.get(`wireTransfer/my`)
      return response.data
    } catch (error) {
      console.error('Cannot find my wire transfers', error)
    }
  }

  static async GetWireTransferById(id) {
    try {
      const response = await api.get(`wireTransfer/${id}`)
      return response.data
    } catch (error) {
      console.error('Cannot find wire transfer by ID', error)
    }
  }

  static async UpdateWireTransfer(id, data) {
    try {
      const response = await api.put(`wireTransfer/${id}`, data)
      return response.data
    } catch (error) {
      console.error('Cannot update wire transfer', error)
      throw error
    }
  }

  static async DeleteWireTransfer(id) {
    try {
      const response = await api.delete(`wireTransfer/${id}`)
      return response.data
    } catch (error) {
      console.error('Cannot delete wire transfer', error)
    }
  }
}

export default InvoiceService
