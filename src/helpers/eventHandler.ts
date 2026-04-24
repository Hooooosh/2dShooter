import { IHitbox } from "../sprites/HitboxHandler";

export enum GLOBAL_EVENTS {
  HEALTH_CHANGED,
  STAMINA_CHANGED,
  PAUSE,
  UNPAUSE,
  TELEPORT,
  INTERACT,
  SCREEN_RESOLUTION_REFRESH,
  _DEBUG_DRAW_RECT
}

type EventMap = {
  [GLOBAL_EVENTS.HEALTH_CHANGED]: void;
  [GLOBAL_EVENTS.STAMINA_CHANGED]: void;
  [GLOBAL_EVENTS.PAUSE]: void;
  [GLOBAL_EVENTS.UNPAUSE]: void;
  [GLOBAL_EVENTS.TELEPORT]: { x: number; y: number };
  [GLOBAL_EVENTS.INTERACT]: { entityId: string };
  [GLOBAL_EVENTS.SCREEN_RESOLUTION_REFRESH]: void;
  [GLOBAL_EVENTS._DEBUG_DRAW_RECT]: IHitbox;
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

  emit(event: GLOBAL_EVENTS.HEALTH_CHANGED): void
  emit(event: GLOBAL_EVENTS.STAMINA_CHANGED): void
  emit(event: GLOBAL_EVENTS.PAUSE): void
  emit(event: GLOBAL_EVENTS.UNPAUSE): void
  emit(event: GLOBAL_EVENTS.SCREEN_RESOLUTION_REFRESH): void
  emit(event: GLOBAL_EVENTS.TELEPORT, payload: { x: number; y: number }): void
  emit(event: GLOBAL_EVENTS.INTERACT, payload: { entityId: string }): void
  emit(event: GLOBAL_EVENTS._DEBUG_DRAW_RECT, payload: IHitbox): void
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
