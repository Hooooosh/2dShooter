import * as PIXI from "pixi.js"
import { BulletHandler } from "../handlers/BulletHandler"
import { ROOM_SIZE } from "./RoomSprite"

interface IBulletSpawner {
    INTERVAL: number
    currentInterval: number
    x: number
    y: number
    lastAngle: number
    _init(app: PIXI.Application): void
    _update(ticker: PIXI.Ticker): void
}

export const BulletSpawner: IBulletSpawner = {
    INTERVAL: 200,
    currentInterval: 0,
    x: ROOM_SIZE / 2,
    y: ROOM_SIZE / 3,
    lastAngle: 0,

    _init(app: PIXI.Application) {
        app.ticker.add(BulletSpawner._update)
        BulletHandler.spawnBullet(BulletSpawner.x, BulletSpawner.y, 0, 0, 99999, 0)
    },

    _update(ticker: PIXI.Ticker) {
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
