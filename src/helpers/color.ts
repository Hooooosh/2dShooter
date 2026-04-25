
export function getInvertedColor(hex: number): number {
    const a = hex & 0xFF000000
    const rgb = hex & 0xFFFFFF
    return a | (rgb ^ 0xFFFFFF)
}
