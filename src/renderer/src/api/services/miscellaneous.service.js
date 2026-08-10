import api from '../api'

class MiscellaneousService {
  // Notifications
  static async Notifications() {
    try {
      const response = await api.get(`notifications`)
      return response.data
    } catch (error) {
      console.error('Error fetching notifications:', error)
      throw error
    }
  }

  // Mark notification as read
  static async MarkNotificationAsRead(id) {
    try {
      const response = await api.patch(`notifications/read/${id}`)
      return response.data
    } catch (error) {
      console.error('Error marking notification as read:', error)
      throw error
    }
  }

  // Share Link
  static async createShareLink(table, parentId, fileId, versionId) {
    try {
      let mappedTable = table;
      if (table === "rfqResponse" || table === "rFQResponse" || table === "rFQresponse") {
        mappedTable = "rFQResponse";
      }
      const url = versionId
        ? `share/${mappedTable}/${parentId}/versions/${versionId}/${fileId}`
        : `share/${mappedTable}/${parentId}/${fileId}`;
      const response = await api.post(url);
      return response.data;
    } catch (error) {
      console.error("Error creating share link:", error);
      throw error;
    }
  }

  // Training endpoints
  static async GetAllTrainingBatches() {
    try {
      const response = await api.get('training')
      return response.data
    } catch (error) {
      console.error('Error fetching all training batches:', error)
      throw error
    }
  }

  static async RequestTraining(payload) {
    try {
      const response = await api.post('training/request', payload, {
        headers: { 'Content-Type': 'application/json' }
      })
      return response.data
    } catch (error) {
      console.error('Error requesting training:', error)
      throw error
    }
  }

  static async GetPendingTraining() {
    try {
      const response = await api.get('training/pending')
      return response.data
    } catch (error) {
      console.error('Error fetching pending training:', error)
      throw error
    }
  }

  static async ApproveTraining(requestId, payload) {
    try {
      const response = await api.post(`training/request/${requestId}/approve`, payload, {
        headers: { 'Content-Type': 'application/json' }
      })
      return response.data
    } catch (error) {
      console.error('Error approving training request:', error)
      throw error
    }
  }

  static async RejectTraining(requestId, payload) {
    try {
      const response = await api.post(`training/request/${requestId}/reject`, payload, {
        headers: { 'Content-Type': 'application/json' }
      })
      return response.data
    } catch (error) {
      console.error('Error rejecting training request:', error)
      throw error
    }
  }

  static async GetTrainingVariance(taskId) {
    try {
      const response = await api.get(`training/variance/${taskId}`)
      return response.data
    } catch (error) {
      console.error('Error fetching training variance:', error)
      throw error
    }
  }

  static async GetSuggestedBatches(departmentId) {
    try {
      const response = await api.get(`training/suggested/${departmentId}`)
      return response.data
    } catch (error) {
      console.error('Error fetching suggested batches:', error)
      throw error
    }
  }

  static async CreateTrainingBatch(payload) {
    try {
      const response = await api.post('training/batch', payload, {
        headers: { 'Content-Type': 'application/json' }
      })
      return response.data
    } catch (error) {
      console.error('Error creating training batch:', error)
      throw error
    }
  }

  static async CompleteTrainingBatch(batchId) {
    try {
      const response = await api.post(`training/batch/${batchId}/complete`, {}, {
        headers: { 'Content-Type': 'application/json' }
      })
      return response.data
    } catch (error) {
      console.error('Error completing training batch:', error)
      throw error
    }
  }

  static async GetMyTrainingBatches() {
    try {
      const response = await api.get('training/my')
      return response.data
    } catch (error) {
      console.error('Error fetching my training batches:', error)
      throw error
    }
  }

  static async GetMonthlyTrainingReport(year, month) {
    try {
      const response = await api.get(`training/report/monthly?year=${year}&month=${month}`)
      return response.data
    } catch (error) {
      console.error('Error fetching monthly training report:', error)
      throw error
    }
  }

  // Vendors
  static async AddVendor(data) {
    try {
      const response = await api.post(`vendors`, data, {
        headers: { 'Content-Type': 'application/json' }
      })
      console.log('Vendor added:', response.data)
      return response.data
    } catch (error) {
      console.error('Error adding vendor:', error)
      throw error
    }
  }

