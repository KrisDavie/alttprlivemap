import { ModeToggle } from "@/components/mode-toggle"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import SniSettings from "./sni/sniSettings"
import { AlertCircleIcon, CheckIcon, HomeIcon, XCircleIcon } from "lucide-react"
import { useAppDispatch, useAppSelector } from "@/app/hooks"
import { selectAvailableDevices, setPollInterval } from "./sni/sniSlice"
import { useGetDevicesQuery } from "./sni/sniApiSlice"
import {
  setHistoryLenToShow,
  setZoomLevel,
  toggleFollowPlayer,
  toggleSomariaPits,
} from "./map/mapSlice"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { cn } from "@/lib/utils"
import { Separator } from "@/components/ui/separator"
import { Input } from "@/components/ui/input"

function Header(props: any) {
  const grpcConnected = useAppSelector((state) => state.sni.grpcConnected)
  const devices: string[] = useAppSelector(selectAvailableDevices)
  const dispatch = useAppDispatch()
  const connectedDevice: string | undefined = useAppSelector(
    (state) => state.sni.connectedDevice,
  )
  const somariaPits = useAppSelector((state) => state.maps.somariaPits)
  const followPlayer = useAppSelector((state) => state.maps.followPlayer)
  const historyLengthToShow = useAppSelector(
    (state) => state.maps.historyLenToShow,
  )
  const coordsHistory = useAppSelector((state) => state.maps.coordsHistory)
  const zoomLevel = useAppSelector((state) => state.maps.zoomLevel)
  const pollingInterval = useAppSelector((state) => state.sni.pollInterval)
  useGetDevicesQuery(
    { noConnect: false },
    { pollingInterval: 1000, skip: devices.length > 0 },
  )

  const handleSomariaPits = () => {
    dispatch(toggleSomariaPits())
  }

  const handleFollowPlayer = () => {
    dispatch(toggleFollowPlayer())
  }

  const handleZoomChange = (e: any) => {
    dispatch(setZoomLevel(e))
  }

  const handleHistoryLengthChange = (e: any) => {
      dispatch(setHistoryLenToShow(e))
  }

  const handlePollingIntervalChange = (e: any) => {
    dispatch(setPollInterval(parseInt(e.target.value)))
  }

  return (
    <div className="flex flex-col h-12 items-center">
      <div className="flex absolute top-4 left-2 space-x-2 justify-between">
        <div className="flex items-center space-x-2">
          <Checkbox
            onClick={handleSomariaPits}
            checked={somariaPits}
            id="somaria"
          />
          <Label
            htmlFor="somaria"
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            Show Somaria Pits
          </Label>
        </div>
        <Separator orientation="vertical" className="flex h-4" />
        <div className="flex items-center space-x-2">
          <Checkbox
            onClick={handleFollowPlayer}
            checked={followPlayer}
            id="follow"
          />
          <Label
            htmlFor="follow"
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            Follow Player
          </Label>
        </div>
        <Separator orientation="vertical" className="flex h-4" />
        <div className="flex items-center space-x-2 w-48">
          <Slider
            onValueChange={handleZoomChange}
            value={[zoomLevel]}
            defaultValue={[1]}
            max={5}
            step={0.1}
            className={cn("w-[85%]")}
            id="follow"
          />
          <Label
            htmlFor="follow"
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            Zoom
          </Label>
        </div>
        <Separator orientation="vertical" className="flex h-4" />
        <div className="flex items-center space-x-2 w-56">
          <Slider
            onValueChange={handleHistoryLengthChange}
            defaultValue={[100]}
            max={10000}
            step={100}
            className={cn("w-[60%]")}
            id="history"
          />
          <Label
            htmlFor="history"
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            Steps ({historyLengthToShow == 0 ? "All" : historyLengthToShow})
          </Label>
        </div>
        <Separator orientation="vertical" className="flex h-4" />
        <div className="flex items-center space-x-2 w-56">
          <Input
          defaultValue={pollingInterval ?? 500}
            onChange={handlePollingIntervalChange}
            className="w-24 h-4"
            id='pollingInterval'
          />
          <Label
            htmlFor="pollingInterval"
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >Poll Interval (ms)</Label>
            </div>
      </div>
      <div className="flex absolute top-1 right-2">
        <Popover>
          <PopoverTrigger>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <Button variant="outline">
                    <div className="pr-2">SNI Settings</div>
                    {!grpcConnected ? (
                      <XCircleIcon color="red" />
                    ) : devices.length === 0 ? (
                      <AlertCircleIcon color="yellow" />
                    ) : (
                      <CheckIcon color="green" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {!grpcConnected
                    ? "SNI Not Detected"
                    : devices.length === 0
                    ? "No Devices Found"
                    : "Connected to " + connectedDevice + " via SNI"}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-auto">
            <SniSettings />
          </PopoverContent>
        </Popover>
        <ModeToggle />
      </div>
    </div>
  )
}

export default Header
