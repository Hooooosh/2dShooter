import { Application, Container, Graphics } from "pixi.js"
import { DRAW_ORDERS } from "../const/drawOrders"
import { Distance } from "../helpers/dist"
import { Player } from "./PlayerSprite"
import { EventHandler, GLOBAL_EVENTS } from "../helpers/eventHandler"

let roomContainer: Container | null = null
let doorContainer: Container | null = null

const BANNER_SIZE = 100
const ROOM_SIZE = window.innerHeight - BANNER_SIZE * 2
const DOOR_WIDTH = 80
const DOOR_HEIGHT = 40

export const RoomSprite = {
    BANNER_SIZE,
    ROOM_SIZE,
    ROOM_BOUNDS: {
        top: BANNER_SIZE,
        bottom: window.innerHeight - BANNER_SIZE,
        left: window.innerWidth / 2 - ROOM_SIZE / 2,
        right: window.innerWidth / 2 + ROOM_SIZE / 2,
    },
    displayedDoorCount: 0,

    getRenderPosition(x: number, y: number) {
        return { x: x + RoomSprite.ROOM_BOUNDS.left, y: y + RoomSprite.ROOM_BOUNDS.top }
    },

    _init(app: Application) {
        roomContainer = new Container()
        doorContainer = new Container()

        roomContainer.x = this.ROOM_BOUNDS.left
        roomContainer.y = this.ROOM_BOUNDS.top

        doorContainer.x = this.ROOM_BOUNDS.left
        doorContainer.y = this.ROOM_BOUNDS.top

        roomContainer.zIndex = DRAW_ORDERS.ROOM
        doorContainer.zIndex = DRAW_ORDERS.DOORS

        const border = new Graphics()
        border.rect(0, 0, ROOM_SIZE, ROOM_SIZE)
        border.stroke({ width: 2, color: 0xaaaaaa })

        const BORDER2_OFFSET = 20

        const border2 = new Graphics()
        border2.rect(-BORDER2_OFFSET / 2, -BORDER2_OFFSET / 2, ROOM_SIZE + BORDER2_OFFSET, ROOM_SIZE + BORDER2_OFFSET)
        border2.stroke({ width: 3, color: 0xdddddd })

        roomContainer.addChild(border)
        roomContainer.addChild(border2)

        app.stage.addChild(roomContainer)
        app.stage.addChild(doorContainer)
        EventHandler.on(GLOBAL_EVENTS.STAGE_CLEAR, RoomSprite._createDoors)
        EventHandler.on(GLOBAL_EVENTS.DOOR_ENTER, RoomSprite._removeDoors)

        app.ticker.add(RoomSprite._checkDoorCollision)
    },

    _removeDoors() {
        if (!doorContainer) return;
        doorContainer.removeChildren()
        RoomSprite.displayedDoorCount = 0
    },

    _createDoors() {
        if (!doorContainer) return;

        /* if doors need to be updated */
        if (RoomSprite.displayedDoorCount !== doorContainer.children.length) {
            doorContainer.removeChildren()
            for (let i = 0; i < RoomSprite.displayedDoorCount; i++) {
                const door = new Graphics()

                door.rect(-DOOR_WIDTH / 2, -DOOR_HEIGHT / 2, DOOR_WIDTH, DOOR_HEIGHT)
                door.fill(0x777777)

                switch (i) {
                    case 0: /* top */
                        door.x = RoomSprite.ROOM_SIZE / 2
                        door.y = 0
                        break
                    case 1: /* right */
                        door.x = RoomSprite.ROOM_SIZE
                        door.y = RoomSprite.ROOM_SIZE / 2
                        door.rotation = Math.PI / 2
                        break
                    case 2: /* left */
                        door.x = 0
                        door.y = RoomSprite.ROOM_SIZE / 2
                        door.rotation = Math.PI / 2
                        break
                    case 3: /* bottom */
                        door.x = RoomSprite.ROOM_SIZE / 2
                        door.y = RoomSprite.ROOM_SIZE
                        break
                }
                doorContainer.addChild(door)
            }
        }
    },


    _checkDoorCollision() {
        if (!doorContainer) return;
        /* check distances for doors */
        doorContainer.children.forEach((door, idx) => {
            if (Distance({ x: Player.x, y: Player.y }, { x: door.x, y: door.y }) < Player.SPRITE_SIZE) {
                /* emit enter door event */
                EventHandler.emit(GLOBAL_EVENTS.DOOR_ENTER, { doorIdx: idx })

                switch (idx) {
                    case 0: /* top */
                        Player.y = RoomSprite.ROOM_SIZE
                        break
                    case 1: /* right */
                        Player.x = 0
                        break
                    case 2: /* left */
                        Player.x = RoomSprite.ROOM_SIZE
                        break
                    case 3: /* bottom */
                        Player.y = 0
                        break
                    default:
                        break;
                }
            }
        })
    }
}