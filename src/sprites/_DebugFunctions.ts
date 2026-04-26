import { ENEMY_BEHAVIORS, TFollowPlayerConfig, TShootPeriodicallyConfig, TAnyBehaviorEntry } from "../const/enemyBehaviors"
import { BulletHandler } from "../handlers/BulletHandler"
import { EnemyHandler } from "../handlers/EnemyHandler"
import { Player } from "./PlayerSprite"
import { RoomSprite } from "./RoomSprite"



export const _DebugFunctions = {
    _init() {
        /* setup key listeners */

        window.addEventListener("keydown", (e) => {
            if (e.repeat) return

            switch (e.code) {
                /* DMG PLAYER */
                case "KeyH":
                    Player.damage(1)
                    break;

                /* HEAL PLAYER */
                case "KeyJ":
                    Player.healTo(Player.MAX_HEALTH)
                    break;

                /* KILL ALL */
                case "Backquote":
                    EnemyHandler.enemies.forEach(e => e.instakill())
                    break;

                /* TEST BULLETS */
                case "KeyQ":
                    for (let i = 0; i < 20; i++) {
                        BulletHandler.spawnBullet(50 + i * 20, 50, 0, i * 2, 4000)
                    }
                    break;

                /* SUMMON 1HP DUMMIES */
                case "Digit1":
                    this._summonDummies()
                    break;

                /* SUMMON UNKILLABLE DUMMIES */
                case "Digit2":
                    this._summonDummies(true)
                    break;

                /* SUMMON 1 SHOOTING FOLLOWING ENEMY */
                case "Digit3":
                    this._summonShootingEnemy()
                    break;

                /* SUMMON 15 */
                case "Digit4":
                    for (let i = 0; i < 15; i++) {
                        this._summonShootingEnemy()
                    }
                    break;

                default:
                    break;
            }
        })
    },

    _summonShootingEnemy() {
        EnemyHandler.spawnEnemy(
            Math.random() * RoomSprite.ROOM_SIZE,
            Math.random() * RoomSprite.ROOM_SIZE,
            3,
            undefined,
            [
                { behavior: ENEMY_BEHAVIORS.followPlayerBehavior, config: { keepDistance: 200 } as TFollowPlayerConfig },
                { behavior: ENEMY_BEHAVIORS.shootPeriodicallyBehavior, config: { shootInterval: 2500 } as TShootPeriodicallyConfig },
            ] as TAnyBehaviorEntry[],
        )
    },

    _summonDummies(invincible = false) {
        function spawn(x: number, y: number) {
            EnemyHandler.spawnEnemy(x, y, invincible ? 9999999 : 1)
        }

        /* evenly across room x */
        /* bottom 1 */
        spawn(RoomSprite.ROOM_SIZE / 2, RoomSprite.ROOM_SIZE * (3 / 4))

        const MID_AMT = 4
        for (let i = 1; i <= MID_AMT; i++) {
            spawn(RoomSprite.ROOM_SIZE / (MID_AMT + 1) * i, RoomSprite.ROOM_SIZE * (2 / 4))
        }

        const BOT_AMT = 4
        const GAP = 30
        for (let i = 0; i < BOT_AMT; i++) {
            spawn(RoomSprite.ROOM_SIZE / 2 - GAP * (BOT_AMT - 1) / 2 + i * GAP, RoomSprite.ROOM_SIZE * (1 / 4))
        }
    }
}