import { createSlice } from '@reduxjs/toolkit'

const initialState = {
  milestonesByProject: {}
}

const milestoneSlice = createSlice({
  name: 'milestoneInfo',
  initialState,
  reducers: {
    setMilestonesForProject: (state, action) => {
      const { projectId, milestones } = action.payload
      state.milestonesByProject[projectId] = milestones
    }
  }
})

export const { setMilestonesForProject } = milestoneSlice.actions
export default milestoneSlice.reducer
