import * as PIXI from "pixi.js"
import { RoomSprite } from "./RoomSprite"
import { Player } from "./PlayerSprite"

let bulletContainer: PIXI.Container | null = null

interface Bullet {
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

export const BulletHandler = {
    bullets: [] as Bullet[],

    init(app: PIXI.Application) {
        bulletContainer = new PIXI.Container()

        app.stage.addChild(bulletContainer)
        app.ticker.add(this.update)
    },

    spawnBullet(x: number, y: number, vx?: number, vy?: number, maxLife?: number, dampFactor?: number, radius?: number, sprite?: PIXI.Graphics) {
        const _fallbackSprite =
            sprite ??
            new PIXI.Graphics()
                .circle(0, 0, radius ?? 10)
                .fill(0x990000)
                .setStrokeStyle({ width: 3, color: 0xee0000 })
                .stroke()

        const particle: Bullet = {
            x: x,
            y: y,
            vx: vx ?? 0,
            vy: vy ?? 0,
            radius: radius ?? 10,
            life: 0,
            maxLife: maxLife ?? 1000,
            dampFactor: dampFactor ?? 1,
            sprite: sprite ?? _fallbackSprite
        }

        /* init into render position so first frame is correct */
        const renderPos = RoomSprite.getRenderPosition(x, y)
        particle.sprite.x = renderPos.x
        particle.sprite.y = renderPos.y

        bulletContainer?.addChild(particle.sprite)
        BulletHandler.bullets.push(particle)
    },

    update(ticker: PIXI.Ticker) {
        if (!BulletHandler.bullets) return;

        const ms = ticker.deltaMS

        for (let i = 0; i < BulletHandler.bullets.length; i++) {
            const b = BulletHandler.bullets[i]
            b.life += ms

            /* check if bullet is out of bounds or out of life */
            if (
                (b.life >= b.maxLife) ||
                b.x < 0 || b.x > RoomSprite.ROOM_SIZE ||
                b.y < 0 || b.y > RoomSprite.ROOM_SIZE
            ) {
                bulletContainer?.removeChild(b.sprite)
                BulletHandler.bullets.splice(i, 1)
                i--
                continue
            }

            /* check player hit */
            const ppos = { x: Player.x, y: Player.y }
            const psize = Player.getSprite()?.width ?? 0 / 2
            const dx = b.x - ppos.x
            const dy = b.y - ppos.y
            const r = psize / 2 + b.radius / 2

            /* hit */
            if (dx * dx + dy * dy <= r * r) {
                Player.damage(1)
                bulletContainer?.removeChild(b.sprite)
                BulletHandler.bullets.splice(i, 1)
                i--
                continue
            }

            /* update pos */
            const renderPos = RoomSprite.getRenderPosition(b.x, b.y)
            b.sprite.x = renderPos.x
            b.sprite.y = renderPos.y

            /* physics */
            b.x += b.vx
            b.y += b.vy

            b.vx *= b.dampFactor
            b.vy *= b.dampFactor
        }
    },
}
