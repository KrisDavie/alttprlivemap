import React, { useState } from "react";
import MapImage from "./MapImage";
import { useAppSelector } from "@/app/hooks";
import { selectCoordsHistory } from "./mapSlice";
import { stat } from "fs";


interface MapContentProps {
  zoomToElement: (element: string, scale?: number, transitionTime?: number) => void;
}

function MapContent(props: MapContentProps) {
  const {
    zoomToElement,
  } = props;

  const showSomariaPits = useAppSelector(state => state.maps.somariaPits);
  const curCoords = useAppSelector(state => state.maps.curCoords);
  let coordsHistory = useAppSelector(state => state.maps.coordsHistory.slice(-state.maps.historyLenToShow))
  const mapHistory = useAppSelector(state => state.maps.mapHistory.slice(-state.maps.historyLenToShow));
  const followPlayer = useAppSelector(state => state.maps.followPlayer);
  const zoomLevel = useAppSelector(state => state.maps.zoomLevel);
  const pollingInterval = useAppSelector((state) => state.sni.pollInterval)


  if (followPlayer && curCoords) {
    zoomToElement("playerDot", zoomLevel, pollingInterval)
  }

  const selectedMap = useAppSelector(state => state.maps.curMap);
  let coordsSets: [number,number][][] = [];

  let currentSet = [];
  for (let i = 0; i < coordsHistory.length; i++) {
    if (mapHistory[i] === selectedMap) {
      currentSet.push(coordsHistory[i]);
    } else {
      if (currentSet.length > 0) {
        coordsSets.push(currentSet);
        currentSet = [];
      }
    }
  }
  if (currentSet.length > 0) {
    coordsSets.push(currentSet);
  }

  console.log(coordsSets)
  


  const mapElements = [];

  let mapImage = "";
  let somariaPits = "";

  switch (selectedMap) {
    case "EG1":
      mapImage = "images/eg_map_fully_annotated";
      somariaPits = "images/eg_somaria_pits";
      break;
    case "EG2":
      mapImage = "images/eg2_map_fully_annotated";
      somariaPits = "images/eg2_somaria_pits";
      break;
    case "LW":
      mapImage = "images/lightworld_large";
      somariaPits = "";
      break;
    case "DW":
      mapImage = "images/darkworld_large";
      somariaPits = "";
      break;
    default:
      mapImage = "images/eg_map_fully_annotated";
      somariaPits = "images/eg_somaria_pits";
  }

  // Set map image basec on selected map

  const x = curCoords[0]
  const y = curCoords[1]

  const x_corr = selectedMap.startsWith("EG") ? 3 : 12
  const y_corr = selectedMap.startsWith("EG") ? 8 : 24
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
      {/* Show current coords as an X */}
      {curCoords && (
        <div
        id="playerDot"
          style={{
            position: "absolute",
            left: (selectedMap.startsWith("EG") ? x : x * 2) + x_corr,
            top: (selectedMap.startsWith("EG") ? y : y * 2) + y_corr,
            width: 10,
            height: 10,
            backgroundColor: "red",
            borderRadius: "50%",
            zIndex: 100,
          }}
        ></div>)}
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
              if (index === historySet.length - 1) return null; // Skip the last coordinate
              const startX = selectedMap.startsWith("EG") ? coords[0] : coords[0] * 2;
              const startY = selectedMap.startsWith("EG") ? coords[1] : coords[1] * 2;
              const endX = selectedMap.startsWith("EG") ? historySet[index + 1][0] : historySet[index + 1][0] * 2;
              const endY = selectedMap.startsWith("EG") ? historySet[index + 1][1] : historySet[index + 1][1] * 2;
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
              );
            }))}
          </svg>

      )}
    </div>
  );
}

export default MapContent;
