import Service from '../api/Service'
import { toast } from 'react-toastify'

const getDownloadUrl = (table, parentId, fileId, versionId) => {
  const baseURL = import.meta.env.VITE_BASE_URL?.replace(/\/$/, '')
  switch (table) {
    case 'project':
      return `${baseURL}/project/viewFile/${parentId}/${fileId}`
    case 'estimation':
      return `${baseURL}/estimation/viewFile/${parentId}/${fileId}`
    case 'rFI':
    case 'RFI':
      return `${baseURL}/rfi/viewfile/${parentId}/${fileId}`
    case 'rFIResponse':
      return `${baseURL}/rfi/response/viewfile/${parentId}/${fileId}`
    case 'submittals':
      return `${baseURL}/submittal/${parentId}/versions/${versionId}/${fileId}`
    case 'submittalsResponse':
    case 'submittal/response':
      return `${baseURL}/submittal/response/${parentId}/viewfile/${fileId}`
    case 'rFQ':
      return `${baseURL}/rfq/viewFile/${parentId}/${fileId}`
    case 'rfqResponse':
    case 'rfq/response':
      return `${baseURL}/rfq/response/viewFile/${parentId}/${fileId}`
    case 'changeOrders':
    case 'changeOrder/response':
    case 'cOResponse':
      return `${baseURL}/co/viewfile/${parentId}/${fileId}`
    case 'projectNotes':
      return `${baseURL}/projectNotes/note/viewfile/${parentId}/${fileId}`
    case 'connection-designer':
      return `${baseURL}/connectionDesign/viewFile/${parentId}/${fileId}`
    case 'designDrawings':
    case 'design-drawings':
      return `${baseURL}/notes/viewfile/${parentId}/${fileId}`
    default:
      return `${baseURL}/${table}/viewFile/${parentId}/${fileId}`
  }
}

export const openFileSecurely = async (type, id, fileId, versionId) => {
  const downloadUrl = getDownloadUrl(type, id, fileId, versionId)
  try {
    const token = sessionStorage.getItem('token')
    if (!token) {
      toast.error('Authentication token missing')
      return
    }

    const response = await fetch(downloadUrl, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`
      }
    })

    if (!response.ok) {
      throw new Error('Failed to fetch file')
    }

    const blob = await response.blob()
    const fileURL = window.URL.createObjectURL(blob)
    window.open(fileURL, '_blank', 'noopener,noreferrer')
  } catch (err) {
    console.error('File open failed:', err)
    toast.error('Unable to open file')
  }
}

export const downloadFileSecurely = async (type, id, fileId, originalName, versionId) => {
  const downloadUrl = getDownloadUrl(type, id, fileId, versionId)
  try {
    const token = sessionStorage.getItem('token')
    if (!token) {
      toast.error('Authentication token missing')
      return
    }

    const response = await fetch(downloadUrl, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })

    if (!response.ok) throw new Error('Download failed')

    const blob = await response.blob()
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = originalName || 'download'
    document.body.appendChild(a)
    a.click()
    window.URL.revokeObjectURL(url)
    document.body.removeChild(a)
    toast.success('Download started')
  } catch (error) {
    console.error('Error downloading file:', error)
    toast.error('Error downloading file')
  }
}

export const shareFileSecurely = async (type, id, fileId, versionId) => {
  try {
    const response = type === 'submittals'
      ? await Service.createShareLink('submittalVersion', versionId, fileId)
      : await Service.createShareLink(type, id, fileId, versionId)
    if (response?.shareUrl) {
      await navigator.clipboard.writeText(response.shareUrl)
      toast.success('Link copied to clipboard!')
    } else {
      toast.error('Failed to generate link')
    }
  } catch (error) {
    console.error('Error sharing file:', error)
    toast.error('Error generating share link')
  }
}
