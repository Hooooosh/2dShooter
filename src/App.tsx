import { Application, extend, useApplication } from "@pixi/react";
import { Container } from "pixi.js";
import { GenericInputHandler } from "./helpers/input";
import { useEffect, useRef } from "react";
import { Player } from "./sprites/PlayerSprite";
import { RoomSprite } from "./sprites/RoomSprite";
import { ParticleHandler } from "./handlers/ParticleHandler";
import UiTopBar from "./react-components/ui-top-bar";
import { BulletHandler } from "./handlers/BulletHandler";
import { EnemyHandler } from "./handlers/EnemyHandler";
import DebugCanvas from "./react-components/debug-canvas";
import { _DebugFunctions } from "./sprites/_DebugFunctions";
import { LevelLoopHandler } from "./handlers/LevelLoopHandler";
import UiLeftBar from "./react-components/ui-left-bar";

extend({
  Container,
});

export default function App() {
  return (
    <>
      <UiTopBar />
      <UiLeftBar />
      <DebugCanvas />

      <Application resizeTo={window}>
        <Game />
      </Application>
    </>
  )
}

function Game() {
  const { app } = useApplication()
  const isMounted = useRef(false)

  useEffect(() => {
    if(isMounted.current) return;
    isMounted.current = true

    GenericInputHandler._init(app)
    
    RoomSprite._init(app)
    Player._init(app)
    
    ParticleHandler._init(app)
    EnemyHandler._init(app)
    BulletHandler._init(app)

    LevelLoopHandler._init(app)
    
    _DebugFunctions._init()

  }, [app])

  useEffect(() => {
  }, [])

  return null
}