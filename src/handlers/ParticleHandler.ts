import * as PIXI from "pixi.js"
import { RoomSprite } from "../sprites/RoomSprite"
import { IGenericEnemy } from "../sprites/EnemySprite"
import cubicBezierEase from "../helpers/bezier"
import { DRAW_ORDERS } from "../const/drawOrders"

let genericParticleContainer: PIXI.Container | null = null
let damageNumberParticleContainer: PIXI.Container | null = null

interface IParticle {
    x: number,
    y: number,
    vx: number,
    vy: number,
    radius: number,
    life: number,
    maxLife: number,
    dampFactor: number,
    color: number,
    maxAlpha?: number,
    sprite: PIXI.Graphics
}

interface IShootIndicatorEffect {
    enemy: IGenericEnemy,
    maxLife: number,
    life: number,
    initialRadius: number,
    sprite: PIXI.Graphics
}

interface IDamageNumberEffect {
    x: number,
    y: number,
    vx: number,
    vy: number,
    life: number,
    damage: number,
    isCrit: boolean,
    sprite: PIXI.HTMLText
}

interface ICricleExplosionEffect {
    x: number,
    y: number,
    targetRadius: number,
    initialRadius: number,
    initialLinewidth: number
    life: number,
    maxLife: number,
    maxAlpha: number,
    color: number,
    sprite: PIXI.Graphics
}

const NEGATIVE_FILTER = new PIXI.ColorMatrixFilter()
NEGATIVE_FILTER.negative(true)

