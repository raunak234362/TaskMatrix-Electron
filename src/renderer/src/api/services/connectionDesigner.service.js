import api from '../api'

class ConnectionDesignerService {
  // Add Connection Designer
  static async AddConnectionDesigner(data) {
    try {
      const response = await api.post(`connectionDesign`, data, {
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

  // Fetch All Connection Designer
  static async FetchAllConnectionDesigner() {
    try {
      const response = await api.get(`connectionDesign/all`, {
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

  // Fetch Connection Designer By ID
  static async FetchConnectionDesignerByID(id) {
    try {
      const response = await api.get(`connectionDesign/${id}`, {
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

  // Fetch Connection Designer By ID
  static async FetchConnectionQuotationByDesignerID(id) {
    try {
      const response = await api.get(`connectionDesignerQuota/designer/${id}`, {
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

  // Update Connection Designer By ID
  static async UpdateConnectionDesignerByID(id, data) {
    try {
      const response = await api.put(`connectionDesign/update/${id}`, data, {
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

  // Get Connection Designer Quota by ID
  static async GetConnectionDesignerQuotaByID(id) {
    try {
      const response = await api.get(`connectionDesignerQuota/${id}`, {
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

  // Connection Designer Quota Approve By ID
  static async ConnectionDesignerQuotaApproveByID(id) {
    try {
      const response = await api.put(`connectionDesignerQuota/approve/${id}`, {
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

  // Add CD Quota Response
  static async addCDQuotaResponse(data) {
    try {
      const isFormData = data instanceof FormData;
      const response = await api.post(`CDQuotaResponse`, data, {
        headers: {
          "Content-Type": isFormData ? "multipart/form-data" : "application/json",
        },
      });
      console.log("CD Quota Response added:", response.data);
      return response.data;
    } catch (error) {
      console.error("cannot add CD Quota Response", error);
      throw error;
    }
  }

  // Get CD Quota Responses by Quota ID
  static async getCDQuotaResponsesByQuotaId(quotaId) {
    try {
      const response = await api.get(`CDQuotaResponse/quota/${quotaId}`, {
        headers: {
          "Content-Type": "application/json",
        },
      });
      console.log("CD Quota Responses by Quota ID fetched:", response.data);
      return response.data;
    } catch (error) {
      console.error("cannot get CD Quota Responses by Quota ID", error);
    }
  }

  // Add CD Quota Response by ID (optional/unused but present in PWA)
  static async getCDQuotaResponseById(id) {
    try {
      const response = await api.get(`CDQuotaResponse/${id}`, {
        headers: {
          "Content-Type": "application/json",
        },
      });
      console.log("CD Quota Response by ID fetched:", response.data);
      return response.data;
    } catch (error) {
      console.error("cannot get CD Quota Response by ID", error);
    }
  }
}

export default ConnectionDesignerService
