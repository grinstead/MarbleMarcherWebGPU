import {
  FrameTimer,
  GameLoop,
  GameLoopContext,
  VEC_ZERO,
  Vec,
  VectorBinding,
  addVec,
  magnitude,
  normalize,
  scale,
  subtractVec,
  useTime,
  vec,
  vecEqual,
  xyzArray,
} from "@grinstead/ambush";
import { Fractal, nearestPoint } from "./Fractal.tsx";
import { FractalShape, LevelData } from "./LevelData.ts";
import { Accessor, createMemo, createSignal, useContext } from "solid-js";
import { MatrixBinary, rotateAboutY } from "./Matrix.ts";
import { unwrap } from "solid-js/store";

export type LevelProps = {
  level: LevelData;
  timer: FrameTimer;
  heldKeys: Set<string>;
};

export function Level(props: LevelProps) {
  const time = useTime(() => props.timer);

  const [pMarble, setPMarble] = createSignal(
    unwrap(props.level.marblePosition)
  );

  const nearest = nearestPoint(props.level, pMarble());
  console.log({
    marble: pMarble(),
    nearest,
    distance: magnitude(subtractVec(pMarble(), nearest)),
  });

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
