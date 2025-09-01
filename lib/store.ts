import { configureStore } from '@reduxjs/toolkit';
import { setupListeners } from '@reduxjs/toolkit/query/react';
import { mongoApi } from './api/mongoApi';
import authSlice from './slices/authSlice';
import themeSlice from './slices/themeSlice';
import workspaceSlice from './slices/workspaceSlice';

export const store = configureStore({
  reducer: {
    auth: authSlice,
    theme: themeSlice,
    workspace: workspaceSlice,
    [mongoApi.reducerPath]: mongoApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(
      mongoApi.middleware
    ),
});

setupListeners(store.dispatch);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;