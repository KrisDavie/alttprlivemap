import type { PayloadAction } from "@reduxjs/toolkit"
import { createSlice } from "@reduxjs/toolkit"

export interface SniSliceState {
  grpcHost: string
  grpcPort: number
  grpcConnected: boolean
  deviceList: string[]
  sa1ReadPossible: boolean
  romtype: string
  raceOverride?: boolean
  connectedDevice?: string
  curRead?: number
  curTimestamp?: number
  lastRead?: number
  lastTimestamp?: number
  pollInterval?: number
  memoryMapping?: string
  romName?: string
  sa1Init?: boolean
  useAltMemLocs?: boolean
  prevSram?: Uint8Array
}

const initialState: SniSliceState = {
  grpcHost: "localhost",
  grpcPort: 8190,
  grpcConnected: false,
  deviceList: [],
  sa1ReadPossible: true,
  romtype: "rando",
  raceOverride: false,
  connectedDevice: undefined,
  curRead: undefined,
  curTimestamp: undefined,
  lastRead: undefined,
  lastTimestamp: undefined,
  pollInterval: 100,
  memoryMapping: undefined,
  romName: undefined,
  sa1Init: false,
  useAltMemLocs: false,
  prevSram: undefined
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
    setPollInterval: (state, action: PayloadAction<number>) => {
      state.pollInterval = action.payload
    },
    setRaceOverride: (state, action: PayloadAction<boolean>) => {
      state.raceOverride = action.payload
    },
    setMemoryMapping: (state, action: PayloadAction<string>) => {
      state.memoryMapping = action.payload
      if (action.payload === "sa1") {
        state.romtype = 'prachack'
      } else {
        state.romtype = 'rando'
      }
      if (state.connectedDevice?.split(":")[0] === "fxpakpro" && action.payload === "sa1") {
        state.sa1ReadPossible = false
      }
    },
    setRomName: (state, action: PayloadAction<string>) => {
      state.romName = action.payload
    },
    romChange(state, action: PayloadAction<string>) {
      state.romName = action.payload
      state.sa1Init = false
      state.memoryMapping = undefined
      state.useAltMemLocs = false
      state.romtype = "rando"
      state.sa1ReadPossible = true
    }
  }
})

export const selectAvailableDevices = (state: { sni: SniSliceState }) =>
  state.sni.deviceList

export const selectSA1ReadPossible = (state: { sni: SniSliceState }) =>
  state.sni.sa1ReadPossible

export const {
  setGrpcHost,
  setGrpcPort,
  setGrpcConnected,
  setDeviceList,
  setPollInterval,
  setRaceOverride,
  setConnectedDevice,
  setMemoryMapping,
  setRomName,
  romChange
} = sniSlice.actions
export default sniSlice.reducer 

export const sniActions = sniSlice.actions