import { Application, Graphics, Ticker } from "pixi.js"
import cubicBezierEase from "../helpers/bezier"
import { _DOOR_POSITIONS, BORDER_GAP, BORDER_STYLE_INNER, BORDER_STYLE_OUTER, ROOM_SIZE, RoomSprite } from "./RoomSprite"
import { DRAW_ORDERS } from "../const/drawOrders"
import { ParticleHandler } from "../handlers/ParticleHandler"

const OPEN_ANIM_DURATION = 900
const CLOSE_ANIM_DURATION = 250
const DOOR_WIDTH = 100
const DOOR_HEIGHT = 45

interface IDoorSprite {
    index: number,
    lastChangedMs: number,
    targetHeightNormal: number,
    fromHeightNormal: number,
    doorLine1: Graphics | null,
    doorLine2: Graphics | null,
    doorMask: Graphics | null,
    setIsOpen(isOpen: boolean): void,
    _updateGraphic(ticker: Ticker): void,
}

export class DoorSprite implements IDoorSprite {
    index: number = 0;
    lastChangedMs: number = 0;
    targetHeightNormal: number = 0;
    fromHeightNormal: number = 0;
    doorLine1: Graphics | null = null
    doorLine2: Graphics | null = null
    doorMask: Graphics | null = null

    constructor(index: number, app: Application) {
        this.index = index
        this.doorLine1 = new Graphics()
        this.doorLine2 = new Graphics()
        this.doorMask = new Graphics()
        this.doorLine1.zIndex = this.doorLine2.zIndex = this.doorMask.zIndex = DRAW_ORDERS.DOORS

        app.stage.addChild(this.doorMask, this.doorLine1, this.doorLine2)
        app.ticker.add(this._updateGraphic)
    }

    setIsOpen = (open: boolean) => {
        if (!open && this.targetHeightNormal == 0) return
        if (open && this.targetHeightNormal == 1) return

        if (open && this.targetHeightNormal == 0) {
            /* opening, play particles */
            ParticleHandler.spawnParticleExplosion(_DOOR_POSITIONS[this.index].x, _DOOR_POSITIONS[this.index].y, 5, 10, 0.3, undefined, Math.random() * 300 + 400)
            ParticleHandler.spawnCircleExplosion(_DOOR_POSITIONS[this.index].x, _DOOR_POSITIONS[this.index].y, 100, 20, 1000, undefined, 0.5)
        }
        if (!open && this.targetHeightNormal == 1) {
            /* closing, play particles */
            setTimeout(() => {
                ParticleHandler.spawnCircleExplosion(_DOOR_POSITIONS[this.index].x, _DOOR_POSITIONS[this.index].y, 70, 10, 1000, undefined, 0.3)
            }, CLOSE_ANIM_DURATION)
        }

        this.fromHeightNormal = this.targetHeightNormal
        this.targetHeightNormal = open ? 1 : 0
        this.lastChangedMs = 0
    }

    _updateGraphic = (ticker: Ticker) => {
        if (this.targetHeightNormal == this.fromHeightNormal) return;
        if (!this.doorLine1 || !this.doorLine2 || !this.doorMask) return;

        this.lastChangedMs += ticker.deltaMS

        const OPEN_BEZIER_CONTROLS = [0, .67, .48, .91] as [number, number, number, number]
        const newOpenAnimNormal = Math.max(0, Math.min(1, cubicBezierEase(
            Math.max(0, Math.min(1, this.lastChangedMs / OPEN_ANIM_DURATION)),
            ...OPEN_BEZIER_CONTROLS
        )))

        const CLOSE_BEZIER_CONTROLS = [.67, 0, .91, .48] as [number, number, number, number]
        const newCloseAnimNormal = Math.max(0, Math.min(1, cubicBezierEase(
            Math.max(0, Math.min(1, this.lastChangedMs / CLOSE_ANIM_DURATION)),
            ...CLOSE_BEZIER_CONTROLS
        )))

        let newHeight = 0;
        if (this.targetHeightNormal > this.fromHeightNormal) {
            /* opening */
            newHeight = DOOR_HEIGHT * (this.fromHeightNormal + (this.targetHeightNormal - this.fromHeightNormal) * newOpenAnimNormal)
        }
        else if (this.targetHeightNormal < this.fromHeightNormal) {
            /* closing */
            newHeight = DOOR_HEIGHT * (this.fromHeightNormal - (this.fromHeightNormal - this.targetHeightNormal) * newCloseAnimNormal)
        }
        else {
            /* no anim needed */
            return
        }

        this.doorLine1.clear()
        this.doorLine2.clear()
        this.doorMask.clear()

        switch (this.index) {
            case 0: /* top */
                this.doorLine1.x = ROOM_SIZE / 2
                this.doorLine1.y = 0
                break
            case 1: /* right */
                this.doorLine1.rotation = Math.PI / 2
                this.doorLine1.x = ROOM_SIZE
                this.doorLine1.y = ROOM_SIZE / 2
                break
            case 2: /* left */
                this.doorLine1.x = 0
                this.doorLine1.y = ROOM_SIZE / 2
                this.doorLine1.rotation = -Math.PI / 2
                break
            case 3: /* bottom */
                this.doorLine1.x = ROOM_SIZE / 2
                this.doorLine1.y = ROOM_SIZE
                this.doorLine1.rotation = Math.PI
                break
        }

        const renderPos = RoomSprite.getRenderPosition(this.doorLine1.x, this.doorLine1.y)

        this.doorLine1.x = this.doorLine2.x = this.doorMask.x = renderPos.x
        this.doorLine1.y = this.doorLine2.y = this.doorMask.y = renderPos.y
        this.doorLine2.rotation = this.doorLine1.rotation

        /* draw bg color mask */
        this.doorMask.rotation = this.doorLine1.rotation
        this.doorMask.x = this.doorLine1.x - Math.sin(this.doorLine1.rotation) * 10
        this.doorMask.y = this.doorLine1.y + Math.cos(this.doorLine1.rotation) * 10
        this.doorMask.rect(
            -DOOR_WIDTH / 2 + 1.5,
            -DOOR_HEIGHT + 1.5,
            DOOR_WIDTH - 1.5,
            DOOR_HEIGHT - 1.5
        )
        this.doorMask.fill(0x000000)

        /* draw door lines */
        this.doorLine1
            .moveTo(-DOOR_WIDTH / 2, -BORDER_GAP)
            .lineTo(-DOOR_WIDTH / 2, -newHeight - BORDER_GAP)
            .lineTo(DOOR_WIDTH / 2, -newHeight - BORDER_GAP)
            .lineTo(DOOR_WIDTH / 2, -BORDER_GAP)
        this.doorLine1.stroke({ width: BORDER_STYLE_OUTER.width, color: BORDER_STYLE_OUTER.color })

        this.doorLine2
            .moveTo(-DOOR_WIDTH / 2, 0)
            .lineTo(-DOOR_WIDTH / 2 + BORDER_GAP, 0)
            .lineTo(-DOOR_WIDTH / 2 + BORDER_GAP, -newHeight)
            .lineTo(DOOR_WIDTH / 2 - BORDER_GAP, -newHeight)
            .lineTo(DOOR_WIDTH / 2 - BORDER_GAP, 0)
            .lineTo(DOOR_WIDTH / 2, 0)
        this.doorLine2.stroke({ width: BORDER_STYLE_INNER.width, color: BORDER_STYLE_INNER.color })
    }

}