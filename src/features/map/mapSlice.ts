import { PayloadAction, createSlice } from "@reduxjs/toolkit"

export interface MapSliceState {
  somariaPits: boolean
  followPlayer: boolean
  curCoords: [number, number]
  coordsHistory: [number, number][]
  mapHistory: string[]
  historyLenToShow: number
  curMap: string
  zoomLevel: number
}

const initialState: MapSliceState = {
  somariaPits: false,
  followPlayer: true,
  curCoords: [0, 0],
  mapHistory: [],
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
    setCurCoords: (state, action: PayloadAction<[number, number, string]>) => {
      state.curCoords = [action.payload[0], action.payload[1]]
      state.coordsHistory.push([action.payload[0], action.payload[1]])
      state.mapHistory.push(action.payload[2])
    },
    setHistoryLenToShow: (state, action: PayloadAction<number>) => {
      state.historyLenToShow = action.payload
    },
    setCurMap: (state, action: PayloadAction<string>) => {
      state.curMap = action.payload
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
  setZoomLevel,
} = mapSlice.actions

export default mapSlice.reducer

export const mapActions = mapSlice.actions
