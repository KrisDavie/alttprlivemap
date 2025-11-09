import MapImage from "./MapImage"
import { useAppSelector } from "@/app/hooks"
import {
  selectCoordsHistory,
  selectAllData,
  selectMapHistory,
  selectSomariaPits,
  selectCurCoords,
  selectFollowPlayer,
  selectZoomLevel,
  selectCurMap,
  selectCameraInfo,
  selectDebugInfo,
} from "./mapSlice"

import { spriteIds } from "@/data/sprite_ids"
import { ancillaeIds } from "@/data/ancillae_ids"

interface MapContentProps {
  zoomToElement: (
    element: string,
    scale?: number,
    transitionTime?: number,
  ) => void
}

function MapContent(props: MapContentProps) {
  const { zoomToElement } = props

  const showSomariaPits = useAppSelector(selectSomariaPits)
  const showCameraInfo = useAppSelector(selectCameraInfo)
  const showDebugInfo = useAppSelector(selectDebugInfo)
  const curCoords = useAppSelector(selectCurCoords)
  let coordsHistory = useAppSelector(selectCoordsHistory)
  const mapHistory = useAppSelector(selectMapHistory)
  const followPlayer = useAppSelector(selectFollowPlayer)
  const zoomLevel = useAppSelector(selectZoomLevel)
  const pollingInterval = useAppSelector((state) => state.sni.pollInterval)
  const allData = useAppSelector(selectAllData)

  if (followPlayer && curCoords) {
    zoomToElement("playerDot", zoomLevel, pollingInterval)
  }

  const selectedMap = useAppSelector(selectCurMap)
  let coordsSets: [number, number][][] = []

  let currentSet: [number, number][] = []
  for (let i = 0; i < coordsHistory.length; i++) {
    if (mapHistory[i] === selectedMap) {
      currentSet.push(coordsHistory[i])
    } else {
      if (currentSet.length > 0) {
        coordsSets.push(currentSet)
        currentSet = []
      }
    }
  }
  if (currentSet.length > 0) {
    coordsSets.push(currentSet)
  }

  let mapImage = ""
  let somariaPits = ""

  switch (selectedMap) {
    case "EG1":
      mapImage = "images/eg_map_fully_annotated"
      somariaPits = "images/eg_somaria_pits"
      break
    case "EG2":
      mapImage = "images/eg2_map_fully_annotated"
      somariaPits = "images/eg2_somaria_pits"
      break
    case "LW":
      mapImage = "images/lightworld_large"
      somariaPits = ""
      break
    case "DW":
      mapImage = "images/darkworld_large"
      somariaPits = ""
      break
    default:
      mapImage = "images/eg_map_fully_annotated"
      somariaPits = "images/eg_somaria_pits"
  }

  // Set map image based on selected map
  const x = curCoords[0] * (selectedMap.startsWith("EG") ? 1 : 2)
  const y = curCoords[1] * (selectedMap.startsWith("EG") ? 1 : 2)

  const x_corr = selectedMap.startsWith("EG") ? 3 : 12
  const y_corr = selectedMap.startsWith("EG") ? 8 : 24

  let transitionBounds,
    transitionHeight,
    transitionWidth,
    cameraPosX = 0,
    cameraPosY = 0

  const spriteData: [string, number, number][] = []
  const ancillaeData: [string, number, number][] = []

  // UW
  if (selectedMap.startsWith("EG")) {
    // Bounds
    const transitionBoundLocs = [0x0, 0xc, 0x4, 0x8]
    if (allData && allData["transition_bounds"]) {
      const boundSet = [
        allData["transition_bound_set"][1], // V
        allData["transition_bound_set"][0], // H
        allData["transition_bound_set"][1], // V
        allData["transition_bound_set"][0], // H
      ]
      transitionBounds = transitionBoundLocs.map((loc, index) => {
        loc += boundSet[index]

        const bound = allData["transition_bounds"].slice(loc, loc + 2)
        let boundVal = new Uint16Array(
          new Uint8Array([bound[0], bound[1]]).buffer,
        )[0]
        switch (index) {
          case 0: // N
            if (boundSet[index] == 0) {
              boundVal += 0x10
            }
            break
          case 1: // E
            if (boundSet[index] == 0) {
              boundVal += 0x100
            }
            break
          case 2: // S
            if (boundSet[index] == 0) {
              boundVal += 0xf0
            } else if (boundSet[index] == 2) {
              boundVal -= 0x10
            }
            break
        }
        return boundVal
      })
      transitionHeight =
        (transitionBounds[2] - transitionBounds[0]) *
        (allData["transition_bound_set"][1] === 0 ? 1 : 2)
      transitionWidth =
        (transitionBounds[1] - transitionBounds[3]) *
        (allData["transition_bound_set"][0] === 0 ? 1 : 2)

      if (selectedMap == "EG2") {
        if (transitionBounds[0] >= 8192) {
          transitionBounds[0] -= 8192
          transitionBounds[2] -= 8192
        }
      }
    }

    // Camera pos
    if (allData && allData["camera_pos_uw"]) {
      cameraPosX = new Uint16Array(
        new Uint8Array([
          allData["camera_pos_uw"][0],
          allData["camera_pos_uw"][1],
        ]).buffer,
      )[0]
      cameraPosY = new Uint16Array(
        new Uint8Array([
          allData["camera_pos_uw"][6],
          allData["camera_pos_uw"][7],
        ]).buffer,
      )[0]

      if (selectedMap == "EG2") {
        if (cameraPosY >= 8192) {
          cameraPosY -= 8192
        }
      }
    }
    // OW
  } else {
    // Bounds
    const transitionBoundLocs = [0x0, 0x16, 0x12, 0x4]
    transitionBounds = transitionBoundLocs.map((loc, index) => {
      const bound =
        allData && allData["transition_bounds"]
          ? allData["transition_bounds"].slice(loc, loc + 2)
          : [0, 0]
      let boundVal = new Uint16Array(
        new Uint8Array([bound[0], bound[1]]).buffer,
      )[0]
      return boundVal * 2
    })
    transitionHeight = transitionBounds[2] - transitionBounds[0]
    transitionWidth = transitionBounds[1] - transitionBounds[3]

    // Camera pos
    if (allData && allData["camera_pos_ow"]) {
      cameraPosY =
        (new Uint16Array(
          new Uint8Array([
            allData["camera_pos_ow"][0],
            allData["camera_pos_ow"][1],
          ]).buffer,
        )[0] -
          108) *
        2
      cameraPosX =
        (new Uint16Array(
          new Uint8Array([
            allData["camera_pos_ow"][6],
            allData["camera_pos_ow"][7],
          ]).buffer,
        )[0] -
          123) *
        2
    }
  }
  // Sprites
  if (allData && allData["sprite_ids"]) {
    // Loop through sprite IDs with index
    for (let i = 0; i < allData["sprite_ids"].length; i++) {
      const spriteId = spriteIds[allData["sprite_ids"][i]]
      const yPos = new Uint16Array(
        new Uint8Array([
          allData["sprite_coords"][i],
          allData["sprite_coords"][0x20 + i],
        ]).buffer,
      )[0]
      const xPos = new Uint16Array(
        new Uint8Array([
          allData["sprite_coords"][0x10 + i],
          allData["sprite_coords"][0x30 + i],
        ]).buffer,
      )[0]
      spriteData.push([spriteId, xPos, yPos])
    }
  }

  if (allData && allData["ancillae_ids"]) {
    // Loop through ancillae IDs with index
    for (let i = 0; i < allData["ancillae_ids"].length; i++) {
      const ancillaeId = ancillaeIds[allData["ancillae_ids"][i]]
      const yPos = new Uint16Array(
        new Uint8Array([
          allData["ancillae_coords"][i],
          allData["ancillae_coords"][0x14 + i],
        ]).buffer,
      )[0]
      const xPos = new Uint16Array(
        new Uint8Array([
          allData["ancillae_coords"][0xa + i],
          allData["ancillae_coords"][0x1e + i],
        ]).buffer,
      )[0]
      ancillaeData.push([ancillaeId, xPos, yPos])
    }
  }

  const cameraStrokeWidth = 4

  return (
    <div
      style={{
        position: "relative",
      }}
    >
      <MapImage
        src={`${mapImage}.png`}
        width={8192}
        height={selectedMap === "EG2" ? 1536 : 8192}
        mapImage={mapImage}
        somariaPits={`${somariaPits}.png`}
        selectedMap={selectedMap}
        showSomariaPits={showSomariaPits}
      />
      {showDebugInfo && (
        <div
          id="coordsText"
          style={{
            position: "absolute",
            top: (y % 8192) + y_corr,
            left: (x % 8192) + x_corr,
            backgroundColor: "rgba(0, 0, 0, 0.7)",
            padding: "5px",
            borderRadius: "5px",
            zIndex: 2000,
          }}
        >
          Link: (
          {(x / (selectedMap.startsWith("EG") ? 1 : 2))
            .toString(16)
            .padStart(4, "0")}
          ,{" "}
          {(y / (selectedMap.startsWith("EG") ? 1 : 2))
            .toString(16)
            .padStart(4, "0")}
          )<br />
          Camera: (
          {(cameraPosX / (selectedMap.startsWith("EG") ? 1 : 2))
            .toString(16)
            .padStart(4, "0")}
          ,{" "}
          {(cameraPosY / (selectedMap.startsWith("EG") ? 1 : 2))
            .toString(16)
            .padStart(4, "0")}
          )<br />
          BoundSet H:{" "}
          {allData &&
            allData["transition_bound_set"] &&
            allData["transition_bound_set"][0]}
          <br />
          BoundSet V:{" "}
          {allData &&
            allData["transition_bound_set"] &&
            allData["transition_bound_set"][1]}
          <br />
          Bounds N:{" "}
          {transitionBounds &&
            `${transitionBounds[0]} (${allData["transition_bound_set"][1]})`}
          <br />
          Bounds E:{" "}
          {transitionBounds &&
            `${transitionBounds[1]} (${allData["transition_bound_set"][0]})`}
          <br />
          Bounds S:{" "}
          {transitionBounds &&
            `${transitionBounds[2]} (${allData["transition_bound_set"][1]})`}
          <br />
          Bounds W:{" "}
          {transitionBounds &&
            `${transitionBounds[3]} (${allData["transition_bound_set"][0]})`}
          <br />
        </div>
      )}
      {/* Show current coords as a circle */}
      {curCoords && (
        <svg
          id="playerDotSvg"
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            width: "100%",
            height: "100%",
            pointerEvents: "none",
            zIndex: 10000,
          }}
        >
          <circle
            id="playerDot"
            cx={(x % 8192) + x_corr}
            cy={(y % 8192) + y_corr}
            r={6}
            fill="red"
            strokeDasharray={Math.max(x, y) < 8192 ? "0" : "2,2"}
            stroke="black"
            strokeWidth={2}
          />
        </svg>
      )}
      {coordsSets.length > 0 && (
        <svg
          id="pathSvg"
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            width: "100%",
            height: "100%",
            pointerEvents: "none",
            zIndex: 99,
          }}
        >
          {coordsSets.map((historySet) =>
            historySet.map((coords, index) => {
              if (index === historySet.length - 1) return null // Skip the last coordinate
              const startX = selectedMap.startsWith("EG")
                ? coords[0]
                : coords[0] * 2
              const startY = selectedMap.startsWith("EG")
                ? coords[1]
                : coords[1] * 2
              const endX = selectedMap.startsWith("EG")
                ? historySet[index + 1][0]
                : historySet[index + 1][0] * 2
              const endY = selectedMap.startsWith("EG")
                ? historySet[index + 1][1]
                : historySet[index + 1][1] * 2
              return (
                <line
                  key={index}
                  x1={startX + x_corr + 5}
                  y1={startY + y_corr + 5}
                  x2={endX + x_corr + 5}
                  y2={endY + y_corr + 5}
                  stroke="red"
                  strokeWidth={3}
                />
              )
            }),
          )}
        </svg>
      )}
      {/* show transition boundaries */}
      {showCameraInfo &&
        cameraPosY !== undefined &&
        cameraPosX !== undefined && (
          <svg
            id="transitionBoundsSvg"
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              width: "100%",
              height: "100%",
              pointerEvents: "none",
              zIndex: 98,
            }}
          >
            {/* nesw */}
            <rect
              x={(cameraPosX % 8192) - cameraStrokeWidth / 2}
              y={(cameraPosY % 8192) - cameraStrokeWidth / 2}
              height={
                224 * (selectedMap.startsWith("EG") ? 1 : 2) + cameraStrokeWidth
              }
              width={
                256 * (selectedMap.startsWith("EG") ? 1 : 2) + cameraStrokeWidth
              }
              stroke="red"
              strokeDasharray={
                Math.max(cameraPosX, cameraPosY) < 8192 ? "0" : "10,5"
              }
              strokeWidth={cameraStrokeWidth}
              fill="none"
            />
          </svg>
        )}
      {/* show transition boundaries */}
      {showCameraInfo && transitionBounds && (
        <svg
          id="transitionBoundsSvg"
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            width: "100%",
            height: "100%",
            pointerEvents: "none",
            zIndex: 98,
          }}
        >
          {/* nesw */}
          <rect
            y={transitionBounds[0] % 8192}
            x={transitionBounds[3] % 8192}
            height={transitionHeight}
            width={transitionWidth}
            stroke="blue"
            strokeDasharray={
              Math.max(transitionBounds[0], transitionBounds[3]) < 8192
                ? "0"
                : "10,5"
            }
            strokeWidth={5}
            fill="none"
          />
        </svg>
      )}
      {spriteData.length > 0 && (
        <svg
          id="spriteSvg"
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            width: "100%",
            height: "100%",
            pointerEvents: "none",
            zIndex: 97,
          }}
        >
          {spriteData.map((sprite, index) => {
            const spriteX = selectedMap.startsWith("EG")
              ? sprite[1]
              : sprite[1] * 2
            const spriteY = selectedMap.startsWith("EG")
              ? sprite[2]
              : sprite[2] * 2
            return (
              <g key={index}>
                <circle
                  cx={spriteX + x_corr}
                  cy={spriteY + y_corr}
                  r={6}
                  fill="yellow"
                  stroke="black"
                  strokeWidth={2}
                />
                <text
                  x={spriteX + x_corr}
                  y={spriteY + y_corr - 10}
                  fill="white"
                  fontSize="16"
                  textAnchor="middle"
                >
                  {`${index.toString().padStart(2, "0")}: ${sprite[0]}`}
                </text>
              </g>
            )
          })}
        </svg>
      )}
      {ancillaeData.length > 0 && (
        <svg
          id="ancillaeSvg"
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            width: "100%",
            height: "100%",
            pointerEvents: "none",
            zIndex: 96,
          }}
        >
          {ancillaeData.map((ancillae, index) => {
            const ancillaeX = selectedMap.startsWith("EG")
              ? ancillae[1]
              : ancillae[1] * 2
            const ancillaeY = selectedMap.startsWith("EG")
              ? ancillae[2]
              : ancillae[2] * 2
            if (ancillae[0] === "Nothing") {
              return null
            }
            return (
              <g key={index}>
                <circle
                  cx={(ancillaeX % 8192) + x_corr}
                  cy={(ancillaeY % 8192) + y_corr}
                  r={6}
                  fill="blue"
                  stroke="black"
                  strokeDasharray={
                    Math.max(ancillaeX, ancillaeY) < 8192 ? "0" : "2,2"
                  }
                  strokeWidth={2}
                />
                <text
                  x={(ancillaeX % 8192) + x_corr}
                  y={(ancillaeY % 8192) + y_corr - 10}
                  fill="white"
                  fontSize="16"
                  textAnchor="middle"
                >
                  {`${index.toString().padStart(2, "0")}: ${ancillae[0]}`}
                </text>
              </g>
            )
          })}
        </svg>
      )}
    </div>
  )
}

export default MapContent
