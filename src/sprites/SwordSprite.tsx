import * as PIXI from "pixi.js"
import { Vector2 } from "../interfaces/genericInterfaces"
import { Player } from "./PlayerSprite"
import { Input } from "../helpers/input"
import { ParticleHandler } from "./ParticleHandler"
import cubicBezierEase from "../helpers/bezier"
import { degToRad, signedAngleDelta } from "../helpers/angle"

let sprite: PIXI.Sprite | null = null

await PIXI.Assets.load([
    {
        alias: "sword",
        src: "/public/assets/sword.png"
    }
])

export const Sword = {
    SWING_COOLDOWN: 300,
    SWING_DURATION: 200,
    SWING_ANGLE: degToRad(90),
    currentSwingSide: 1,
    currentSwingCooldown: 999,
    SWORD_OFFSET_FROM_PLAYER: 1.6,
    lastSwingAngle: 0,

    init(app: PIXI.Application) {
        sprite = new PIXI.Sprite(PIXI.Assets.get("sword"))

        sprite.anchor.set(0.5, this.SWORD_OFFSET_FROM_PLAYER)
        sprite.x = app.screen.width / 2
        sprite.y = app.screen.height / 2

        app.stage.addChild(sprite)

        app.ticker.add((ticker) => this.update(ticker, app))
    },

    remove() {
        if (!sprite || !sprite.parent) return
        sprite.parent.removeChild(sprite)
        sprite = null
    },

    getSprite() {
        return sprite
    },

    getPosition(): Vector2 {
        if (!sprite) return { x: 0, y: 0 }
        return { x: sprite.x, y: sprite.y }
    },

    setPosition(x: number, y: number) {
        if (!sprite) return
        sprite.x = x
        sprite.y = y
    },

    getIsSwinging() {
        return this.currentSwingCooldown < this.SWING_DURATION
    },

    update(ticker: PIXI.Ticker, app: PIXI.Application) {
        if (!sprite || !this.getSprite()) return

        /* snap to player */
        const player = Player.getPosition()
        const mousePos = app.renderer.events.pointer.global
        this.setPosition(player.x, player.y)


        /* calculate sword angle */
        if (this.currentSwingCooldown < this.SWING_COOLDOWN) {
            this.currentSwingCooldown += ticker.deltaMS
        }
        const oldAngleAfterBezier = sprite.rotation
        const angleToMouse = Math.atan2(mousePos.y - player.y, mousePos.x - player.x) + Math.PI / 2
        let newAngleAfterBezier

        /* handle swing input */
        if (Input.mouseDown && this.currentSwingCooldown >= this.SWING_COOLDOWN) {
            this.currentSwingCooldown = 0
            this.currentSwingSide *= -1
            this.lastSwingAngle = oldAngleAfterBezier
        }

        /* if swinging, bezier swing angle, else aim at mouse */
        if (this.getIsSwinging()) {
            const newAngleNormal = cubicBezierEase(
                Math.min(this.currentSwingCooldown / this.SWING_DURATION, 1),
                0.22, 1.13, 0.75, 0.98
            )
            newAngleAfterBezier = this.lastSwingAngle + newAngleNormal * this.SWING_ANGLE * this.currentSwingSide
        }
        else {
            newAngleAfterBezier = angleToMouse + this.SWING_ANGLE / 2 * this.currentSwingSide
        }
        sprite.rotation = newAngleAfterBezier


        const clampToNormal = (v: number) => Math.max(0, Math.min(1, v))

        const finalAngleTarget = this.lastSwingAngle + this.SWING_ANGLE * this.currentSwingSide
        const totalDelta = signedAngleDelta(this.lastSwingAngle, finalAngleTarget)

        /* spawn particles at sword tip */
        if (this.getIsSwinging()) {
            let currentAngleProgress = oldAngleAfterBezier;

            while (
                (this.currentSwingSide == 1 && currentAngleProgress < newAngleAfterBezier) ||
                (this.currentSwingSide == -1 && currentAngleProgress > newAngleAfterBezier)
            ) {
                currentAngleProgress += this.currentSwingSide * degToRad(5)

                const alreadyTraveledDelta = signedAngleDelta(this.lastSwingAngle, currentAngleProgress)
                const currentAngleProgressNormal = clampToNormal(alreadyTraveledDelta / totalDelta)

                const tipX = player.x + Math.cos(currentAngleProgress - Math.PI/2) * 50
                const tipY = player.y + Math.sin(currentAngleProgress - Math.PI/2) * 50

                ParticleHandler.spawnParticle(
                    tipX,
                    tipY,
                    Math.cos(currentAngleProgress - Math.PI/2) * 5,
                    Math.sin(currentAngleProgress - Math.PI/2) * 5,
                    150,
                    0.98,
                    5 + (Math.min(currentAngleProgressNormal, 1 - currentAngleProgressNormal)) * 10
                )
            }


        }
    },
}
