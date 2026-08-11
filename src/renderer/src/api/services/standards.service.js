import api from '../api'
import { getBaseURL, getApiUrl } from '../backendConfig'

class StandardsService {
  /**
   * Upload a PDF standard document for processing
   * POST /standards/upload
   * @param {FormData} formData - Contains file, sourceType, projectId, fabricatorId
   */
  static async UploadStandard(formData) {
    try {
      const response = await api.post('standards/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })
      console.log('Upload Standard response:', response.data)
      return response.data
    } catch (error) {
      console.error('Error uploading standard document:', error)
      throw error
    }
  }

  /**
   * Chat with project standards
   * POST /projects/{projectId}/standards/chat
   * @param {string} projectId - UUID of the project
   * @param {string|object} queryData - Query string or object { query: string }
   */
  static async ChatWithStandards(projectId, queryData) {
    try {
      const payload = typeof queryData === 'string' ? { query: queryData } : queryData
      const response = await api.post(`projects/${projectId}/standards/chat`, payload, {
        headers: {
          'Content-Type': 'application/json'
        }
      })
      console.log('Chat with standards response:', response.data)
      return response.data
    } catch (error) {
      console.error('Error chatting with project standards:', error)
      throw error
    }
  }

  /**
   * Get standard chat history for a project
   * GET /projects/{projectId}/standards/chat/history
   * @param {string} projectId - UUID of the project
   */
  static async GetStandardsChatHistory(projectId) {
    try {
      const response = await api.get(`projects/${projectId}/standards/chat/history`, {
        headers: {
          'Content-Type': 'application/json'
        }
      })
      console.log('Standards chat history response:', response.data)
      return response.data
    } catch (error) {
      console.error('Error fetching standards chat history:', error)
      throw error
    }
  }

  /**
   * Fetch standard image securely with Authorization token
   * @param {string} imagePath - Relative or full image path
   * @returns {Promise<Blob>} Image blob
   */
  static async GetStandardImageBlob(imagePath) {
    const token = sessionStorage.getItem('token')
    const baseURL = getBaseURL()
    const apiUrl = getApiUrl()

    let targetUrls = []
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
      targetUrls.push(imagePath)
    } else {
      if (imagePath.startsWith('/api/')) {
        targetUrls.push(`${baseURL}${imagePath}`)
        targetUrls.push(`${apiUrl}${imagePath.replace(/^\/api\//, '')}`)
      } else {
        const cleanPath = imagePath.replace(/^\//, '')
        targetUrls.push(`${apiUrl}${cleanPath}`)
        targetUrls.push(`${baseURL}/${cleanPath}`)
      }
    }

    for (const url of targetUrls) {
      try {
        console.log('[GetStandardImageBlob] Requesting:', url)
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            Authorization: token ? `Bearer ${token}` : ''
          }
        })
        if (response.ok) {
          return await response.blob()
        }
      } catch (err) {
        console.warn('[GetStandardImageBlob] Failed url:', url, err)
      }
    }
    throw new Error('Unable to fetch standard reference image')
  }
}

export default StandardsService
