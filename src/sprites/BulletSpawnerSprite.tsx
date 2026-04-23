import * as PIXI from "pixi.js"
import { BulletHandler } from "./BulletHandler"
import { RoomSprite } from "./RoomSprite"

export const BulletSpawner = {
    INTERVAL: 200,
    currentInterval: 0,
    x: RoomSprite.ROOM_SIZE / 2,
    y: RoomSprite.ROOM_SIZE / 3,
    lastAngle: 0,

    init(app: PIXI.Application) {
        app.ticker.add(BulletSpawner.update)
        BulletHandler.spawnBullet(BulletSpawner.x, BulletSpawner.y, 0, 0, 99999, 0)
    },

    update(ticker: PIXI.Ticker) {
        const ms = ticker.deltaMS

        BulletSpawner.currentInterval -= ms
        if (BulletSpawner.currentInterval <= 0) {

            BulletSpawner.lastAngle += Math.PI / 3 * 2 + 0.05
            BulletSpawner.currentInterval = BulletSpawner.INTERVAL
            const vx = Math.cos(BulletSpawner.lastAngle) * 2
            const vy = Math.sin(BulletSpawner.lastAngle) * 2
            BulletHandler.spawnBullet(BulletSpawner.x, BulletSpawner.y, vx, vy, 10000, 0.995)
        }
    },
}
