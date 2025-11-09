import type { RootState } from "@/app/store"
import { createApi, fakeBaseQuery } from "@reduxjs/toolkit/query/react"
import { GrpcWebFetchTransport } from "@protobuf-ts/grpcweb-transport"
import {
  romChange,
  setConnectedDevice,
  setDeviceList,
  setGrpcConnected,
  setMemoryMapping,
  setRaceOverride,
} from "./sniSlice"
import { setCurCoords, setCurMap, setAllData } from "../map/mapSlice"
import {
  DevicesClient,
  DeviceMemoryClient,
} from "@/sni/sni.client"
import { AddressSpace, MemoryMapping } from "@/sni/sni"

const getTransport = (state: any) => {
  return new GrpcWebFetchTransport({
    baseUrl: `http://${state.sni.grpcHost}:${state.sni.grpcPort}`,
  })
}

const ingame_modes = [0x07, 0x09, 0x0b]
const completed_modes = [0x19, 0x1a]

type MemLocs = {
  // name: [[mem_loc, size], [mem_loc, size]]
  [key: string]: {
    'prachack': [number, number],
    'rando': [number, number],
  }
}

const memMaps: { [x: string]: MemoryMapping } = {
  'lorom': MemoryMapping.LoROM,
  'sa1': MemoryMapping.SA1,
}

const memLocs: MemLocs = {
  'module': {
    'prachack': [0xE07C04, 0x1],
    'rando': [0xF50010, 0x1],
  },
  'coords': {
    'prachack': [0xE07C00, 0x4],
    'rando': [0xF50020, 0x4],
  },
  'world': {
    'prachack': [0xE07C06, 0x1],
    'rando': [0xF50FFF, 0x1],
  },
  'race_mode': {
    'prachack': [0x0, 0x0],
    'rando': [0x180213, 0x1],
  },
  'transition_bound_set': {
    'prachack': [0xF500A6, 0x2],
    'rando': [0xF500A6, 0x2],
  },
  'transition_bounds': {
    'prachack': [0xF50600, 0x20],
    'rando': [0xF50600, 0x20],
  },
  'camera_pos_ow': {
    'prachack': [0xF50618, 0x8],
    'rando': [0xF50618, 0x8],
  },
  'camera_pos_uw': {
    'prachack': [0xF500E0, 0x8],
    'rando': [0xF500E0, 0x8],
  },
  'sprite_ids': {
    'prachack': [0xF50E20, 0x10],
    'rando': [0xF50E20, 0x10],
  },
  'sprite_coords': {
    'prachack': [0xF50D00, 0x40],
    'rando': [0xF50D00, 0x40],
  },

}

