import { configureStore } from "@reduxjs/toolkit";
import { taskinoContextReducer } from "./taskino-context-slice";

export const store = configureStore({
  reducer: {
    taskinoContext: taskinoContextReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
      immutableCheck: false,
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
