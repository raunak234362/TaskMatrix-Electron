import { configureStore } from "@reduxjs/toolkit";
import userReducer from "./userSlice";
import fabricatorReducer from "./fabricatorSlice";
import RFQReducer from "./rfqSlice";
const store = configureStore({
  reducer: {
    userInfo: userReducer,
    RFQInfos: RFQReducer,
    fabricatorInfo: fabricatorReducer,
  },
});

export default store;
