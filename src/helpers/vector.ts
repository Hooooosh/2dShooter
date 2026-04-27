import { Vector2 } from "../interfaces/genericInterfaces";

export function normalizeVector(vector: Vector2) {
    const length = Math.sqrt(vector.x * vector.x + vector.y * vector.y)
    if (length === 0) return { x: 0, y: 0 }
    return { x: vector.x / length, y: vector.y / length }
}

export function dotProduct(a: Vector2, b: Vector2): number {
    return a.x * b.x + a.y * b.y
}

export function addVectors(v1: Vector2, v2: Vector2): Vector2 {
    return { x: v1.x + v2.x, y: v1.y + v2.y }
}

export function subtractVectors(v1: Vector2, v2: Vector2): Vector2 {
    return { x: v1.x - v2.x, y: v1.y - v2.y }
}

export function scaleVector(v: Vector2, scalar: number): Vector2 {
    return { x: v.x * scalar, y: v.y * scalar }
}

export function wrapAngle(angle: number): number {
    const tpi = Math.PI * 2
    return ((angle % tpi) + tpi) % tpi
}

export function angleDiff(a: number, b: number): number {
    const tpi = Math.PI * 2
    const diff = wrapAngle(b) - wrapAngle(a)
    if (diff > Math.PI) return diff - tpi
    if (diff < -Math.PI) return diff + tpi
    return diff
}
