import { createSlice } from '@reduxjs/toolkit'

const uiSlice = createSlice({
  name: 'ui',
  initialState: {
    modalCount: 0,
    activeDetail: {
      type: null, // 'task', 'rfq', 'rfi', 'submittal', 'milestone', 'project', etc.
      id: null,
      data: null // Optional extra data
    }
  },
  reducers: {
    incrementModalCount: (state) => {
      state.modalCount += 1
    },
    decrementModalCount: (state) => {
      state.modalCount = Math.max(0, state.modalCount - 1)
    },
    resetModalCount: (state) => {
      state.modalCount = 0
    },
    setActiveDetail: (state, action) => {
      state.activeDetail = action.payload
    },
    clearActiveDetail: (state) => {
      state.activeDetail = { type: null, id: null, data: null }
    }
  }
})

export const {
  incrementModalCount,
  decrementModalCount,
  resetModalCount,
  setActiveDetail,
  clearActiveDetail
} = uiSlice.actions

export default uiSlice.reducer
