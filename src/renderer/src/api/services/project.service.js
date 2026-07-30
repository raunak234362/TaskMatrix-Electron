import api from '../api'
import SubmittalsService from './Submittals.service'

class ProjectService {
  // Add Project
  static async AddProject(formData, fabricatorName, projectName) {
    const token = sessionStorage.getItem('token')
    try {
      const response = await api.post(
        `project/projects?fabricatorName=${encodeURIComponent(fabricatorName)}&projectName=${encodeURIComponent(projectName)}`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            Authorization: `Bearer ${token}`
          }
        }
      )
      console.log(response)
      return response.data
    } catch (error) {
      console.log(error)
    }
  }

  // Get All Projects
  static async GetAllProjects() {
    try {
      const response = await api.get(`project/projects`, {
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

  // Get Project By ID
  static async GetProjectById(id) {
    try {
      const response = await api.get(`project/projects/${id}`, {
        headers: {
          'Content-Type': 'application/json'
        }
      })
      if (response && response.data && response.data.data) {
        const userRole = sessionStorage.getItem('userRole')?.toLowerCase()
        const promises = [SubmittalsService.GetSubmittalByProjectId(id)]

        if (userRole !== 'staff') {
          promises.push(this.GetProjectManagerAssists(id))
        }

        const results = await Promise.all(promises)
        response.data.data.submittals = results[0] || []

        if (userRole !== 'staff' && results[1] && results[1].length > 0) {
          response.data.data.assists = results[1];
        }
      }
      return response.data
    } catch (error) {
      console.log(error)
    }
  }

  // Get Project Overall Dashboard
  static async GetProjectOverallDashboard(id, stage) {
    try {
      const response = await api.get(`project/${id}/dashboard/${stage}`, {
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

  // Edit Project By ID
  static async EditProjectById(id, data) {
    try {
      const response = await api.put(`project/projects/${id}`, data)
      console.log(response)
      return response.data
    } catch (error) {
      console.log(error)
    }
  }

  // Archive Project Files By ID
  static async ArchiveProject(id) {
    try {
      const response = await api.post(`project/projects/${id}/archive`, {}, {
        headers: {
          'Content-Type': 'application/json'
        }
      })
      console.log('Project archived:', response.data)
      return response.data
    } catch (error) {
      console.error('Error archiving project:', error)
      throw error
    }
  }

  // Award Project By ID
  static async AwardProject(id) {
    try {
      const response = await api.patch(`project/projects/${id}/award`)
      console.log(response)
      return response.data
    } catch (error) {
      console.log(error)
    }
  }

  // Add Project Manager Assists
  static async AddProjectManagerAssists(id, data) {
    try {
      const response = await api.post(`project/projects/${id}/assists`, data)
      console.log(response)
      return response.data
    } catch (error) {
      console.log(error)
    }
  }

  // Get Project Manager Assists
  static async GetProjectManagerAssists(id) {
    try {
      const response = await api.get(`project/projects/${id}/assists`, {
        headers: {
          'Content-Type': 'application/json'
        }
      })
      console.log(response)
      return response.data?.data || []
    } catch (error) {
      console.log(error)
    }
  }

  // Update Project Manager Assists User
  static async UpdateProjectManagerAssistsUser(id, userId, data) {
    try {
      const response = await api.put(`project/projects/${id}/assists/${userId}`, data, {
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

  // Delete Project Manager Assists User
  static async DeleteProjectManagerAssistsUser(id, userId) {
    try {
      const response = await api.delete(`project/projects/${id}/assists/${userId}`, {
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

  static async RemoveProjectAssist(projectId, userId) {
    try {
      const response = await api.delete(`project/projects/${projectId}/assists/${userId}`)
      return response.data
    } catch (error) {
      console.error('Error removing project assist', error)
      throw error
    }
  }

  // Get Project Notes
  static async GetProjectNotes(projectId) {
    try {
      const response = await api.get(`project/projects/${projectId}/notes`, {
        headers: {
          'Content-Type': 'application/json'
        }
      })
      console.log(' Project notes fetched', response.data)
      return response.data
    } catch (error) {
      console.log(error)
    }
  }

  // Get Project Note By ID
  static async GetProjectNoteById(projectId, noteId) {
    try {
      const response = await api.get(`project/projects/${projectId}/notes/${noteId}`, {
        headers: {
          'Content-Type': 'application/json'
        }
      })
      console.log(' Project note fetched', response.data)
      return response.data
    } catch (error) {
      console.log(error)
    }
  }

  // Create Project Note
  static async CreateProjectNote(projectId, data, fabricatorName, projectName) {
    const token = sessionStorage.getItem('token')
    try {
      const response = await api.post(`project/projects/${projectId}/notes?fabricatorName=${encodeURIComponent(fabricatorName)}&projectName=${encodeURIComponent(projectName)}`, data, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`
        }
      })
      console.log(' Project note created', response.data)
      return response.data
    } catch (error) {
      console.log(error)
    }
  }

  // Project Progress Report Endpoints
  static async createProjectProgressReport(data) {
    try {
      const response = await api.post('projectProgressReport', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      return response.data
    } catch (error) {
      console.error('Error creating project progress report:', error)
      throw error
    }
  }

  static async getAllProjectProgressReports() {
    try {
      const response = await api.get('projectProgressReport')
      return response.data
    } catch (error) {
      console.error('Error fetching all project progress reports:', error)
      throw error
    }
  }

  static async getProjectProgressReportsByProjectId(projectId) {
    try {
      const response = await api.get(`projectProgressReport/project/${projectId}`)
      return response.data
    } catch (error) {
      console.error('Error fetching progress reports by project ID:', error)
      throw error
    }
  }

  static async getProjectProgressReportById(id) {
    try {
      const response = await api.get(`projectProgressReport/${id}`)
      return response.data
    } catch (error) {
      console.error('Error fetching project progress report by ID:', error)
      throw error
    }
  }

  static async updateProjectProgressReport(id, data) {
    try {
      const response = await api.patch(`projectProgressReport/${id}`, data)
      return response.data
    } catch (error) {
      console.error('Error updating project progress report:', error)
      throw error
    }
  }

  static async deleteProjectProgressReport(id) {
    try {
      const response = await api.delete(`projectProgressReport/${id}`)
      return response.data
    } catch (error) {
      console.error('Error deleting project progress report:', error)
      throw error
    }
  }

  static async createProjectProgressReportResponse(data) {
    try {
      const response = await api.post('projectProgressReport/response', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      return response.data
    } catch (error) {
      console.error('Error creating project progress report response:', error)
      throw error
    }
  }

  static async getProjectProgressReportResponseById(id) {
    try {
      const response = await api.get(`projectProgressReport/response/${id}`)
      return response.data
    } catch (error) {
      console.error('Error fetching progress report response by ID:', error)
      throw error
    }
  }

  static async updateProjectProgressReportResponse(id, data) {
    try {
      const response = await api.patch(`projectProgressReport/response/${id}`, data)
      return response.data
    } catch (error) {
      console.error('Error updating progress report response:', error)
      throw error
    }
  }

  static async deleteProjectProgressReportResponse(id) {
    try {
      const response = await api.delete(`projectProgressReport/response/${id}`)
      return response.data
    } catch (error) {
      console.error('Error deleting progress report response:', error)
      throw error
    }
  }

  static async getResponsesByReportId(reportId) {
    try {
      const response = await api.get(`projectProgressReport/report/${reportId}/responses`)
      return response.data
    } catch (error) {
      console.error('Error fetching responses by report ID:', error)
      throw error
    }
  }

  // Coordination Drawing Endpoints
  static async createCoordinationDrawing(data, fabricatorName, projectName) {
    try {
      const response = await api.post(`coordinationDrawing?fabricatorName=${encodeURIComponent(fabricatorName)}&projectName=${encodeURIComponent(projectName)}`, data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      return response.data
    } catch (error) {
      console.error('Error creating coordination drawing:', error)
      throw error
    }
  }

  static async getAllCoordinationDrawings() {
    try {
      const response = await api.get('coordinationDrawing')
      return response.data
    } catch (error) {
      console.error('Error fetching all coordination drawings:', error)
      throw error
    }
  }

  static async getCoordinationDrawingsByProjectId(projectId) {
    try {
      const response = await api.get(`coordinationDrawing/project/${projectId}`)
      return response.data
    } catch (error) {
      console.error('Error fetching coordination drawings by project ID:', error)
      throw error
    }
  }

  static async getCoordinationDrawingById(id) {
    try {
      const response = await api.get(`coordinationDrawing/${id}`)
      return response.data
    } catch (error) {
      console.error('Error fetching coordination drawing by ID:', error)
      throw error
    }
  }

  static async updateCoordinationDrawing(id, data, fabricatorName, projectName) {
    try {
      const response = await api.patch(`coordinationDrawing/${id}?fabricatorName=${encodeURIComponent(fabricatorName)}&projectName=${encodeURIComponent(projectName)}`, data)
      return response.data
    } catch (error) {
      console.error('Error updating coordination drawing:', error)
      throw error
    }
  }

  static async deleteCoordinationDrawing(id) {
    try {
      const response = await api.delete(`coordinationDrawing/${id}`)
      return response.data
    } catch (error) {
      console.error('Error deleting coordination drawing:', error)
      throw error
    }
  }

  static async createCoordinationDrawingResponse(data, fabricatorName, projectName) {
    try {
      const response = await api.post(`coordinationDrawing/response?fabricatorName=${encodeURIComponent(fabricatorName)}&projectName=${encodeURIComponent(projectName)}`, data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      return response.data
    } catch (error) {
      console.error('Error creating coordination drawing response:', error)
      throw error
    }
  }

  static async getCoordinationDrawingResponseById(id) {
    try {
      const response = await api.get(`coordinationDrawing/response/${id}`)
      return response.data
    } catch (error) {
      console.error('Error fetching drawing response by ID:', error)
      throw error
    }
  }

  static async updateCoordinationDrawingResponse(id, data, fabricatorName, projectName) {
    try {
      const response = await api.patch(`coordinationDrawing/response/${id}?fabricatorName=${encodeURIComponent(fabricatorName)}&projectName=${encodeURIComponent(projectName)}`, data)
      return response.data
    } catch (error) {
      console.error('Error updating drawing response:', error)
      throw error
    }
  }

  static async deleteCoordinationDrawingResponse(id) {
    try {
      const response = await api.delete(`coordinationDrawing/response/${id}`)
      return response.data
    } catch (error) {
      console.error('Error deleting drawing response:', error)
      throw error
    }
  }

  static async getResponsesByDrawingId(drawingId) {
    try {
      const response = await api.get(`coordinationDrawing/drawing/${drawingId}/responses`)
      return response.data
    } catch (error) {
      console.error('Error fetching responses by drawing ID:', error)
      throw error
    }
  }

  // Create new Design Drawing
  static async CreateDesignDrawing(data, fabricatorName, projectName) {
    try {
      const response = await api.post(`designDrawings?fabricatorName=${encodeURIComponent(fabricatorName)}&projectName=${encodeURIComponent(projectName)}`, data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      return response.data
    } catch (error) {
      console.error('Error creating design drawing:', error)
      throw error
    }
  }

  // Update stage / description of a Design Drawing
  static async UpdateDesignDrawing(id, data, fabricatorName, projectName) {
    try {
      const response = await api.put(`designDrawings/${id}?fabricatorName=${encodeURIComponent(fabricatorName)}&projectName=${encodeURIComponent(projectName)}`, data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      return response.data
    } catch (error) {
      console.error('Error updating design drawing:', error)
      throw error
    }
  }

  // Get all Design Drawings (Admin)
  static async GetAllDesignDrawings() {
    try {
      const response = await api.get(`designDrawings`)
      return response.data
    } catch (error) {
      console.error('Error fetching all design drawings:', error)
      throw error
    }
  }

  // Get All Documents by Project ID
  static async GetAllDocumentsByProjectId(projectId) {
    try {
      const response = await api.get(`project/getAllDocuments/${projectId}`, {
        headers: {
          "Content-Type": "application/json",
        },
      });
      console.log(response);
      return response.data;
    } catch (error) {
      console.log(error);
    }
  }

  // Get Design Drawings by Project ID
  static async GetDesignDrawingsByProjectId(projectId) {
    try {
      const response = await api.get(`designDrawings/project/${projectId}`)
      return response.data
    } catch (error) {
      console.error('Error fetching design drawings by project ID:', error)
      throw error
    }
  }

  // Get a single Design Drawing by ID
  static async GetDesignDrawingById(id) {
    try {
      const response = await api.get(`designDrawings/${id}`)
      return response.data
    } catch (error) {
      console.error('Error fetching design drawing by ID:', error)
      throw error
    }
  }

  // Delete a Design Drawing
  static async DeleteDesignDrawing(id) {
    try {
      const response = await api.delete(`designDrawings/${id}`)
      return response.data
    } catch (error) {
      console.error('Error deleting design drawing:', error)
      throw error
    }
  }

  // Get file metadata (from Design Drawing)
  static async GetDesignDrawingFileMetadata(designId, fileId) {
    try {
      const response = await api.get(`designDrawings/${designId}/files/${fileId}`)
      return response.data
    } catch (error) {
      console.error('Error fetching design drawing file metadata:', error)
      throw error
    }
  }

  // Stream file (from Design Drawing)
  static async ViewDesignDrawingFile(designId, fileId) {
    try {
      const response = await api.get(`designDrawings/viewFile/${designId}/${fileId}`)
      return response.data
    } catch (error) {
      console.error('Error viewing design drawing file:', error)
      throw error
    }
  }

  // BFA (Bid for Approval) API methods
  static async AddBFA(formData, fabricatorName, projectName) {
    const response = await api.post(`bfa?fabricatorName=${encodeURIComponent(fabricatorName)}&projectName=${encodeURIComponent(projectName)}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
    return response.data
  }

  static async GetAllBFA() {
    try {
      const response = await api.get(`bfa`)
      return response.data
    } catch (error) {
      console.error('Cannot find BFAs', error)
    }
  }

  static async GetBFAById(id) {
    try {
      const response = await api.get(`bfa/${id}`)
      return response.data
    } catch (error) {
      console.error('Cannot find BFA by ID', error)
    }
  }

  static async UpdateBFA(id, formData, fabricatorName, projectName) {
    try {
      const response = await api.put(`bfa/${id}?fabricatorName=${encodeURIComponent(fabricatorName)}&projectName=${encodeURIComponent(projectName)}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })
      return response.data
    } catch (error) {
      console.error('Cannot update BFA', error)
      throw error
    }
  }

  static async DeleteBFA(id) {
    try {
      const response = await api.delete(`bfa/${id}`)
      return response.data
    } catch (error) {
      console.error('Cannot delete BFA', error)
    }
  }

  static async GetBFABySubmittalId(submittalId) {
    try {
      const response = await api.get(`bfa/submittal/${submittalId}`)
      return response.data
    } catch (error) {
      if (error?.response?.status !== 404) {
        console.error('Cannot find BFA by Submittal ID', error)
      }
      return null
    }
  }

  static GetBFAFileViewUrl(bfaId, versionId, fileId) {
    const baseURL = api.defaults.baseURL || ''
    return `${baseURL}bfa/viewFile/${bfaId}/${versionId}/${fileId}`
  }

  static async CreateBFA(formData) {
    const token = sessionStorage.getItem('token')
    try {
      const response = await api.post(`bfa/`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`
        }
      })
      return response.data
    } catch (error) {
      console.error('Error creating BFA:', error)
      throw error
    }
  }

  static async GetAllBFAs() {
    try {
      const response = await api.get(`bfa/`, {
        headers: {
          'Content-Type': 'application/json'
        }
      })
      return response.data
    } catch (error) {
      console.error('Error getting all BFAs:', error)
      throw error
    }
  }

  static async UpdateBFAById(id, formData) {
    try {
      const response = await api.put(`bfa/${id}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })
      return response.data
    } catch (error) {
      console.error('Error updating BFA by ID:', error)
      throw error
    }
  }

  static async DeleteBFAById(id) {
    try {
      const response = await api.delete(`bfa/${id}`, {
        headers: {
          'Content-Type': 'application/json'
        }
      })
      return response.data
    } catch (error) {
      console.error('Error deleting BFA by ID:', error)
      throw error
    }
  }

  static async ViewBFAFile(bfaId, versionId, fileId) {
    try {
      const response = await api.get(`bfa/viewFile/${bfaId}/${versionId}/${fileId}`, {
        headers: {
          'Content-Type': 'application/json'
        }
      })
      return response.data
    } catch (error) {
      console.error('Error viewing BFA file:', error)
      throw error
    }
  }
}

export default ProjectService

