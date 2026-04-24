import { Vector2 } from "../interfaces/genericInterfaces"
import { RoomSprite } from "../sprites/RoomSprite"

export default function getSpritePosClampedToBounds(pos: Vector2, spriteSize?: number) {
    if (!spriteSize) spriteSize = 0

    if (pos.x - spriteSize / 2 < 0)
        pos.x = 0 + spriteSize / 2

    if (pos.x + spriteSize / 2 > RoomSprite.ROOM_SIZE)
        pos.x = RoomSprite.ROOM_SIZE - spriteSize / 2

    if (pos.y - spriteSize / 2 < 0)
        pos.y = 0 + spriteSize / 2

    if (pos.y + spriteSize / 2 > RoomSprite.ROOM_SIZE)
        pos.y = RoomSprite.ROOM_SIZE - spriteSize / 2

    return pos
}