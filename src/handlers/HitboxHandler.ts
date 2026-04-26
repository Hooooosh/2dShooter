import { FastIsPointInCircle } from "../helpers/dist";
import { EnemyHandler } from "./EnemyHandler";
import { IGenericEnemy } from "../sprites/EnemySprite"
import { Player } from "../sprites/PlayerSprite";

export interface IHitbox {
    xCenter: number,
    yCenter: number,
    width: number,
    height: number,
    rot?: number,
}

export interface IHitcircle {
    xCenter: number,
    yCenter: number,
    r: number
}

export function RollCrit() {
    return Math.random() < Player.critChance
}

export const HitboxHandler = {
    runHitboxAgainstEnemies(hitbox: IHitbox, damage = 1) {
        if (!EnemyHandler.enemies) return;
        
        for (let i = 0; i < EnemyHandler.enemies.length; i++) {
            const e = EnemyHandler.enemies[i]
            if (!e.sprite) continue

            const isRelativelyClose = FastIsPointInCircle(
                { x: e.x, y: e.y },
                { x: hitbox.xCenter, y: hitbox.yCenter },
                Math.max(hitbox.width, hitbox.height) * 0.75
            )

            if (isRelativelyClose) {
                const isHit = HitboxHandler._runHitboxAgainstSpecificEnemy(e, hitbox)

                if (isHit) {
                    const isCrit = RollCrit()
                    if(isCrit) damage *= 2
                    e.damage(damage, isCrit)
                }
            }
        }
    },

    _runHitboxAgainstSpecificEnemy(enemy: IGenericEnemy, hitbox: IHitbox): boolean {
        if (!enemy.sprite) return false

        const dx = enemy.x - hitbox.xCenter
        const dy = enemy.y - hitbox.yCenter

        // 2. rotate into rectangle's local space (inverse rotation)
        const cos = Math.cos(-(hitbox.rot ?? 0))
        const sin = Math.sin(-(hitbox.rot ?? 0))

        const enemyRad = enemy.hurtboxSize

        const localX = dx * cos - dy * sin
        const localY = dx * sin + dy * cos

        // 3. clamp to rectangle bounds
        const closestX = Math.max(-hitbox.width /* / 2 */, Math.min(localX, hitbox.width /* / 2 */))
        const closestY = Math.max(-hitbox.height /* / 2 */, Math.min(localY, hitbox.height /* / 2 */))

        // 4. distance from circle center to closest point
        const distX = localX - closestX
        const distY = localY - closestY

        return (distX * distX + distY * distY) <= (enemyRad * enemyRad)
    }
}
