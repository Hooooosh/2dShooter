import { Application, extend, useApplication } from "@pixi/react";
import { Container } from "pixi.js";
import { Input } from "./helpers/input";
import { useEffect } from "react";
import { Player } from "./sprites/PlayerSprite";
import { RoomSprite } from "./sprites/RoomSprite";
import { ParticleHandler } from "./sprites/ParticleHandler";
import HealthUI from "./react-components/health-ui";

extend({
  Container,
});

export default function App() {
  return (
    <>
      <HealthUI />
      <Application resizeTo={window}>
        <Game />
      </Application>

    </>
  )
}

function Game() {
  const { app } = useApplication()

  useEffect(() => {
    Player.init(app)
    RoomSprite.init(app)
    Input.init(app)
    ParticleHandler.init(app)
  }, [app])

  useEffect(() => {
  }, [])

  return null
}