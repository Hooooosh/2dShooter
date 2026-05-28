import { ENEMY_TYPES, TEnemyType } from "../const/enemyTypes"
import { BulletHandler } from "../handlers/BulletHandler"
import { EnemyHandler } from "../handlers/EnemyHandler"
import { Player } from "./PlayerSprite"
import { ROOM_SIZE } from "./RoomSprite"



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
                        BulletHandler.spawnBullet({ x: 50 + i * 20, y: 50, angle: 0, speed: i * 2, maxLife: 4000 })
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

                default:
                    break;
            }

            /* debug spawn nth enemy */
            if (e.code.includes("Numpad")) {
                const num = parseInt(e.code.slice(-1))
                if (num >= Object.keys(ENEMY_TYPES).length) return
                const enemy = ENEMY_TYPES[Object.keys(ENEMY_TYPES)[num] as TEnemyType]()
                EnemyHandler.spawnEnemy(enemy)
            }
        })
    },

    _summonDummies(invincible = false) {
        function spawn(x: number, y: number) {
            const enemy = ENEMY_TYPES.DUMMY()
            enemy.x = x
            enemy.y = y
            enemy.health = invincible ? 99999 : 1
            EnemyHandler.spawnEnemy(enemy)
        }

        /* evenly across room x */
        /* bottom 1 */
        spawn(ROOM_SIZE / 2, ROOM_SIZE * (3 / 4))

        const MID_AMT = 4
        for (let i = 1; i <= MID_AMT; i++) {
            spawn(ROOM_SIZE / (MID_AMT + 1) * i, ROOM_SIZE * (2 / 4))
        }

        const BOT_AMT = 4
        const GAP = 30
        for (let i = 0; i < BOT_AMT; i++) {
            spawn(ROOM_SIZE / 2 - GAP * (BOT_AMT - 1) / 2 + i * GAP, ROOM_SIZE * (1 / 4))
        }
    }
}