import * as PIXI from "pixi.js"
import { RoomSprite } from "./RoomSprite"

let particleContainer: PIXI.Container | null = null
/* let trailContainer: PIXI.Container | null = null */

interface Particle {
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

/* interface TrailPoint {
    x: number,
    y: number,
    life: number,
    maxLife: number,
    sprite: PIXI.Graphics
} */

export const ParticleHandler = {
    particles: [] as Particle[],
    /* trails: [] as TrailPoint[], */

    _trailSampleRate: 1,
    _trailLastSample: 0,

    init(app: PIXI.Application) {
        particleContainer = new PIXI.Container()
        /* trailContainer = new PIXI.Container() */

        app.stage.addChild(particleContainer)
        /* app.stage.addChild(trailContainer) */
        app.ticker.add(this.update)
    },

    spawnParticle(x: number, y: number, vx?: number, vy?: number, maxLife?: number, dampFactor?: number, radius?: number, sprite?: PIXI.Graphics) {
        const _fallbackSprite = sprite ?? new PIXI.Graphics().circle(0, 0, radius ?? 5).fill(0xeeeeee)
        const particle: Particle = {
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

    /* spawnTrailPoint(x: number, y: number, life?: number, maxLife?: number) {
        const graphics = new PIXI.Graphics().circle(0, 0, 6).fill(0xffffff)

        const trailPoint: TrailPoint = {
            x: x,
            y: y,
            life: life ?? 0,
            maxLife: maxLife ?? 500,
            sprite: graphics
        }

        trailContainer?.addChild(graphics)
        ParticleHandler.trails.push(trailPoint)
    },

    sampleTrail(x: number, y: number, dt: number) {
        this._trailLastSample += dt

        if (this._trailLastSample < this._trailSampleRate) return

        this._trailLastSample = 0
        this.spawnTrailPoint(x, y)
    }, */

    update(ticker: PIXI.Ticker) {
        if (!ParticleHandler.particles) return;

        const ms = ticker.deltaMS

        for (let i = 0; i < ParticleHandler.particles.length; i++) {
            const p = ParticleHandler.particles[i]
            p.life += ms

            if (
                (p.life >= p.maxLife) ||
                p.x < RoomSprite.ROOM_BOUNDS.left || p.x > RoomSprite.ROOM_BOUNDS.right ||
                p.y < RoomSprite.ROOM_BOUNDS.top || p.y > RoomSprite.ROOM_BOUNDS.bottom
            ) {
                particleContainer?.removeChild(p.sprite)
                ParticleHandler.particles.splice(i, 1)
                i--
                continue
            }

            /* update pos */
            p.sprite.x = p.x
            p.sprite.y = p.y

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

        /* for (let i = 0; i < ParticleHandler.trails.length; i++) {
            const t = ParticleHandler.trails[i]
            t.life += ms

            const n = t.life / t.maxLife

            if (n >= 1) {
                trailContainer?.removeChild(t.sprite)
                ParticleHandler.trails.splice(i, 1)
                i--
                continue
            }

            const fade = 1 - n

            t.sprite.alpha = fade

            t.sprite.x = t.x
            t.sprite.y = t.y
        } */
    },
}
