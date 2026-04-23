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
                height: RoomSprite.ROOM_BOUNDS.top + "px"
            }}
            className="absolute flex gap-4 items-center">
            {
                Array.from({ length: Player.MAX_HEALTH }).map((_, i) => (
                    <Heart key={i} filled={i < hp} />
                ))
            }
        </div>
    )
}

const Heart = ({ filled }: { filled: boolean }) => {
    return (
        <div className="relative flex items-center justify-center">
            <img
                style={{
                    animationDuration: "0.5s",
                    animationIterationCount: "5",
                    animationFillMode: "forwards",
                    animationName: filled ? "heart-blink" : undefined,
                }}
                src="/public/assets/heart.png" className="w-[50px] absolute" />
            <img src="/public/assets/heart_empty.png" className="w-[50px]" />
        </div>
    )
}