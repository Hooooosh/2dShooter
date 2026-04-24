import * as PIXI from "pixi.js"
import { TAnyBehaviorEntry } from "../const/enemyBehaviors";
import getSpritePosClampedToBounds from "../helpers/getSpritePosClampedToBounds";
import { RoomSprite } from "./RoomSprite";

await PIXI.Assets.load([
    {
        alias: "enemy-placeholder",
        src: "/assets/enemy-placeholder.png"
    }
])


export interface IGenericEnemy {
    x: number
    y: number
    health: number
    maxHealth: number
    hurtboxSize: number
    markedForDeletion: boolean

    sprite: PIXI.Sprite | undefined
    behaviors: TAnyBehaviorEntry[]
    update(ticker: PIXI.Ticker): void
    damage(amount?: number): void
    isInvulnerable(): boolean
}

export class GenericEnemy implements IGenericEnemy {
    x = 0;
    y = 0;
    health = 1;
    maxHealth = 1;
    hurtboxSize = 0;
    currentIframesMs = 0;
    markedForDeletion = false;

    sprite = new PIXI.Sprite();
    behaviors = [] as TAnyBehaviorEntry[];

    constructor(x: number, y: number, maxHealth?: number, health?: number, texture?: PIXI.Texture, behaviors?: TAnyBehaviorEntry[], hurtboxSize?: number) {
        this.x = x;
        this.y = y;
        this.health = health ?? maxHealth ?? 1;
        this.maxHealth = maxHealth ?? 1;
        this.hurtboxSize = hurtboxSize ?? this.sprite.width;
        this.sprite = new PIXI.Sprite(texture ?? PIXI.Assets.get("enemy-placeholder"))

        this.sprite.anchor.set(0.5)
        this.sprite.x = x
        this.sprite.y = y

        this.behaviors = behaviors ?? []
    }

    isInvulnerable() {
        return this.currentIframesMs > 0
    }

    damage(amount?: number) {
        if (this.isInvulnerable()) return
        this.health -= amount ?? 1
        this.sprite.alpha = this.health / 3

        if(this.health <= 0) {
            this.markedForDeletion = true
        }
    }

    update(ticker: PIXI.Ticker) {
        if (!this.sprite || this.markedForDeletion) return


        const pos = { x: this.x, y: this.y }

        /* clamp pos to bounds */
        const clampedPos = getSpritePosClampedToBounds(pos, this.sprite.width)
        this.x = clampedPos.x
        this.y = clampedPos.y

        /* get render pos */
        const renderPos = RoomSprite.getRenderPosition(pos.x, pos.y)

        this.sprite.x = renderPos.x
        this.sprite.y = renderPos.y
        for (const { behavior, config } of this.behaviors) {
            behavior(this, ticker, config)
        }
    };
}
