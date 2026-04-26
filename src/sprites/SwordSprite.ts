import * as PIXI from "pixi.js"
import { Player } from "./PlayerSprite"
import { ParticleHandler } from "../handlers/ParticleHandler"
import cubicBezierEase from "../helpers/bezier"
import { degToRad, signedAngleDelta } from "../helpers/angle"
import { RoomSprite } from "./RoomSprite"
import { HitboxHandler } from "../handlers/HitboxHandler"
import { EventHandler, GLOBAL_EVENTS } from "../helpers/eventHandler"

let sprite: PIXI.Sprite | null = null

await PIXI.Assets.load([
    {
        alias: "sword",
        src: "/assets/sword.png"
    }
])

export const Sword = {
    SWING_COOLDOWN: 400,
    SWING_DURATION: 150,
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

        sprite.anchor.set(0.5, Sword.SWORD_OFFSET_FROM_PLAYER)
        sprite.x = Player.x
        sprite.y = Player.y

        app.stage.addChild(sprite)

        app.ticker.add((ticker) => Sword._update(ticker, app))
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

    _attemptAttack() {
        if (Sword.currentSwingCooldown >= Sword.SWING_COOLDOWN && sprite) {
            Sword.currentSwingCooldown = 0
            Sword.currentSwingSide *= -1
            Sword.hasRanHitboxThisSwing = false
            Sword.isSwinging = true
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

        if (Sword.currentSwingCooldown > Sword.SWING_DURATION) {
            Sword.isSwinging = false
            sprite.rotation = angleToMouse + Sword.SWING_ANGLE / 2 * Sword.currentSwingSide
        }

        /* calculate sword angle */
        if (Sword.currentSwingCooldown < Sword.SWING_COOLDOWN) {
            /* if first frame, snap rotation to mouse to avoid conflicts */
            if (Sword.currentSwingCooldown == 0) {
                sprite.rotation = angleToMouse - Sword.SWING_ANGLE / 2 * Sword.currentSwingSide
                Sword.lastSwingAngle = sprite.rotation
            }
            Sword.currentSwingCooldown += ticker.deltaMS
        }

        Sword.setPosition(playerPos.x, playerPos.y)

        const oldAngle = sprite.rotation
        let newAngleAfterBezier

        /* if swinging, bezier swing angle, else aim at mouse */
        if (Sword.isSwinging) {
            const newAngleNormal = cubicBezierEase(
                Math.min(Sword.currentSwingCooldown / Sword.SWING_DURATION, 1),
                ...Sword.SWING_BEZIER_CONTROLS
            )
            /* apply rotation */
            newAngleAfterBezier = Sword.lastSwingAngle + newAngleNormal * Sword.SWING_ANGLE * Sword.currentSwingSide
            sprite.rotation = newAngleAfterBezier

            /* run swing hitbox at .5 */
            if (!Sword.hasRanHitboxThisSwing && (newAngleNormal > 0.5 || Sword.SWING_DURATION < 200)) {
                const hitboxWidth = 100
                const hitboxThickness = 50
                const angleAtHalfProgress = angleToMouse - Math.PI / 2
                const hitboxX = playerPos.x + Math.cos(angleAtHalfProgress) * Sword.SWORD_OFFSET_FROM_PLAYER * (sprite.height - hitboxThickness / 3)
                const hitboxY = playerPos.y + Math.sin(angleAtHalfProgress) * Sword.SWORD_OFFSET_FROM_PLAYER * (sprite.height - hitboxThickness / 3)
                Sword.hasRanHitboxThisSwing = true
                HitboxHandler.runHitboxAgainstEnemies(
                    {
                        xCenter: hitboxX,
                        yCenter: hitboxY,
                        width: hitboxThickness,
                        height: hitboxWidth,
                        rot: angleAtHalfProgress
                    },
                    Player.baseDmg
                )
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
        const finalAngleTarget = Sword.lastSwingAngle + Sword.SWING_ANGLE * Sword.currentSwingSide
        const totalDelta = signedAngleDelta(Sword.lastSwingAngle, finalAngleTarget)

        /* spawn particles at sword tip */
        if (Sword.isSwinging) {
            let currentAngleProgress = oldAngle + Sword.currentSwingSide * degToRad(3);

            while (
                (Sword.currentSwingSide == 1 && currentAngleProgress < newAngleAfterBezier) ||
                (Sword.currentSwingSide == -1 && currentAngleProgress > newAngleAfterBezier)
            ) {
                currentAngleProgress += Sword.currentSwingSide * degToRad(5)

                const alreadyTraveledDelta = signedAngleDelta(Sword.lastSwingAngle, currentAngleProgress)
                const currentAngleProgressNormal = clampToNormal(alreadyTraveledDelta / totalDelta)

                const tipX = playerPos.x + Math.cos(currentAngleProgress - Math.PI / 2) * Sword.SWORD_OFFSET_FROM_PLAYER * sprite.height
                const tipY = playerPos.y + Math.sin(currentAngleProgress - Math.PI / 2) * Sword.SWORD_OFFSET_FROM_PLAYER * sprite.height

                ParticleHandler.spawnParticle(
                    tipX,
                    tipY,
                    Math.cos(currentAngleProgress - Math.PI / 2) * 2,
                    Math.sin(currentAngleProgress - Math.PI / 2) * 2,
                    100,
                    0xffffff,
                    0.3,
                    0.98,
                    2 + (Math.min(currentAngleProgressNormal, 1 - currentAngleProgressNormal)) * 10,
                    new PIXI.Graphics().circle(0, 0, 50)
                )
            }
        }
    },
}
