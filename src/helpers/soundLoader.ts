import { sound } from "@pixi/sound";

type sounds = "enemyDash" | "playerDash" | "enemyShoot" | "swordSwing" | "playerHit" | "enemyHit" | "doorOpen" | "doorClose" | "enemyDie1" | "enemyDie2" | "stageClear" | "enemySpawn1" | "enemySpawn2" | "enemySpawn3"
sound.add("enemyDash", `${import.meta.env.BASE_URL}assets/sfx/enemyDash.wav`)
sound.add("swordSwing", `${import.meta.env.BASE_URL}assets/sfx/swordSwing.wav`)
sound.add("playerHit", `${import.meta.env.BASE_URL}assets/sfx/playerHit.wav`)
sound.add("enemyHit", `${import.meta.env.BASE_URL}assets/sfx/enemyHit.wav`)
sound.add("enemyDie1", `${import.meta.env.BASE_URL}assets/sfx/enemyDie1.wav`)
sound.add("enemyDie2", `${import.meta.env.BASE_URL}assets/sfx/enemyDie2.wav`)
sound.add("enemySpawn1", `${import.meta.env.BASE_URL}assets/sfx/enemySpawn1.wav`)
sound.add("enemySpawn2", `${import.meta.env.BASE_URL}assets/sfx/enemySpawn2.wav`)
sound.add("enemySpawn3", `${import.meta.env.BASE_URL}assets/sfx/enemySpawn3.wav`)
sound.add("doorOpen", `${import.meta.env.BASE_URL}assets/sfx/doorOpen.wav`)
sound.add("doorClose", `${import.meta.env.BASE_URL}assets/sfx/doorClose2.wav`)
sound.add("stageClear", `${import.meta.env.BASE_URL}assets/sfx/stageClear.wav`)
sound.add("enemyShoot", `${import.meta.env.BASE_URL}assets/sfx/enemyShoot.wav`)
sound.add("playerDash", `${import.meta.env.BASE_URL}assets/sfx/playerDash.wav`)

export const SFX = {
    play(name: sounds, options?: { volume?: number, speed?: number, onComplete?: () => void }) {
        sound.play(name, {
            volume: options?.volume ?? 0.3,
            speed: options?.speed ? options.speed : Math.random() * 0.2 + 0.9,
            complete: options?.onComplete ? options.onComplete : undefined
        })
    }
}

