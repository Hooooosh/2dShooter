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
const BORDER1 = {
  width: 3,
  color: 0xdddddd,
}
const BORDER2 = {
  width: 2,
  color: 0xaaaaaa,
  offset: 20
}


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
    border2.rect(-BORDER2.offset / 2, -BORDER2.offset / 2, ROOM_SIZE + BORDER2.offset, ROOM_SIZE + BORDER2.offset)
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
      for (let i = 0; i < RoomSprite.displayedDoorCount; i++) {
        const doorLine1 = new Graphics()
        const doorLine2 = new Graphics()

        switch (i) {
          case 0: /* top */
            doorLine1.x = RoomSprite.ROOM_SIZE / 2
            doorLine1.y = -DOOR_HEIGHT / 2
            doorLine2.x = doorLine1.x - BORDER2.offset / 2
            doorLine2.y = doorLine1.y - BORDER2.offset / 2
            break
          case 1: /* right */
            doorLine1.x = RoomSprite.ROOM_SIZE + DOOR_HEIGHT / 2
            doorLine1.y = RoomSprite.ROOM_SIZE / 2
            doorLine1.rotation = Math.PI / 2
            doorLine2.x = doorLine1.x + BORDER2.offset / 2
            doorLine2.y = doorLine1.y - BORDER2.offset / 2
            break
          case 2: /* left */
            doorLine1.x = - DOOR_HEIGHT / 2
            doorLine1.y = RoomSprite.ROOM_SIZE / 2
            doorLine1.rotation = Math.PI / 2
            doorLine2.x = doorLine1.x
            doorLine2.y = doorLine1.y - BORDER2.offset / 2
            break
          case 3: /* bottom */
            doorLine1.x = RoomSprite.ROOM_SIZE / 2
            doorLine1.y = RoomSprite.ROOM_SIZE + DOOR_HEIGHT / 2
            doorLine2.x = doorLine1.x - BORDER2.offset / 2
            doorLine2.y = doorLine1.y
            break
        }

        doorLine1.rect(-DOOR_WIDTH / 2, -DOOR_HEIGHT / 2, DOOR_WIDTH, DOOR_HEIGHT)
        doorLine1.stroke({ width: BORDER1.width, color: BORDER1.color })

        doorLine2.rotation = doorLine1.rotation

        doorLine2.rect(-DOOR_WIDTH / 2, -DOOR_HEIGHT / 2, DOOR_WIDTH + BORDER2.offset, DOOR_HEIGHT + BORDER2.offset / 2)
        doorLine2.stroke({ width: BORDER2.width, color: BORDER2.color })

        doorContainer.addChild(doorLine1)
        doorContainer.addChild(doorLine2)
      }
    }
  },


  _checkDoorCollision() {
    if (!doorContainer) return;
    /* check distances for doors */
    doorContainer.children.forEach((door, idx) => {
      let x = 0
      let y = 0

      switch (idx) {
        case 0:
          x = RoomSprite.ROOM_SIZE / 2
          y = -DOOR_HEIGHT / 2
          break;
        case 1:
          x = RoomSprite.ROOM_SIZE
          y = RoomSprite.ROOM_SIZE / 2
          break;
        case 2:
          x = 0
          y = RoomSprite.ROOM_SIZE / 2
          break;
        case 3:
          x = RoomSprite.ROOM_SIZE / 2
          y = RoomSprite.ROOM_SIZE
          break;
        default:
          break;
      }
      if (Distance({ x: Player.x, y: Player.y }, { x: x, y: y }) < Player.SPRITE_SIZE * 1.1) {
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