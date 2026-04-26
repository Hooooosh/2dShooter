import { useEffect, useRef, useState } from "react"
import { Player } from "../sprites/PlayerSprite"
import { EventHandler, GLOBAL_EVENTS } from "../helpers/eventHandler"
import { RoomSprite } from "../sprites/RoomSprite"


export default function UiTopBar() {
    const [hp, setHp] = useState(Player.health)
    const [stamina, setStamina] = useState(Player.currentStamina)

    useEffect(() => {
        const hpHandler = () => setHp(Player.health)
        const hpUnsub = EventHandler.on(GLOBAL_EVENTS.HEALTH_CHANGED, hpHandler)

        /* only when stamina changes whole numbers */
        const staminaHandler = () => setStamina(Player.currentStamina)
        const staminaUnsub = EventHandler.on(GLOBAL_EVENTS.STAMINA_CHANGED, staminaHandler)

        /* stamina checker ticker */

        function handlePartialStaminaChanges() {
            requestAnimationFrame(handlePartialStaminaChanges)
            if (!staminaPartialEl.current) return

            const staminaProgress = Player.currentStamina - Math.floor(Player.currentStamina)
            staminaPartialEl.current.style.clipPath = `inset(0 0 0 ${100 - staminaProgress * 100}%)`
        }

        handlePartialStaminaChanges()

        return () => {
            hpUnsub()
            staminaUnsub()
        }
    }, [])

    const staminaPartialEl = useRef<HTMLImageElement>(null)

    return (
        <div
            style={{
                left: RoomSprite.ROOM_BOUNDS.left,
                top: 0,
                width: RoomSprite.ROOM_SIZE,
                height: RoomSprite.BANNER_SIZE - 10
            }}
            className="absolute flex gap-4 items-center justify-between py-7 pointer-events-none"
        >
            {/* hp */}
            <div className="flex gap-2 w-full">
                {
                    Array.from({ length: Player.MAX_HEALTH }).map((_, i) => (
                        <Heart key={i} filled={i + 1 <= hp} />
                    ))
                }
            </div>

            {/* stamina */}
            <div className="flex relative w-full justify-end h-full gap-4" key={stamina}>
                <div className="flex absolute w-full h-full justify-end gap-[inherit]">
                    {/* empty stamina icons backdrop */}
                    {
                        Array.from({ length: Math.ceil(Player.MAX_STAMINA) }).map((_, i) => (
                            <img key={i} src="/assets/stamina-empty.png" className="h-full opacity-50" />
                        ))
                    }
                </div>

                {/* animated partial image */}
                {
                    stamina < Player.MAX_STAMINA && (
                        <img ref={staminaPartialEl} src="/assets/stamina-fill.png" className="h-full relative z-10 opacity-40" />
                    )
                }

                {/* full images */}
                {
                    Array.from({ length: Math.floor(stamina) }).map((_, i) => (
                        <img key={i} src="/assets/stamina-fill.png" className="h-full z-10" />
                    ))
                }

            </div>
        </div>
    )
}

const Heart = ({ filled }: { filled: boolean }) => {
    return (
        <div className="relative flex items-center justify-center h-full">
            <img
                style={{
                    animationDuration: "200ms",
                    animationIterationCount: "2",
                    opacity: filled ? 1 : 0,
                    animationName: filled ? "" : "heart-blink",
                }}
                src="/assets/heart-fill.png" className="h-full absolute" />
            <img src="/assets/heart-empty.png" className="h-full" />
        </div>
    )
}