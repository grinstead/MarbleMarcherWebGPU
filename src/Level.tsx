import { FrameTimer, GameLoopContext, useTime, vec } from "@grinstead/ambush";
import { Fractal } from "./Fractal.tsx";
import { LevelData } from "./LevelData.ts";
import { Accessor, useContext } from "solid-js";

export type LevelProps = { level: LevelData; timer: FrameTimer };

export function Level(props: LevelProps) {
  const time = useTime(() => props.timer);

  return (
    <>
      <Fractal
        scale={props.level.scale}
        angle1={animate(props.level.angle1, props.level.animation.x, time)}
        angle2={animate(props.level.angle2, props.level.animation.y, time)}
        offset={vec(
          props.level.offset.x,
          animate(props.level.offset.y, props.level.animation.z, time),
          props.level.offset.z
        )}
        color={props.level.color}
        marbleRadius={props.level.marbleRadius}
        isPlanet={props.level.isPlanet}
        flagPosition={props.level.flagPosition}
      />
    </>
  );
}

function animate(base: number, anim: number, time: Accessor<number>) {
  return base + (anim && anim * Math.sin(time() * 0.9));
}
