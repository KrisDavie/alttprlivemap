import type { RootState } from "@/app/store"
import { createApi, fakeBaseQuery } from "@reduxjs/toolkit/query/react"
import { GrpcWebFetchTransport } from "@protobuf-ts/grpcweb-transport"
import {
  setConnectedDevice,
  setCurRead,
  setDeviceList,
  setGrpcConnected,
  setLastRead,
} from "./sniSlice"
import { resetHistory, setCurCoords, setCurMap } from "../map/mapSlice"
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

type SRAMLocs = {
  [key: number]: [string, number]
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
        let memResponse = await controlMem.multiRead({
          uri: connectedDevice,
          requests: [
            
            
            {
              requestMemoryMapping: MemoryMapping.LoROM,
              requestAddress: 0xf50010,
              requestAddressSpace: AddressSpace.FxPakPro,
              size: 1,
            },
            {
              requestMemoryMapping: MemoryMapping.LoROM,
              requestAddress: 0xf50020,
              requestAddressSpace: AddressSpace.FxPakPro,
              size: 4,
            },
            {
              requestMemoryMapping: MemoryMapping.LoROM,
              requestAddress: 0xf50fff,
              requestAddressSpace: AddressSpace.FxPakPro,
              size: 1,
            },
            {
              requestMemoryMapping: MemoryMapping.LoROM,
              requestAddress: 0x180213,
              requestAddressSpace: AddressSpace.FxPakPro,
              size: 1,
            },
          ],
        })
        if (!memResponse.response) {
          return { error: "Error reading memory, no reposonse" }
        }
        if (memResponse.response.responses[3].data[0] === 0x01) {
          return { error: "Race mode, not polling", errorCode: 1 }
        }
        let module = memResponse.response.responses[0].data[0]
        let coords = memResponse.response.responses[1]
        let world = memResponse.response.responses[2].data[0]
        var y = new Uint16Array(
          new Uint8Array([coords.data[0], coords.data[1]]).buffer,
        )[0]
        const x = new Uint16Array(
          new Uint8Array([coords.data[2], coords.data[3]]).buffer,
        )[0]

        if (ingame_modes.includes(module)) {
          if (module === 0x07 && y <= 8192 && state.maps.curMap !== "EG1") {
            queryApi.dispatch(setCurMap("EG1"))
            queryApi.dispatch(resetHistory())
          }
          if (module === 0x07 && y > 8192) {
            y -= 8192
            if (state.maps.curMap !== "EG2") {
              queryApi.dispatch(setCurMap("EG2"))
              queryApi.dispatch(resetHistory())
            }
          }
          if (module === 0x09 && world === 0x01 && state.maps.curMap !== "DW") {
            queryApi.dispatch(setCurMap("DW"))
            queryApi.dispatch(resetHistory())
          }
          if (module === 0x09 && world === 0x00 && state.maps.curMap !== "LW") {
            queryApi.dispatch(setCurMap("LW"))
            queryApi.dispatch(resetHistory())
          }

          console.log(module, x, y, world)

          queryApi.dispatch(setCurCoords([x, y]))
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
