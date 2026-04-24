import { IGenericEnemy } from "../sprites/EnemySprite";
import { Player } from "../sprites/PlayerSprite";

export type TEnemyBehavior<TBehaviorConfig> = (
    enemy: IGenericEnemy,
    dt: number,
    config: TBehaviorConfig
) => void

export type TAnyBehaviorEntry = TBehaviorEntry<unknown>

export type TBehaviorEntry<TBehaviorConfig> = {
    behavior: TEnemyBehavior<TBehaviorConfig>,
    config?: TBehaviorConfig
}

export type TFollowConfig = {
    keepDistance: number,
    speed: number,
}

type TEnemyBehaviors = 
    "followPlayerBehavior"


export const ENEMY_BEHAVIORS: Record<TEnemyBehaviors, TEnemyBehavior<TFollowConfig>> = {
    followPlayerBehavior: (enemy, dt, config) => {
        if (!Player.getSprite() || !enemy.sprite) return

        const playerPos = {
            x: Player.x,
            y: Player.y,
        }

        const dx = playerPos.x - enemy.x
        const dy = playerPos.y - enemy.y

        const dstToPlayerSq = dx * dx + dy * dy
        const angleToPlayer = Math.atan2(dy, dx)
        const stepSize = config.speed * dt
        const keepDistance = config.keepDistance ?? 0

        /* if enemy too far */
        if (dstToPlayerSq > (keepDistance + stepSize) ** 2) {
            enemy.x += Math.cos(angleToPlayer) * stepSize
            enemy.y += Math.sin(angleToPlayer) * stepSize
        }
        /* if enemy too close */
        else if (dstToPlayerSq < (keepDistance - stepSize) ** 2) {
            enemy.x -= Math.cos(angleToPlayer) * stepSize
            enemy.y -= Math.sin(angleToPlayer) * stepSize
        }
        /* if enemy close enough to snap to dst */
        else {
            enemy.x += Math.cos(angleToPlayer)
            enemy.y += Math.sin(angleToPlayer)
        }

        /* if close enough to snap to radius around player */
    }
}
