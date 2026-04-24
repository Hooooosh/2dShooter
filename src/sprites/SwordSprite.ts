import * as PIXI from "pixi.js"
import { Player } from "./PlayerSprite"
import { ParticleHandler } from "./ParticleHandler"
import cubicBezierEase from "../helpers/bezier"
import { degToRad, signedAngleDelta } from "../helpers/angle"
import { RoomSprite } from "./RoomSprite"
import { HitboxHandler } from "./HitboxHandler"
import { EventHandler, GLOBAL_EVENTS } from "../helpers/eventHandler"

let sprite: PIXI.Sprite | null = null

await PIXI.Assets.load([
    {
        alias: "sword",
        src: "/assets/sword.png"
    }
])

export const Sword = {
    SWING_COOLDOWN: 20,
    SWING_DURATION: 10,
    SWING_ANGLE: degToRad(90),
    SWING_BEZIER_CONTROLS: [0.22, 1.13, 0.75, 0.98] as [number, number, number, number],

    currentSwingSide: 1,
    currentSwingCooldown: 0,
    isSwinging: false,
    SWORD_OFFSET_FROM_PLAYER: 1.6,
    lastSwingAngle: 0,
    hasRanHitboxThisSwing: false,

    _init(app: PIXI.Application) {
        sprite = new PIXI.Sprite(PIXI.Assets.get("sword"))

        sprite.anchor.set(0.5, this.SWORD_OFFSET_FROM_PLAYER)
        sprite.x = Player.x
        sprite.y = Player.y

        app.stage.addChild(sprite)

        app.ticker.add((ticker) => this._update(ticker, app))
    },

    _remove() {
        if (!sprite || !sprite.parent) return
        sprite.parent.removeChild(sprite)
        sprite = null
    },

    setPosition(x: number, y: number) {
        if (!sprite) return
        const renderPos = RoomSprite.getRenderPosition(x, y)
        sprite.x = renderPos.x
        sprite.y = renderPos.y
    },

    attemptSwing() {
        if (this.currentSwingCooldown >= this.SWING_COOLDOWN && sprite) {
            this.currentSwingCooldown = 0
            this.currentSwingSide *= -1
            this.lastSwingAngle = sprite.rotation
            this.isSwinging = true
        }
    },

    _update(ticker: PIXI.Ticker, app: PIXI.Application) {
        if (!sprite) return

        /* snap to player */
        const playerPos = { x: Player.x, y: Player.y }
        const mousePos = app.renderer.events.pointer.global
        const angleToMouse = Math.atan2(
            mousePos.y - RoomSprite.getRenderPosition(playerPos.x, playerPos.y).y,
            mousePos.x - RoomSprite.getRenderPosition(playerPos.x, playerPos.y).x
        ) + Math.PI / 2

        this.setPosition(playerPos.x, playerPos.y)

        /* calculate sword angle */
        if (this.currentSwingCooldown < this.SWING_COOLDOWN) {
            this.currentSwingCooldown += ticker.deltaMS
        }
        else {
            this.hasRanHitboxThisSwing = false
            this.isSwinging = false
            sprite.rotation = angleToMouse + this.SWING_ANGLE / 2 * this.currentSwingSide
        }

        const oldAngle = sprite.rotation
        let newAngleAfterBezier

        /* if swinging, bezier swing angle, else aim at mouse */
        if (this.isSwinging) {
            const newAngleNormal = cubicBezierEase(
                Math.min(this.currentSwingCooldown / this.SWING_DURATION, 1),
                ...this.SWING_BEZIER_CONTROLS
            )
            /* apply rotation */
            newAngleAfterBezier = this.lastSwingAngle + newAngleNormal * this.SWING_ANGLE * this.currentSwingSide
            sprite.rotation = newAngleAfterBezier

            /* run swing hitbox at .5 */
            if (!this.hasRanHitboxThisSwing && (newAngleNormal > 0.5 || this.SWING_DURATION < 200)) {
                const hitboxWidth = 100
                const hitboxThickness = 50
                const angleAtHalfProgress = angleToMouse - Math.PI / 2
                const hitboxX = playerPos.x + Math.cos(angleAtHalfProgress) * this.SWORD_OFFSET_FROM_PLAYER * (sprite.height - hitboxThickness / 3)
                const hitboxY = playerPos.y + Math.sin(angleAtHalfProgress) * this.SWORD_OFFSET_FROM_PLAYER * (sprite.height - hitboxThickness / 3)
                this.hasRanHitboxThisSwing = true
                HitboxHandler.runHitboxAgainstEnemies({
                    xCenter: hitboxX,
                    yCenter: hitboxY,
                    width: hitboxThickness,
                    height: hitboxWidth,
                    rot: angleAtHalfProgress
                })
                EventHandler.emit(GLOBAL_EVENTS._DEBUG_DRAW_RECT, {
                    xCenter: RoomSprite.getRenderPosition(hitboxX, hitboxY).x,
                    yCenter: RoomSprite.getRenderPosition(hitboxX, hitboxY).y,
                    width: hitboxThickness,
                    height: hitboxWidth,
                    rot: angleAtHalfProgress
                })
            }
        }
        else {
            newAngleAfterBezier = angleToMouse
        }


        const clampToNormal = (v: number) => Math.max(0, Math.min(1, v))
        const finalAngleTarget = this.lastSwingAngle + this.SWING_ANGLE * this.currentSwingSide
        const totalDelta = signedAngleDelta(this.lastSwingAngle, finalAngleTarget)

        /* spawn particles at sword tip */
        if (this.isSwinging) {
            let currentAngleProgress = oldAngle + this.currentSwingSide * degToRad(3);

            while (
                (this.currentSwingSide == 1 && currentAngleProgress < newAngleAfterBezier) ||
                (this.currentSwingSide == -1 && currentAngleProgress > newAngleAfterBezier)
            ) {
                currentAngleProgress += this.currentSwingSide * degToRad(5)

                const alreadyTraveledDelta = signedAngleDelta(this.lastSwingAngle, currentAngleProgress)
                const currentAngleProgressNormal = clampToNormal(alreadyTraveledDelta / totalDelta)

                const tipX = playerPos.x + Math.cos(currentAngleProgress - Math.PI / 2) * this.SWORD_OFFSET_FROM_PLAYER * sprite.height
                const tipY = playerPos.y + Math.sin(currentAngleProgress - Math.PI / 2) * this.SWORD_OFFSET_FROM_PLAYER * sprite.height

                ParticleHandler.spawnParticle(
                    tipX,
                    tipY,
                    Math.cos(currentAngleProgress - Math.PI / 2) * 5,
                    Math.sin(currentAngleProgress - Math.PI / 2) * 5,
                    75,
                    0.98,
                    5 + (Math.min(currentAngleProgressNormal, 1 - currentAngleProgressNormal)) * 10,
                    new PIXI.Graphics({ alpha: 0.5 }).circle(0, 0, 50).fill(0xff0000)
                )
            }


        }
    },
}
