import { useEffect, useMemo, useState } from "react";
import { RoomSprite } from "../sprites/RoomSprite";
import { GameLoopHandler, ILevelData } from "../handlers/GameLoopHandler";
import { EventHandler, GLOBAL_EVENTS } from "../helpers/eventHandler";



export default function UiLeftBar() {
    const [globalLevels, setGlobalLevels] = useState<ILevelData[]>();
    const [displayData, setDisplayData] = useState({
        currentLevelIdx: GameLoopHandler.currentLevelIdx,
        currentWaveIdx: GameLoopHandler.currentWaveIdx,
    })

    const wavesThisLevel = useMemo(() => {
        if (!globalLevels || globalLevels.length == 0) return 0;
        const currentLevel = globalLevels[displayData.currentLevelIdx]
        if (!currentLevel) return 0;
        return currentLevel.variants[GameLoopHandler.currentVariationIdx].enemyWaves!.length ?? 0
    }, [globalLevels, displayData.currentLevelIdx])

    useEffect(() => {
        EventHandler.on(GLOBAL_EVENTS.UPDATE_STAGE_INFO_UI, () => {
            setDisplayData({
                currentLevelIdx: GameLoopHandler.currentLevelIdx,
                currentWaveIdx: GameLoopHandler.currentWaveIdx,
            })
            setGlobalLevels(GameLoopHandler.globalLevels)
        })
    }, [])

    return (
        <div
            style={{
                left: 0,
                top: RoomSprite.ROOM_BOUNDS.top,
                width: RoomSprite.ROOM_BOUNDS.left,
                height: RoomSprite.ROOM_SIZE
            }}
            className="absolute flex justify-end pointer-events-none font-mono"
        >
            <div className="w-fit h-full flex flex-col gap-2 pr-8 text-white items-end">
                <div>
                    Stage {displayData.currentLevelIdx}
                </div>
                <div>
                    <span>Wave:&nbsp;</span>
                    <span>
                        {Math.min(wavesThisLevel, displayData.currentWaveIdx + 1)}
                        <span>/{wavesThisLevel}</span>
                    </span>
                </div>
            </div>
        </div>
    )
}
