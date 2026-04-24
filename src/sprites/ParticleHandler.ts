import * as PIXI from "pixi.js"
import { RoomSprite } from "./RoomSprite"
import { IGenericEnemy } from "./EnemySprite"
import cubicBezierEase from "../helpers/bezier"

let particleContainer: PIXI.Container | null = null

interface IParticle {
    x: number,
    y: number,
    vx: number,
    vy: number,
    radius: number,
    life: number,
    maxLife: number,
    dampFactor: number,
    sprite: PIXI.Graphics
}

interface IShootIndicatorEffect {
    enemy: IGenericEnemy,
    duration: number,
    remainingDuration: number,
    initialRadius: number,
    sprite: PIXI.Graphics
}

export const ParticleHandler = {
    particles: [] as IParticle[],
    enemyShootIndicators: [] as IShootIndicatorEffect[],

    _init(app: PIXI.Application) {
        particleContainer = new PIXI.Container()

        app.stage.addChild(particleContainer)
        app.ticker.add(this._update)
    },

    spawnParticle(x: number, y: number, vx?: number, vy?: number, maxLife?: number, dampFactor?: number, radius?: number, sprite?: PIXI.Graphics) {
        const _fallbackSprite = sprite ?? new PIXI.Graphics().circle(0, 0, radius ?? 5).fill(0xeeeeee)
        const particle: IParticle = {
            x: x,
            y: y,
            vx: vx ?? 0,
            vy: vy ?? 0,
            radius: radius ?? 5,
            life: 0,
            maxLife: maxLife ?? 1000,
            dampFactor: dampFactor ?? 0.95,
            sprite: sprite ?? _fallbackSprite
        }

        particle.sprite.x = x
        particle.sprite.y = y

        particleContainer?.addChild(particle.sprite)
        ParticleHandler.particles.push(particle)
    },

    spawnEnemyShootIndicator(enemy: IGenericEnemy, duration: number, radius?: number) {
        const effect: IShootIndicatorEffect = {
            enemy,
            duration,
            remainingDuration: duration,
            initialRadius: radius ?? 50,
            sprite: new PIXI.Graphics().circle(0, 0, radius ?? 50).setStrokeStyle({ width: 3, color: 0xff0000 })
        }
        effect.sprite.alpha = 0
        particleContainer?.addChild(effect.sprite)
        ParticleHandler.enemyShootIndicators.push(effect)
    },

    _update(ticker: PIXI.Ticker) {

        /* ------------- PARTICLES ------------- */

        if (!ParticleHandler.particles) return;

        const ms = ticker.deltaMS

        for (let i = 0; i < ParticleHandler.particles.length; i++) {
            const p = ParticleHandler.particles[i]
            p.life += ms

            /* check if particle is out of bounds or out of life */
            if (
                (p.life >= p.maxLife) ||
                p.x < 0 || p.x > RoomSprite.ROOM_SIZE ||
                p.y < 0 || p.y > RoomSprite.ROOM_SIZE
            ) {
                particleContainer?.removeChild(p.sprite)
                ParticleHandler.particles.splice(i, 1)
                i--
                continue
            }

            /* update pos */
            const renderPos = RoomSprite.getRenderPosition(p.x, p.y)
            p.sprite.x = renderPos.x
            p.sprite.y = renderPos.y

            /* apply new radius */
            const lifeNormal = p.life / p.maxLife
            const adjustedNormal = Math.min(1, 2 - lifeNormal * 2)
            p.sprite.clear()
            p.sprite.circle(0, 0, adjustedNormal * p.radius)
            p.sprite.fill(0xffffff)
            /* p.sprite.alpha = adjustedNormal */

            /* physics */
            p.x += p.vx
            p.y += p.vy

            p.vx *= p.dampFactor
            p.vy *= p.dampFactor
        }

        /* ------------- ENEMY SHOOT INDICATORS ------------- */

        if (!ParticleHandler.enemyShootIndicators) return;

        for (let i = 0; i < ParticleHandler.enemyShootIndicators.length; i++) {
            const e = ParticleHandler.enemyShootIndicators[i]

            /* check if indicator is out of life */
            if (
                e.remainingDuration <= 0 || !e.enemy || e.enemy.markedForDeletion
            ) {
                particleContainer?.removeChild(e.sprite)
                ParticleHandler.enemyShootIndicators.splice(i, 1)
                i--
                continue
            }

            const BEZIER_CONTROLS = [
                .11,
                .83,
                .25,
                .89,
            ] as [number, number, number, number]
            const newRadiusNormal = cubicBezierEase(
                Math.max(0, Math.min(1, e.remainingDuration / e.duration)),
                ...BEZIER_CONTROLS
            )

            const newRadius = (newRadiusNormal) * e.initialRadius
            const color = e.sprite.strokeStyle.color

            e.sprite.clear()
            e.sprite.circle(0, 0, newRadius)
            e.sprite.alpha = (1 - newRadiusNormal) * 0.4 + 0.3
            e.sprite.stroke({ width: (1 - newRadiusNormal) * 5, color: color })

            const renderPos = RoomSprite.getRenderPosition(e.enemy.x, e.enemy.y)
            e.sprite.x = renderPos.x
            e.sprite.y = renderPos.y

            e.remainingDuration -= ms
        }
    },
}
