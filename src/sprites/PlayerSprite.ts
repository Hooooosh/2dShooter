import * as PIXI from "pixi.js"
import { ALL_MOVEMENT_KEYS, KEYBOARD_MOVEMENT_RULES, MovementRule } from "../const/KeyboardMovementRules"
import { Sword } from "./SwordSprite"
import { Input } from "../helpers/input"
import { EventHandler, GLOBAL_EVENTS } from "../helpers/eventHandler"
import { RoomSprite } from "./RoomSprite"
import { Vector2 } from "../interfaces/genericInterfaces"
import cubicBezierEase from "../helpers/bezier"
import getSpritePosClampedToBounds from "../helpers/getSpritePosClampedToBounds"
import { normalizeVector } from "../helpers/vector"

let sprite: PIXI.Sprite | null = null

await PIXI.Assets.load([
    {
        alias: "player",
        src: "/assets/player.png"
    }
])

interface IPlayer {
    SPRITE_SIZE: number
    SPEED: number
    lastMoveVector: Vector2

    MAX_HEALTH: number
    HURT_IFRAMES: number
    health: number
    _hurtFlickerAnimRemainingMs: number
    currentIframesMs: number

    MAX_STAMINA: number
    STAMINA_REGEN_RATE_PER_SEC: number
    currentStamina: number

    DASH_DISTANCE: number
    DASH_DURATION: number
    lastDashedFrom: Vector2
    lastDashVector: Vector2
    msSinceLastDash: number

    x: number
    y: number
    _init(app: PIXI.Application): void
    _remove(): void
    getSprite(): PIXI.Sprite | null
    setPosition(x: number, y: number): void
    _getCurrentKeyboardMovementRule(): MovementRule | undefined

    damage(amount?: number): void
    healTo(amount?: number): void
    isInvulnerable(): boolean
    _attemptDashTowardsVector(vector: Vector2): void


    _update(ticker: PIXI.Ticker): void
}


