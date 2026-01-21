import { createSlice } from '@reduxjs/toolkit'

// Initial state
const initialState = {
  token: false,
  userDetail: null,
  departmentData: [],
  teamData: [],
  staffData: []
}

// Slice
const userSlice = createSlice({
  name: 'userDetail',
  initialState,
  reducers: {
    login: (state, action) => {
      state.userDetail = action.payload
      const token = action.payload.token
      if (token) {
        state.token = token
        sessionStorage.setItem('token', token)
      }
    },
    setUserData: (state, action) => {
      // state.token = action.payload.token || false;
      state.userDetail = action.payload
    },
    addStaff: (state, action) => {
      state.staffData.push(action.payload)
    },
    showStaff: (state, action) => {
      state.staffData = action.payload
    },
    updateStaffData: (state, action) => {
      state.staffData = state.staffData.map((staff) =>
        staff.id === action.payload.id ? { ...staff, ...action.payload } : staff
      )
    },
    addTeam: (state, action) => {
      state.teamData.push(action.payload)
    },
    showTeam: (state, action) => {
      state.teamData = action.payload
    },
    updateTeamData: (state, action) => {
      state.teamData = state.teamData.map((team) =>
        team.id === action.payload.id ? { ...team, ...action.payload } : team
      )
    },
    addDepartment: (state, action) => {
      state.departmentData.push(action.payload)
    },
    updateDepartmentData: (state, action) => {
      state.departmentData = state.departmentData.map((department) =>
        department.id === action.payload.id ? { ...department, ...action.payload } : department
      )
    },
    showDepartment: (state, action) => {
      state.departmentData = action.payload
    },
    logout: (state) => {
      state.token = false
      state.userDetail = null
      sessionStorage.removeItem('token')
    },
    updatetoken: (state, action) => {
      state.token = action.payload.token
      sessionStorage.setItem('token', action.payload.token)
    }
  }
})

// Export actions and reducer
export const {
  login,
  showStaff,
  addStaff,
  setUserData,
  updateStaffData,
  updateTeamData,
  addDepartment,
  showDepartment,
  addTeam,
  showTeam,
  updatetoken,
  updateDepartmentData,
  logout
} = userSlice.actions

export default userSlice.reducer
