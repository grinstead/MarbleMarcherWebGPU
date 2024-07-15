import {
  FrameTimer,
  ScalarBinding,
  VectorBinding,
  rgbArray,
  useTime,
  xyzArray,
} from "@grinstead/ambush";
import { LevelData } from "./LevelData.ts";

export type FractalProps = Pick<
  LevelData,
  | "scale"
  | "animation"
  | "angle1"
  | "angle2"
  | "offset"
  | "color"
  | "marbleRadius"
  | "isPlanet"
  | "flagPosition"
> & {
  time: FrameTimer;
};

export function Fractal(props: FractalProps) {
  const time = useTime(() => props.time);

  return (
    <>
      <ScalarBinding label="iFracScale" group={0} id={3} value={props.scale} />
      <VectorBinding
        label="iFracAng1"
        group={0}
        id={4}
        value={(() => {
          const anim = props.animation.x;

          return sinCosTanAngle(
            props.angle1 + (anim && anim * Math.sin(time() * 0.9))
          );
        })()}
      />
      <VectorBinding
        label="iFracAng2"
        group={0}
        id={5}
        value={(() => {
          const anim = props.animation.y;

          return sinCosTanAngle(
            props.angle2 + (anim && anim * Math.sin(time() * 0.9))
          );
        })()}
      />
      <VectorBinding
        label="iFracShift"
        group={0}
        id={6}
        value={(() => {
          const anim = props.animation.z;
          const offset = xyzArray(props.offset);

          if (anim) {
            offset[1] += anim * Math.sin(time() * 0.9);
          }

          return offset;
        })()}
      />
      <VectorBinding
        label="iFracCol"
        group={0}
        id={7}
        value={rgbArray(props.color)}
      />
      <ScalarBinding
        label="iMarbleRad"
        group={0}
        id={9}
        value={props.marbleRadius}
      />
      <ScalarBinding
        label="iFlagScale"
        group={0}
        id={10}
        value={(props.isPlanet ? -1 : 1) * props.marbleRadius}
      />
      <VectorBinding
        label="iFlagPos"
        group={0}
        id={11}
        value={xyzArray(props.flagPosition)}
      />
    </>
  );
}

function sinCosTanAngle(angle: number): [number, number, number, number] {
  const sin = Math.sin(angle);
  const cos = Math.cos(angle);
  return [sin, cos, sin / cos, angle];
}
