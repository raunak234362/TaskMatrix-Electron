import api from '../api'

class InvoiceService {
  // Add Bank Account
  static async AddBankAccount(data) {
    try {
      const response = await api.post(`bank`, data, {
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

  // Add Invoice
  static async AddInvoice(data) {
    try {
      const response = await api.post(`invoice`, data, {
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

  // Get Invoice By ID
  static async GetInvoiceById(id) {
    try {
      const response = await api.get(`invoice/${id}`, {
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

  // Update Invoice by ID
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

  // Get All Invoice
  static async GetAllInvoice() {
    try {
      const response = await api.get(`invoice/all`, {
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

  // Get Bank Accounts
  static async GetBankAccounts() {
    try {
      const response = await api.get(`bank`, {
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

  // Get Bank Account By ID
  static async GetBankAccountById(id) {
    try {
      const response = await api.get(`bank/${id}`, {
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

  // Get Account Info by ID / Fabricator ID
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
