import { PayloadAction, createSlice } from "@reduxjs/toolkit"

export interface MapSliceState {
  somariaPits: boolean
  followPlayer: boolean
  curCoords: [number, number]
  coordsHistory: [number, number][]
  historyLenToShow: number
  curMap: string
  zoomLevel: number
}

const initialState: MapSliceState = {
  somariaPits: false,
  followPlayer: true,
  curCoords: [0, 0],
  coordsHistory: [],
  historyLenToShow: 10,
  curMap: "EG1",
  zoomLevel: 3,
}

export const mapSlice = createSlice({
  name: "maps",
  initialState,
  reducers: {
    toggleSomariaPits: (state) => {
      state.somariaPits = !state.somariaPits
    },
    toggleFollowPlayer: (state) => {
      state.followPlayer = !state.followPlayer
    },
    setCurCoords: (state, action: PayloadAction<[number, number]>) => {
      state.curCoords = action.payload
      state.coordsHistory.push(action.payload)
    },
    setHistoryLenToShow: (state, action: PayloadAction<number>) => {
      state.historyLenToShow = action.payload
    },
    setCurMap: (state, action: PayloadAction<string>) => {
      state.curMap = action.payload
    },
    resetHistory: (state) => {
      state.coordsHistory = []
    },
    setZoomLevel: (state, action: PayloadAction<number>) => {
      state.zoomLevel = action.payload
    },
  },
})

export const selectSomariaPits = (state: { map: MapSliceState }) =>
  state.map.somariaPits
export const selectCurCoords = (state: { map: MapSliceState }) =>
  state.map.curCoords
export const selectCoordsHistory = (state: { map: MapSliceState }) =>
  state.map.coordsHistory.slice(-state.map.historyLenToShow)
export const selectHistoryLenToShow = (state: { map: MapSliceState }) =>
  state.map.historyLenToShow

export const {
  toggleSomariaPits,
  toggleFollowPlayer,
  setCurCoords,
  setHistoryLenToShow,
  setCurMap,
  resetHistory,
  setZoomLevel,
} = mapSlice.actions

export default mapSlice.reducer

export const mapActions = mapSlice.actions
