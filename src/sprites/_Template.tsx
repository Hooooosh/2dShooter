import * as PIXI from "pixi.js"
import { Vector2 } from "../interfaces/genericInterfaces"
import { RoomSprite } from "./RoomSprite"

let sprite: PIXI.Sprite | null = null

await PIXI.Assets.load([
    {
        alias: "ASSET_ALIAS",
        src: "/public/assets/ASSET_NAME.png"
    }
])

const SPRITE_SIZE = 50

export const Template = {
    init(app: PIXI.Application) {
        sprite = new PIXI.Sprite(PIXI.Assets.get("ASSET_ALIAS"))

        sprite.anchor.set(0.5)
        sprite.x = app.screen.width / 2
        sprite.y = app.screen.height / 2

        app.stage.addChild(sprite)

        app.ticker.add(this.update)
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

    applyKeepInRoomBoundssUpdate() {
        if(!sprite) return;

        if (sprite.x - SPRITE_SIZE / 2 < RoomSprite.ROOM_BOUNDS.left) sprite.x = RoomSprite.ROOM_BOUNDS.left + SPRITE_SIZE / 2
        if (sprite.x + SPRITE_SIZE / 2 > RoomSprite.ROOM_BOUNDS.right) sprite.x = RoomSprite.ROOM_BOUNDS.right - SPRITE_SIZE / 2
        if (sprite.y - SPRITE_SIZE / 2 < RoomSprite.ROOM_BOUNDS.top) sprite.y = RoomSprite.ROOM_BOUNDS.top + SPRITE_SIZE / 2
        if (sprite.y + SPRITE_SIZE / 2 > RoomSprite.ROOM_BOUNDS.bottom) sprite.y = RoomSprite.ROOM_BOUNDS.bottom - SPRITE_SIZE / 2
    },


    update(ticker: PIXI.Ticker) {
        if (!sprite) return
    },
}
