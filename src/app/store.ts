import { configureStore, ThunkAction, Action } from "@reduxjs/toolkit"
import { sniApiSlice } from "@/features/sni/sniApiSlice"
import sniSlice from "@/features/sni/sniSlice"
import mapSlice from "@/features/map/mapSlice"

export const store = configureStore({
  reducer: {
    sni: sniSlice,
    maps: mapSlice,
    [sniApiSlice.reducerPath]: sniApiSlice.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({ serializableCheck: false }).concat(
      sniApiSlice.middleware,
    ),
})
export type AppDispatch = typeof store.dispatch
export type RootState = ReturnType<typeof store.getState>
export type AppThunk<ReturnType = void> = ThunkAction<
  ReturnType,
  RootState,
  unknown,
  Action<string>
>
