import { Vector2 } from "../interfaces/genericInterfaces";

export function normalizeVector(vector: Vector2) {
    const length = Math.sqrt(vector.x * vector.x + vector.y * vector.y)
    if (length === 0) return { x: 0, y: 0 }
    return { x: vector.x / length, y: vector.y / length }
}
