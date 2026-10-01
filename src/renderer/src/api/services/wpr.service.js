import api from '../api'

class WPRService {
  /**
   * 1. Get Project Report Weeks
   * Calculates and returns the list of reporting weeks (Monday–Sunday) for a project
   * dynamically from its timeline up to the current week in the configured WPR timezone.
   * Nothing is stored in the database for this endpoint — calculated dynamically on the fly.
   *
   * @param {string} projectId - UUID of the project
   * @returns {Promise<Object>} Response data containing status and weeks array
   */
  static async GetProjectReportWeeks(projectId) {
    try {
      const response = await api.get(`wpr/projects/${projectId}/weeks`, {
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json'
        }
      })
      console.log('Project report weeks fetched:', response.data)
      return response.data
    } catch (error) {
      console.error('Error fetching project report weeks:', error)
      throw error
    }
  }

  // Alias for GetProjectReportWeeks
  static async GetProjectWeeks(projectId) {
    return this.GetProjectReportWeeks(projectId)
  }

  /**
   * 2. Download Weekly Progress Report PDF
   * Generates and streams a Weekly Progress Report (WPR) PDF on demand for the specified project
   * and optional week ending date (snapped to that week's Sunday).
   * Nothing is stored or cached on disk/DB — the PDF is generated in-memory and streamed directly.
   *
   * @param {string} projectId - UUID of the project
   * @param {string} [weekEnding] - Optional YYYY-MM-DD date (snapped to Sunday)
   * @returns {Promise<Blob>} Binary PDF blob stream
   */
  static async DownloadReportPdf(projectId, weekEnding) {
    try {
      const response = await api.get(`wpr/projects/${projectId}/report.pdf`, {
        params: weekEnding ? { weekEnding } : {},
        headers: {
          Accept: 'application/pdf'
        },
        responseType: 'blob'
      })
      return response.data
    } catch (error) {
      console.error('Error downloading WPR report PDF:', error)
      throw error
    }
  }

  // Alias for DownloadReportPdf
  static async GetReportPdf(projectId, weekEnding) {
    return this.DownloadReportPdf(projectId, weekEnding)
  }

  /**
   * 3. Get Weekly Progress Report JSON Data
   * Assembles and returns Weekly Progress Report data (RFIs, Schedule/Milestones/Submittals, Change Orders)
   * as JSON for the specified week. Assembled dynamically on the fly from current project records.
   *
   * @param {string} projectId - UUID of the project
   * @param {string} [weekEnding] - Optional YYYY-MM-DD date (snapped to Sunday)
   * @returns {Promise<Object>} Assembled report JSON data ({ meta, rfi, schedule, changeOrders })
   */
  static async GetReportJson(projectId, weekEnding) {
    try {
      const response = await api.get(`wpr/projects/${projectId}/report.json`, {
        params: weekEnding ? { weekEnding } : {},
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json'
        }
      })
      console.log('WPR report JSON fetched:', response.data)
      return response.data
    } catch (error) {
      console.error('Error fetching WPR report JSON:', error)
      throw error
    }
  }

  // Alias for GetReportJson
  static async GetReportData(projectId, weekEnding) {
    return this.GetReportJson(projectId, weekEnding)
  }

  /**
   * 4. List WPR Automated Deliveries
   * Retrieves a paginated list of automated Weekly Progress Report email delivery logs.
   *
   * @param {Object} [params={}] - Query parameters
   * @param {string} [params.fabricatorId] - Filter deliveries by fabricator ID (UUID)
   * @param {string} [params.projectId] - Filter deliveries by project ID (UUID)
   * @param {('PENDING'|'SENT'|'FAILED'|'SKIPPED')} [params.status] - Filter deliveries by status
   * @param {number} [params.page=1] - Page number (default: 1)
   * @param {number} [params.limit=20] - Items per page (default: 20)
   * @returns {Promise<Object>} Paginated delivery records and metadata
   */
  static async GetDeliveryLogs(params = {}) {
    try {
      const {
        fabricatorId,
        projectId,
        status,
        page = 1,
        limit = 20
      } = typeof params === 'object' && params !== null ? params : {}

      const queryParams = { page, limit }
      if (fabricatorId) queryParams.fabricatorId = fabricatorId
      if (projectId) queryParams.projectId = projectId
      if (status) queryParams.status = status

      const response = await api.get('wpr/deliveries', {
        params: queryParams,
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json'
        }
      })
      console.log('WPR deliveries fetched:', response.data)
      return response.data
    } catch (error) {
      console.error('Error fetching WPR deliveries:', error)
      throw error
    }
  }

  // Alias for GetDeliveryLogs
  static async GetDeliveries(params) {
    return this.GetDeliveryLogs(params)
  }
}

export default WPRService