import { createSlice } from '@reduxjs/toolkit'

const initialState = {
  wbsByProject: {} // { projectId: [wbsItems] }
}

const wbsSlice = createSlice({
  name: 'wbs',
  initialState,
  reducers: {
    setWBSForProject: (state, action) => {
      const { projectId, wbs } = action.payload
      state.wbsByProject[projectId] = wbs
    },
    clearWBS: (state) => {
      state.wbsByProject = {}
    }
  }
})

export const { setWBSForProject, clearWBS } = wbsSlice.actions
export default wbsSlice.reducer
