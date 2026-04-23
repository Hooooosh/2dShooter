import * as PIXI from "pixi.js"
import { ALL_MOVEMENT_KEYS, KEYBOARD_MOVEMENT_RULES } from "../const/KeyboardMovementRules"
import { Vector2 } from "../interfaces/genericInterfaces"
import { Sword } from "./SwordSprite"
import { Input } from "../helpers/input"
import { EventHandler, GLOBAL_EVENTS } from "../helpers/eventHandler"
import { RoomSprite } from "./RoomSprite"

let sprite: PIXI.Sprite | null = null

await PIXI.Assets.load([
    {
        alias: "player",
        src: "/public/assets/player.png"
    }
])

const PLAYER_SPRITE_SIZE = 50
const PLAYER_SPEED = 6

export const Player = {
    MAX_HEALTH: 3,
    health: 3,
    iframes: 0,

    init(app: PIXI.Application) {
        sprite = new PIXI.Sprite(PIXI.Assets.get("player"))

        sprite.anchor.set(0.5)
        sprite.x = app.screen.width / 2
        sprite.y = app.screen.height / 2

        app.stage.addChild(sprite)

        app.ticker.add(this.update)

        Sword.init(app)
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

    damage(amount?: number, iframes?: number) {
        if(this.iframes > 0) return
        EventHandler.emit(GLOBAL_EVENTS.HEALTH_CHANGED)
        this.health -= amount ?? 1
        this.iframes = iframes ?? 2500
    },

    applyKeepInRoomBoundssUpdate() {
        if (!sprite) return;

        if (sprite.x - PLAYER_SPRITE_SIZE / 2 < RoomSprite.ROOM_BOUNDS.left) sprite.x = RoomSprite.ROOM_BOUNDS.left + PLAYER_SPRITE_SIZE / 2
        if (sprite.x + PLAYER_SPRITE_SIZE / 2 > RoomSprite.ROOM_BOUNDS.right) sprite.x = RoomSprite.ROOM_BOUNDS.right - PLAYER_SPRITE_SIZE / 2
        if (sprite.y - PLAYER_SPRITE_SIZE / 2 < RoomSprite.ROOM_BOUNDS.top) sprite.y = RoomSprite.ROOM_BOUNDS.top + PLAYER_SPRITE_SIZE / 2
        if (sprite.y + PLAYER_SPRITE_SIZE / 2 > RoomSprite.ROOM_BOUNDS.bottom) sprite.y = RoomSprite.ROOM_BOUNDS.bottom - PLAYER_SPRITE_SIZE / 2
    },






    update(ticker: PIXI.Ticker) {
        if (!sprite) return

        /* movement */
        const movementInputs = Array.from(Input.keyboardKeys).filter((key) =>
            ALL_MOVEMENT_KEYS.includes(key)
        )
        const rule = KEYBOARD_MOVEMENT_RULES.find((r) =>
            JSON.stringify(movementInputs.sort()) === JSON.stringify(r.keys.sort())
        )
        if (rule) {
            sprite.x += rule.velocity.x * PLAYER_SPEED * ticker.deltaTime
            sprite.y += rule.velocity.y * PLAYER_SPEED * ticker.deltaTime
        }

        /* iframe decay */
        if (Player.iframes > 0) Player.iframes -= ticker.deltaMS

        /* iframe flicker */
        if (Player.iframes > 0) {
            const flickerFrequency = 100
            sprite.visible = Math.floor(Player.iframes / flickerFrequency) % 2 === 0
        }
        else {
            sprite.visible = true
        }

        if (Input.isKeyDown("KeyH")) {
            Player.damage(1)
            console.log("first")
        }

        Player.applyKeepInRoomBoundssUpdate()
    }
}
