import { Ticker } from "pixi.js";
import { BulletHandler } from "../handlers/BulletHandler";
import { IGenericEnemy } from "../sprites/EnemySprite";
import { ParticleHandler } from "../handlers/ParticleHandler";
import { Player } from "../sprites/PlayerSprite";
import { degToRad, radToDeg } from "../helpers/angle";
import { RoomSprite } from "../sprites/RoomSprite";

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
    isErratic?: number,
}

export type TShootPeriodicallyConfig = {
    shootInterval?: number,
    bulletSpeed?: number
}

export type TShootBurstTowardPlayeConfig = {
    shootInterval?: number,
    bulletSpeed?: number,
    bulletSpread?: number,
    bulletCount?: number,
    bulletDecay?: number
}

export type TKamikazeBehavior = {
    acceleration?: number
}

export type TDashBehavior = {
    dashCooldown?: number,
    dashSpeed?: number,
    dashDecay?: number
}

export type TLookAtPlayerBehavior = {
    intensity?: number,
    condition?: () => boolean
}

export const ENEMY_BEHAVIORS = {
    followPlayerBehavior: (enemy: IGenericEnemy, ticker: Ticker,
        config: TFollowPlayerConfig & { _actualFollowDist?: number }
    ) => {
        if (!Player.getSprite() || !enemy.sprite) return

        config.keepDistance ??= 175
        if (config._actualFollowDist == undefined) config._actualFollowDist = config.keepDistance

        const playerPos = {
            x: Player.x,
            y: Player.y,
        }


        const dx = playerPos.x - enemy.x
        const dy = playerPos.y - enemy.y

        const dstToPlayerSq = dx * dx + dy * dy
        const angleToPlayer = Math.atan2(dy, dx)
        const stepSize = enemy.baseSpeed * ticker.deltaTime

        /* if enemy too far */
        if (dstToPlayerSq > (config._actualFollowDist + stepSize) ** 2) {
            enemy.x += Math.cos(angleToPlayer) * stepSize
            enemy.y += Math.sin(angleToPlayer) * stepSize
        }
        /* if enemy too close */
        else if (dstToPlayerSq < (config._actualFollowDist - stepSize) ** 2) {
            enemy.x -= Math.cos(angleToPlayer) * stepSize * 0.7
            enemy.y -= Math.sin(angleToPlayer) * stepSize * 0.7
        }
        /* if enemy close enough to snap to dst */
        else {
            enemy.x = playerPos.x - Math.cos(angleToPlayer) * config._actualFollowDist
            enemy.y = playerPos.y - Math.sin(angleToPlayer) * config._actualFollowDist

            /* if erratic, roll chance to randomize followDist */
            if (config.isErratic) {
                if (Math.random() < 0.1) {
                    const minFact = 0.75
                    const maxFact = 1.35
                    config._actualFollowDist = config.keepDistance * (Math.random() * (maxFact - minFact) + minFact)
                }
            }
        }
    },
    shootPeriodicallyBehavior: (enemy: IGenericEnemy, ticker: Ticker,
        config: TShootPeriodicallyConfig & { _canPlayWarning?: boolean, _currentTime?: number }
    ) => {
        /* fill missing values */
        if (!enemy.sprite || enemy.markedForDeletion) return
        config._canPlayWarning ??= true
        config.shootInterval ??= 1700
        config.bulletSpeed ??= 3.5
        config._currentTime ??= 0
        config._currentTime += ticker.deltaMS

        /* play shoot warning particle */
        const WARNING_DURATION = Math.max(Math.min(1500, config.shootInterval * 0.75), 500)
        if (config._currentTime >= config.shootInterval - WARNING_DURATION && config._canPlayWarning) {
            ParticleHandler.spawnEnemyShootIndicator(enemy, WARNING_DURATION, 75)
            config._canPlayWarning = false
        }

        /* shoot if possible */
        if (config._currentTime > config.shootInterval) {
            config._currentTime = 0
            const playerPos = { x: Player.x, y: Player.y }
            const angleToPlayer = Math.atan2(playerPos.y - enemy.y, playerPos.x - enemy.x)
            BulletHandler.spawnBullet(
                enemy.x,
                enemy.y,
                Math.cos(angleToPlayer) * (config.bulletSpeed ?? 2),
                Math.sin(angleToPlayer) * (config.bulletSpeed ?? 2),
            )
            config._canPlayWarning = true
        }
    },
    shootBurstTowardPlayer: (enemy: IGenericEnemy, ticker: Ticker,
        config: TShootBurstTowardPlayeConfig & { _canPlayWarning?: boolean, _currentTime?: number }
    ) => {
        /* fill missing values */
        if (!enemy.sprite || enemy.markedForDeletion) return
        config._canPlayWarning ??= true
        config.shootInterval ??= 1700
        config.bulletSpeed ??= 3.5
        config.bulletSpread ??= 30
        config.bulletCount ??= 5
        config._currentTime ??= 0
        config._currentTime += ticker.deltaMS

        if (config._canPlayWarning == undefined) config._canPlayWarning = true

        /* play shoot warning particle */
        const WARNING_DURATION = Math.max(Math.min(1500, config.shootInterval * 0.75), 500)
        if (config._currentTime >= config.shootInterval - WARNING_DURATION && config._canPlayWarning) {
            ParticleHandler.spawnEnemyShootIndicator(enemy, WARNING_DURATION, 75)
            config._canPlayWarning = false
        }

        /* shoot if possible */
        if (config._currentTime > config.shootInterval) {
            config._currentTime = 0
            const playerPos = { x: Player.x, y: Player.y }
            const angleToPlayer = Math.atan2(playerPos.y - enemy.y, playerPos.x - enemy.x)
            const spreadRad = degToRad(config.bulletSpread)
            const startAngle = angleToPlayer - spreadRad / 2
            /* if only one bullet, shoot normally */
            if (config.bulletCount == 1) {
                BulletHandler.spawnBullet(
                    enemy.x,
                    enemy.y,
                    Math.cos(angleToPlayer) * config.bulletSpeed,
                    Math.sin(angleToPlayer) * config.bulletSpeed,
                    undefined,
                    config.bulletDecay
                )
            }
            /* else, shotgun */
            else {
                for (let i = 0; i < config.bulletCount; i++) {
                    const headingAngle = startAngle + (i * spreadRad / (config.bulletCount - 1))
                    BulletHandler.spawnBullet(
                        enemy.x,
                        enemy.y,
                        Math.cos(headingAngle) * config.bulletSpeed,
                        Math.sin(headingAngle) * config.bulletSpeed,
                        undefined,
                        config.bulletDecay
                    )
                    ParticleHandler.spawnParticle(
                        enemy.x, 
                        enemy.y, 
                        Math.cos(headingAngle + Math.PI) * (config.bulletSpeed) * (Math.random() * 0.4 + 0.6) * 5, 
                        Math.sin(headingAngle + Math.PI) * (config.bulletSpeed) * (Math.random() * 0.4 + 0.6) * 5,
                        300,
                        0xffaaaa,
                        0.4,
                        0.90,
                        3 + Math.random() * 3
                    )
                }
            }
            config._canPlayWarning = true
        }
    },
    kamikazeBehavior: (enemy: IGenericEnemy, ticker: Ticker,
        config: TKamikazeBehavior & { _isLockedIn?: boolean, _vx?: number, _vy?: number }
    ) => {
        if (!Player.getSprite() || !enemy.sprite) return

        config._isLockedIn ??= false
        config._vx ??= 0
        config._vy ??= 0
        config.acceleration ??= 0.2

        const playerPos = {
            x: Player.x,
            y: Player.y,
        }

        const dx = playerPos.x - enemy.x
        const dy = playerPos.y - enemy.y

        const dstToPlayerSq = dx * dx + dy * dy
        const angleToPlayer = Math.atan2(dy, dx)

        /* check distance for locking in */
        const lockInDistance = 150

        const TICK_DOWN_HEALTH_AFTER_SECS = 2

        if (!config._isLockedIn && dstToPlayerSq < lockInDistance ** 2) {
            /* lock to player forever */
            config._isLockedIn = true
            config._vx = 0
            config._vy = 0
        }

        /* if wandering around, not locked in */
        if (!config._isLockedIn) {
            if (Math.random() < 0.1) {
                const randomAngle = Math.random() * Math.PI * 2
                config._vx = Math.cos(randomAngle) * (enemy.baseSpeed / 2)
                config._vy = Math.sin(randomAngle) * (enemy.baseSpeed / 2)
            }
        }
        /* locked in, accelerating towards player */
        else {
            const angleForward = Math.atan2(config._vy, config._vx)
            const angleDiff = Math.atan2(Math.sin(angleToPlayer - angleForward), Math.cos(angleToPlayer - angleForward))
            const harderAcceleration = Math.abs(angleDiff) > degToRad(20) ? 2 : 1
            console.log(angleDiff, radToDeg(angleDiff))

            config._vx += Math.cos(angleToPlayer) * config.acceleration * ticker.deltaTime * harderAcceleration
            config._vy += Math.sin(angleToPlayer) * config.acceleration * ticker.deltaTime * harderAcceleration

            if (enemy.health > enemy.aliveFor / 1000 * TICK_DOWN_HEALTH_AFTER_SECS) {
                enemy.damage(0.5)
            }
        }

        /* move enemy */
        enemy.x += config._vx * ticker.deltaTime
        enemy.y += config._vy * ticker.deltaTime
    },
    dashBehavior: (enemy: IGenericEnemy, ticker: Ticker,
        config: TDashBehavior & { _vx?: number, _vy?: number, _canPlayWarning?: boolean, _currentTime?: number, _afterImageTime?: number }
    ) => {
        if (!Player.getSprite() || !enemy.sprite) return

        config._vx ??= 0
        config._vy ??= 0
        config.dashCooldown ??= 2500
        config.dashSpeed ??= 5
        config.dashDecay ??= 0.985
        config._currentTime ??= 0
        config._afterImageTime ??= 0
        config._canPlayWarning ??= true

        const AFTERIMAGE_INTERVAL = 250

        const speedSq = config._vx * config._vx + config._vy * config._vy

        if (config._vx == 0 && config._vy == 0) {
            /* only count cooldown when stationary */
            config._currentTime += ticker.deltaMS
        }
        else {
            /* if moving */
            /* apply decay to speed */
            config._vx *= config.dashDecay
            config._vy *= config.dashDecay

            if (speedSq < 3) {
                config._vx *= 0.97
                config._vy *= 0.97
            }

            if (speedSq < 0.5) {
                config._vx = 0
                config._vy = 0
            }
            else {
                /* update facing angle */
                const headingAngle = Math.atan2(config._vy, config._vx)
                enemy.sprite.rotation = headingAngle - Math.PI / 2
            }

            /* spawn afterimage if can */
            config._afterImageTime += ticker.deltaTime * ticker.deltaMS
            if (Math.floor(config._afterImageTime / AFTERIMAGE_INTERVAL) < Math.floor((config._afterImageTime + ticker.deltaTime * ticker.deltaMS) / AFTERIMAGE_INTERVAL)) {
                ParticleHandler.spawnEnemyAfterImage(enemy, 800, Math.min(0.7, speedSq / 15), false)
            }
        }

        /* play dash warning particle */
        const WARNING_DURATION = 2000
        if (config._currentTime >= config.dashCooldown - WARNING_DURATION && config._canPlayWarning) {
            ParticleHandler.spawnEnemyShootIndicator(enemy, WARNING_DURATION, 100)
            config._canPlayWarning = false
        }

        /* init dash */
        if (config._currentTime > config.dashCooldown) {
            config._currentTime = 0
            const playerPos = { x: Player.x, y: Player.y }
            const angleToPlayer = Math.atan2(playerPos.y - enemy.y, playerPos.x - enemy.x)
            const newDashSpeed = config.dashSpeed * (0.7 + Math.random() * 0.6)
            config._vx = Math.cos(angleToPlayer) * newDashSpeed
            config._vy = Math.sin(angleToPlayer) * newDashSpeed
            config._canPlayWarning = true
        }

        /* bounce off walls */
        const nextX = enemy.x + config._vx * ticker.deltaTime
        const nextY = enemy.y + config._vy * ticker.deltaTime
        const bounds = enemy.sprite.width / 2
        if (nextX < bounds || nextX > RoomSprite.ROOM_SIZE - bounds) {
            config._vx *= -1
            enemy.x = Math.max(bounds, Math.min(RoomSprite.ROOM_SIZE - bounds, nextX))
        }
        else {
            enemy.x = nextX
        }
        if (nextY < bounds || nextY > RoomSprite.ROOM_SIZE - bounds) {
            config._vy *= -1
            enemy.y = Math.max(bounds, Math.min(RoomSprite.ROOM_SIZE - bounds, nextY))
        }
        else {
            enemy.y = nextY
        }
    },
    lookAtPlayerBehavior: (enemy: IGenericEnemy, _ticker: Ticker,
        config: TLookAtPlayerBehavior & { _currentAngle?: number }
    ) => {
        if (!Player.getSprite() || !enemy.sprite) return
        config.intensity ??= 0.2
        config.condition ??= () => true

        if (!config.condition()) return

        const playerPos = {
            x: Player.x,
            y: Player.y,
        }

        const angleToPlayer = Math.atan2(playerPos.y - enemy.y, playerPos.x - enemy.x)
        config._currentAngle ??= angleToPlayer

        /* prevent angle wrap around jerks */
        if (Math.abs(angleToPlayer - config._currentAngle) > Math.PI) {
            config._currentAngle += Math.sign(angleToPlayer - config._currentAngle) * Math.PI * 2
        }

        config._currentAngle += (angleToPlayer - config._currentAngle) * config.intensity
        enemy.sprite.rotation = config._currentAngle - Math.PI / 2
    }
}

