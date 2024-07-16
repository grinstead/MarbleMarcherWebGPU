import {
  FrameTimer,
  GameLoop,
  GameLoopContext,
  VEC_ZERO,
  Vec,
  VectorBinding,
  addVec,
  dot,
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

const MARBLE_BOUNCE = 1.2; //Range 1.0 to 2.0

export type LevelProps = {
  level: LevelData;
  timer: FrameTimer;
  heldKeys: Set<string>;
};

export function Level(props: LevelProps) {
  const time = useTime(() => props.timer);

  const [pMarble, setPMarble] = createSignal({
    ...unwrap(props.level.marblePosition),
  });

  const nearest = nearestPoint(props.level, pMarble());
  console.log({
    marble: pMarble(),
    nearest,
    distance: magnitude(subtractVec(pMarble(), nearest)),
  });

  const runStep = createMemo(() => {
    const { heldKeys, timer } = props;
    const { startLookDirection } = props.level;
    let v = VEC_ZERO;
    let p = VEC_ZERO;

    return step;

    function step() {
      p = pMarble();
      collision();
      moveMarble();
    }

    function collision() {
      const nearest = nearestPoint(props.level, p);
      const delta = subtractVec(nearest, p);
      const distance = magnitude(delta);

      const { marbleRadius } = props.level;
      if (distance > marbleRadius) {
        // no collision
        return;
      }

      const direction = scale(delta, 1 / distance);

      let dv = dot(v, direction);
      p = subtractVec(p, subtractVec(scale(direction, marbleRadius), delta));
      v = subtractVec(v, scale(direction, dv * MARBLE_BOUNCE));
    }

    function moveMarble() {
      const camera = new MatrixBinary();
      rotateAboutY(camera, startLookDirection);

      const dMarble = vec(
        (heldKeys.has("d") ? 1 : 0) - (heldKeys.has("a") ? 1 : 0),
        0,
        (heldKeys.has("s") ? 1 : 0) - (heldKeys.has("w") ? 1 : 0)
      );

      v = addVec(v, scale(camera.multVec(dMarble), 0.01 * timer.deltaTime));

      if (!vecEqual(v, VEC_ZERO)) {
        setPMarble(addVec(p, v));
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
