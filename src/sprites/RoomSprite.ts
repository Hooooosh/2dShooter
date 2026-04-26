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
const BORDER_OFFSET = 10
const BORDER1 = {
  width: 3,
  color: 0xdddddd,
}
const BORDER2 = {
  width: 2,
  color: 0xaaaaaa,
}

const _DOOR_POSITIONS = [
  { x: ROOM_SIZE / 2, y: 0 }, /* top */
  { x: ROOM_SIZE, y: ROOM_SIZE / 2 }, /* right */
  { x: 0, y: ROOM_SIZE / 2 }, /* left */
  { x: ROOM_SIZE / 2, y: ROOM_SIZE }, /* bottom */
]


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
    border.stroke({ width: BORDER1.width, color: BORDER1.color })


    const border2 = new Graphics()
    border2.rect(-BORDER_OFFSET, -BORDER_OFFSET, ROOM_SIZE + BORDER_OFFSET * 2, ROOM_SIZE + BORDER_OFFSET * 2)
    border2.stroke({ width: BORDER2.width, color: BORDER2.color })

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

      const singleDoorContainer = new Container()

      for (let i = 0; i < RoomSprite.displayedDoorCount; i++) {
        const doorLine1 = new Graphics()
        const doorLine2 = new Graphics()

        switch (i) {
          case 0: /* top */
            doorLine1.x = RoomSprite.ROOM_SIZE / 2
            doorLine1.y = 0
            break
          case 1: /* right */
            doorLine1.rotation = Math.PI / 2
            doorLine1.x = RoomSprite.ROOM_SIZE
            doorLine1.y = RoomSprite.ROOM_SIZE / 2
            break
          case 2: /* left */
            doorLine1.x = 0
            doorLine1.y = RoomSprite.ROOM_SIZE / 2
            doorLine1.rotation = -Math.PI / 2
            break
          case 3: /* bottom */
            doorLine1.x = RoomSprite.ROOM_SIZE / 2
            doorLine1.y = RoomSprite.ROOM_SIZE
            doorLine1.rotation = Math.PI
            break
        }

        doorLine2.x = doorLine1.x
        doorLine2.y = doorLine1.y
        doorLine2.rotation = doorLine1.rotation


        /* draw bg color mask */
        const doorMask = new Graphics()
        doorMask.rotation = doorLine1.rotation
        doorMask.x = doorLine1.x - Math.sin(doorLine1.rotation) * 10
        doorMask.y = doorLine1.y + Math.cos(doorLine1.rotation) * 10
        doorMask.rect(
          -DOOR_WIDTH / 2 + 1.5,
          -DOOR_HEIGHT + 1.5,
          DOOR_WIDTH - 1.5,
          DOOR_HEIGHT - 1.5
        )
        doorMask.fill(0x000000)



        /* draw door lines */
        doorLine1
          .moveTo(-DOOR_WIDTH / 2, -BORDER_OFFSET)
          .lineTo(-DOOR_WIDTH / 2, -DOOR_HEIGHT)
          .lineTo(DOOR_WIDTH / 2, -DOOR_HEIGHT)
          .lineTo(DOOR_WIDTH / 2, -BORDER_OFFSET)
        doorLine1.stroke({ width: BORDER2.width, color: BORDER2.color })

        doorLine2
          .moveTo(-DOOR_WIDTH / 2, 0)
          .lineTo(-DOOR_WIDTH / 2 + BORDER_OFFSET, 0)
          .lineTo(-DOOR_WIDTH / 2 + BORDER_OFFSET, -DOOR_HEIGHT + BORDER_OFFSET)
          .lineTo(DOOR_WIDTH / 2 - BORDER_OFFSET, -DOOR_HEIGHT + BORDER_OFFSET)
          .lineTo(DOOR_WIDTH / 2 - BORDER_OFFSET, 0)
          .lineTo(DOOR_WIDTH / 2, 0)
        doorLine2.stroke({ width: BORDER1.width, color: BORDER1.color })

        singleDoorContainer.addChild(doorMask)
        singleDoorContainer.addChild(doorLine1)
        singleDoorContainer.addChild(doorLine2)
        doorContainer.addChild(singleDoorContainer)
      }
    }
  },

  _checkDoorCollision() {
    if (!doorContainer) return;
    /* check distances for doors */
    for (let idx = 0; idx < RoomSprite.displayedDoorCount; idx++) {
      if (Distance({ x: Player.x, y: Player.y }, _DOOR_POSITIONS[idx]) < Player.SPRITE_SIZE * 0.7) {
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
    }
  }
}