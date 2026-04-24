import { Vector2 } from "../interfaces/genericInterfaces";

export function Distance(a: Vector2, b: Vector2): number {
    return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2)
}

export function FastIsPointInCircle(point: Vector2, circleCenter: Vector2, circleRadius: number): boolean {
    const dx = point.x - circleCenter.x
    const dy = point.y - circleCenter.y
    return dx * dx + dy * dy <= circleRadius * circleRadius
}