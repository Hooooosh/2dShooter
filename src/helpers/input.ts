import { Application } from "pixi.js"


export const Input = {
    mouseDown: false,
    keyboardKeys: new Set<string>(),

    isKeyDown(code: string) {
        return this.keyboardKeys.has(code)
    },

    handleKeydown: (e: KeyboardEvent) => {
        Input.keyboardKeys.add(e.code)
    },
    handleKeyup: (e: KeyboardEvent) => {
        Input.keyboardKeys.delete(e.code)
    },

    init(app: Application) {
        window.addEventListener("keydown", Input.handleKeydown)
        window.addEventListener("keyup", Input.handleKeyup)

        app.stage.eventMode = "static"
        app.stage.interactive = true

        app.canvas.onmousedown = () => this.mouseDown = true
        app.canvas.onmouseup = () => this.mouseDown = false
        app.canvas.onmouseout = () => this.mouseDown = false
    }
}
