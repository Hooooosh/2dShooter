import { Ticker } from "pixi.js";
import { BulletHandler } from "../handlers/BulletHandler";
import { IGenericEnemy } from "../sprites/EnemySprite";
import { ParticleHandler } from "../handlers/ParticleHandler";
import { Player } from "../sprites/PlayerSprite";
import { dtToMs } from "../helpers/time";

export type TEnemyBehavior<TBehaviorConfig> = (
    enemy: IGenericEnemy,
    ticker: Ticker,
    config: TBehaviorConfig
) => void

export type TAnyBehaviorEntry = TBehaviorEntry<unknown>

export type TBehaviorEntry<TBehaviorConfig> = {
    behavior: TEnemyBehavior<TBehaviorConfig>,
    config?: TBehaviorConfig
}

export type TFollowPlayerConfig = {
    keepDistance?: number,
    speed?: number,
}

export type TShootPeriodicallyConfig = {
    shootPeriod?: number,
    bulletSpeed?: number
}


export const ENEMY_BEHAVIORS = {
    followPlayerBehavior: (enemy: IGenericEnemy, ticker: Ticker,
        config?: TFollowPlayerConfig
    ) => {
        if (!Player.getSprite() || !enemy.sprite) return

        const playerPos = {
            x: Player.x,
            y: Player.y,
        }

        config ??= {}
        config.keepDistance ??= 175
        config.speed ??= 1.5

        const dx = playerPos.x - enemy.x
        const dy = playerPos.y - enemy.y

        const dstToPlayerSq = dx * dx + dy * dy
        const angleToPlayer = Math.atan2(dy, dx)
        const stepSize = config?.speed ? config.speed * ticker.deltaTime : 0
        const keepDistance = config?.keepDistance ?? 0

        /* if enemy too far */
        if (dstToPlayerSq > (keepDistance + stepSize) ** 2) {
            enemy.x += Math.cos(angleToPlayer) * stepSize
            enemy.y += Math.sin(angleToPlayer) * stepSize
        }
        /* if enemy too close */
        else if (dstToPlayerSq < (keepDistance - stepSize) ** 2) {
            enemy.x -= Math.cos(angleToPlayer) * stepSize * 0.7
            enemy.y -= Math.sin(angleToPlayer) * stepSize * 0.7
        }
        /* if enemy close enough to snap to dst */
        else {
            enemy.x = playerPos.x - Math.cos(angleToPlayer) * keepDistance
            enemy.y = playerPos.y - Math.sin(angleToPlayer) * keepDistance
        }
    },


    shootPeriodicallyBehavior: (enemy: IGenericEnemy, ticker: Ticker,
        config?: TShootPeriodicallyConfig & {
            _currentTime: number,
            _canPlayWarning: boolean,
            _nextRandomizedShootPeriod: number
        }
    ) => {
        if (!enemy.sprite || enemy.markedForDeletion) return
        
        config ??= { _canPlayWarning: true, _currentTime: 0, _nextRandomizedShootPeriod: 9999, shootPeriod: 1200, bulletSpeed: 2 }

        function randomizeNextShootPeriod() {
            const minTimes = 0.9
            const maxTimes = 1.1
            config!._nextRandomizedShootPeriod = config!.shootPeriod! * (minTimes + Math.random() * (maxTimes - minTimes))
        }

        if (config._currentTime == undefined) config._currentTime = 0
        if (config._canPlayWarning == undefined) config._canPlayWarning = true

        /* little random so enemies dont shoot at same time */
        if (config._nextRandomizedShootPeriod == undefined) randomizeNextShootPeriod()

        /* play shoot warning particle */
        const WARNING_DURATION = Math.max(Math.min(1500, config._nextRandomizedShootPeriod * 0.75), 500)
        if (config._currentTime >= config._nextRandomizedShootPeriod - WARNING_DURATION && config._canPlayWarning) {
            ParticleHandler.spawnEnemyShootIndicator(enemy, WARNING_DURATION, 75)
            config._canPlayWarning = false
        }

        /* shoot if possible */
        if (config._currentTime > config._nextRandomizedShootPeriod) {
            const playerPos = { x: Player.x, y: Player.y }
            const angleToPlayer = Math.atan2(playerPos.y - enemy.y, playerPos.x - enemy.x)
            BulletHandler.spawnBullet(
                enemy.x,
                enemy.y,
                Math.cos(angleToPlayer) * (config.bulletSpeed ?? 2),
                Math.sin(angleToPlayer) * (config.bulletSpeed ?? 2),
            )
            config._currentTime -= config._nextRandomizedShootPeriod
            config._canPlayWarning = true
            randomizeNextShootPeriod()
        }

        config._currentTime += dtToMs(ticker.deltaTime)
    }
}