export const ParticleHandler = {
    particles: [] as IParticle[],
    enemyShootIndicators: [] as IShootIndicatorEffect[],
    damageNumbers: [] as IDamageNumberEffect[],
    circleExplosions: [] as ICricleExplosionEffect[],

    _init(app: PIXI.Application) {
        genericParticleContainer = new PIXI.Container()
        damageNumberParticleContainer = new PIXI.Container()

        genericParticleContainer.zIndex = DRAW_ORDERS.PARTICLES
        damageNumberParticleContainer.zIndex = DRAW_ORDERS.DAMAGE_NUMBERS

        app.stage.addChild(genericParticleContainer)
        app.stage.addChild(damageNumberParticleContainer)
        app.ticker.add(this._update)
    },

    spawnParticle(
        x: number,
        y: number,
        vx = 0,
        vy = 0,
        maxLife = 1000,
        color = 0xffffff,
        maxAlpha = 1,
        dampFactor = 0.95,
        radius = 5,
        sprite?: PIXI.Graphics
    ) {
        const _fallbackSprite = sprite ?? new PIXI.Graphics().circle(0, 0, radius).fill(0xeeeeee)
        const particle: IParticle = {
            x,
            y,
            vx,
            vy,
            radius,
            life: 0,
            maxLife,
            dampFactor,
            maxAlpha,
            color,
            sprite: sprite ?? _fallbackSprite
        }

        particle.sprite.x = x
        particle.sprite.y = y

        genericParticleContainer?.addChild(particle.sprite)
        ParticleHandler.particles.push(particle)
    },

    spawnEnemyShootIndicator(enemy: IGenericEnemy, maxLife: number, initialRadius = 50) {
        const effect: IShootIndicatorEffect = {
            enemy,
            maxLife,
            life: 0,
            initialRadius,
            sprite: new PIXI.Graphics().circle(0, 0, initialRadius).setStrokeStyle({ width: 3, color: 0xff0000 })
        }
        effect.sprite.alpha = 0
        genericParticleContainer?.addChild(effect.sprite)
        ParticleHandler.enemyShootIndicators.push(effect)
    },

    spawnDamageNumber(x: number, y: number, damage: number, isCrit = false) {
        const num: IDamageNumberEffect = {
            x,
            y,
            vx: (Math.random() - 0.5) * 5,
            vy: -7 - Math.random() * 3,
            life: 0,
            damage,
            isCrit,
            sprite: new PIXI.HTMLText({
                text: damage.toString() + (isCrit ? "!" : ""),
                style: {
                    "fontFamily": "monospace",
                    "fontSize": 25,
                    "fontWeight": "bold",
                    "fill": 0xffffff,
                }
            })
        }

        num.sprite.anchor.set(0.5)
        num.sprite.style.addOverride('text-shadow: 3px 0 0 #ff0000, 0 3px 0 #ff0000, -3px 0 0 #ff0000, 0 -3px 0 #ff0000, 3px 3px 0 #ff0000, -3px 3px 0 #ff0000, -3px -3px 0 #ff0000, 3px -3px 0 #ff0000');
        num.sprite.filters = []

        damageNumberParticleContainer?.addChild(num.sprite)
        ParticleHandler.damageNumbers.push(num)
    },

    spawnParticleExplosion(x: number, y: number, speed = 3, count = 5, maxAlpha = 0.3, color = 0xffffff) {
        count = count + Math.floor(Math.random() * 5)
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2
            const initialSpeed = speed + Math.random() * 5
            const vx = Math.cos(angle) * initialSpeed
            const vy = Math.sin(angle) * initialSpeed
            const radius = Math.random() * 3 + 2
            const sprite = new PIXI.Graphics().circle(0, 0, radius).fill(color)
            ParticleHandler.spawnParticle(x, y, vx, vy, 500, color, maxAlpha, 0.95, radius, sprite)
        }
    },

    spawnCircleExplosion(x: number, y: number, targetRadius: number, initialRadius = 0, maxLife = 800, initialLinewidth = 10, maxAlpha = 1, color = 0xffffff) {
        const effect: ICricleExplosionEffect = {
            x,
            y,
            targetRadius,
            initialRadius,
            initialLinewidth,
            maxLife,
            maxAlpha,
            color,
            life: 0,
            sprite: new PIXI.Graphics().circle(x, y, initialRadius).fill(color)
        }

        genericParticleContainer?.addChild(effect.sprite)
        ParticleHandler.circleExplosions.push(effect)
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
                genericParticleContainer?.removeChild(p.sprite)
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
            p.sprite.fill(p.color)
            p.sprite.alpha = Math.min(p.maxAlpha ?? 1, adjustedNormal)

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
                e.life >= e.maxLife || !e.enemy || e.enemy.markedForDeletion
            ) {
                genericParticleContainer?.removeChild(e.sprite)
                ParticleHandler.enemyShootIndicators.splice(i, 1)
                i--
                continue
            }

            const BEZIER_CONTROLS = [
                .83,
                .11,
                .89,
                .25,
            ] as [number, number, number, number]
            const newRadiusNormal = cubicBezierEase(
                Math.max(0, Math.min(1, e.life / e.maxLife)),
                ...BEZIER_CONTROLS
            )


            const newRadius = (1 - newRadiusNormal) * e.initialRadius
            const color = e.sprite.strokeStyle.color

            e.sprite.clear()
            e.sprite.circle(0, 0, newRadius)
            e.sprite.alpha = (newRadiusNormal) * 0.4 + 0.4
            e.sprite.stroke({ width: (newRadiusNormal) * 5, color: color })

            const renderPos = RoomSprite.getRenderPosition(e.enemy.x, e.enemy.y)
            e.sprite.x = renderPos.x
            e.sprite.y = renderPos.y

            e.life += ms
        }


        /* ------------- DAMAGE NUMBERS ------------- */

        for (let i = 0; i < ParticleHandler.damageNumbers.length; i++) {
            const d = ParticleHandler.damageNumbers[i]

            if (d.life >= 2000 || d.sprite.alpha <= 0) {
                genericParticleContainer?.removeChild(d.sprite)
                ParticleHandler.damageNumbers.splice(i, 1)
                i--
                continue
            }


            d.x += d.vx
            d.y += d.vy
            d.vx *= 0.99
            d.vy += 0.25

            d.life += ms
            d.sprite.alpha = -d.vy / 2 + 2

            const renderPos = RoomSprite.getRenderPosition(d.x, d.y)

            d.sprite.x = renderPos.x
            d.sprite.y = renderPos.y

            /* if crit, fancy effect */
            if (d.isCrit) {
                const blinkInterval = 50
                d.sprite.style.fill = Math.floor(d.life / blinkInterval) % 2 == 0 ? 0xff0000 : 0xffffff
                const extraSize = 0.2
                const normal = 1 / (Math.max(d.life / 50, 1))
                const scaleX = normal * 4 + 1 + extraSize
                const scaleY = normal * -1 + 1 + extraSize
                d.sprite.scale.set(scaleX, scaleY)
            }
        }


        /* ------------- CIRCLE EXPLOSIONS ------------- */

        for (let i = 0; i < ParticleHandler.circleExplosions.length; i++) {
            const c = ParticleHandler.circleExplosions[i]

            if (c.life >= c.maxLife) {
                genericParticleContainer?.removeChild(c.sprite)
                ParticleHandler.circleExplosions.splice(i, 1)
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
                Math.max(0, Math.min(1, c.life / c.maxLife)),
                ...BEZIER_CONTROLS
            )

            const newRadius = (newRadiusNormal) * (c.targetRadius - c.initialRadius) + c.initialRadius
            const newLineWidth = (1 - newRadiusNormal) * c.initialLinewidth
            const newOpacity = (1 - newRadiusNormal) * c.maxAlpha

            c.sprite.clear()
            c.sprite.circle(0, 0, newRadius)
            c.sprite.alpha = newOpacity
            c.sprite.stroke({ width: newLineWidth, color: c.color })

            const renderPos = RoomSprite.getRenderPosition(c.x, c.y)
            c.sprite.x = renderPos.x
            c.sprite.y = renderPos.y

            c.life += ms

        }
    },
}
