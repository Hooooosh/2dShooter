import { Vector2 } from "../interfaces/genericInterfaces";

const sqrt2per2 = Math.sqrt(2) / 2;

interface MovementRule {
    keys: string[],
    velocity: Vector2,
}

export const ALL_MOVEMENT_KEYS = ["KeyW", "KeyA", "KeyS", "KeyD"]

export const KEYBOARD_MOVEMENT_RULES: MovementRule[] = [
    {
        keys: ["KeyW"],
        velocity: { x: 0, y: -1 },
    },
    {
        keys: ["KeyA"],
        velocity: { x: -1, y: 0 },
    },
    {
        keys: ["KeyS"],
        velocity: { x: 0, y: 1 },
    },
    {
        keys: ["KeyD"],
        velocity: { x: 1, y: 0 },
    },
    {
        keys: ["KeyW", "KeyA"],
        velocity: { x: -sqrt2per2, y: -sqrt2per2 },
    },
    {
        keys: ["KeyW", "KeyD"],
        velocity: { x: sqrt2per2, y: -sqrt2per2 },
    },
    {
        keys: ["KeyS", "KeyA"],
        velocity: { x: -sqrt2per2, y: sqrt2per2 },
    },
    {
        keys: ["KeyS", "KeyD"],
        velocity: { x: sqrt2per2, y: sqrt2per2 },
    },
    {
        keys: ["KeyW", "KeyA", "KeyD"],
        velocity: { x: 0, y: -1 },
    },
    {
        keys: ["KeyS", "KeyA", "KeyD"],
        velocity: { x: 0, y: 1 },
    },
    {
        keys: ["KeyW", "KeyS", "KeyA"],
        velocity: { x: -1, y: 0 },
    },
    {
        keys: ["KeyW", "KeyS", "KeyD"],
        velocity: { x: 1, y: 0 },
    },
    {
        keys: ["KeyW", "KeyS", "KeyA", "KeyD"],
        velocity: { x: 0, y: 0 },
    }
]
