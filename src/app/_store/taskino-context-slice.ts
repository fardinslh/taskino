import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

export type TaskinoPageContext = Record<string, any>;

type TaskinoContextState = {
  pageContext: TaskinoPageContext;
};

const initialState: TaskinoContextState = {
  pageContext: {},
};

const taskinoContextSlice = createSlice({
  name: "taskinoContext",
  initialState,
  reducers: {
    setPageContext(state, action: PayloadAction<TaskinoPageContext>) {
      state.pageContext = action.payload;
    },
  },
});

export const { setPageContext } = taskinoContextSlice.actions;
export const taskinoContextReducer = taskinoContextSlice.reducer;
