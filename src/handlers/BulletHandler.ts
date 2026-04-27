import * as PIXI from "pixi.js"
import { ROOM_SIZE, RoomSprite } from "../sprites/RoomSprite"
import { Player } from "../sprites/PlayerSprite"
import { DRAW_ORDERS } from "../const/drawOrders"
import { SFX } from "../helpers/soundLoader"

let bulletContainer: PIXI.Container | null = null

interface IBullet {
    x: number,
    y: number,
    angle: number,
    initSpeed: number,
    radius: number,
    life: number,
    lifeFrames: number,
    maxLife: number,
    markedForDeletion?: boolean,
    dampFactor: number,
    sprite: PIXI.Graphics
}

interface IBulletConstructorParams {
    x: number,
    y: number,
    angle?: number,
    speed?: number,
    maxLife?: number,
    dampFactor?: number,
    radius?: number,
    sprite?: PIXI.Graphics
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

    spawnBullet(params: IBulletConstructorParams) {
        const chosenSprite =
            params.sprite ??
            new PIXI.Graphics()
                .circle(0, 0, params.radius ?? 10)
                .fill(0x990000)
                .setStrokeStyle({ width: 3, color: 0xee0000 })
                .stroke()

        const b: IBullet = {
            x: params.x,
            y: params.y,
            angle: params.angle ?? 0,
            initSpeed: params.speed ?? 0,
            radius: params.radius ?? 10,
            life: 0,
            lifeFrames: 0,
            maxLife: params.maxLife ?? 5000,
            dampFactor: params.dampFactor ?? 0.995,
            sprite: chosenSprite
        }

        /* init into render position so first frame is correct */
        const renderPos = RoomSprite.getRenderPosition(params.x, params.y)
        b.sprite.x = renderPos.x
        b.sprite.y = renderPos.y

        bulletContainer?.addChild(b.sprite)
        BulletHandler.bullets.push(b)

        /* play sfx */
        SFX.play("enemyShoot", { volume: 0.5, speed: Math.random() * 2 + 1.5 })
    },

    fadeOutAll() {
        BulletHandler.bullets.forEach(b => {
            if (b.life < b.maxLife) {
                b.life = b.maxLife
            }
        })
    },

    fadeOut(bullet: IBullet) {
        if (bullet.life < bullet.maxLife) {
            bullet.life = bullet.maxLife
        }
    },

    _update(ticker: PIXI.Ticker) {
        if (!BulletHandler.bullets) return;

        const ms = ticker.deltaMS

        for (let i = 0; i < BulletHandler.bullets.length; i++) {
            const b = BulletHandler.bullets[i]

            b.life += ms
            b.lifeFrames += ticker.deltaTime

            /* check if bullet finished disappear anim */
            if (b.life >= b.maxLife + DESPAWN_TIME) {
                b.markedForDeletion = true
            }

            /* check if bullet is oob */
            if (
                b.x < 0 || b.x > ROOM_SIZE ||
                b.y < 0 || b.y > ROOM_SIZE
            ) {
                BulletHandler.fadeOut(b) /* start despawn if not already */
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
                    BulletHandler.fadeOut(b)
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


            const newSpeed = b.initSpeed * Math.pow(b.dampFactor, b.lifeFrames)
            console.log(b.angle)

            /* physics */
            b.x += Math.cos(b.angle) * newSpeed
            b.y += Math.sin(b.angle) * newSpeed

            /* normal scale */
            const scaleStretch = Math.max(Math.min(1 + newSpeed / 20, 2), 1)
            const scaleSquish = Math.max(1 / scaleStretch, 0.4)
            b.sprite.scale.set(scaleStretch, scaleSquish)
            b.sprite.rotation = b.angle

            /* + decaying scale */
            if (b.life >= b.maxLife) {
                const decayProgress = Math.min((b.life - b.maxLife) / DESPAWN_TIME, 1)
                const scale = Math.max(1 - decayProgress, 0)
                b.sprite.scale.set(scaleStretch * scale, scaleSquish * scale)
                b.sprite.alpha = Math.max(1 - decayProgress, 0)
            }

        }
    },
}
