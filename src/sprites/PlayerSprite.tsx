import * as PIXI from "pixi.js"
import { ALL_MOVEMENT_KEYS, KEYBOARD_MOVEMENT_RULES } from "../const/KeyboardMovementRules"
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
    x: 0,
    y: 0,

    init(app: PIXI.Application) {
        sprite = new PIXI.Sprite(PIXI.Assets.get("player"))

        sprite.anchor.set(0.5)
        Player.x = RoomSprite.ROOM_SIZE / 2
        Player.y = RoomSprite.ROOM_SIZE / 2

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

    setPosition(x: number, y: number) {
        if (!sprite) return
        Player.x = x
        Player.y = y
    },

    damage(amount?: number, iframes?: number) {
        if(Player.iframes > 0) return
        Player.health -= amount ?? 1
        Player.iframes = iframes ?? 2500
        EventHandler.emit(GLOBAL_EVENTS.HEALTH_CHANGED)
    },

    healTo(amount?: number) {
        const _amt = amount ?? Math.min(Player.health + 1, Player.MAX_HEALTH)
        Player.health = _amt
        EventHandler.emit(GLOBAL_EVENTS.HEALTH_CHANGED)
    },

    applyKeepInRoomBoundssUpdate() {
        if (!sprite) return;

        if (Player.x - PLAYER_SPRITE_SIZE / 2 < 0) Player.x = 0 + PLAYER_SPRITE_SIZE / 2
        if (Player.x + PLAYER_SPRITE_SIZE / 2 > RoomSprite.ROOM_SIZE) Player.x = RoomSprite.ROOM_SIZE - PLAYER_SPRITE_SIZE / 2
        if (Player.y - PLAYER_SPRITE_SIZE / 2 < 0) Player.y = 0 + PLAYER_SPRITE_SIZE / 2
        if (Player.y + PLAYER_SPRITE_SIZE / 2 > RoomSprite.ROOM_SIZE) Player.y = RoomSprite.ROOM_SIZE - PLAYER_SPRITE_SIZE / 2
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
            Player.x += rule.velocity.x * PLAYER_SPEED * ticker.deltaTime
            Player.y += rule.velocity.y * PLAYER_SPEED * ticker.deltaTime
        }

        /* iframe decay */
        if (Player.iframes > 0) Player.iframes -= ticker.deltaMS

        /* iframe flicker */
        if (Player.iframes > 0) {
            const flickerFrequency = 100
            sprite.visible = Math.floor(Player.iframes / flickerFrequency) % 2 !== 0
        }
        else {
            sprite.visible = true
        }

        /* apply internal pos to sprite */
        const renderPos = RoomSprite.getRenderPosition(Player.x, Player.y)
        sprite.x = renderPos.x
        sprite.y = renderPos.y

        /* TEST */
        if (Input.isKeyDown("KeyH")) {
            Player.damage(1)
            console.log("first")
        }

        if (Input.isKeyDown("KeyJ")) {
            Player.healTo(Player.MAX_HEALTH)
            console.log("first")
        }

        Player.applyKeepInRoomBoundssUpdate()
    }
}
