import { Application, extend, useApplication } from "@pixi/react";
import { Container } from "pixi.js";
import { Input } from "./helpers/input";
import { useEffect } from "react";
import { Player } from "./sprites/PlayerSprite";
import { RoomSprite } from "./sprites/RoomSprite";
import { ParticleHandler } from "./sprites/ParticleHandler";
import UiTopbar from "./react-components/ui-top-bar";
import { BulletHandler } from "./sprites/BulletHandler";
import { EnemyHandler } from "./sprites/EnemyHandler";
import DebugCanvas from "./react-components/debug-canvas";

extend({
  Container,
});

export default function App() {
  return (
    <>
      <UiTopbar />
      <DebugCanvas />

      <Application resizeTo={window}>
        <Game />
      </Application>
    </>
  )
}

function Game() {
  const { app } = useApplication()

  useEffect(() => {
    Player._init(app)
    RoomSprite._init(app)
    Input.init(app)
    ParticleHandler._init(app)
    BulletHandler._init(app)
    EnemyHandler._init(app)

  }, [app])

  useEffect(() => {
  }, [])

  return null
}