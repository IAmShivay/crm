import { configureStore } from '@reduxjs/toolkit';
import { setupListeners } from '@reduxjs/toolkit/query/react';
import { mongoApi } from './api/mongoApi';
import { userPreferencesApi } from './api/userPreferencesApi';
import { webhookApi } from './api/webhookApi';
import authSlice from './slices/authSlice';
import themeSlice from './slices/themeSlice';
import workspaceSlice from './slices/workspaceSlice';
import { persistenceMiddleware, loadPersistedState } from './middleware/persistenceMiddleware';

// Load persisted state
const persistedState = typeof window !== 'undefined' ? loadPersistedState() : {};

export const store = configureStore({
  reducer: {
    auth: authSlice,
    theme: themeSlice,
    workspace: workspaceSlice,
    [mongoApi.reducerPath]: mongoApi.reducer,
    [userPreferencesApi.reducerPath]: userPreferencesApi.reducer,
    [webhookApi.reducerPath]: webhookApi.reducer,
  },
  preloadedState: persistedState,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(
      mongoApi.middleware,
      userPreferencesApi.middleware,
      webhookApi.middleware,
      persistenceMiddleware
    ),
});

setupListeners(store.dispatch);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;