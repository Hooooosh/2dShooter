import * as PIXI from "pixi.js"
import { Vector2 } from "../interfaces/genericInterfaces"

let sprite: PIXI.Sprite | null = null

await PIXI.Assets.load([
    {
        alias: "ASSET_ALIAS",
        src: "/assets/ASSET_NAME.png"
    }
])

export const Template = {
    _init(app: PIXI.Application) {
        sprite = new PIXI.Sprite(PIXI.Assets.get("ASSET_ALIAS"))

        sprite.anchor.set(0.5)
        sprite.x = app.screen.width / 2
        sprite.y = app.screen.height / 2

        app.stage.addChild(sprite)

        app.ticker.add(this._update)
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

    _update(ticker: PIXI.Ticker) {
        if (!sprite) return
    },
}
