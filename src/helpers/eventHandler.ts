import { IHitbox } from "../handlers/HitboxHandler";
import { Vector2 } from "../interfaces/genericInterfaces";

export enum GLOBAL_EVENTS {
  HEALTH_CHANGED,
  STAMINA_CHANGED,
  PAUSE,
  UNPAUSE,
  TELEPORT,
  INTERACT,
  STAGE_CLEAR,
  DOOR_ENTER,
  ENEMY_DIE,
  UPDATE_STAGE_INFO_UI,

  _DEBUG_DRAW_RECT,
  _DEBUG_DRAW_DOT,
}

type EventMap = {
  [GLOBAL_EVENTS.HEALTH_CHANGED]: void;
  [GLOBAL_EVENTS.STAMINA_CHANGED]: void;
  [GLOBAL_EVENTS.PAUSE]: void;
  [GLOBAL_EVENTS.UNPAUSE]: void;
  [GLOBAL_EVENTS.TELEPORT]: Vector2;
  [GLOBAL_EVENTS.INTERACT]: { entityId: string };
  [GLOBAL_EVENTS.DOOR_ENTER]: { doorIdx: number };
  [GLOBAL_EVENTS.ENEMY_DIE]: void;
  [GLOBAL_EVENTS.STAGE_CLEAR]: void;
  [GLOBAL_EVENTS.UPDATE_STAGE_INFO_UI]: void;

  [GLOBAL_EVENTS._DEBUG_DRAW_RECT]: IHitbox;
  [GLOBAL_EVENTS._DEBUG_DRAW_DOT]: Vector2;
}

class _EventHandler {
  private events: Partial<Record<keyof EventMap, Set<unknown>>> = {}

  on<K extends keyof EventMap>(
    event: K,
    handler: (payload: EventMap[K]) => void
  ) {
    if (!this.events[event]) {
      this.events[event] = new Set<unknown>()
    }

    const handlers = this.events[event] as Set<(payload: EventMap[K]) => void>
    handlers.add(handler)

    return () => {
      handlers.delete(handler)
      if (handlers.size === 0) {
        delete this.events[event]
      }
    }
  }

  off<K extends keyof EventMap>(
    event: K,
    handler: (payload: EventMap[K]) => void
  ) {
    const pickedHandlers = this.events[event] as Set<(payload: EventMap[K]) => void> | undefined
    if (pickedHandlers) {
      pickedHandlers.delete(handler)
      if (pickedHandlers.size === 0) {
        delete this.events[event]
      }
    }
  }

  emit<K extends keyof EventMap>(event: K, payload?: EventMap[K]) {
    const handlers = this.events[event] as Set<(payload: EventMap[K]) => void> | undefined

    if (!handlers) {
      return
    }

    if (payload === undefined) {
      handlers.forEach((handler) => handler(undefined as EventMap[K]))
      return
    }

    handlers.forEach((handler) => handler(payload))


  }
}

export const EventHandler = new _EventHandler(); /* singleton */
