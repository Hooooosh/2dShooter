import { Ticker } from "pixi.js";
import { BulletHandler } from "../sprites/BulletHandler";
import { IGenericEnemy } from "../sprites/EnemySprite";
import { ParticleHandler } from "../sprites/ParticleHandler";
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
    keepDistance: number,
    speed: number,
}

export type TShootPeriodicallyConfig = {
    shootPeriod: number,
    bulletSpeed?: number
}


export const ENEMY_BEHAVIORS = {
    followPlayerBehavior: (enemy: IGenericEnemy, ticker: Ticker, config?: TFollowPlayerConfig) => {
        if (!Player.getSprite() || !enemy.sprite) return

        const playerPos = {
            x: Player.x,
            y: Player.y,
        }

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


    shootPeriodicallyBehavior: (enemy: IGenericEnemy, ticker: Ticker, config: TShootPeriodicallyConfig & { _currentTime: number, _canPlayWarning: boolean }) => {
        if (!enemy.sprite || enemy.markedForDeletion) return

        if (config._currentTime == undefined) config._currentTime = 0
        if (config._canPlayWarning == undefined) config._canPlayWarning = true


        /* play shoot warning particle */
        const WARNING_DURATION = Math.max(Math.min(1500, config.shootPeriod * 0.75), 500)
        if (config._currentTime >= config.shootPeriod - WARNING_DURATION && config._canPlayWarning) {
            ParticleHandler.spawnEnemyShootIndicator(enemy, WARNING_DURATION, 50)
            config._canPlayWarning = false
        }

        /* shoot if possible */
        if (config._currentTime > config.shootPeriod) {
            const playerPos = { x: Player.x, y: Player.y }
            const angleToPlayer = Math.atan2(playerPos.y - enemy.y, playerPos.x - enemy.x)
            BulletHandler.spawnBullet(
                enemy.x,
                enemy.y,
                Math.cos(angleToPlayer) * (config.bulletSpeed ?? 2),
                Math.sin(angleToPlayer) * (config.bulletSpeed ?? 2),
            )
            config._currentTime -= config.shootPeriod
            config._canPlayWarning = true
        }

        config._currentTime += dtToMs(ticker.deltaTime)
    }
}
