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

type TEnemyType = keyof typeof _TYPES

export const ENEMY_TYPES: Record<TEnemyType, () => ILevelInputGenericEnemy> = {
    [_TYPES.BASIC_SHOOTER]: () => {
        const followDist = Math.random() * 50 + 150
        return {
            texture: Assets.get("basic-shooter"),
            standardPrice: 25,
            health: 5,
            baseSpeed: Math.random() * 0.2 + 1.7,
            behaviors: [
                GET_ENEMY_BEHAVIOR.shootPeriodicallyBehavior(1300, 3),
                GET_ENEMY_BEHAVIOR.followPlayerBehavior(followDist),
            ]
        }
    },
    [_TYPES.TURRET_FAST]: () => {
        return {
            texture: Assets.get("turret"),
            standardPrice: 35,
            health: 1,
            behaviors: [
                GET_ENEMY_BEHAVIOR.shootPeriodicallyBehavior(250, 3.5),
            ]
        }
    },
    [_TYPES.SNIPER]: () => {
        const followDist = Math.random() * 50 + 400

        return {
            texture: Assets.get("sniper"),
            standardPrice: 50,
            health: 3,
            baseSpeed: 0.5,
            behaviors: [
                GET_ENEMY_BEHAVIOR.shootPeriodicallyBehavior(4500, 15),
                GET_ENEMY_BEHAVIOR.followPlayerBehavior(followDist),
            ]
        }
    },
    [_TYPES.CIRCLE_TURRET]: () => {
        return {
            texture: Assets.get("circle-turret"),
            standardPrice: 40,
            health: 4,
            behaviors: [
                GET_ENEMY_BEHAVIOR.shootBurstTowardPlayer(3000, 3, 360, 16, 0.98),
            ]
        }
    },
    [_TYPES.SHOTGUN]: () => {
        const followDist = Math.random() * 50 + 150
        return {
            texture: Assets.get("shotgun"),
            standardPrice: 75,
            health: 6,
            baseSpeed: Math.random() * 0.5 + 1.1,
            behaviors: [
                GET_ENEMY_BEHAVIOR.shootBurstTowardPlayer(2700, 4, 45, 5),
                GET_ENEMY_BEHAVIOR.followPlayerBehavior(followDist, true),
            ]
        }
    },
    [_TYPES.KAMIKAZE]: () => {
        return {
            texture: Assets.get("kamikaze"),
            standardPrice: 9999999,
            health: 1,
            baseSpeed: 1.5,
            behaviors: [
                GET_ENEMY_BEHAVIOR.kamikazeBehavior()
            ]
        }
    },
    [_TYPES.DASH]: () => {
        return {
            texture: Assets.get("dash"),
            standardPrice: 60,
            health: 6,
            baseSpeed: 0,
            behaviors: [
                GET_ENEMY_BEHAVIOR.dashBehavior(undefined, 16)
            ]
        }
    }
}
