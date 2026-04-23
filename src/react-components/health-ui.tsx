import { useEffect, useState } from "react"
import { Player } from "../sprites/PlayerSprite"
import { EventHandler, GLOBAL_EVENTS } from "../helpers/eventHandler"
import { RoomSprite } from "../sprites/RoomSprite"


export default function HealthUI() {
    const [hp, setHp] = useState(Player.health)
    useEffect(() => {
        const handler = () => setHp(Player.health)
        const unsub = EventHandler.on(GLOBAL_EVENTS.HEALTH_CHANGED, handler)
        return () => {
            unsub()
        }
    }, [])


    return (
        <div
            style={{
                left: RoomSprite.ROOM_BOUNDS.left,
                top: 0,
                width: RoomSprite.ROOM_SIZE,
                height: RoomSprite.BANNER_SIZE - 10
            }}
            className="absolute flex gap-2 items-center py-7">
            {
                Array.from({ length: Player.MAX_HEALTH }).map((_, i) => (
                    <Heart key={i} filled={i + 1 <= hp} />
                ))
            }
        </div>
    )
}

const Heart = ({ filled }: { filled: boolean }) => {
    console.log(filled)
    return (
        <div className="relative flex items-center justify-center h-full">
            <img
                style={{
                    animationDuration: "200ms",
                    animationIterationCount: "2",
                    opacity: filled ? 1 : 0,
                    animationName: filled ? "" : "heart-blink",
                }}
                src="/public/assets/heart.png" className="h-full absolute" />
            <img src="/public/assets/heart_empty.png" className="h-full" />
        </div>
    )
}