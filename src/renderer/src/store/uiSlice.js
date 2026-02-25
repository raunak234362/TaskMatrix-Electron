import { createSlice } from '@reduxjs/toolkit'

const uiSlice = createSlice({
  name: 'ui',
  initialState: {
    modalCount: 0,
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
  },
})

export const { incrementModalCount, decrementModalCount, resetModalCount } =
  uiSlice.actions

export default uiSlice.reducer
