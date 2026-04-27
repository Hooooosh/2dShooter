import * as PIXI from "pixi.js"
import { TAnyBehaviorEntry } from "../const/enemyBehaviors";
import getSpritePosClampedToBounds from "../helpers/getSpritePosClampedToBounds";
import { ROOM_SIZE, RoomSprite } from "./RoomSprite";
import { ParticleHandler } from "../handlers/ParticleHandler";
import { EnemyHandler } from "../handlers/EnemyHandler";
import { Player } from "./PlayerSprite";
import { SFX } from "../helpers/soundLoader";

await PIXI.Assets.load([
    {
        alias: "enemy-placeholder",
        src: `${import.meta.env.BASE_URL}assets/enemy-placeholder.png`
    }
])

export interface IEnemyConstructorParams {
    x?: number,
    y?: number,
    vx?: number,
    vy?: number,
    slipperiness?: number,
    health?: number,
    maxHealth?: number,
    baseSpeed?: number,
    hurtboxSize?: number,
    hurtsPlayerOnCollision?: boolean,
    isCritVulnerable?: boolean
    behaviors?: TAnyBehaviorEntry[],
    texture?: PIXI.Texture,
}

export interface IGenericEnemy {
    x: number
    y: number
    vx: number
    vy: number
    slipperiness: number
    health: number
    baseSpeed: number
    maxHealth: number
    aliveFor: number
    hurtboxSize: number
    iframesMs: number
    markedForDeletion: boolean
    hurtsPlayerOnCollision: boolean
    isCritVulnerable: boolean

    sprite: PIXI.Sprite | undefined
    behaviors: TAnyBehaviorEntry[]
    _update(ticker: PIXI.Ticker): void
    damage(amount?: number, wasCrit?: boolean, ignoreInvulnerability?: boolean): void
    isInvulnerable(): boolean
    instakill(): void
    getSlippingSpeed(): number
}


export class GenericEnemy implements IGenericEnemy {
    x = 0;
    y = 0;
    vx = 0;
    vy = 0;
    slipperiness = 0;
    health = 1;
    baseSpeed = 3;
    aliveFor = 0;
    maxHealth = 1;
    hurtboxSize = 0;
    iframesMs = 0;
    markedForDeletion = false;
    hurtsPlayerOnCollision = true;
    isCritVulnerable = false;

    sprite = new PIXI.Sprite();
    behaviors = [] as TAnyBehaviorEntry[];

    constructor(params: IEnemyConstructorParams) {
        this.x = params.x ?? Math.random() * ROOM_SIZE;
        this.y = params.y ?? Math.random() * ROOM_SIZE;
        this.vx = params.vx ?? 0;
        this.vy = params.vy ?? 0;
        this.slipperiness = params.slipperiness ?? 0;
        this.health = params.health ?? params.maxHealth ?? 1;
        this.maxHealth = params.maxHealth ?? 1;
        this.baseSpeed = params.baseSpeed ?? 3;
        this.hurtsPlayerOnCollision = params.hurtsPlayerOnCollision ?? true;
        this.isCritVulnerable = params.isCritVulnerable ?? false;
        this.aliveFor = 0;
        this.sprite = new PIXI.Sprite(params.texture ?? PIXI.Assets.get("enemy-placeholder"))
        this.hurtboxSize = params.hurtboxSize ?? this.sprite.width;

        this.sprite.anchor.set(0.5)
        this.sprite.x = this.x
        this.sprite.y = this.y

        this.behaviors = params.behaviors ?? []

        console.log("created enemy")
    }

    isInvulnerable() {
        return this.iframesMs > 0
    }

    getSlippingSpeed() {
        return Math.sqrt(this.vx * this.vx + this.vy * this.vy) * this.slipperiness
    }

    damage(baseAmount = 1, crit = false, ignoreInvulnerability = false) {
        if (this.isInvulnerable() && !ignoreInvulnerability) return
        if (!crit && this.isCritVulnerable) {
            crit = true
        }

        if(crit) {
            baseAmount *= 2
        }
        this.health -= baseAmount

        ParticleHandler.spawnDamageNumber(this.x, this.y, baseAmount, crit)

        this._playHitEffects(baseAmount, crit)
    }

    _playHitEffects(amount = 1, wasCrit = false) {
        if (this.health <= 0) {
            /* die */
            if (Math.random() < 0.5)
                SFX.play("enemyDie1", { volume: 0.4, speed: Math.random() * 0.5 + 0.75 })
            else
                SFX.play("enemyDie2", { volume: 0.4, speed: Math.random() * 0.5 + 0.75 })

            this.markedForDeletion = true
            ParticleHandler.spawnParticleExplosion(this.x, this.y, 5, Math.min(50, this.maxHealth * 5) + 5, 0.8)
            ParticleHandler.spawnCircleExplosion(this.x, this.y, 100, this.sprite.width / 2, 1500)
        }
        else {
            /* normal damage particles */
            ParticleHandler.spawnParticleExplosion(this.x, this.y, undefined, Math.min(15, amount * 2 + 2), 0.4, undefined, 300)

            if (wasCrit) {
                SFX.play("enemyDie2", { volume: 0.4, speed: Math.random() * 1 + 1.5 })
            }
            else {
                SFX.play("enemyHit", { volume: 0.2, speed: Math.random() * 1 + 1 })
            }
        }
    }

    instakill() {
        this.damage(this.health)
    }

    _update(ticker: PIXI.Ticker) {
        if (!this.sprite || this.markedForDeletion) return

        /* upd iframes */
        if (this.iframesMs > 0) {
            this.iframesMs -= ticker.deltaMS
        }

        /* update alivetime */
        this.aliveFor += ticker.deltaMS


        /* update speed */
        this.vx *= this.slipperiness
        this.vy *= this.slipperiness

        const posWithSpeed = { x: this.x + this.vx, y: this.y + this.vy }

        /* clamp pos to bounds */
        const clampedPos = getSpritePosClampedToBounds(posWithSpeed, this.sprite.width)
        this.x = clampedPos.x
        this.y = clampedPos.y

        /* get render pos */
        const renderPos = RoomSprite.getRenderPosition(posWithSpeed.x, posWithSpeed.y)
        this.sprite.x = renderPos.x
        this.sprite.y = renderPos.y

        /* run all behavior */
        for (const { behavior, config } of this.behaviors) {
            behavior(this, ticker, config)
        }

        /* nudge away if clipping another enemy */
        EnemyHandler.enemies.forEach(e => {
            if (e == this || e.markedForDeletion || !e.sprite) return
            const dx = e.x - this.x
            const dy = e.y - this.y
            const dstSq = dx * dx + dy * dy

            const minDist = (this.hurtboxSize + e.hurtboxSize) / 2 * 0.8 /* added leniency */

            if (dstSq > 0 && dstSq < minDist ** 2) {
                const dist = Math.sqrt(dstSq)
                const overlap = (minDist - dist) * 0.5
                const distInverse = 1 / dist

                this.x -= dx * distInverse * overlap
                this.y -= dy * distInverse * overlap
            }


        })

        /* run collision checks against player */
        if (this.hurtsPlayerOnCollision && !this.markedForDeletion) {
            const leniency = 0.7
            const player = Player
            const dx = player.x - this.x
            const dy = player.y - this.y
            const dstSq = dx * dx + dy * dy
            const minDist = (this.hurtboxSize + player.SPRITE_SIZE) / 2 * leniency

            if (dstSq > 0 && dstSq < minDist * minDist) {
                player.damage(1)
            }
        }
    }
}
