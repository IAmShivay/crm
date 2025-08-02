import { configureStore } from '@reduxjs/toolkit';
import { setupListeners } from '@reduxjs/toolkit/query/react';
import { supabaseApi } from './api/supabaseApi';
import authSlice from './slices/authSlice';
import themeSlice from './slices/themeSlice';
import workspaceSlice from './slices/workspaceSlice';

export const store = configureStore({
  reducer: {
    auth: authSlice,
    theme: themeSlice,
    workspace: workspaceSlice,
    [supabaseApi.reducerPath]: supabaseApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(
      supabaseApi.middleware
    ),
});

setupListeners(store.dispatch);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;