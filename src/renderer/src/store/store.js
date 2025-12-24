import { configureStore } from '@reduxjs/toolkit'
import userReducer from './userSlice'
import fabricatorReducer from './fabricatorSlice'
import RFQReducer from './rfqSlice'
import projectReducer from './projectSlice'
import milestoneReducer from './milestoneSlice'

const store = configureStore({
  reducer: {
    userInfo: userReducer,
    RFQInfos: RFQReducer,
    fabricatorInfo: fabricatorReducer,
    projectInfo: projectReducer,
    milestoneInfo: milestoneReducer
  }
})

export default store
