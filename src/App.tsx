import { useRef, useState } from "react";
import Header from "./features/Header"
import Timer from "./features/timer/Timer"
import {
  TransformWrapper,
  TransformComponent,
  ReactZoomPanPinchRef,
} from "react-zoom-pan-pinch";
import MapContent from "./features/map/MapContent";
import { useReadMemoryQuery } from "./features/sni/sniApiSlice";
import { useAppDispatch } from "./app/hooks";
import { setZoomLevel } from "./features/map/mapSlice";

function App() {

  const [msToCount, setMsToCount] = useState(500)
  const memReply = useReadMemoryQuery(
    { memLoc: 0xF50020, size: 4 },
    { pollingInterval: msToCount },
  )

  const transformComponentRef = useRef<ReactZoomPanPinchRef | null>(null);
  const windowSize = useRef({
    width: window.innerWidth,
    height: window.innerHeight,
  });
  const initialScale = 0.5;
  const [selectedMap, setSelectedMap] = useState<"EG1" | "EG2" | "LW" | "DW">(
    "EG1"
  );
  const dispatch = useAppDispatch();
  const curImageSize = {

    width: 8192,
    height: selectedMap === "EG2" ? 1536 : 8192,
  };
  const [showSomariaPits, setShowSomariaPits] = useState(false);

  const handleSomariaPits = () => {
    setShowSomariaPits(!showSomariaPits);
  }

  const race = memReply.error

  const mapContent = race ? (<div className="text-red-700 text-4xl font-bold mt-32">ERROR: Race rom detected</div>) : (<TransformWrapper
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
          <MapContent
            zoomToElement={zoomToElement}
          />
        </TransformComponent>
      </div>
    )}
  </TransformWrapper>)

  
  return (
    <div className="flex flex-col items-center">
      <Header setShowSomariaPits={handleSomariaPits}/>
      {mapContent}
      
    </div>
  )
}

export default App
