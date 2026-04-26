import * as PIXI from "pixi.js"
import { RoomSprite } from "../sprites/RoomSprite"
import { Player } from "../sprites/PlayerSprite"
import { DRAW_ORDERS } from "../const/drawOrders"

let bulletContainer: PIXI.Container | null = null

interface IBullet {
    x: number,
    y: number,
    vx: number,
    vy: number,
    radius: number,
    life: number,
    maxLife: number,
    markedForDeletion?: boolean,
    dampFactor: number,
    sprite: PIXI.Graphics
}

const DESPAWN_TIME = 300

export const BulletHandler = {
    bullets: [] as IBullet[],

    _init(app: PIXI.Application) {
        bulletContainer = new PIXI.Container()
        bulletContainer.zIndex = DRAW_ORDERS.BULLETS

        app.stage.addChild(bulletContainer)
        app.ticker.add(this._update)
    },

    spawnBullet(x: number, y: number, vx?: number, vy?: number, maxLife?: number, dampFactor?: number, radius?: number, sprite?: PIXI.Graphics) {
        const _fallbackSprite =
            sprite ??
            new PIXI.Graphics()
                .circle(0, 0, radius ?? 10)
                .fill(0x990000)
                .setStrokeStyle({ width: 3, color: 0xee0000 })
                .stroke()

        const particle: IBullet = {
            x: x,
            y: y,
            vx: vx ?? 0,
            vy: vy ?? 0,
            radius: radius ?? 10,
            life: 0,
            maxLife: maxLife ?? 5000,
            dampFactor: dampFactor ?? 0.995,
            sprite: sprite ?? _fallbackSprite
        }

        /* init into render position so first frame is correct */
        const renderPos = RoomSprite.getRenderPosition(x, y)
        particle.sprite.x = renderPos.x
        particle.sprite.y = renderPos.y

        bulletContainer?.addChild(particle.sprite)
        BulletHandler.bullets.push(particle)
    },

    _update(ticker: PIXI.Ticker) {
        if (!BulletHandler.bullets) return;

        const ms = ticker.deltaMS

        for (let i = 0; i < BulletHandler.bullets.length; i++) {
            const b = BulletHandler.bullets[i]

            b.life += ms

            /* check if bullet finished disappear anim */
            if (b.life >= b.maxLife + DESPAWN_TIME) {
                b.markedForDeletion = true
            }

            /* check if bullet is oob */
            if (
                b.x < 0 || b.x > RoomSprite.ROOM_SIZE ||
                b.y < 0 || b.y > RoomSprite.ROOM_SIZE
            ) {
                b.life = Math.max(b.maxLife, b.life) /* start despawn if not already */
            }

            /* check player hit */
            if (b.life < b.maxLife && !Player.isInvulnerable()) {
                const LENIENCY_FACTOR = 0.9
                const ppos = { x: Player.x, y: Player.y }
                const psize = Player.SPRITE_SIZE
                const dx = b.x - ppos.x
                const dy = b.y - ppos.y
                const r = (psize / 2 + b.radius / 2) * LENIENCY_FACTOR

                /* hit */
                if (dx * dx + dy * dy <= r * r) {
                    Player.damage(1)
                    b.markedForDeletion = true
                }
            }

            /* remove if marked for deletion */
            if (b.markedForDeletion) {
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

            const speed = Math.sqrt(b.vx * b.vx + b.vy * b.vy)
            b.sprite.rotation = Math.atan2(b.vy, b.vx)

            /* normal scale */
            const scaleStretch = Math.max(Math.min(1 + speed / 20, 2), 1)
            const scaleSquish = Math.max(1 / scaleStretch, 0.4)
            b.sprite.scale.set(scaleStretch, scaleSquish)

            /* + decaying scale */
            if (b.life >= b.maxLife) {
                const decayProgress = Math.min((b.life - b.maxLife) / DESPAWN_TIME, 1)
                const scale = Math.max(1 - decayProgress, 0)
                b.sprite.scale.set(scaleStretch * scale, scaleSquish * scale)
                b.sprite.alpha = Math.max(1 - decayProgress, 0)
            }

            b.vx *= b.dampFactor
            b.vy *= b.dampFactor
        }
    },
}
