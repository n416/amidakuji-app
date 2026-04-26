import { configureStore } from '@reduxjs/toolkit';
import authReducer from './authSlice';
import participantReducer from './participantSlice';
import lotteryReducer from './lotterySlice';

import adminReducer from './adminSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    participant: participantReducer,
    lottery: lotteryReducer,
    admin: adminReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
