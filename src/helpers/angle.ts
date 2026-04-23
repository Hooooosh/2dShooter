export function radToDeg(rad: number) {
    return rad * 180 / Math.PI
}

export function degToRad(deg: number) {
    return deg * Math.PI / 180
}

export const signedAngleDelta = (from: number, to: number) => Math.atan2(Math.sin(to - from), Math.cos(to - from))
