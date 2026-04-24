import * as PIXI from "pixi.js"
import { GenericEnemy, IGenericEnemy } from "./EnemySprite"
import { TAnyBehaviorEntry } from "../const/enemyBehaviors"
import { RoomSprite } from "./RoomSprite"

let enemyContainer: PIXI.Container | null = null

export const EnemyHandler = {
    enemies: [] as IGenericEnemy[],
    appRef: null as PIXI.Application | null,

    _init(app: PIXI.Application) {
        enemyContainer = new PIXI.Container()

        app.stage.addChild(enemyContainer)
        app.ticker.add(this.update)

        this.appRef = app

        /* test */
        window.addEventListener("keydown", (e) => {
            if (e.code === "KeyE" && !e.repeat) {
                const times = 30
                const oneSegment = RoomSprite.ROOM_SIZE / (times + 2)
                for (let x = oneSegment; x < RoomSprite.ROOM_SIZE - oneSegment; x += oneSegment) {
                    for (let y = oneSegment; y < RoomSprite.ROOM_SIZE - oneSegment; y += oneSegment) {
                        EnemyHandler.spawnEnemy(x, y, 3, undefined, 0)
                    }
                }
            }
        })
    },

    spawnEnemy(x: number, y: number, health?: number, maxHealth?: number, hurtboxSize?: number, texture?: PIXI.Texture, behaviors?: TAnyBehaviorEntry[]) {
        const enemy = new GenericEnemy(
            x,
            y,
            maxHealth,
            health = health ?? maxHealth ?? undefined,
            texture ?? PIXI.Assets.get("enemy-placeholder"),
            behaviors,
            hurtboxSize
        )

        if (EnemyHandler.appRef) {
            EnemyHandler.appRef.stage.addChild(enemy.sprite)
            EnemyHandler.enemies.push(enemy)
        }

        return enemy
    },


    update(ticker: PIXI.Ticker) {
        for (const enemy of EnemyHandler.enemies) {
            enemy.update(ticker)
        }
    }
}
