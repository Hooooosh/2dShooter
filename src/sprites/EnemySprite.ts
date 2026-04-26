import * as PIXI from "pixi.js"
import { TAnyBehaviorEntry } from "../const/enemyBehaviors";
import getSpritePosClampedToBounds from "../helpers/getSpritePosClampedToBounds";
import { RoomSprite } from "./RoomSprite";
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

export interface IGenericEnemy {
    x: number
    y: number
    health: number
    baseSpeed: number
    maxHealth: number
    aliveFor: number
    hurtboxSize: number
    markedForDeletion: boolean
    hurtsPlayerOnCollision?: boolean

    sprite: PIXI.Sprite | undefined
    behaviors: TAnyBehaviorEntry[]
    _update(ticker: PIXI.Ticker): void
    damage(amount?: number, wasCrit?: boolean): void
    isInvulnerable(): boolean
    instakill(): void
}

export class GenericEnemy implements IGenericEnemy {
    x = 0;
    y = 0;
    health = 1;
    baseSpeed = 3;
    aliveFor = 0;
    maxHealth = 1;
    hurtboxSize = 0;
    currentIframesMs = 0;
    markedForDeletion = false;
    hurtsPlayerOnCollision = true;

    sprite = new PIXI.Sprite();
    behaviors = [] as TAnyBehaviorEntry[];

    constructor(x: number, y: number, health?: number, texture?: PIXI.Texture, behaviors?: TAnyBehaviorEntry[], baseSpeed?: number, hurtsPlayerOnCollision?: boolean, maxHealth?: number, hurtboxSize?: number) {
        this.x = x;
        this.y = y;
        this.health = health ?? maxHealth ?? 1;
        this.maxHealth = maxHealth ?? 1;
        this.baseSpeed = baseSpeed ?? 3;
        this.hurtsPlayerOnCollision = hurtsPlayerOnCollision ?? true;
        this.aliveFor = 0;
        this.sprite = new PIXI.Sprite(texture ?? PIXI.Assets.get("enemy-placeholder"))
        this.hurtboxSize = hurtboxSize ?? this.sprite.width;

        this.sprite.anchor.set(0.5)
        this.sprite.x = x
        this.sprite.y = y

        this.behaviors = behaviors ?? []

        console.log("created enemy")
    }

    isInvulnerable() {
        return this.currentIframesMs > 0
    }

    damage(amount = 1, wasCrit = false) {
        if (this.isInvulnerable()) return

        this.health -= amount

        ParticleHandler.spawnDamageNumber(this.x, this.y, amount, wasCrit)

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

        /* update alivetime */
        this.aliveFor += ticker.deltaMS

        const pos = { x: this.x, y: this.y }

        /* clamp pos to bounds */
        const clampedPos = getSpritePosClampedToBounds(pos, this.sprite.width)
        this.x = clampedPos.x
        this.y = clampedPos.y

        /* get render pos */
        const renderPos = RoomSprite.getRenderPosition(pos.x, pos.y)
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
