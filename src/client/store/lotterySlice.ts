import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface LotteryState {
  currentEventId: string | null;
  currentGroupId: string | null;
  currentLotteryData: any | null;
  prizes: any[];
}

const initialState: LotteryState = {
  currentEventId: null,
  currentGroupId: null,
  currentLotteryData: null,
  prizes: [],
};

export const lotterySlice = createSlice({
  name: 'lottery',
  initialState,
  reducers: {
    setCurrentEventId: (state, action: PayloadAction<string | null>) => {
      state.currentEventId = action.payload;
    },
    setCurrentGroupId: (state, action: PayloadAction<string | null>) => {
      state.currentGroupId = action.payload;
    },
    setCurrentLotteryData: (state, action: PayloadAction<any | null>) => {
      state.currentLotteryData = action.payload;
    },
    setPrizes: (state, action: PayloadAction<any[]>) => {
      state.prizes = action.payload;
    },
  },
});

export const { setCurrentEventId, setCurrentGroupId, setCurrentLotteryData, setPrizes } = lotterySlice.actions;
export default lotterySlice.reducer;