export const sniApiSlice = createApi({
  baseQuery: fakeBaseQuery(),
  reducerPath: "sniApi",
  endpoints: (builder) => ({
    getDevices: builder.query({
      async queryFn(
        arg: { noConnect: boolean },
        queryApi,
        extraOptions,
        baseQuery,
      ) {
        const transport = getTransport(queryApi.getState() as RootState)
        try {
          let devClient = new DevicesClient(transport)
          let devicesReponse = await devClient.listDevices({ kinds: [] })
          let devices = devicesReponse.response.devices.map(
            (device) => device.uri,
          )
          queryApi.dispatch(setGrpcConnected(true))
          queryApi.dispatch(setDeviceList(devices))
          if (devices.length > 0 && !arg.noConnect) {
            queryApi.dispatch(setConnectedDevice(devices[0]))
          }
          return { data: devices }
        } catch (e) {
          return { error: "Error getting devices." }
        }
      },
    }),
    readMemory: builder.query({
      async queryFn(
        arg: {},
        queryApi,
        extraOptions,
        baseQuery,
      ) {
        const state = queryApi.getState() as RootState
        const transport = getTransport(state)
        let controlMem = new DeviceMemoryClient(transport)
        let connectedDevice = state.sni.connectedDevice
        if (!connectedDevice) {
          return { error: "No device selected" }
        }

        // Detect memory mapping
        if (!state.sni.memoryMapping) {
          let memMapResponse = await controlMem.mappingDetect({
            uri: connectedDevice,
          })
          if (!memMapResponse.response) {
            return { error: "Error detecting memory mapping" }
          }
          var memMap = memMapResponse.response.memoryMapping
          switch (memMapResponse.response.memoryMapping) {
            case MemoryMapping.LoROM:
              queryApi.dispatch(setMemoryMapping("lorom"))
              break
            case MemoryMapping.SA1:
              queryApi.dispatch(setMemoryMapping("sa1"))
              // Auto override on Practice hack
              queryApi.dispatch(setRaceOverride(true))
              break
            default:
              return { error: "Unsupported memory mapping" }
          }
        } else {
          var memMap = memMaps[state.sni.memoryMapping]
        }

        // Read rom name
        let romNameResponse = await controlMem.singleRead({
          uri: connectedDevice,
          request: { 
            requestMemoryMapping: memMap,
            requestAddress: 0x7FC0,
            requestAddressSpace: AddressSpace.FxPakPro,
            size: 0x15}
        })

        if (!romNameResponse.response.response) {
          return { error: "Error reading rom name" }
        }

        let romName = Array.from(romNameResponse.response.response.data).map(byte => String.fromCharCode(byte)).join("")

        if (romName !== state.sni.romName) {
          queryApi.dispatch(romChange(romName))
        }
        // Build multi-read based on memory mapping
        const mread_data = {
          uri: connectedDevice,
          requests: [] as any[],
        }

        let romtype: 'prachack' | 'rando' = 'rando'
        if (state.sni.romtype === 'prachack' && state.sni.connectedDevice?.split(':')[0] === 'fxpakpro') {
          romtype = 'prachack'
        }

        Object.keys(memLocs).forEach((key) => {
          const [addr, size] = memLocs[key][romtype]
          if (size === 0) {
            return
          }
          mread_data.requests.push({
            requestMemoryMapping: memMap,
            requestAddress: addr,
            requestAddressSpace: AddressSpace.FxPakPro,
            size: size,
          })
        })

        let memResponse = await controlMem.multiRead({
            uri: connectedDevice,
            requests: mread_data.requests
        })
        
        if (!memResponse.response) {
          return { error: "Error reading memory, no reposonse" }
        }

        let data: { [key: string]: Uint8Array } = {}

        let ix = 0
        Object.keys(memLocs).forEach((key, index) => {
          const [addr, size] = memLocs[key][romtype]
          if (size === 0) {
            return
          }
          data[key] = memResponse.response.responses[ix++].data
        })

        var y = new Uint16Array(
          new Uint8Array([data['coords'][0], data['coords'][1]]).buffer,
        )[0]
        const x = new Uint16Array(
          new Uint8Array([data['coords'][2], data['coords'][3]]).buffer,
        )[0]

        const module = data['module'][0]
        const world = data['world'][0]

        let curMap = state.maps.curMap
        if (!state.sni.raceOverride && completed_modes.includes(module)) {
          queryApi.dispatch(setRaceOverride(true))
        }
        if (ingame_modes.includes(module)) {
          if (module === 0x07 && y <= 8192 && state.maps.curMap !== "EG1") {
            queryApi.dispatch(setCurMap("EG1"))
            curMap = "EG1"
          }
          if (module === 0x07 && y > 8192) {
            y -= 8192
            if (state.maps.curMap !== "EG2") {
              queryApi.dispatch(setCurMap("EG2"))
              curMap = "EG2"
            }
          }
          if (module === 0x09 && world === 0x01 && state.maps.curMap !== "DW") {
            queryApi.dispatch(setCurMap("DW"))
            curMap = "DW"
          }
          if (module === 0x09 && world === 0x00 && state.maps.curMap !== "LW") {
            queryApi.dispatch(setCurMap("LW"))
            curMap = "LW"
          }
          queryApi.dispatch(setCurCoords([x, y, curMap]))
        }

        if (state.sni.memoryMapping === 'lorom' && !state.sni.raceOverride && memResponse.response.responses[3].data[0] === 0x01) {
          return { error: "Race mode, not polling", errorCode: 1 }
        }
        queryApi.dispatch(setAllData(data))

        return { data: module }
      },
    }),
  }),
})

export const {
  useGetDevicesQuery,
  useLazyGetDevicesQuery,
  useReadMemoryQuery,
} = sniApiSlice
