
export function msToFrames(ms: number) {
    return Math.round(ms / (1000 / 60))
}

export function dtToMs(dt: number) {
    return dt * (1000 / 60)
}

export function msToDt(ms: number) {
    return ms / (1000 / 60)
}