  static async AddVendorWithFiles(formData) {
    try {
      const response = await api.post(`vendors/withFiles`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      console.log('Vendor with files added:', response.data)
      return response.data
    } catch (error) {
      console.error('Error adding vendor with files:', error)
      throw error
    }
  }

  static async GetAllVendors() {
    try {
      const response = await api.get(`vendors/all`, {
        headers: { 'Content-Type': 'application/json' }
      })
      console.log('All vendors fetched:', response.data)
      return response.data
    } catch (error) {
      console.error('Error fetching all vendors:', error)
      throw error
    }
  }

  static async GetVendorById(id) {
    try {
      const response = await api.get(`vendors/${id}`, {
        headers: { 'Content-Type': 'application/json' }
      })
      console.log('Vendor by ID fetched:', response.data)
      return response.data
    } catch (error) {
      console.error('Error fetching vendor by ID:', error)
      throw error
    }
  }

  static async DeleteVendorById(id) {
    try {
      const response = await api.delete(`vendors/delete/${id}`, {
        headers: { 'Content-Type': 'application/json' }
      })
      console.log('Vendor deleted:', response.data)
      return response.data
    } catch (error) {
      console.error('Error deleting vendor:', error)
      throw error
    }
  }

  static async UpdateVendorById(id, data) {
    try {
      const response = await api.put(`vendors/update/${id}`, data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      console.log('Vendor updated:', response.data)
      return response.data
    } catch (error) {
      console.error('Error updating vendor:', error)
      throw error
    }
  }

  static async Getfiles(id, fileid) {
    try {
      const response = await api.get(`vendors/download/${id}/${fileid}`, {
        responseType: 'blob'
      })
      return response.data
    } catch (error) {
      console.error('Error downloading vendor file:', error)
      throw error
    }
  }

  static async DeleteFile(id, fileid) {
    try {
      const response = await api.delete(`vendors/delete/${id}/${fileid}`)
      return response.data
    } catch (error) {
      console.error('Error deleting vendor file:', error)
      throw error
    }
  }

  static async ViewFile(id, fileid) {
    try {
      const response = await api.get(`vendors/viewFile/${id}/${fileid}`, {
        responseType: 'blob'
      })
      return response.data
    } catch (error) {
      console.error('Error viewing vendor file:', error)
      throw error
    }
  }

  // Team Meeting Notes
  static async AddTeamMeetingNotes(formData, fabricatorName, projectName) {
    const token = sessionStorage.getItem('token')
    try {
      const response = await api.post(
        `teamMeetingNotes?fabricatorName=${encodeURIComponent(fabricatorName)}&projectName=${encodeURIComponent(projectName)}`,
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
      throw error
    }
  }

  static async GetTeamMeetingNotesAll() {
    try {
      const response = await api.get(`teamMeetingNotes/all`, {
        headers: {
          'Content-Type': 'application/json'
        }
      })
      console.log('All notes fetched:', response.data)
      return response.data
    } catch (error) {
      console.error('cannot find notes', error)
    }
  }

  static async GetTeamMeetingNotesByProjectId(projectId) {
    try {
      const response = await api.get(`teamMeetingNotes/project/${projectId}`, {
        headers: {
          'Content-Type': 'application/json'
        }
      })
      console.log('All notes by project fetched:', response.data)
      return response.data
    } catch (error) {
      console.error('cannot find notes by project', error)
    }
  }

  static async GetTeamMeetingNotesById(id) {
    try {
      const response = await api.get(`teamMeetingNotes/${id}`, {
        headers: {
          'Content-Type': 'application/json'
        }
      })
      console.log('Note fetched by ID:', response.data)
      return response.data
    } catch (error) {
      console.error('cannot find note by ID', error)
    }
  }

  static async UpdateTeamMeetingNotes(id, data, fabricatorName, projectName) {
    try {
      const response = await api.put(
        `teamMeetingNotes/${id}?fabricatorName=${encodeURIComponent(fabricatorName)}&projectName=${encodeURIComponent(projectName)}`,
        data,
        {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        }
      )
      console.log('Note updated:', response.data)
      return response.data
    } catch (error) {
      console.error('cannot update note', error)
      throw error
    }
  }

  static async DeleteTeamMeetingNotes(id) {
    try {
      const response = await api.delete(`teamMeetingNotes/${id}`, {
        headers: {
          'Content-Type': 'application/json'
        }
      })
      console.log('Note deleted:', response.data)
      return response.data
    } catch (error) {
      console.error('cannot delete note', error)
      throw error
    }
  }

  static async ViewFileNotesTeamMeeting(noteId, fileId) {
    try {
      const response = await api.get(`teamMeetingNotes/viewFile/${noteId}/${fileId}`, {
        responseType: 'blob'
      })
      console.log('File fetched:', response.data)
      return response.data
    } catch (error) {
      console.error('cannot fetch file', error)
    }
  }

  // Team Meeting Response
  static async AddTeamMeetingResponse(notesId, formData, fabricatorName, projectName) {
    const token = sessionStorage.getItem('token')
    try {
      const response = await api.post(
        `teamMeetingNotes/${notesId}/responses?fabricatorName=${encodeURIComponent(fabricatorName)}&projectName=${encodeURIComponent(projectName)}`,
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
      throw error
    }
  }

  static async Getallrepliesforanote(noteId) {
    try {
      const response = await api.get(`teamMeetingNotes/${noteId}/responses`, {
        headers: {
          'Content-Type': 'application/json'
        }
      })
      console.log('All replies fetched:', response.data)
      return response.data
    } catch (error) {
      console.error('cannot find replies', error)
    }
  }

  static async GetallrepliesforanoteByid(id) {
    try {
      const response = await api.get(`teamMeetingNotesResponse/${id}`, {
        headers: {
          'Content-Type': 'application/json'
        }
      })
      console.log('Reply fetched by ID:', response.data)
      return response.data
    } catch (error) {
      console.error('cannot find reply by ID', error)
    }
  }

  static async UpdateTeamMeetingResponse(id, data, fabricatorName, projectName) {
    try {
      const response = await api.put(
        `teamMeetingNotesResponse/${id}?fabricatorName=${encodeURIComponent(fabricatorName)}&projectName=${encodeURIComponent(projectName)}`,
        data,
        {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        }
      )
      console.log('Reply updated:', response.data)
      return response.data
    } catch (error) {
      console.error('cannot update reply', error)
      throw error
    }
  }

  static async DeleteTeamMeetingResponse(id) {
    try {
      const response = await api.delete(`teamMeetingNotesResponse/${id}`, {
        headers: {
          'Content-Type': 'application/json'
        }
      })
      console.log('Reply deleted:', response.data)
      return response.data
    } catch (error) {
      console.error('cannot delete reply', error)
      throw error
    }
  }

  static async ViewFileNotesTeamMeetingResponse(noteId, fileId) {
    try {
      const response = await api.get(`teamMeetingNotesResponse/viewFile/${noteId}/${fileId}`, {
        responseType: 'blob'
      })
      console.log('File fetched:', response.data)
      return response.data
    } catch (error) {
      console.error('cannot fetch file', error)
    }
  }

  // Client Communication Followup
  static async AddClientCommunicationFollowup(data) {
    try {
      const response = await api.post(`clientCommunicationFollowup`, data, {
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

  static async GetClientCommunicationFollowupList() {
    try {
      const response = await api.get(`clientCommunicationFollowup`, {
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

  static async UpdateClientCommunicationFollowup(id, data) {
    try {
      const response = await api.put(`clientCommunicationFollowup/${id}`, data, {
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

  static async MarkClientCommunicationAsCompleted(id) {
    try {
      const response = await api.patch(`clientCommunicationFollowup/${id}`, {
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

  static async GetCommunicationById(id) {
    try {
      const response = await api.get(`clientCommunicationFollowup/${id}`, {
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

  static async DeleteCommunication(id) {
    try {
      const response = await api.delete(`clientCommunicationFollowup/${id}`, {
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
}

export default MiscellaneousService
