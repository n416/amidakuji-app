import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface AdminState {
  groups: any[];
  loadingGroups: boolean;
  currentGroup: any | null;
  currentGroupEvents: any[];
  currentGroupMembers: any[];
  currentGroupPrizeMasters: any[];
  passwordRequests: any[];
}

const initialState: AdminState = {
  groups: [],
  loadingGroups: true,
  currentGroup: null,
  currentGroupEvents: [],
  currentGroupMembers: [],
  currentGroupPrizeMasters: [],
  passwordRequests: [],
};

export const adminSlice = createSlice({
  name: 'admin',
  initialState,
  reducers: {
    setGroups: (state, action: PayloadAction<any[]>) => {
      state.groups = action.payload;
      state.loadingGroups = false;
    },
    setLoadingGroups: (state, action: PayloadAction<boolean>) => {
      state.loadingGroups = action.payload;
    },
    setCurrentGroup: (state, action: PayloadAction<any | null>) => {
      state.currentGroup = action.payload;
    },
    setCurrentGroupEvents: (state, action: PayloadAction<any[]>) => {
      state.currentGroupEvents = action.payload;
    },
    setCurrentGroupMembers: (state, action: PayloadAction<any[]>) => {
      state.currentGroupMembers = action.payload;
    },
    setCurrentGroupPrizeMasters: (state, action: PayloadAction<any[]>) => {
      state.currentGroupPrizeMasters = action.payload;
    },
    setPasswordRequests: (state, action: PayloadAction<any[]>) => {
      state.passwordRequests = action.payload;
    },
  },
});

export const {
  setGroups,
  setLoadingGroups,
  setCurrentGroup,
  setCurrentGroupEvents,
  setCurrentGroupMembers,
  setCurrentGroupPrizeMasters,
  setPasswordRequests,
} = adminSlice.actions;

export default adminSlice.reducer;
