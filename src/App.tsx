import { useRef, useState } from "react"
import Header from "./features/Header"
import {
  TransformWrapper,
  TransformComponent,
  ReactZoomPanPinchRef,
} from "react-zoom-pan-pinch"
import MapContent from "./features/map/MapContent"
import { useReadMemoryQuery } from "./features/sni/sniApiSlice"
import { setRaceOverride } from "./features/sni/sniSlice"
import { useAppDispatch, useAppSelector } from "./app/hooks"
import { setZoomLevel } from "./features/map/mapSlice"
import { Checkbox } from "./components/ui/checkbox"
import { Button } from "./components/ui/button"

function App() {
  const pollingInterval = useAppSelector((state) => state.sni.pollInterval)
  const [overrideAcknowlegde, setOverrideAcknowlegde] = useState(false)

  const memReply = useReadMemoryQuery({}, { pollingInterval: pollingInterval })

  const transformComponentRef = useRef<ReactZoomPanPinchRef | null>(null)
  const windowSize = useRef({
    width: window.innerWidth,
    height: window.innerHeight,
  })
  const initialScale = 0.5
  const [selectedMap, setSelectedMap] = useState<"EG1" | "EG2" | "LW" | "DW">(
    "EG1",
  )
  const dispatch = useAppDispatch()
  const curImageSize = {
    width: 8192,
    height: selectedMap === "EG2" ? 1536 : 8192,
  }
  const [showSomariaPits, setShowSomariaPits] = useState(false)
  const [showCameraInfo, setShowCameraInfo] = useState(false)
  const [showDebugInfo, setShowDebugInfo] = useState(false)

  const raceOverride = useAppSelector((state) => state.sni.raceOverride)

  const handleSomariaPits = () => {
    setShowSomariaPits(!showSomariaPits)
  }

  const handleCameraInfo = () => {
    setShowCameraInfo(!showCameraInfo)
  }

  const handleDebugInfo = () => {
    setShowDebugInfo(!showDebugInfo)
  }

  const handleRaceOverride = () => {
    dispatch(setRaceOverride(true))
  }

  const race = memReply.error && !raceOverride

  const mapContent = race ? (
    <div className="flex flex-col w-4/6 items-center">
      <div className="flex text-red-700 text-2xl font-bold mt-32 w-5/6 text-center">
        ERROR: Race rom detected!
        <br />
        <br />
        Data will be logged but the map will not be shown until you beat the
        game or trigger the override.
      </div>
      <div className="mt-4 mb-4">
        <Checkbox
          id="raceOverride"
          checked={overrideAcknowlegde}
          onClick={() => setOverrideAcknowlegde(!overrideAcknowlegde)}
        />
        <label className="ml-3" htmlFor="raceOverride">
          I understand that using this in a race is against the rules and that I
          would be cheating if I did so.
        </label>
      </div>
      <Button
        className="w-36"
        disabled={!overrideAcknowlegde}
        onClick={() => handleRaceOverride()}
      >
        Override
      </Button>
    </div>
  ) : (
    <TransformWrapper
      initialScale={initialScale}
      initialPositionX={
        (-curImageSize.width * initialScale) / 2 +
        windowSize.current.width / 2 -
        292
      }
      initialPositionY={
        (-curImageSize.height * initialScale) / 2 +
        windowSize.current.height / 2
      }
      minScale={0.1}
      wheel={{ step: 0.05 }}
      ref={transformComponentRef}
      onZoom={(zoom) => {
        dispatch(setZoomLevel(zoom.state.scale))
      }}
      limitToBounds={false}
    >
      {({ zoomToElement, resetTransform }) => (
        <div>
          <TransformComponent
            wrapperStyle={{
              maxWidth: "100%",
              maxHeight: "calc(100vh - 1px)",
              backgroundColor: "#322d38",
            }}
          >
            <MapContent zoomToElement={zoomToElement} />
          </TransformComponent>
        </div>
      )}
    </TransformWrapper>
  )

  return (
    <div className="flex flex-col items-center">
      <Header
        setShowSomariaPits={handleSomariaPits}
        setShowCameraInfo={handleCameraInfo}
        setShowDebugInfo={handleDebugInfo}
      />
      {mapContent}
    </div>
  )
}

export default App
