import { createMemo, Match, onMount, Switch, useContext } from "solid-js";
import { Level, LevelProps } from "./Level.tsx";
import {
  GameLoopContext,
  lerp,
  rgb,
  scale,
  useGameEngine,
  useTime,
  vec2,
  vec3,
} from "@grinstead/ambush";
import { Fractal, FractalProps } from "./Fractal.tsx";
import { HideMarble, Marble } from "./Marble.tsx";
import { OrbitCamera } from "./Camera.tsx";
import { FAR_AWAY, playMusic } from "./hacks.ts";
import { levels } from "./LevelData.ts";

export type LevelWithIntroProps = LevelProps & {
  from: FractalProps;
};

const ORBIT_SPEED = 0.005;
const INTRO_START_SECONDS = 6.5;
const INTRO_END_SECONDS = 10;

export function LevelWithIntro(props: LevelWithIntroProps) {
  const gameloop = useContext(GameLoopContext)!;
  const { audio } = useGameEngine();

  onMount(() => {
    const { title } = props.level;
    playMusic(
      audio,
      levels.findIndex((l) => l.title === title)
    );
  });

  const time = useTime(() => gameloop.timer.subtimer());

  const smoothstep = createMemo(() => {
    const p = Math.min(time() / INTRO_START_SECONDS);
    return (p * p) / (2 * p * (p - 1) + 1);
  });

  const target = createMemo(() => {
    const { orbitDistance } = props.level;

    const t = time() * 60 * ORBIT_SPEED;
    const perp = vec3(Math.sin(t), 0, Math.cos(t));

    const orbit = vec3(0, orbitDistance, 0);

    return orbit.plus(scale(perp, orbitDistance * 2.5));
  });

  const camera = createMemo(() => {
    const { x, z } = target();
    const angle = Math.atan2(x, z);

    return vec2(angle, -0.3);
  });

  return (
    <Switch fallback={<Level {...props} />}>
      <Match when={time() < INTRO_START_SECONDS}>
        <Fractal
          scale={lerp(props.from.scale, props.level.scale, smoothstep())}
          angle1={angleLerp(
            props.from.angle1,
            props.level.angle1,
            smoothstep()
          )}
          angle2={angleLerp(
            props.from.angle2,
            props.level.angle2,
            smoothstep()
          )}
          offset={vec3(
            lerp(props.from.offset.x, props.level.offset.x, smoothstep()),
            lerp(props.from.offset.y, props.level.offset.y, smoothstep()),
            lerp(props.from.offset.z, props.level.offset.z, smoothstep())
          )}
          color={rgb(
            lerp(props.from.color.r, props.level.color.r, smoothstep()),
            lerp(props.from.color.g, props.level.color.g, smoothstep()),
            lerp(props.from.color.b, props.level.color.b, smoothstep())
          )}
          marbleRadius={props.level.marbleRadius}
          isPlanet={props.level.isPlanet}
          flagPosition={FAR_AWAY}
        />
        <HideMarble />
        <OrbitCamera target={target()} offset={camera()} />
      </Match>
      <Match when={time() < INTRO_END_SECONDS}>
        <Fractal {...props.level} />
        <Marble position={props.level.marblePosition} />
        <OrbitCamera target={target()} offset={camera()} />
        <h1 class="level-title">{props.level.title}</h1>
      </Match>
    </Switch>
  );
}

function angleLerp(a: number, b: number, step: number) {
  let aMod = a;
  while (Math.abs(aMod - b) > Math.PI) {
    aMod += aMod < b ? 2 * Math.PI : -2 * Math.PI;
  }

  return lerp(aMod, b, step);
}
