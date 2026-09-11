import store from '../store/store'

/**
 * Utilities for role and designation checks, with special handling for CHECKER and MODELER designations.
 */

/**
 * Checks if a given designation string represents a CHECKER or MODELER
 * (e.g., "Checker", "Junior Checker", "Senior Checker", "Modeler", "Junior Modeler", "Senior Modeler", etc.)
 */
export const isCheckerOrModelerDesignation = (designation) => {
  if (!designation || typeof designation !== 'string') return false
  const d = designation.trim().replace(/^["']|["']$/g, '').toUpperCase()
  if (!d || d === 'UNDEFINED' || d === 'NULL' || d === '—' || d === 'N/A') return false
  return d.includes('CHECK') || d.includes('MODEL')
}

/**
 * Checks if the currently logged-in user has a CHECKER or MODELER designation.
 * Checks sessionStorage, Redux userDetail, and Redux staffData.
 */
export const isCurrentCheckerOrModeler = (explicitStaffData = null, explicitUserDetail = null) => {
  // 1. Direct check in sessionStorage designation
  const designation = sessionStorage.getItem('designation')
  if (designation && isCheckerOrModelerDesignation(designation)) return true

  // 2. Direct check in sessionStorage userRole (in case role was set to CHECKER or MODELER)
  const role = sessionStorage.getItem('userRole')
  if (role && isCheckerOrModelerDesignation(role)) return true

  // 3. Check explicit userDetail or Redux userDetail
  let reduxState = null
  try {
    if (store && typeof store.getState === 'function') {
      reduxState = store.getState()
    }
  } catch (e) {
    console.error('Error getting store state in designationUtils:', e)
  }

  const userDetail = explicitUserDetail || reduxState?.userInfo?.userDetail
  if (userDetail) {
    if (isCheckerOrModelerDesignation(userDetail.designation)) {
      try {
        sessionStorage.setItem('designation', userDetail.designation)
      } catch {}
      return true
    }
    if (isCheckerOrModelerDesignation(userDetail.role)) return true
  }

  // 4. Check explicit staffData or Redux staffData
  const staffData = explicitStaffData || reduxState?.userInfo?.staffData || []
  const currentUserId = sessionStorage.getItem('userId') || userDetail?.id || userDetail?._id
  const currentUsername = (sessionStorage.getItem('username') || userDetail?.username || '').toUpperCase()

  if (Array.isArray(staffData) && staffData.length > 0 && (currentUserId || currentUsername)) {
    const found = staffData.find((s) =>
      (currentUserId && (String(s.id) === String(currentUserId) || String(s._id) === String(currentUserId))) ||
      (currentUsername && String(s.username || '').toUpperCase() === currentUsername)
    )
    if (found) {
      if (isCheckerOrModelerDesignation(found.designation)) {
        try {
          sessionStorage.setItem('designation', found.designation)
        } catch {}
        return true
      }
      if (isCheckerOrModelerDesignation(found.role)) return true
    }
  }

  return false
}

/**
 * Extracts or resolves the Project Manager object for a project.
 * Checks project.manager, project.managerID, or matches against staffData.
 */
export const getProjectManager = (project, staffData = []) => {
  if (!project) return null

  // 1. If project.manager is an object with name fields
  if (project.manager && typeof project.manager === 'object') {
    return project.manager
  }

  // 2. If project.managerID / project.managerId / project.projectManager is an ID string, match in staffData
  const managerId =
    project.managerID ||
    project.managerId ||
    project.projectManagerId ||
    (typeof project.manager === 'string' ? project.manager : null) ||
    (typeof project.projectManager === 'string' ? project.projectManager : null)

  let reduxStaff = []
  try {
    reduxStaff = store?.getState?.()?.userInfo?.staffData || []
  } catch {}

  const pool = Array.isArray(staffData) && staffData.length > 0 ? staffData : reduxStaff

  if (managerId && Array.isArray(pool) && pool.length > 0) {
    const found = pool.find((s) => String(s.id) === String(managerId) || String(s._id) === String(managerId))
    if (found) return found
  }

  return null
}

/**
 * Gets the full name of the Project Manager for a project.
 */
export const getProjectManagerName = (project, staffData = []) => {
  const pm = getProjectManager(project, staffData)
  if (pm) {
    const name = `${pm.firstName || pm.f_name || ''} ${pm.lastName || pm.l_name || ''}`.trim()
    if (name) return name
    if (pm.username) return pm.username
    if (pm.name) return pm.name
  }
  return null
}

/**
 * Checks if a user object (or user ID in staffData) represents a CHECKER or MODELER.
 */
export const isUserCheckerOrModeler = (user, staffData = []) => {
  if (!user) return false

  // Direct check on user.designation if present
  if (isCheckerOrModelerDesignation(user.designation)) return true
  if (isCheckerOrModelerDesignation(user.role)) return true

  // Check if it corresponds to the currently logged in user
  const currentUserId = sessionStorage.getItem('userId')
  if (currentUserId && (String(user.id) === String(currentUserId) || String(user._id) === String(currentUserId))) {
    if (isCurrentCheckerOrModeler(staffData)) return true
  }

  // Look up in staffData for designation
  let reduxStaff = []
  try {
    reduxStaff = store?.getState?.()?.userInfo?.staffData || []
  } catch {}

  const pool = Array.isArray(staffData) && staffData.length > 0 ? staffData : reduxStaff

  if (Array.isArray(pool) && pool.length > 0) {
    const targetId = user.id || user._id || (typeof user === 'string' ? user : null)
    if (targetId) {
      const found = pool.find((s) => String(s.id) === String(targetId) || String(s._id) === String(targetId))
      if (found && (isCheckerOrModelerDesignation(found.designation) || isCheckerOrModelerDesignation(found.role))) {
        return true
      }
    }
  }

  return false
}

/**
 * Extracts initials from a full name (e.g. "John Doe" -> "JD").
 */
export const getInitialsFromName = (name) => {
  if (!name || typeof name !== 'string') return 'U'
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return 'U'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase()
}

/**
 * Returns the effective display name for an author/uploader:
 * If the author is a CHECKER or MODELER and a Project Manager exists for the project,
 * returns the Project Manager's name. Otherwise returns the author's name.
 */
export const getEffectiveDisplayName = ({ user, project, staffData = [], fallbackName = '' }) => {
  const isCM = isUserCheckerOrModeler(user, staffData)
  const pmName = getProjectManagerName(project, staffData)
  if (isCM && pmName) {
    return pmName
  }
  if (user && typeof user === 'object') {
    const userFullName = `${user.firstName || user.f_name || ''} ${user.lastName || user.l_name || ''}`.trim()
    if (userFullName) return userFullName
    if (user.username) return user.username
    if (user.name) return user.name
  }
  return fallbackName || 'User'
}
