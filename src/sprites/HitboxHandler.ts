import { FastIsPointInCircle } from "../helpers/dist";
import { EnemyHandler } from "./EnemyHandler";
import { IGenericEnemy } from "./EnemySprite"

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

export const HitboxHandler = {
    runHitboxAgainstEnemies(hitbox: IHitbox) {
        if (!EnemyHandler.enemies) return;

        for (let i = 0; i < EnemyHandler.enemies.length; i++) {
            if (!EnemyHandler.enemies[i].sprite) continue

            const isRelativelyClose = FastIsPointInCircle(
                { x: EnemyHandler.enemies[i].x, y: EnemyHandler.enemies[i].y },
                { x: hitbox.xCenter, y: hitbox.yCenter },
                Math.max(hitbox.width, hitbox.height) * 0.75
            )

            if (isRelativelyClose) {
                const isHit = HitboxHandler._runHitboxAgainstSpecificEnemy(EnemyHandler.enemies[i], hitbox)

                if (isHit) {
                    EnemyHandler.enemies[i].damage()
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
