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
    cameraPosX,
    cameraPosY,
    cameraBoundsN,
    cameraBoundsE

  if (selectedMap.startsWith("EG")) {
    // NESW
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
  } else {
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

    // NESW
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

  const cameraStrokeWidth = 4

  return (
    <div
      style={{
        position: "relative",
      }}
    >
      {/* Small square with camera and link coords as text */}
      {showDebugInfo && (
        <div
          id="coordsText"
          style={{
            position: "absolute",
            top: y + y_corr,
            left: x + x_corr,
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
          Camera: ({cameraPosX}, {cameraPosY})<br />
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
          {"E<->W:"}{" "}
          {Math.abs(
            transitionBounds ? transitionBounds[3] - transitionBounds[1] : 0,
          )}
          <br />
          {"N<->S:"}{" "}
          {Math.abs(
            transitionBounds ? transitionBounds[0] - transitionBounds[2] : 0,
          )}
          <br />
        </div>
      )}
      <MapImage
        src={`${mapImage}.png`}
        width={8192}
        height={selectedMap === "EG2" ? 1536 : 8192}
        mapImage={mapImage}
        somariaPits={`${somariaPits}.png`}
        selectedMap={selectedMap}
        showSomariaPits={showSomariaPits}
      />
      {/* Show current coords as an X */}
      {curCoords && (
        <div
          id="playerDot"
          style={{
            position: "absolute",
            left: x + x_corr,
            top: y + y_corr,
            width: 10,
            height: 10,
            backgroundColor: "red",
            borderRadius: "50%",
            zIndex: 10000,
          }}
        ></div>
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
              x={cameraPosX - cameraStrokeWidth / 2}
              y={cameraPosY - cameraStrokeWidth / 2}
              height={
                224 * (selectedMap.startsWith("EG") ? 1 : 2) + cameraStrokeWidth
              }
              width={
                256 * (selectedMap.startsWith("EG") ? 1 : 2) + cameraStrokeWidth
              }
              stroke="red"
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
            y={transitionBounds[0]}
            x={transitionBounds[3]}
            height={transitionHeight}
            width={transitionWidth}
            stroke="blue"
            strokeWidth={5}
            fill="none"
          />
        </svg>
      )}
    </div>
  )
}

export default MapContent
