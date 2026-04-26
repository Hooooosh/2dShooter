import { Application, Container, Graphics } from "pixi.js"
import { DRAW_ORDERS } from "../const/drawOrders"
import { Distance } from "../helpers/dist"
import { Player } from "./PlayerSprite"
import { EventHandler, GLOBAL_EVENTS } from "../helpers/eventHandler"
import { DoorSprite } from "./DoorSprite"
import { SFX } from "../helpers/soundLoader"

let borderContainer: Container | null = null

export const BANNER_SIZE = 100
export const ROOM_SIZE = window.innerHeight - BANNER_SIZE * 2

export const BORDER_GAP = 10
export const BORDER_STYLE_INNER = {
  width: 3,
  color: 0xdddddd,
}
export const BORDER_STYLE_OUTER = {
  width: 2,
  color: 0xaaaaaa,
}

export const _DOOR_POSITIONS = [
  { x: ROOM_SIZE / 2, y: 0 }, /* top */
  { x: ROOM_SIZE, y: ROOM_SIZE / 2 }, /* right */
  { x: 0, y: ROOM_SIZE / 2 }, /* left */
  { x: ROOM_SIZE / 2, y: ROOM_SIZE }, /* bottom */
]

export const RoomSprite = {
  ROOM_BOUNDS: {
    top: BANNER_SIZE,
    bottom: window.innerHeight - BANNER_SIZE,
    left: window.innerWidth / 2 - ROOM_SIZE / 2,
    right: window.innerWidth / 2 + ROOM_SIZE / 2,
  },
  doors: [] as DoorSprite[],
  openDoorsCount: 0,
  enterDoorCooldown: 0,


  getRenderPosition(x: number, y: number) {
    return { x: x + RoomSprite.ROOM_BOUNDS.left, y: y + RoomSprite.ROOM_BOUNDS.top }
  },

  _init(app: Application) {
    borderContainer = new Container()

    /* pos & zindex */
    borderContainer.x = this.ROOM_BOUNDS.left
    borderContainer.y = this.ROOM_BOUNDS.top

    borderContainer.zIndex = DRAW_ORDERS.ROOM

    app.stage.addChild(borderContainer)
    app.ticker.add(RoomSprite._checkDoorCollision)

    /* init border */
    RoomSprite._drawBorders()

    /* events */
    EventHandler.on(GLOBAL_EVENTS.STAGE_CLEAR, () => {
      RoomSprite._updateDoorSprites()
      RoomSprite.enterDoorCooldown = 1100
    })

    /* init doors */
    for (let i = 0; i < 4; i++) {
      RoomSprite.doors.push(new DoorSprite(i, app))
    }

    app.ticker.add((ticker) => {
      if (RoomSprite.enterDoorCooldown >= 0) {
        RoomSprite.enterDoorCooldown -= ticker.deltaMS
      }
    })
  },

  _drawBorders() {
    if (!borderContainer) return;

    borderContainer.removeChildren()

    const border = new Graphics()
    border.rect(0, 0, ROOM_SIZE, ROOM_SIZE)
    border.stroke({ width: BORDER_STYLE_INNER.width, color: BORDER_STYLE_INNER.color })

    const border2 = new Graphics()
    border2.rect(-BORDER_GAP, -BORDER_GAP, ROOM_SIZE + BORDER_GAP * 2, ROOM_SIZE + BORDER_GAP * 2)
    border2.stroke({ width: BORDER_STYLE_OUTER.width, color: BORDER_STYLE_OUTER.color })

    borderContainer.addChild(border)
    borderContainer.addChild(border2)
  },

  _closeDoors(atRandomTimes = false) {
    if (atRandomTimes) {
      RoomSprite.doors.forEach(d => {
        setTimeout(() => {
          d.setIsOpen(false)
        }, Math.random() * 500);
      })
    }
    else {
      RoomSprite.doors.forEach(door => door.setIsOpen(false))
    }
    RoomSprite.openDoorsCount = 0
  },

  updateDoorCount(count: number) {
    RoomSprite.openDoorsCount = count
    RoomSprite._updateDoorSprites()
  },

  _updateDoorSprites() {
    RoomSprite.doors.forEach((door, idx) => {
      door.setIsOpen(idx < RoomSprite.openDoorsCount)
    })
  },

  _checkDoorCollision() {
    if (RoomSprite.enterDoorCooldown > 0) return;
    /* check distances for doors */
    for (let idx = 0; idx < RoomSprite.openDoorsCount; idx++) {
      if (Distance({ x: Player.x, y: Player.y }, _DOOR_POSITIONS[idx]) < Player.SPRITE_SIZE * 0.7) {
        /* emit enter door event */
        EventHandler.emit(GLOBAL_EVENTS.DOOR_ENTER, { doorIdx: idx })
        RoomSprite._closeDoors()

        SFX.play("doorClose")

        switch (idx) {
          case 0: /* entered top */
            Player.y = ROOM_SIZE
            break
          case 1: /* entered right */
            Player.x = 0
            break
          case 2: /* entered left */
            Player.x = ROOM_SIZE
            break
          case 3: /* entered bottom */
            Player.y = 0
            break
          default:
            break;
        }

      }
    }
  }
}