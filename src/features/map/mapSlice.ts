import { PayloadAction, createSlice, createSelector } from "@reduxjs/toolkit"

export interface MapSliceState {
  somariaPits: boolean
  cameraInfo: boolean
  debugInfo: boolean
  followPlayer: boolean
  curCoords: [number, number]
  coordsHistory: [number, number][]
  mapHistory: string[]
  historyLenToShow: number
  curMap: string
  zoomLevel: number
  allData: { [key: string]: Uint8Array }
}

const initialState: MapSliceState = {
  somariaPits: false,
  cameraInfo: false,
  debugInfo: false,
  followPlayer: true,
  curCoords: [0, 0],
  mapHistory: [],
  coordsHistory: [],
  historyLenToShow: 10,
  curMap: "EG1",
  zoomLevel: 1,
  allData: {},
}

export const mapSlice = createSlice({
  name: "maps",
  initialState,
  reducers: {
    toggleSomariaPits: (state) => {
      state.somariaPits = !state.somariaPits
    },
    toggleCameraInfo: (state) => {
      state.cameraInfo = !state.cameraInfo
    },
    toggleDebugInfo: (state) => {
      state.debugInfo = !state.debugInfo
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
    setAllData: (state, action: PayloadAction<{ [key: string]: Uint8Array }>) => {
      state.allData = action.payload
    },
  },
})

// Simple selectors for primitive values (no memoization needed)
export const selectSomariaPits = (state: { maps: MapSliceState }) => state.maps.somariaPits
export const selectCameraInfo = (state: { maps: MapSliceState }) => state.maps.cameraInfo
export const selectDebugInfo = (state: { maps: MapSliceState }) => state.maps.debugInfo
export const selectCurCoords = (state: { maps: MapSliceState }) => state.maps.curCoords
export const selectFollowPlayer = (state: { maps: MapSliceState }) => state.maps.followPlayer
export const selectZoomLevel = (state: { maps: MapSliceState }) => state.maps.zoomLevel
export const selectCurMap = (state: { maps: MapSliceState }) => state.maps.curMap
export const selectHistoryLenToShow = (state: { maps: MapSliceState }) => state.maps.historyLenToShow

// Memoized selectors for derived values that create new references
// These use createSelector to avoid creating new arrays on every render

export const selectCoordsHistory = createSelector(
  (state: { maps: MapSliceState }) => state.maps.coordsHistory,
  (state: { maps: MapSliceState }) => state.maps.historyLenToShow,
  (coordsHistory, historyLenToShow) => coordsHistory.slice(-historyLenToShow)
)

export const selectMapHistory = createSelector(
  (state: { maps: MapSliceState }) => state.maps.mapHistory,
  (state: { maps: MapSliceState }) => state.maps.historyLenToShow,
  (mapHistory, historyLenToShow) => mapHistory.slice(-historyLenToShow)
)

export const selectAllData = createSelector(
  (state: { maps: MapSliceState }) => state.maps.allData,
  (allData) => allData
)

export const {
  toggleSomariaPits,
  toggleCameraInfo,
  toggleDebugInfo,
  toggleFollowPlayer,
  setCurCoords,
  setHistoryLenToShow,
  setAllData,
  setCurMap,
  setZoomLevel,
} = mapSlice.actions

export default mapSlice.reducer

export const mapActions = mapSlice.actions
