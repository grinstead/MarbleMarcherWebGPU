import { FrameTimer, useTime, vec } from "@grinstead/ambush";
import { Fractal } from "./Fractal.tsx";
import { LevelData } from "./LevelData.ts";
import { Accessor } from "solid-js";

export type LevelProps = LevelData & { time: FrameTimer };

export function Level(props: LevelProps) {
  const time = useTime(() => props.time);

  return (
    <Fractal
      scale={props.scale}
      angle1={animate(props.angle1, props.animation.x, time)}
      angle2={animate(props.angle2, props.animation.y, time)}
      offset={vec(
        props.offset.x,
        animate(props.offset.y, props.animation.z, time),
        props.offset.z
      )}
      color={props.color}
      marbleRadius={props.marbleRadius}
      isPlanet={props.isPlanet}
      flagPosition={props.flagPosition}
    />
  );
}

function animate(base: number, anim: number, time: Accessor<number>) {
  return base + (anim && anim * Math.sin(time() * 0.9));
}
