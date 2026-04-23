import * as PIXI from "pixi.js"
import { RoomSprite } from "./RoomSprite"

let particleContainer: PIXI.Container | null = null

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

export const ParticleHandler = {
    particles: [] as Particle[],

    init(app: PIXI.Application) {
        particleContainer = new PIXI.Container()

        app.stage.addChild(particleContainer)
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

    update(ticker: PIXI.Ticker) {
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
    },
}
