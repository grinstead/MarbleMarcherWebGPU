import { FrameTimer } from "@grinstead/ambush";
import { Fractal } from "./Fractal.tsx";
import { LevelData } from "./LevelData.ts";

export type LevelProps = LevelData & { time: FrameTimer };

export function Level(props: LevelProps) {
  return (
    <Fractal
      scale={props.scale}
      animation={props.animation}
      angle1={props.angle1}
      angle2={props.angle2}
      offset={props.offset}
      color={props.color}
      marbleRadius={props.marbleRadius}
      isPlanet={props.isPlanet}
      flagPosition={props.flagPosition}
      time={props.time}
    />
  );
}
