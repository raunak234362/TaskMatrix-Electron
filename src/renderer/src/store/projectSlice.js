import { createSlice } from '@reduxjs/toolkit'

const initialState = {
  projectData: []
}

const projectSlice = createSlice({
  name: 'projectInfo',
  initialState,
  reducers: {
    setProjectData: (state, action) => {
      state.projectData = action.payload
    },
    addProject: (state, action) => {
      state.projectData.push(action.payload)
    },
    updateProject: (state, action) => {
      const updatedProject = action.payload
      state.projectData = state.projectData.map((project) =>
        project.id === updatedProject.id ? updatedProject : project
      )
    }
  }
})

export const { setProjectData, addProject, updateProject } = projectSlice.actions
export default projectSlice.reducer
