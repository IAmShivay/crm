import { configureStore } from '@reduxjs/toolkit';
import { setupListeners } from '@reduxjs/toolkit/query/react';
import { mongoApi } from './api/mongoApi';
import { userPreferencesApi } from './api/userPreferencesApi';
import { webhookApi } from './api/webhookApi';
import { authApi } from './api/authApi';
import authReducer from './slices/authSlice';
import themeReducer from './slices/themeSlice';
import workspaceReducer from './slices/workspaceSlice';
import { persistenceMiddleware, loadPersistedState } from './middleware/persistenceMiddleware';

// Load persisted state
const persistedState = typeof window !== 'undefined' ? loadPersistedState() : {};

export const store = configureStore({
  reducer: {
    auth: authReducer,
    theme: themeReducer,
    workspace: workspaceReducer,
    [mongoApi.reducerPath]: mongoApi.reducer,
    [userPreferencesApi.reducerPath]: userPreferencesApi.reducer,
    [webhookApi.reducerPath]: webhookApi.reducer,
    [authApi.reducerPath]: authApi.reducer,
  } as any,
  preloadedState: persistedState as any,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(
      mongoApi.middleware,
      userPreferencesApi.middleware,
      webhookApi.middleware,
      authApi.middleware,
      persistenceMiddleware
    ),
});

setupListeners(store.dispatch);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;