export const Player: IPlayer = {
    SPRITE_SIZE: 50,
    SPEED: 6,
    lastMoveVector: { x: 0, y: 0 },

    MAX_HEALTH: 3,
    HURT_IFRAMES: 1500,
    health: 3,
    _hurtFlickerAnimRemainingMs: 0,
    currentIframesMs: 0,

    MAX_STAMINA: 3,
    STAMINA_REGEN_RATE_PER_SEC: 0.3,
    currentStamina: 3,

    DASH_DISTANCE: 150,
    DASH_DURATION: 150,
    lastDashedFrom: { x: 0, y: 0 },
    lastDashVector: { x: 0, y: 0 },
    msSinceLastDash: 99999,

    x: 0,
    y: 0,

    _init(app: PIXI.Application) {
        sprite = new PIXI.Sprite(PIXI.Assets.get("player"))

        sprite.anchor.set(0.5)
        Player.x = RoomSprite.ROOM_SIZE / 2
        Player.y = RoomSprite.ROOM_SIZE / 2

        app.stage.addChild(sprite)

        app.ticker.add(this._update)

        Sword._init(app)

        /* setup key listeners */
        window.addEventListener("keydown", (e) => {
            /* dash setup */
            if (e.code === "Space" && !e.repeat) {
                Player._attemptDashTowardsVector(Player.lastMoveVector)
            }
            if (e.code === "KeyH" && !e.repeat) {
                Player.damage(1)
            }
            if (e.code === "KeyJ" && !e.repeat) {
                Player.healTo(Player.MAX_HEALTH)
            }
        })
    },

    _remove() {
        if (!sprite || !sprite.parent) return
        sprite.parent.removeChild(sprite)
        sprite = null
    },

    getSprite() {
        return sprite
    },

    setPosition(x: number, y: number) {
        if (!sprite) return
        Player.x = x
        Player.y = y
    },

    damage(amount?: number) {
        if (Player.isInvulnerable()) return
        Player.health -= amount ?? 1
        Player._hurtFlickerAnimRemainingMs = Player.HURT_IFRAMES
        Player.currentIframesMs = Player.HURT_IFRAMES
        EventHandler.emit(GLOBAL_EVENTS.HEALTH_CHANGED)
    },

    healTo(amount?: number) {
        const _amt = amount ?? Math.min(Player.health + 1, Player.MAX_HEALTH)
        Player.health = _amt
        EventHandler.emit(GLOBAL_EVENTS.HEALTH_CHANGED)
    },



    isInvulnerable() {
        return Player.currentIframesMs > 0
    },

    _attemptDashTowardsVector(vector: Vector2) {
        if (Player.msSinceLastDash < Player.DASH_DURATION) return
        if (Player.currentStamina < 1) return
        Player.lastDashedFrom = { x: Player.x, y: Player.y }
        Player.lastDashVector = normalizeVector(vector)
        Player.msSinceLastDash = 0
        Player.currentStamina -= 1
        Player.currentIframesMs = Player.DASH_DURATION + 50 /* 50ms extra leniency */
        EventHandler.emit(GLOBAL_EVENTS.STAMINA_CHANGED)
    },


    _getCurrentKeyboardMovementRule() {
        const movementInputs = Array.from(Input.continuousKbKeys).filter((key) =>
            ALL_MOVEMENT_KEYS.includes(key)
        )
        return KEYBOARD_MOVEMENT_RULES.find((r) =>
            JSON.stringify(movementInputs.sort()) === JSON.stringify(r.keys.sort())
        )
    },


    _update(ticker: PIXI.Ticker) {
        if (!sprite) return
        const _newMovementVector = { x: 0, y: 0 }


        /* attempt sword swing if mouse down */
        if (Input.mouseDown) {
            Sword.attemptSwing()
        }


        /* movement when not currently dashing */
        if (!(Player.msSinceLastDash < Player.DASH_DURATION)) {
            const movementInputs = Array.from(Input.continuousKbKeys).filter((key) =>
                ALL_MOVEMENT_KEYS.includes(key)
            )
            const rule = KEYBOARD_MOVEMENT_RULES.find((r) =>
                JSON.stringify(movementInputs.sort()) === JSON.stringify(r.keys.sort())
            )
            if (rule) {
                _newMovementVector.x += rule.velocity.x * ticker.deltaTime * Player.SPEED
                _newMovementVector.y += rule.velocity.y * ticker.deltaTime * Player.SPEED
            }
        }


        /* dashing calc */
        else {
            Player.msSinceLastDash += ticker.deltaMS
            const _newLinearProgress = Player.msSinceLastDash / Player.DASH_DURATION
            const _newInterpolProgress = cubicBezierEase(_newLinearProgress, 0.31, 0.89, 1, 0.97)

            const currentPlayerPosOnVector = { x: Player.x - Player.lastDashedFrom.x, y: Player.y - Player.lastDashedFrom.y }
            const newPlayerPosOnVector = {
                x: _newInterpolProgress * Player.DASH_DISTANCE * Player.lastDashVector.x,
                y: _newInterpolProgress * Player.DASH_DISTANCE * Player.lastDashVector.y
            }

            _newMovementVector.x += newPlayerPosOnVector.x - currentPlayerPosOnVector.x
            _newMovementVector.y += newPlayerPosOnVector.y - currentPlayerPosOnVector.y
        }



        /* iframe decay */
        if (Player.isInvulnerable()) {
            Player.currentIframesMs -= ticker.deltaMS
        }

        /* player hurt flicker */
        if (Player._hurtFlickerAnimRemainingMs > 0) {
            Player._hurtFlickerAnimRemainingMs -= ticker.deltaMS
            const flickerFrequency = 100
            sprite.visible = Math.floor(Player._hurtFlickerAnimRemainingMs / flickerFrequency) % 2 !== 0
        }
        else {
            sprite.visible = true
        }



        /* stamina regen */
        if (Player.currentStamina < Player.MAX_STAMINA) {
            const changeAmt = Player.STAMINA_REGEN_RATE_PER_SEC * (ticker.deltaMS / 1000)

            /* if whole amount changed, fire event for ui */
            Player.currentStamina = Math.min(Player.currentStamina + changeAmt, Player.MAX_STAMINA)

            if (
                Player.currentStamina > Player.MAX_STAMINA ||
                Math.floor(Player.currentStamina - changeAmt) < Math.floor(Player.currentStamina)
            ) {
                EventHandler.emit(GLOBAL_EVENTS.STAMINA_CHANGED)
            }
        }



        /* clamp new calculated pos to room bounds */
        let newPos = { x: Player.x + _newMovementVector.x, y: Player.y + _newMovementVector.y }
        newPos = getSpritePosClampedToBounds(newPos, Player.SPRITE_SIZE)

        Player.x = newPos.x
        Player.y = newPos.y

        /* save move vector for later */
        Player.lastMoveVector = { x: _newMovementVector.x, y: _newMovementVector.y }

        /* apply internal pos to sprite */
        const renderPos = RoomSprite.getRenderPosition(Player.x, Player.y)
        sprite.x = renderPos.x
        sprite.y = renderPos.y
    }
}
