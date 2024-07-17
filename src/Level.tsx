import {
  BufferBinding,
  FrameTimer,
  GameLoop,
  GameLoopContext,
  VEC_ZERO,
  Vec,
  VectorBinding,
  addVec,
  dot,
  magnitude,
  maybeNewVec,
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
import {
  Accessor,
  createComputed,
  createMemo,
  createRenderEffect,
  createSignal,
  useContext,
} from "solid-js";
import {
  IDENTITY,
  MatrixBinary,
  rotateAboutX,
  rotateAboutY,
} from "./Matrix.ts";
import { unwrap } from "solid-js/store";

const MARBLE_BOUNCE = 1.2; //Range 1.0 to 2.0

// forces are the original repos * 60fps * 60fps
const GRAVITY = 18;
const GROUND_FORCE = 28.8;
const AIR_FORCE = 14.4;
const GROUND_FRICTION = 0.99;
const AIR_FRICTION = 0.995;

const GROUND_RATIO = 1.15;

const NUM_PHYSICS_STEPS = 6;

export type LevelProps = {
  level: LevelData;
  timer: FrameTimer;
  mouse: Vec;
  heldKeys: Set<string>;
};

export function Level(props: LevelProps) {
  const time = useTime(() => props.timer);

  const start = props.level.marblePosition;
  const [pMarble, setPMarble] = createSignal(vec(start.x, start.y, start.z), {
    equals: vecEqual,
  });

  const [cameraData, setCameraData] = createSignal(VEC_ZERO, {
    equals: vecEqual,
  });

  let mouse = VEC_ZERO;
  createComputed<Vec>((prev) => {
    const m = props.mouse;

    if (prev) {
      mouse = addVec(mouse, scale(subtractVec(m, prev), 1 / 320));
    }

    return m;
  });

  const shape = createMemo(() => {
    const { level } = props;
    const { animation, offset } = level;

    return {
      scale: level.scale,
      angle1: animate(level.angle1, animation.x, time),
      angle2: animate(level.angle2, animation.y, time),
      offset: vec(offset.x, animate(offset.y, animation.z, time), offset.z),
    };
  });

  const runStep = createMemo(() => {
    const { heldKeys, timer } = props;
    const { startLookDirection, marbleRadius } = props.level;
    let v = VEC_ZERO;
    let p = VEC_ZERO;
    let deltaTime = 0;
    let prevMouse = mouse;
    let camera = vec(startLookDirection, -0.3, 15);
    setCameraData(camera);

    updateCamera();

    return step;

    function step() {
      updateCamera();

      deltaTime = timer.deltaTime;
      if (!deltaTime) return;

      let onGround = false;
      p = pMarble();
      for (let i = 0; i < NUM_PHYSICS_STEPS; i++) {
        gravity();
        onGround = collision() || onGround;
        p = addVec(p, scale(v, deltaTime / NUM_PHYSICS_STEPS));
      }

      // add the velocity the user is inputing, but it will
      // only apply next frame
      addUserInput(onGround);

      // apply some cheap friction
      v = scale(v, onGround ? GROUND_FRICTION : AIR_FRICTION);

      setPMarble(p);
    }

    function updateCamera() {
      if (vecEqual(mouse, prevMouse)) return;

      const diff = subtractVec(mouse, prevMouse);
      prevMouse = mouse;

      let { x, y } = subtractVec(camera, diff);
      while (x > Math.PI) x -= 2 * Math.PI;
      while (x < Math.PI) x += 2 * Math.PI;

      y = Math.min(Math.max(y, -Math.PI / 2), Math.PI / 2);

      camera = vec(x, y, camera.z);
      setCameraData(camera);
    }

    function gravity() {
      let f = marbleRadius * (GRAVITY / NUM_PHYSICS_STEPS);
      v = addVec(v, vec(0, -f * deltaTime, 0));
    }

    /**
     * Computes collision with the fractal
     * @returns whether the fractal is "on the ground"
     */
    function collision(): boolean {
      const nearest = nearestPoint(shape(), p);
      const delta = subtractVec(nearest, p);
      const distance = magnitude(delta);

      if (distance > marbleRadius) {
        // no collision
        return distance < marbleRadius * GROUND_RATIO;
      }

      const direction = scale(delta, 1 / distance);

      let dv = dot(v, direction);
      p = subtractVec(p, subtractVec(scale(direction, marbleRadius), delta));
      v = subtractVec(v, scale(direction, dv * MARBLE_BOUNCE));

      return true;
    }

    function addUserInput(onGround: boolean) {
      const cameraMatrix = new MatrixBinary();
      rotateAboutY(cameraMatrix, camera.x);

      const dMarble = vec(
        (heldKeys.has("d") ? 1 : 0) - (heldKeys.has("a") ? 1 : 0),
        0,
        (heldKeys.has("s") ? 1 : 0) - (heldKeys.has("w") ? 1 : 0)
      );

      v = addVec(
        v,
        scale(
          cameraMatrix.multVec(dMarble),
          (onGround ? GROUND_FORCE : AIR_FORCE) * marbleRadius * deltaTime
        )
      );
    }
  });

  const camera = new MatrixBinary();

  const cameraMatrix = createMemo(() => {
    const { marbleRadius } = props.level;

    const { x, y, z } = cameraData();

    camera.set(IDENTITY);
    rotateAboutX(camera, y);
    rotateAboutY(camera, x);

    let camPos = pMarble();
    camPos = addVec(camPos, camera.multVec(vec(0, 0, marbleRadius * z)));

    camPos = addVec(camPos, scale(camera.colY(), marbleRadius * z * 0.1));

    const mat = camera.snapshot();

    mat.set(xyzArray(camPos), 12);

    return mat;
  });

  return (
    <>
      <Fractal
        {...shape()}
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
      <BufferBinding label="iMat" group={0} id={0} value={cameraMatrix()} />
    </>
  );
}

function animate(base: number, anim: number, time: Accessor<number>) {
  return base + (anim && anim * Math.sin(time() * 0.9));
}