export const GET_ENEMY_BEHAVIOR = {
    followPlayerBehavior: (followDist: number, isErratic?: boolean) => ({
        behavior: ENEMY_BEHAVIORS.followPlayerBehavior,
        config: { keepDistance: followDist, isErratic: isErratic } as TFollowPlayerConfig
    } as TAnyBehaviorEntry),
    shootPeriodicallyBehavior: (shootInterval: number, bulletSpeed: number) => ({
        behavior: ENEMY_BEHAVIORS.shootPeriodicallyBehavior,
        config: { shootInterval: shootInterval, bulletSpeed } as TShootPeriodicallyConfig
    } as TAnyBehaviorEntry),
    shootBurstTowardPlayer: (shootInterval: number, bulletSpeed: number, bulletSpread: number, bulletCount: number, bulletDecay?: number) => ({
        behavior: ENEMY_BEHAVIORS.shootBurstTowardPlayer,
        config: { shootInterval, bulletSpeed, bulletSpread, bulletCount, bulletDecay }
    } as TAnyBehaviorEntry),
    kamikazeBehavior: (acceleration?: number) => ({
        behavior: ENEMY_BEHAVIORS.kamikazeBehavior,
        config: { acceleration } as TKamikazeBehavior
    } as TAnyBehaviorEntry),
    dashBehavior: (dashCooldown?: number, dashSpeed?: number, dashDecay?: number) => ({
        behavior: ENEMY_BEHAVIORS.dashBehavior,
        config: { dashCooldown, dashSpeed, dashDecay } as TDashBehavior
    } as TAnyBehaviorEntry),
    lookAtPlayerBehavior: (intensity?: number, condition?: () => boolean) => ({
        behavior: ENEMY_BEHAVIORS.lookAtPlayerBehavior,
        config: { intensity, condition } as TLookAtPlayerBehavior
    } as TAnyBehaviorEntry)
}
