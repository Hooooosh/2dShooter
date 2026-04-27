import { useEffect, useRef } from "react"
import { EventHandler, GLOBAL_EVENTS } from "../helpers/eventHandler"
import { IHitbox } from "../handlers/HitboxHandler"
import { Vector2 } from "../interfaces/genericInterfaces"

export default function DebugCanvas() {
    const isEnabled = useRef(false)
    const ref = useRef<HTMLCanvasElement>(null)
    const ctx = useRef<CanvasRenderingContext2D | undefined>(undefined)

    function clearCanvas(t: number = 0) {
        if (!ctx.current) return
        if (t === 0 || !t) {
            ctx.current.clearRect(0, 0, window.innerWidth, window.innerHeight)
        }
        else {
            setTimeout(() => {
                if (!ctx.current) return
                ctx.current.clearRect(0, 0, window.innerWidth, window.innerHeight)
            }, t)
        }
    }

    useEffect(() => {
        if (ref) {
            ctx.current = ref.current?.getContext("2d") ?? undefined
        }
    }, [ref])

    useEffect(() => {
        if (ctx.current) {
            ctx.current.canvas.width = window.innerWidth
            ctx.current.canvas.height = window.innerHeight
        }
    }, [ctx])

    function enableCanvas() {
        isEnabled.current = true
        EventHandler.on(GLOBAL_EVENTS._DEBUG_DRAW_RECT, drawRotatedRect)
        EventHandler.on(GLOBAL_EVENTS._DEBUG_DRAW_DOT, drawDot)
        clearCanvas()
    }

    function disableCanvas() {
        isEnabled.current = false
        EventHandler.off(GLOBAL_EVENTS._DEBUG_DRAW_RECT, drawRotatedRect)
        EventHandler.off(GLOBAL_EVENTS._DEBUG_DRAW_DOT, drawDot)
        clearCanvas()
    }

    useEffect(() => {
        window.addEventListener("keydown", (e) => {
            if (e.code === "KeyP" && !e.repeat) {
                if (isEnabled.current) {
                    disableCanvas()
                }
                else {
                    enableCanvas()
                }
            }
        })
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    function drawRotatedRect(hitbox: IHitbox) {
        if (!ctx.current) return
        ctx.current.save()
        ctx.current.translate(hitbox.xCenter, hitbox.yCenter)
        ctx.current.rotate(hitbox.rot ?? 0)
        ctx.current.fillStyle = "#ff0000a0"
        ctx.current.fillRect(-hitbox.width / 2, -hitbox.height / 2, hitbox.width, hitbox.height)
        ctx.current.restore()
    }

    function drawDot(pos: Vector2) {
        if (!ctx.current) return
        ctx.current.fillStyle = "#ff0000"
        ctx.current.beginPath()
        ctx.current.arc(pos.x, pos.y, 5, 0, Math.PI * 2)
        ctx.current.fill()
    }

    return (
        <canvas ref={ref} style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100vh", pointerEvents: "none", zIndex: 999 }} />
    )

}