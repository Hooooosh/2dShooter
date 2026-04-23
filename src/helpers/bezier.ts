import { Vector2 } from "../interfaces/genericInterfaces"

export default function cubicBezierEase(
    t: number,
    p1x: number, p1y: number,
    p2x: number, p2y: number,
    iterations = 5
) {
    // solve x(t) ≈ t using Newton-Raphson
    let x = t

    for (let i = 0; i < iterations; i++) {
        const { x: cx, y: cy } = cubicBezier(
            { x: 0, y: 0 },
            { x: p1x, y: p1y },
            { x: p2x, y: p2y },
            { x: 1, y: 1 },
            x
        )

        const dx = cx - t
        if (Math.abs(dx) < 0.001) break

        x -= dx
    }

    return cubicBezier(
        { x: 0, y: 0 },
        { x: p1x, y: p1y },
        { x: p2x, y: p2y },
        { x: 1, y: 1 },
        x
    ).y
}

function cubicBezier(p0: Vector2, p1: Vector2, p2: Vector2, p3: Vector2, t: number) {
    const cX = 3 * (p1.x - p0.x)
    const bX = 3 * (p2.x - p1.x) - cX
    const aX = p3.x - p0.x - cX - bX

    const cY = 3 * (p1.y - p0.y)
    const bY = 3 * (p2.y - p1.y) - cY
    const aY = p3.y - p0.y - cY - bY

    const x = ((aX * t + bX) * t + cX) * t
    const y = ((aY * t + bY) * t + cY) * t

    return { x, y }
}