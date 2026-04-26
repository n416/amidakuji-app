import { createSlice, PayloadAction } from '@reduxjs/toolkit';

// LocalStorage key for session
const SESSION_KEY = 'amidakuji_participant_session';

interface ParticipantState {
  token: string | null;
  memberId: string | null;
  name: string | null;
  groupId: string | null;
}

// 初期化時にLocalStorageから読み込む
const loadInitialState = (): ParticipantState => {
  try {
    const saved = localStorage.getItem(SESSION_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.error('Failed to load participant session from localStorage', e);
  }
  return {
    token: null,
    memberId: null,
    name: null,
    groupId: null,
  };
};

const initialState: ParticipantState = loadInitialState();

export const participantSlice = createSlice({
  name: 'participant',
  initialState,
  reducers: {
    setParticipantSession: (state, action: PayloadAction<Partial<ParticipantState>>) => {
      if (action.payload.token !== undefined) state.token = action.payload.token;
      if (action.payload.memberId !== undefined) state.memberId = action.payload.memberId;
      if (action.payload.name !== undefined) state.name = action.payload.name;
      if (action.payload.groupId !== undefined) state.groupId = action.payload.groupId;
      
      // 同期的にLocalStorageへ保存
      try {
        localStorage.setItem(SESSION_KEY, JSON.stringify(state));
      } catch (e) {
        console.error('Failed to save participant session to localStorage', e);
      }
    },
    clearParticipantSession: (state) => {
      state.token = null;
      state.memberId = null;
      state.name = null;
      // グループIDは残す場合もあるが、完全クリアとする
      state.groupId = null;
      
      try {
        localStorage.removeItem(SESSION_KEY);
      } catch (e) {
        console.error('Failed to clear participant session from localStorage', e);
      }
    },
  },
});

export const { setParticipantSession, clearParticipantSession } = participantSlice.actions;
export default participantSlice.reducer;
