import api from '../api'

class WBSTemplateService {
  // Get WBS template list
  static async GetWBSTemplate() {
    try {
      const response = await api.get(`wbsTemplates/admin/templates/bundles`, {
        headers: {
          'Content-Type': 'application/json'
        }
      })
      console.log(' wbs fetched:', response.data)
      return response.data
    } catch (error) {
      console.error('cannot find wbs templates', error)
    }
  }

  //Get Bundle Templates with WBS + LINEITEM
  static async GetBundleTemplateWithItems() {
    try {
      const response = await api.get(`project/wbs/bundles`, {
        headers: {
          'Content-Type': 'application/json'
        }
      })
      console.log(' WBS fetched:', response.data)
      return response.data
    } catch (error) {
      console.error('cannot find wbs templates', error)
    }
  }

  //Post Expands WBS + LINEITEM in project
  static async PostExpandedBundles(projectId, data) {
    try {
      const response = await api.post(`project/projects/${projectId}/wbs/expand`, data, {
        headers: {
          'Content-Type': 'application/json'
        }
      })
      console.log(' Expanded WBS posted:', response.data)
      return response.data
    } catch (error) {
      console.error('cannot find expanded wbs', error)
      throw error
    }
  }

  // Get WBS Line Item by ID
  static async GetWBSLineItem(wbsId) {
    try {
      const response = await api.get(`project/project-wbs/${wbsId}/line-items`, {
        headers: {
          'Content-Type': 'application/json'
        }
      })
      console.log(' WBS line item fetched:', response.data)
      return response.data
    } catch (error) {
      console.error('cannot find wbs line item', error)
    }
  }

  // add new WBS template Item
  static async AddWBSTemplateItem(data) {
    try {
      const response = await api.post(`wbsTemplates/admin/templates/wbs`, data, {
        headers: {
          'Content-Type': 'application/json'
        }
      })
      console.log(' WBS added:', response.data)
      return response.data
    } catch (error) {
      console.error('cannot find wbs templates', error)
    }
  }

  // sync WBS with DB
  static async SyncWBS(projectId) {
    try {
      const response = await api.post(`project/projects/${projectId}/wbs/sync`, {
        headers: {
          'Content-Type': 'application/json'
        }
      })
      console.log(' WBS synced:', response.data)
      return response.data
    } catch (error) {
      console.error('cannot sync wbs', error)
    }
  }

  // getBundleByProjectId
  static async GetBundleByProjectId(projectId) {
    try {
      const response = await api.get(`project/projects/${projectId}/bundles`, {
        headers: {
          'Content-Type': 'application/json'
        }
      })
      console.log(' WBS bundles fetched:', response.data)
      return response.data
    } catch (error) {
      console.error('cannot find wbs bundles', error)
    }
  }

  
//------------------------------
  // Update WBS Line Item
  static async UpdateLineItem(id, data) {
    try {
      const response = await api.patch(`project/line-items/${id}`, data, {
        headers: {
          'Content-Type': 'application/json'
        }
      })
      console.log(' WBS line item updated:', response.data)
      return response.data
    } catch (error) {
      console.error('cannot update wbs line item', error)
    }
  }

  // Add new Line item in WBS template
  static async AddNewWBSLineItems(data) {
    try {
      const response = await api.post(`wbsTemplates/admin/templates/line-items`, data, {
        headers: {
          'Content-Type': 'application/json'
        }
      })
      console.log(' WBS line item added:', response.data)
      return response.data
    } catch (error) {
      console.error('cannot add wbs line item', error)
    }
  }

  // add new WBS template
  static async AddWBSTemplate(data) {
    try {
      const response = await api.post(`wbs-template/create`, data, {
        headers: {
          'Content-Type': 'application/json'
        }
      })
      console.log(' WBS added:', response.data)
      return response.data
    } catch (error) {
      console.error('cannot find wbs templates', error)
    }
  }

  
  // add wbs in project:
  static async AddWBSInProject(projectId) {
    try {
      const response = await api.post(`wbs/project/${projectId}`, {
        headers: {
          'Content-Type': 'application/json'
        }
      })
      console.log(' WBS added to project:', response.data)
      return response.data
    } catch (error) {
      console.error('cannot add wbs to project', error)
    }
  }

  // Get WBS by Project ID
  static async GetWBSByProjectId(projectId) {
    try {
      const response = await api.get(`wbs/project/${projectId}`, {
        headers: {
          'Content-Type': 'application/json'
        }
      })
      console.log(' WBS fetched:', response.data)
      return response.data
    } catch (error) {
      console.error('cannot find wbs', error)
    }
  }

  // Get WBS by ID
  static async GetWBSById(id) {
    try {
      const response = await api.get(`wbs/${id}`, {
        headers: {
          'Content-Type': 'application/json'
        }
      })
      console.log(' WBS fetched by ID:', response.data)
      return response.data
    } catch (error) {
      console.error('cannot find wbs', error)
    }
  }

  // wbsLineItemByProjectID
  static async GetWBSLineItemById(projectId, id, stage) {
    try {
      const response = await api.get(`project/project-wbs/${id}/line-items`, {
        headers: {
          'Content-Type': 'application/json'
        }
      })
      console.log(' WBS line item fetched by ID:', response.data)
      return response.data
    } catch (error) {
      console.error('cannot find wbs line item', error)
    }
  }

  // Update WBS line item by WBS ID and Line Item ID
  static async UpdateWBSLineItem(projectId, wbsId, lineItemId, data) {
    try {
      const response = await api.put(`wbs/line-item/${projectId}/${wbsId}/${lineItemId}`, data, {
        headers: {
          'Content-Type': 'application/json'
        }
      })
      console.log(' WBS line item updated:', response.data)
      return response.data
    } catch (error) {
      console.error('cannot update wbs line item', error)
    }
  }
}

export default WBSTemplateService
