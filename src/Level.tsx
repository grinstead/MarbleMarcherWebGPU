import {
  FrameTimer,
  GameLoop,
  GameLoopContext,
  VEC_ZERO,
  VectorBinding,
  addVec,
  scale,
  useTime,
  vec,
  vecEqual,
  xyzArray,
} from "@grinstead/ambush";
import { Fractal } from "./Fractal.tsx";
import { LevelData } from "./LevelData.ts";
import { Accessor, createMemo, createSignal, useContext } from "solid-js";
import { MatrixBinary, rotateAboutY } from "./Matrix.ts";

export type LevelProps = {
  level: LevelData;
  timer: FrameTimer;
  heldKeys: Set<string>;
};

export function Level(props: LevelProps) {
  const time = useTime(() => props.timer);

  const [pMarble, setPMarble] = createSignal(props.level.marblePosition);

  const runStep = createMemo(() => {
    const { heldKeys, timer } = props;
    const { startLookDirection } = props.level;
    let vMarble = VEC_ZERO;

    return step;

    function step() {
      moveMarble();
    }

    function moveMarble() {
      const camera = new MatrixBinary();
      rotateAboutY(camera, startLookDirection);

      const dMarble = vec(
        (heldKeys.has("d") ? 1 : 0) - (heldKeys.has("a") ? 1 : 0),
        0,
        (heldKeys.has("s") ? 1 : 0) - (heldKeys.has("w") ? 1 : 0)
      );

      vMarble = addVec(
        vMarble,
        scale(camera.multVec(dMarble), 0.01 * timer.deltaTime)
      );

      if (!vecEqual(vMarble, VEC_ZERO)) {
        setPMarble((prev) => addVec(prev, vMarble));
      }
    }
  });

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
      <GameLoop.Part step="main" work={runStep()} />
      <VectorBinding
        label="iMarblePos"
        group={0}
        id={8}
        value={xyzArray(pMarble())}
      />
    </>
  );
}

function animate(base: number, anim: number, time: Accessor<number>) {
  return base + (anim && anim * Math.sin(time() * 0.9));
}
