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
   * Query project standards (Phase 6, Google-style)
   * POST /projects/{projectId}/standards/query
   * @param {string} projectId - UUID of the project
   * @param {string|object} queryData - Query string or object { query: string }
   */
  static async QueryProjectStandards(projectId, queryData) {
    try {
      const query = typeof queryData === 'string' ? queryData.trim() : queryData?.query?.trim()
      if (!query) {
        throw new Error('Query string is required')
      }

      const payload = typeof queryData === 'object' && queryData !== null
        ? { ...queryData, query }
        : { query }

      const response = await api.post(`projects/${projectId}/standards/query`, payload, {
        headers: {
          'Content-Type': 'application/json'
        }
      })
      console.log('Query project standards response:', response.data)
      return {
        messageId: response.data?.messageId,
        aiSummary: response.data?.aiSummary ?? null,
        deferralReason: response.data?.deferralReason ?? null,
        results: Array.isArray(response.data?.results) ? response.data.results : [],
        ...response.data
      }
    } catch (error) {
      const serverMessage = error.response?.data?.message || error.message
      console.error('Error querying project standards:', serverMessage, error)
      throw error
    }
  }

  /**
   * Alias: Query project standards
   * POST /projects/{projectId}/standards/query
   */
  static async QueryStandards(projectId, queryData) {
    return this.QueryProjectStandards(projectId, queryData)
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
   * Upload a standard document (Phase 6, async)
   * POST /standards/documents
   * @param {FormData|object} data - FormData containing file & metadata, or document payload
   */
  static async UploadStandardDocument(data) {
    try {
      const isFormData = data instanceof FormData
      const response = await api.post('standards/documents', data, {
        headers: {
          ...(isFormData ? { 'Content-Type': 'multipart/form-data' } : { 'Content-Type': 'application/json' })
        }
      })
      console.log('Upload standard document response:', response.data)
      return response.data
    } catch (error) {
      console.error('Error uploading standard document (async):', error)
      throw error
    }
  }

  /**
   * Alias: Upload a standard document (Phase 6, async)
   * POST /standards/documents
   */
  static async UploadStandardDocumentAsync(data) {
    return this.UploadStandardDocument(data)
  }

  /**
   * List standard documents (Phase 6)
   * GET /standards/documents
   * @param {object} [params] - Optional query parameters (status, projectId, fabricatorId, limit, page, etc.)
   */
  static async GetStandardDocuments(params = {}) {
    try {
      const response = await api.get('standards/documents', {
        params,
        headers: {
          'Content-Type': 'application/json'
        }
      })
      console.log('List standard documents response:', response.data)
      return response.data
    } catch (error) {
      console.error('Error listing standard documents:', error)
      throw error
    }
  }

  /**
   * Alias: List standard documents (Phase 6)
   * GET /standards/documents
   */
  static async ListStandardDocuments(params = {}) {
    return this.GetStandardDocuments(params)
  }

  /**
   * Get a single document's status (Phase 6)
   * GET /standards/documents/{id}
   * @param {string} id - Document UUID
   */
  static async GetStandardDocumentById(id) {
    try {
      const response = await api.get(`standards/documents/${id}`, {
        headers: {
          'Content-Type': 'application/json'
        }
      })
      console.log('Get standard document status response:', response.data)
      return response.data
    } catch (error) {
      console.error('Error fetching standard document status:', error)
      throw error
    }
  }

  /**
   * Alias: Get single document status (Phase 6)
   * GET /standards/documents/{id}
   */
  static async GetStandardDocumentStatus(id) {
    return this.GetStandardDocumentById(id)
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
   * Activate a document (Phase 6)
   * POST /standards/documents/{id}/activate
   * @param {string} id - Document UUID
   * @param {object} [payload] - Optional activation payload
   */
  static async ActivateStandardDocument(id, payload = {}) {
    try {
      const response = await api.post(`standards/documents/${id}/activate`, payload, {
        headers: {
          'Content-Type': 'application/json'
        }
      })
      console.log('Activate standard document response:', response.data)
      return response.data
    } catch (error) {
      console.error('Error activating standard document:', error)
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
   * Alias: Get fabricator standards by fabricator ID
   * GET /standards/fabricators/{fabricatorId}/families
   * @param {string} fabricatorId - UUID of the fabricator
   */
  static async GetFabricatorStandards(fabricatorId) {
    return this.GetFabricatorStandardFamilies(fabricatorId)
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
      const familyIds = Array.isArray(preferencesData)
        ? preferencesData
        : preferencesData?.standardFamilyIds || preferencesData?.families || preferencesData?.familyIds || []

      const effectiveTier = tier === 'FABRICATOR' ? 'PROJECT' : tier || undefined

      const payload = {
        standardFamilyIds: familyIds,
        families: familyIds,
        familyIds: familyIds,
        tier: effectiveTier,
        ...(typeof preferencesData === 'object' && !Array.isArray(preferencesData) ? preferencesData : {})
      }

      const targetPath = projectId && projectId !== 'general'
        ? `standards/projects/${projectId}/preferences`
        : 'standards/projects/general/preferences'

      try {
        const response = await api.post(targetPath, payload, {
          params: {
            tier: effectiveTier
          },
          headers: {
            'Content-Type': 'application/json'
          }
        })
        console.log('Set Project Standard Preferences response:', response.data)
        return response.data
      } catch (err1) {
        console.warn(`Primary preference POST endpoint (${targetPath}) failed, trying fallback /standards/preferences:`, err1)
        const response = await api.post('standards/preferences', { ...payload, projectId }, {
          params: {
            tier: effectiveTier
          },
          headers: {
            'Content-Type': 'application/json'
          }
        })
        console.log('Set Standard Preferences fallback response:', response.data)
        return response.data
      }
    } catch (error) {
      console.error('Error setting project standard preferences:', error)
      throw error
    }
  }
}

export default StandardsService

