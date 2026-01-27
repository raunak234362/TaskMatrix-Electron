import { createSlice } from '@reduxjs/toolkit'

const initialState = {
  RFQData: [],
  EstimationData: []
}

const RFQSlice = createSlice({
  name: 'RFQ',
  initialState,
  reducers: {
    addRFQ: (state, action) => {
      state.RFQData.push(action.payload)
    },
    addEstimation: (state, action) => {
      state.EstimationData.push(action.payload)
    },
    deleteRFQ: (state, action) => {
      state.RFQData = state.RFQData.filter((rfq) => rfq.id !== action.payload)
    },
    deleteEstimation: (state, action) => {
      state.EstimationData = state.EstimationData.filter((est) => est.id !== action.payload)
    },
    updateRFQ: (state, action) => {
      const updatedRFQ = action.payload
      state.RFQData = state.RFQData.map((rfq) => (rfq.id === updatedRFQ.id ? updatedRFQ : rfq))
    },
    updateEstimation: (state, action) => {
      const updatedEstimation = action.payload
      state.EstimationData = state.EstimationData.map((est) =>
        est.id === updatedEstimation.id ? updatedEstimation : est
      )
    },
    setRFQData: (state, action) => {
      state.RFQData = action.payload
    },
    setEstimationData: (state, action) => {
      state.EstimationData = action.payload
    },
    showRFQData: (state, action) => {
      state.RFQData = action.payload
    },
    showEstimationData: (state, action) => {
      state.EstimationData = action.payload
    }
  }
})

export const {
  setRFQData,
  setEstimationData,
  addRFQ,
  addEstimation,
  deleteRFQ,
  deleteEstimation,
  updateRFQ,
  updateEstimation,
  showRFQData,
  showEstimationData
} = RFQSlice.actions
export default RFQSlice.reducer
