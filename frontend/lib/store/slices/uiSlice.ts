import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface UIState {
  sidebarOpen: boolean;
  theme: 'light' | 'dark' | 'system';
  currentConversationId: string | null;
}

const initialState: UIState = {
  sidebarOpen: true,
  theme: 'system',
  currentConversationId: null,
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    toggleSidebar: state => {
      state.sidebarOpen = !state.sidebarOpen;
    },
    setSidebarOpen: (state, action: PayloadAction<boolean>) => {
      state.sidebarOpen = action.payload;
    },
    setTheme: (state, action: PayloadAction<'light' | 'dark' | 'system'>) => {
      state.theme = action.payload;
      if (typeof window !== 'undefined') {
        localStorage.setItem('theme', action.payload);
      }
    },
    initializeUI: state => {
      if (typeof window !== 'undefined') {
        const savedTheme = localStorage.getItem('theme') as
          | 'light'
          | 'dark'
          | 'system'
          | null;
        if (savedTheme) {
          state.theme = savedTheme;
        }
      }
    },
    setCurrentConversationId: (state, action: PayloadAction<string | null>) => {
      state.currentConversationId = action.payload;
    },
  },
});

export const {
  toggleSidebar,
  setSidebarOpen,
  setTheme,
  initializeUI,
  setCurrentConversationId,
} = uiSlice.actions;
export default uiSlice.reducer;
