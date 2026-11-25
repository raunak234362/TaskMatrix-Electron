import { createSlice } from '@reduxjs/toolkit'
import { logout } from './userSlice'

export const initialUserStats = {
  totalTasks: 0,
  completedTasks: 0,
  pendingTasks: 0,
  allocatedHours: 0,
  workedHours: 0,
  projectsCount: 0,
  efficiency: 0
}

export const initialAdminData = {
  projects: [],
  rfis: [],
  submittals: [],
  pendingSubmittals: [],
  upcomingMilestones: [],
  pendingChangeOrders: [],
  rfqs: [],
  pendingRFI: [],
  pendingRFQ: [],
  pendingCO: [],
  clientSidePendingSubmittals: [],
  clientSidePendingRFI: [],
  clientSidePendingRFQ: [],
  clientSidePendingCO: [],
  unapprovedCO: [],
  unapprovedListsData: {},
  pmDashboard: {},
  projectTrackingActions: {},
  allRfqs: [],
  projectStats: {
    totalProjects: 0,
    activeProjects: 0,
    completedProjects: 0,
    onHoldProjects: 0
  },
  dashboardStats: {
    pendingRFI: 0,
    newRFI: 0,
    pendingSubmittals: 0,
    pendingChangeOrders: 0,
    newChangeOrders: 0,
    pendingRFQ: 0,
    newRFQ: 0
  },
  invoices: []
}

const createInitialState = () => ({
  wbtDashboard: {
    initialized: false,
    stale: false,
    cacheKey: null,
    lastFetchedAt: null,
    tasks: [],
    selfTasks: [],
    projectNotes: [],
    unreadComments: [],
    unapprovedListsCount: 0,
    userStats: { ...initialUserStats },
    adminData: { ...initialAdminData },
    memberStats: []
  },
  projectDashboard: {
    initialized: false,
    stale: false,
    cacheKey: null,
    lastFetchedAt: null,
    allTasks: [],
    allTeams: []
  },
  teamCalendar: {
    initialized: false,
    stale: false,
    cacheKey: null,
    teams: [],
    selectedTeamId: '',
    membersByTeamId: {}
  }
})

const initialState = createInitialState()

const dashboardSlice = createSlice({
  name: 'dashboardInfo',
  initialState,
  reducers: {
    setWbtDashboardData: (state, action) => {
      const payload = action.payload || {}
      const prevAdmin = state.wbtDashboard.adminData || initialAdminData
      const nextAdmin = payload.adminData
        ? {
            ...prevAdmin,
            ...payload.adminData,
            unapprovedListsData:
              payload.adminData.unapprovedListsData ?? prevAdmin.unapprovedListsData ?? {}
          }
        : prevAdmin

      state.wbtDashboard = {
        ...state.wbtDashboard,
        ...payload,
        adminData: nextAdmin,
        initialized: true,
        stale: false,
        lastFetchedAt: Date.now()
      }
    },
    patchWbtDashboard: (state, action) => {
      const payload = action.payload || {}
      state.wbtDashboard = {
        ...state.wbtDashboard,
        ...payload
      }
    },
    patchWbtAdminData: (state, action) => {
      state.wbtDashboard.adminData = {
        ...state.wbtDashboard.adminData,
        ...(action.payload || {})
      }
    },
    setProjectDashboardData: (state, action) => {
      state.projectDashboard = {
        ...state.projectDashboard,
        ...(action.payload || {}),
        initialized: true,
        stale: false,
        lastFetchedAt: Date.now()
      }
    },
    setTeamCalendarData: (state, action) => {
      const payload = action.payload || {}
      const prevMembers = state.teamCalendar.membersByTeamId || {}
      state.teamCalendar = {
        ...state.teamCalendar,
        ...payload,
        membersByTeamId: payload.membersByTeamId
          ? { ...prevMembers, ...payload.membersByTeamId }
          : prevMembers,
        initialized: true,
        stale: false
      }
    },
    markDashboardStale: (state) => {
      if (state.wbtDashboard.initialized) state.wbtDashboard.stale = true
      if (state.projectDashboard.initialized) state.projectDashboard.stale = true
      if (state.teamCalendar.initialized) state.teamCalendar.stale = true
    },
    clearDashboardData: () => createInitialState()
  },
  extraReducers: (builder) => {
    builder.addCase(logout, () => createInitialState())
  }
})

export const {
  setWbtDashboardData,
  patchWbtDashboard,
  patchWbtAdminData,
  setProjectDashboardData,
  setTeamCalendarData,
  markDashboardStale,
  clearDashboardData
} = dashboardSlice.actions

export default dashboardSlice.reducer
