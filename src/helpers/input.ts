import { Application } from "pixi.js"


export const GenericInputHandler = {
    mouseDown: false,
    continuousKbKeys: new Set<string>(),

    isKeyDown(code: string) {
        return this.continuousKbKeys.has(code)
    },

    handleKeydown: (e: KeyboardEvent) => {
        GenericInputHandler.continuousKbKeys.add(e.code)
    },
    handleKeyup: (e: KeyboardEvent) => {
        GenericInputHandler.continuousKbKeys.delete(e.code)
    },

    _init(app: Application) {
        window.addEventListener("keydown", GenericInputHandler.handleKeydown)
        window.addEventListener("keyup", GenericInputHandler.handleKeyup)

        app.stage.eventMode = "static"
        app.stage.interactive = true

        app.canvas.onmousedown = () => this.mouseDown = true
        app.canvas.onmouseup = () => this.mouseDown = false
        app.canvas.onmouseout = () => this.mouseDown = false
    }
}
