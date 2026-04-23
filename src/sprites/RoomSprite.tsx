import { Application, Container, Graphics } from "pixi.js"

let container: Container | null = null

const BANNER_SIZE = 100
const ROOM_SIZE = window.innerHeight - BANNER_SIZE * 2

console.log(ROOM_SIZE)
export const RoomSprite = {
    BANNER_SIZE,
    ROOM_SIZE,

    ROOM_BOUNDS: {
        top: BANNER_SIZE,
        bottom: window.innerHeight - BANNER_SIZE,
        left: window.innerWidth / 2 - ROOM_SIZE / 2,
        right: window.innerWidth / 2 + ROOM_SIZE / 2,
    },

    init(app: Application) {
        container = new Container()

        container.x = this.ROOM_BOUNDS.left
        container.y = this.ROOM_BOUNDS.top

        const border = new Graphics()
        border.rect(0, 0, ROOM_SIZE, ROOM_SIZE)
        border.stroke({ width: 2, color: 0xaaaaaa })

        const BORDER2_OFFSET = 20

        const border2 = new Graphics()
        border2.rect(-BORDER2_OFFSET / 2, -BORDER2_OFFSET / 2, ROOM_SIZE + BORDER2_OFFSET, ROOM_SIZE + BORDER2_OFFSET)
        border2.stroke({ width: 3, color: 0xdddddd })

        container.addChild(border)
        container.addChild(border2)

        app.stage.addChild(container)
    },
}