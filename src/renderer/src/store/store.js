import { configureStore } from '@reduxjs/toolkit'
import userReducer from './userSlice'
import fabricatorReducer from './fabricatorSlice'
import RFQReducer from './rfqSlice'
import projectReducer from './projectSlice'
import milestoneReducer from './milestoneSlice'
import wbsReducer from './wbsSlice'
import uiReducer from './uiSlice'

const store = configureStore({
  reducer: {
    userInfo: userReducer,
    RFQInfos: RFQReducer,
    fabricatorInfo: fabricatorReducer,
    projectInfo: projectReducer,
    milestoneInfo: milestoneReducer,
    wbsInfo: wbsReducer,
    ui: uiReducer
  }
})

export default store
