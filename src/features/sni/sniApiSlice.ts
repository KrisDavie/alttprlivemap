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
import { setCurCoords, setCurMap } from "../map/mapSlice"
import {
  DevicesClient,
  DeviceControlClient,
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

type SRAMLocs = {
  [key: number]: [string, number]
}

const memMaps: { [x: string]: MemoryMapping } = {
  'lorom': MemoryMapping.LoROM,
  'sa1': MemoryMapping.SA1,
}

const sram_locs: SRAMLocs = {
  0xf50010: ["game_mode", 0x1],
  0xe02000: ["rom_name", 0x15],
  0xf5f000: ["base", 0x256],
  0xf5f280: ["overworld", 0x82],
  0xf5f340: ["inventory", 0x1bd],
  0xf5f3c6: ["misc", 0x4],
  0xf5f410: ["npcs", 0x2],
  0xf5f4d0: ["multiinfo", 0x4],
  0xf66018: ["pots", 0x250],
  0xf66268: ["sprites", 0x250],
  0xf664b8: ["shops", 0x29],
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
    reset: builder.mutation({
      async queryFn(arg, queryApi, extraOptions, baseQuery) {
        const state = queryApi.getState() as RootState
        const transport = getTransport(state)
        let controlClient = new DeviceControlClient(transport)
        let connectedDevice = state.sni.connectedDevice
        if (connectedDevice) {
          const res = await controlClient.resetSystem({ uri: connectedDevice })
          return { data: res }
        } else {
          return { error: "No device selected" }
        }
      },
    }),
    readMemory: builder.query({
      async queryFn(
        arg: { memLoc: number; size: number },
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
        let memResponse
        if (state.sni.memoryMapping === 'lorom') {
          memResponse = await controlMem.multiRead({
            uri: connectedDevice,
            requests: 
            [
              {
                requestMemoryMapping: memMap,
                requestAddress: 0xF50010,
                requestAddressSpace: AddressSpace.FxPakPro,
                size: 1,
              },
              {
                requestMemoryMapping: memMap,
                requestAddress: 0xF50020,
                requestAddressSpace: AddressSpace.FxPakPro,
                size: 4,
              },
              {
                requestMemoryMapping: memMap,
                requestAddress: 0xF50fff,
                requestAddressSpace: AddressSpace.FxPakPro,
                size: 1,
              },
              {
                requestMemoryMapping: memMap,
                requestAddress: 0x180213,
                requestAddressSpace: AddressSpace.FxPakPro,
                size: 1,
              },
            ]
          })
        } else {
          memResponse = await controlMem.multiRead({
            uri: connectedDevice,
            requests: 
            [
              {
                requestMemoryMapping: memMap,
                requestAddress: 0xE07C00,
                requestAddressSpace: AddressSpace.FxPakPro,
                size: 0x4,
              },
              {
                requestMemoryMapping: memMap,
                requestAddress: 0xE07C04,
                requestAddressSpace: AddressSpace.FxPakPro,
                size: 1,
              },
              {
                requestMemoryMapping: memMap,
                requestAddress: 0xE07C06,
                requestAddressSpace: AddressSpace.FxPakPro,
                size: 1,
              },
            ]
          })
        }

        if (!memResponse.response) {
          return { error: "Error reading memory, no reposonse" }
        }

        let module
        let coords
        let world 

        if (state.sni.memoryMapping === 'lorom') {
          module = memResponse.response.responses[0].data[0]
          coords = memResponse.response.responses[1]
          world = memResponse.response.responses[2].data[0]
        } else {
          module = memResponse.response.responses[1].data[0]
          coords = memResponse.response.responses[0]
          world = memResponse.response.responses[2].data[0]
        }

        var y = new Uint16Array(
          new Uint8Array([coords.data[0], coords.data[1]]).buffer,
        )[0]
        const x = new Uint16Array(
          new Uint8Array([coords.data[2], coords.data[3]]).buffer,
        )[0]

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

        return { data: module }
      },
    }),
  }),
})

export const {
  useGetDevicesQuery,
  useLazyGetDevicesQuery,
  useResetMutation,
  useReadMemoryQuery,
} = sniApiSlice
