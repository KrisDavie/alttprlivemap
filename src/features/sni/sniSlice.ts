import type { PayloadAction } from "@reduxjs/toolkit"
import { createSlice } from "@reduxjs/toolkit"

export interface SniSliceState {
  grpcHost: string
  grpcPort: number
  grpcConnected: boolean
  deviceList: string[]
  raceOverride?: boolean
  connectedDevice?: string
  curRead?: number
  curTimestamp?: number
  lastRead?: number
  lastTimestamp?: number
  pollInterval?: number
}

const initialState: SniSliceState = {
  grpcHost: "localhost",
  grpcPort: 8190,
  grpcConnected: false,
  deviceList: [],
  raceOverride: false,
  connectedDevice: undefined,
  curRead: undefined,
  curTimestamp: undefined,
  lastRead: undefined,
  lastTimestamp: undefined,
  pollInterval: 500,
}

export const sniSlice = createSlice({
  name: "sni",
  initialState,
  reducers: {
    setGrpcConnected: (state, action: PayloadAction<boolean>) => {
      state.grpcConnected = action.payload
    },
    setGrpcHost: (state, action: PayloadAction<string>) => {
      state.grpcHost = action.payload
    },
    setGrpcPort: (state, action: PayloadAction<number>) => {
      state.grpcPort = action.payload
    },
    setDeviceList: (state, action: PayloadAction<string[]>) => {
      state.deviceList = action.payload
    },
    setConnectedDevice: (state, action: PayloadAction<string>) => {
      state.connectedDevice = action.payload
    },
    setLastRead: (state, action: PayloadAction<[number, number]>) => {
      state.lastRead = action.payload[0]
      state.lastTimestamp = action.payload[1]
    },
    setCurRead: (state, action: PayloadAction<[number, number]>) => {
      state.curRead = action.payload[0]
      state.curTimestamp = action.payload[1]
    },
    setPollInterval: (state, action: PayloadAction<number>) => {
      state.pollInterval = action.payload
    },
    setRaceOverride: (state, action: PayloadAction<boolean>) => {
      state.raceOverride = action.payload
    }
  }
})

export const selectAvailableDevices = (state: { sni: SniSliceState }) =>
  state.sni.deviceList

export const {
  setGrpcHost,
  setGrpcPort,
  setGrpcConnected,
  setLastRead,
  setCurRead,
  setDeviceList,
  setPollInterval,
  setRaceOverride,
  setConnectedDevice,
} = sniSlice.actions
export default sniSlice.reducer 

export const sniActions = sniSlice.actions