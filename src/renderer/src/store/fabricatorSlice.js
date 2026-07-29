import { createSlice } from '@reduxjs/toolkit'

const initialState = {
  fabricatorData: [],
  clientData: []
}

const fabricatorSlice = createSlice({
  name: 'fabricatorData',
  initialState,
  reducers: {
    addFabricator: (state, action) => {
      state.fabricatorData.push(action.payload)
    },

    loadFabricator: (state, action) => {
      state.fabricatorData = action.payload
    },

    updateFabricator: (state, action) => {
      const updatedFab = action.payload
      state.fabricatorData = state.fabricatorData.map((fab) =>
        fab.id === updatedFab.id ? updatedFab : fab
      )
    },

    // ✅ Add a branch
    addBranchToFabricator: (state, action) => {
      const { fabricatorId, branchData } = action.payload
      state.fabricatorData = state.fabricatorData.map((fab) =>
        fab.id === fabricatorId
          ? {
              ...fab,
              branches: [...fab.branches, branchData]
            }
          : fab
      )
    },

    // ✅ Update a branch (replace same branch by id)
    updateFabricatorBranch: (state, action) => {
      const { fabricatorId, branchData } = action.payload
      state.fabricatorData = state.fabricatorData.map((fab) =>
        fab.id === fabricatorId
          ? {
              ...fab,
              branches: fab.branches?.map((branch) =>
                branch.id === branchData.id ? branchData : branch
              )
            }
          : fab
      )
    },

    addClient: (state, action) => {
      state.clientData.push(action.payload)
    },

    showClient: (state, action) => {
      state.clientData = action.payload
    },

    deleteFabricator: (state, action) => {
      state.fabricatorData = state.fabricatorData.filter(
        (fab) => (fab.id || fab._id) !== action.payload
      )
    },

    deleteBranchFromFabricator: (state, action) => {
      const { fabricatorId, branchId } = action.payload
      state.fabricatorData = state.fabricatorData.map((fab) => {
        const fId = fab.id || fab._id
        return fId === fabricatorId
          ? {
              ...fab,
              branches: fab.branches?.filter(
                (branch) => (branch.id || branch._id) !== branchId
              )
            }
          : fab
      })
    }
  }
})

export const {
  addFabricator,
  loadFabricator,
  updateFabricator,
  addBranchToFabricator,
  updateFabricatorBranch,
  deleteFabricator,
  deleteBranchFromFabricator,
  addClient,
  showClient
} = fabricatorSlice.actions

export default fabricatorSlice.reducer
