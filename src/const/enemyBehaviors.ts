import { Ticker } from "pixi.js";
import { BulletHandler } from "../handlers/BulletHandler";
import { IGenericEnemy } from "../sprites/EnemySprite";
import { ParticleHandler } from "../handlers/ParticleHandler";
import { Player } from "../sprites/PlayerSprite";
import { degToRad, radToDeg } from "../helpers/angle";
import { ROOM_SIZE } from "../sprites/RoomSprite";
import { SFX } from "../helpers/soundLoader";
import { Sword } from "../sprites/SwordSprite";
import { dotProduct, scaleVector, subtractVectors } from "../helpers/vector";

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
    bulletDecay?: number,
    shootInCircle?: boolean
}

export type TKamikazeBehavior = {
    acceleration?: number
}

export type TDashBehavior = {
    dashCooldown?: number,
    dashSpeed?: number,
    baseSlipperiness?: number
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
        config._currentTime ??= config.shootInterval / 2
        config._currentTime += ticker.deltaMS

        /* play shoot warning particle */
        const WARNING_DURATION = Math.max(Math.min(1500, config.shootInterval * 0.75), 500)
        if (config._currentTime >= config.shootInterval - WARNING_DURATION && config._canPlayWarning) {
            ParticleHandler.spawnEnemyShootIndicator(enemy, (config.shootInterval - config._currentTime), 75)
            config._canPlayWarning = false
        }

        /* shoot if possible */
        if (config._currentTime > config.shootInterval) {
            config._currentTime = 0
            const playerPos = { x: Player.x, y: Player.y }
            const angleToPlayer = Math.atan2(playerPos.y - enemy.y, playerPos.x - enemy.x)
            BulletHandler.spawnBullet({
                "x": enemy.x,
                "y": enemy.y,
                "speed": config.bulletSpeed,
                "angle": angleToPlayer
            })
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
        config._currentTime ??= config.shootInterval / 2
        config._currentTime += ticker.deltaMS
        const BURST_DURATION = 300

        if (config._canPlayWarning == undefined) config._canPlayWarning = true

        /* play shoot warning particle */
        const WARNING_DURATION = Math.max(Math.min(1500, config.shootInterval * 0.75), 500)
        if (config._currentTime >= config.shootInterval - WARNING_DURATION && config._canPlayWarning) {
            ParticleHandler.spawnEnemyShootIndicator(enemy, (config.shootInterval - config._currentTime), 75)
            config._canPlayWarning = false
        }

        /* shoot if possible */
        if (config._currentTime > config.shootInterval) {
            config._currentTime = 0
            const playerPos = { x: Player.x, y: Player.y }
            const angleToPlayer = Math.atan2(playerPos.y - enemy.y, playerPos.x - enemy.x)
            const spreadRad = degToRad(config.bulletSpread)
            /* if only one bullet, shoot normally */
            if (config.bulletCount == 1) {
                BulletHandler.spawnBullet({
                    "x": enemy.x,
                    "y": enemy.y,
                    "speed": config.bulletSpeed,
                    "angle": angleToPlayer,
                    "dampFactor": config.bulletDecay
                })
            }
            /* else, shotgun */
            else {
                const midAngle = angleToPlayer
                for (let i = 0; i < config.bulletCount; i++) {
                    let headingAngle = 0
                    if (config.shootInCircle) {
                        headingAngle = (Math.PI * 2 / config.bulletCount) * i
                    }
                    else {
                        const side = i % 2 == 0 ? 1 : -1
                        headingAngle = midAngle + side * Math.ceil(i / 2) * (spreadRad / (config.bulletCount - 1))
                    }
                    setTimeout(() => {
                        BulletHandler.spawnBullet({
                            "x": enemy.x,
                            "y": enemy.y,
                            "speed": config.bulletSpeed,
                            "angle": headingAngle,
                            "dampFactor": config.bulletDecay
                        })
                        ParticleHandler.spawnParticle(
                            enemy.x,
                            enemy.y,
                            Math.cos(headingAngle + Math.PI) * config.bulletSpeed! * (Math.random() * 0.4 + 0.6) * 5,
                            Math.sin(headingAngle + Math.PI) * config.bulletSpeed! * (Math.random() * 0.4 + 0.6) * 5,
                            300,
                            0xffaaaa,
                            0.4,
                            0.90,
                            3 + Math.random() * 3
                        )
                    }, i * BURST_DURATION / config.bulletCount)

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
        config: TDashBehavior & { baseSlipperiness?: number, _canPlayWarning?: boolean, _currentTime?: number, _afterImageTime?: number, _prevHealth?: number, _parryTimerMs?: number }
    ) => {
        if (!Player.getSprite() || !enemy.sprite) return

        config.dashCooldown ??= 2500
        config.dashSpeed ??= 5
        config.baseSlipperiness ??= 0.98
        config._currentTime ??= config.dashCooldown / 2
        config._afterImageTime ??= 0
        config._canPlayWarning ??= true
        config._parryTimerMs ??= 0
        config._prevHealth ??= enemy.health
        

        const PARRY_WINDOW = 1500

        const AFTERIMAGE_INTERVAL = 250

        const currSpeed = enemy.getSlippingSpeed()

        if (currSpeed == 0) {
            /* only count cooldown when stationary */
            enemy.hurtsPlayerOnCollision = true
            enemy.slipperiness = config.baseSlipperiness
            config._currentTime += ticker.deltaMS
        }
        else {
            /* if dashing */

            /* bypass normal hitbox, handle parry here */
            enemy.hurtsPlayerOnCollision = false

            /* TODO KISZEDNI */
            /* enemy.slipperiness = config.baseSlipperiness */
            enemy.slipperiness = 1

            /* active parry window */
            if (config._parryTimerMs > 0) {
                config._parryTimerMs -= ticker.deltaMS

                /* timer ticked down, failed parry, damage player */
                if (config._parryTimerMs < 0) {
                    Player.damage()
                }
            }

            if (currSpeed < 3) {
                enemy.slipperiness = 0.96
                enemy.isCritVulnerable = false
            }
            /* if fast enough, vulnerable */
            else {
                enemy.isCritVulnerable = true
            }

            /* if slow enough, stop */
            if (currSpeed < 0.5) {
                enemy.slipperiness = 0
                enemy.isCritVulnerable = false
            }
            else {
                /* update facing angle */
                const headingAngle = Math.atan2(enemy.vy, enemy.vx)
                enemy.sprite.rotation = headingAngle - Math.PI / 2
            }

            const currentSpeed = enemy.getSlippingSpeed()

            /* spawn afterimage if can */
            config._afterImageTime += ticker.deltaTime * ticker.deltaMS
            if (Math.floor(config._afterImageTime / AFTERIMAGE_INTERVAL) < Math.floor((config._afterImageTime + ticker.deltaTime * ticker.deltaMS) / AFTERIMAGE_INTERVAL)) {
                ParticleHandler.spawnEnemyAfterImage(enemy, 800, Math.min(0.7, currentSpeed / 15), false)
            }

            /* parry handler */
            /* if close to player, open parry window */
            const distToPlayerSq = (Player.x - enemy.x) ** 2 + (Player.y - enemy.y) ** 2
            if (distToPlayerSq < 100 ** 2 && config._parryTimerMs <= 0 && enemy.iframesMs <= 0) {
                enemy.iframesMs = 400
                if (config._parryTimerMs <= 0) {
                    config._parryTimerMs = PARRY_WINDOW
                }
            }

            
            /* parry success */
            if (Sword.isSwinging && Sword.isSwingFirstOfHold && config._parryTimerMs > 0) {
                enemy.damage(Player.baseDmg, true)
                config._parryTimerMs = 0
                
                /* reflect by hit angle */
                
                /* v - 2f*(v•f) */
                const angleV = Math.atan2(enemy.vy, enemy.vx) - Math.PI
                const angleF = Sword.lookingToAngle

                console.log(angleV, angleF)

                const v = { x: Math.cos(angleV), y: Math.sin(angleV) }
                const f = { x: Math.cos(angleF), y: Math.sin(angleF) }

                const res = subtractVectors(v, scaleVector(f, 2 * dotProduct(v, f)))

                console.log(res)

                enemy.vx = res.x * currentSpeed * 1
                enemy.vy = res.y * currentSpeed * 1

                /* can hurt player normally again */
                setTimeout(() => {
                    enemy.hurtsPlayerOnCollision = true
                }, 300);
            }
        }

        /* play dash warning particle */
        const WARNING_DURATION = 1500
        if (config._currentTime >= config.dashCooldown - WARNING_DURATION && config._canPlayWarning) {
            ParticleHandler.spawnEnemyShootIndicator(enemy, (config.dashCooldown - config._currentTime), 75)
            config._canPlayWarning = false
        }

        /* init dash */
        if (config._currentTime > config.dashCooldown) {
            config._currentTime = 0
            const playerPos = { x: Player.x, y: Player.y }
            const angleToPlayer = Math.atan2(playerPos.y - enemy.y, playerPos.x - enemy.x)
            const newDashSpeed = config.dashSpeed * (0.7 + Math.random() * 0.6)
            enemy.slipperiness = config.baseSlipperiness
            enemy.vx = Math.cos(angleToPlayer) * newDashSpeed
            enemy.vy = Math.sin(angleToPlayer) * newDashSpeed
            config._canPlayWarning = true

            /* sfx */
            SFX.play("enemyDash", { volume: 0.1, speed: Math.random() * 0.4 + 1.5 })
        }

        /* bounce off walls */
        const nextX = enemy.x + enemy.vx * ticker.deltaTime
        const nextY = enemy.y + enemy.vy * ticker.deltaTime
        const bounds = enemy.sprite.width / 2
        if (nextX < bounds || nextX > ROOM_SIZE - bounds) {
            enemy.vx *= -1
            enemy.x = Math.max(bounds, Math.min(ROOM_SIZE - bounds, nextX))
        }
        else {
            enemy.x = nextX
        }
        if (nextY < bounds || nextY > ROOM_SIZE - bounds) {
            enemy.vy *= -1
            enemy.y = Math.max(bounds, Math.min(ROOM_SIZE - bounds, nextY))
        }
        else {
            enemy.y = nextY
        }

        config._prevHealth = enemy.health
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
    shootBurstTowardPlayer: (shootInterval: number, bulletSpeed: number, bulletSpread: number, bulletCount: number, bulletDecay?: number, shootInCircle?: boolean) => ({
        behavior: ENEMY_BEHAVIORS.shootBurstTowardPlayer,
        config: { shootInterval, bulletSpeed, bulletSpread, bulletCount, bulletDecay, shootInCircle }
    } as TAnyBehaviorEntry),
    kamikazeBehavior: (acceleration?: number) => ({
        behavior: ENEMY_BEHAVIORS.kamikazeBehavior,
        config: { acceleration } as TKamikazeBehavior
    } as TAnyBehaviorEntry),
    dashBehavior: (dashCooldown?: number, dashSpeed?: number, baseSlipperiness?: number) => ({
        behavior: ENEMY_BEHAVIORS.dashBehavior,
        config: { dashCooldown, dashSpeed, baseSlipperiness } as TDashBehavior
    } as TAnyBehaviorEntry),
    lookAtPlayerBehavior: (intensity?: number, condition?: () => boolean) => ({
        behavior: ENEMY_BEHAVIORS.lookAtPlayerBehavior,
        config: { intensity, condition } as TLookAtPlayerBehavior
    } as TAnyBehaviorEntry)
}
