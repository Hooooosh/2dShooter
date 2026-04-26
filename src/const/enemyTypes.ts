import { Assets } from "pixi.js"
import { GET_ENEMY_BEHAVIOR } from "./enemyBehaviors"
import { ILevelInputGenericEnemy } from "../handlers/GameLoopHandler"


const _TYPES = {
    BASIC_SHOOTER: "BASIC_SHOOTER",
    TURRET_FAST: "TURRET_FAST",
    SNIPER: "SNIPER",
    CIRCLE_TURRET: "CIRCLE_TURRET",
    SHOTGUN: "SHOTGUN", 
    KAMIKAZE: "KAMIKAZE",
    DASH: "DASH",
} as const

await Assets.load([
    {
        alias: "basic-shooter",
        src: `${import.meta.env.BASE_URL}assets/enemy-basic-shooter.png`
    },
    {
        alias: "turret",
        src: `${import.meta.env.BASE_URL}assets/enemy-turret.png`
    },
    {
        alias: "sniper",
        src: `${import.meta.env.BASE_URL}assets/enemy-sniper.png`
    },
    {
        alias: "circle-turret",
        src: `${import.meta.env.BASE_URL}assets/enemy-circle-turret.png`
    },
    {
        alias: "shotgun",
        src: "${import.meta.env.BASE_URL}assets/enemy-shotgun.png"
    },
    {
        alias: "dash",
        src: "${import.meta.env.BASE_URL}assets/enemy-dash.png"
    }
])

export type TEnemyType = keyof typeof _TYPES

/* behaviors in order of overwriting data eg rotation */

export const ENEMY_TYPES: Record<TEnemyType, () => ILevelInputGenericEnemy> = {
    [_TYPES.BASIC_SHOOTER]: () => {
        const followDist = Math.random() * 50 + 150
        return {
            texture: Assets.get("basic-shooter"),
            standardPrice: 20,
            health: 3,
            baseSpeed: Math.random() * 0.5 + 1.7,
            behaviors: [
                GET_ENEMY_BEHAVIOR.shootPeriodicallyBehavior(1300, 3),
                GET_ENEMY_BEHAVIOR.followPlayerBehavior(followDist),
                GET_ENEMY_BEHAVIOR.lookAtPlayerBehavior(),
            ]
        }
    },
    [_TYPES.TURRET_FAST]: () => {
        return {
            texture: Assets.get("turret"),
            standardPrice: 45,
            health: 1,
            behaviors: [
                GET_ENEMY_BEHAVIOR.shootPeriodicallyBehavior(350, 2.5),
                GET_ENEMY_BEHAVIOR.lookAtPlayerBehavior(),
            ],
            hurtsPlayerOnCollision: false,
        }
    },
    [_TYPES.SNIPER]: () => {
        const followDist = Math.random() * 50 + 400

        return {
            texture: Assets.get("sniper"),
            standardPrice: 50,
            health: 2,
            baseSpeed: 0.75,
            behaviors: [
                GET_ENEMY_BEHAVIOR.shootPeriodicallyBehavior(4500, 15),
                GET_ENEMY_BEHAVIOR.followPlayerBehavior(followDist),
                GET_ENEMY_BEHAVIOR.lookAtPlayerBehavior(),
            ]
        }
    },
    [_TYPES.CIRCLE_TURRET]: () => {
        return {
            texture: Assets.get("circle-turret"),
            standardPrice: 40,
            health: 3,
            behaviors: [
                GET_ENEMY_BEHAVIOR.shootBurstTowardPlayer(3000, 3, 360, 16, 0.98),
            ],
            hurtsPlayerOnCollision: false,
        }
    },
    [_TYPES.SHOTGUN]: () => {
        const followDist = Math.random() * 50 + 150
        return {
            texture: Assets.get("shotgun"),
            standardPrice: 75,
            health: 5,
            baseSpeed: 1.7,
            behaviors: [
                GET_ENEMY_BEHAVIOR.shootBurstTowardPlayer(2700, 4, 45, 5),
                GET_ENEMY_BEHAVIOR.followPlayerBehavior(followDist, true),
                GET_ENEMY_BEHAVIOR.lookAtPlayerBehavior(),
            ]
        }
    },
    [_TYPES.KAMIKAZE]: () => {
        return {
            texture: Assets.get("kamikaze"),
            standardPrice: 999999999,
            health: 1,
            baseSpeed: 1.5,
            behaviors: [
            ]
        }
    },
    [_TYPES.DASH]: () => {
        const enemy = {
            texture: Assets.get("dash"),
            standardPrice: 60,
            health: 3,
            baseSpeed: 0,
            behaviors: [
                GET_ENEMY_BEHAVIOR.lookAtPlayerBehavior(1),
                GET_ENEMY_BEHAVIOR.dashBehavior(undefined, 20),
            ]
        }
        return enemy
    }
}
