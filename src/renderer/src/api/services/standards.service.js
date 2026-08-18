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
   * Get a standard document image page
   * GET /standards/image/{documentId}/{pageNumber}
   * @param {string} documentId - UUID of the document
   * @param {number|string} pageNumber - Page number
   */
  static async GetStandardImagePage(documentId, pageNumber) {
    try {
      const response = await api.get(`standards/image/${documentId}/${pageNumber}`, {
        responseType: 'blob',
        headers: {
          'Content-Type': 'application/json'
        }
      })
      console.log('Get Standard Image Page response blob:', response.data)
      return response.data
    } catch (error) {
      console.error('Error fetching standard document image page:', error)
      throw error
    }
  }

  /**
   * Fetch standard image securely with Authorization token
   * @param {string} imagePath - Relative or full image path
   * @returns {Promise<Blob>} Image blob
   */
  static async GetStandardImageBlob(imagePath) {
    // Check if path matches /standards/image/{documentId}/{pageNumber} pattern
    const imagePageMatch = imagePath.match(/standards\/image\/([^/]+)\/([^/]+)/)
    if (imagePageMatch) {
      const [, docId, pageNum] = imagePageMatch
      return await this.GetStandardImagePage(docId, pageNum)
    }

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

  /**
   * Get document ingestion progress
   * GET /standards/documents/{id}/progress
   * @param {string} id - Document UUID
   */
  static async GetDocumentProgress(id) {
    try {
      const response = await api.get(`standards/documents/${id}/progress`, {
        headers: {
          'Content-Type': 'application/json'
        }
      })
      console.log('Document progress response:', response.data)
      return response.data
    } catch (error) {
      console.error('Error fetching document progress:', error)
      throw error
    }
  }

  /**
   * Get standard preferences for a project
   * GET /standards/projects/{projectId}/preferences
   * @param {string} projectId - UUID of the project
   * @param {string} [tier] - Standard tier query param (e.g. 'GENERAL' or 'PROJECT')
   */
  static async GetProjectStandardPreferences(projectId, tier) {
    try {
      const effectiveTier = tier === 'FABRICATOR' ? 'PROJECT' : tier || undefined
      const response = await api.get(`standards/projects/${projectId}/preferences`, {
        params: {
          tier: effectiveTier
        },
        headers: {
          'Content-Type': 'application/json'
        }
      })
      console.log('Get Project Standard Preferences response:', response.data)
      return response.data
    } catch (error) {
      console.error('Error fetching project standard preferences:', error)
      throw error
    }
  }

  /**
   * Get available standard families
   * GET /standards/families
   * @param {string} [tier] - Filter by standard tier (GENERAL or PROJECT)
   * @param {string} [projectId] - Required when tier is PROJECT
   */
  static async GetAvailableStandardFamilies(tier, projectId) {
    try {
      const response = await api.get('standards/families', {
        params: {
          tier: tier || undefined,
          projectId: projectId || undefined
        },
        headers: {
          'Content-Type': 'application/json'
        }
      })
      console.log('Get Available Standard Families response:', response.data)
      return response.data
    } catch (error) {
      console.error('Error fetching available standard families:', error)
      throw error
    }
  }
  /**
   * Get available standard families for a specific fabricator
   * GET /standards/fabricators/{fabricatorId}/families
   * @param {string} fabricatorId - UUID of the fabricator
   */
  static async GetFabricatorStandardFamilies(fabricatorId) {
    try {
      const response = await api.get(`standards/fabricators/${fabricatorId}/families`, {
        headers: {
          'Content-Type': 'application/json'
        }
      })
      console.log('Get Fabricator Standard Families response:', response.data)
      return response.data
    } catch (error) {
      console.error('Error fetching fabricator standard families:', error)
      throw error
    }
  }
  /**
   * Set standard preferences for a project
   * POST /standards/projects/{projectId}/preferences
   * @param {string} projectId - UUID of the project
   * @param {object|Array} preferencesData - { standardFamilyIds: string[] } or array of family ID strings
   * @param {string} [tier] - Standard tier query param (e.g. 'GENERAL' or 'PROJECT')
   */
  static async SetProjectStandardPreferences(projectId, preferencesData, tier) {
    try {
      const payload = Array.isArray(preferencesData)
        ? { standardFamilyIds: preferencesData }
        : preferencesData

      const effectiveTier = tier === 'FABRICATOR' ? 'PROJECT' : tier || undefined

      const response = await api.post(`standards/projects/${projectId}/preferences`, payload, {
        params: {
          tier: effectiveTier
        },
        headers: {
          'Content-Type': 'application/json'
        }
      })
      console.log('Set Project Standard Preferences response:', response.data)
      return response.data
    } catch (error) {
      console.error('Error setting project standard preferences:', error)
      throw error
    }
  }
}

export default StandardsService

