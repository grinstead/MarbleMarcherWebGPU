import {
  FrameTimer,
  GameLoop,
  MouseAccessors,
  VEC_ZERO,
  Vec,
  VectorBinding,
  addVec,
  dot,
  magnitude,
  scale,
  subtractVec,
  useTime,
  vec,
  vecEqual,
  xyzArray,
} from "@grinstead/ambush";
import { Fractal, nearestPoint } from "./Fractal.tsx";
import { LevelData } from "./LevelData.ts";
import {
  Accessor,
  Match,
  Setter,
  Switch,
  createComputed,
  createMemo,
  createSignal,
} from "solid-js";
import { MatrixBinary, rotateAboutY } from "./Matrix.ts";
import { MarbleCamera } from "./Camera.tsx";

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
  mouse: MouseAccessors;
  heldKeys: Set<string>;
};

export function Level(props: LevelProps) {
  const time = useTime(() => props.timer);

  const start = props.level.marblePosition;
  const [marble, setMarble] = createSignal(vec(start.x, start.y, start.z), {
    equals: vecEqual,
  });

  const [cameraOffset, setCameraOffset] = createSignal(
    vec(props.level.startLookDirection, -0.3, 15),
    {
      equals: vecEqual,
    }
  );

  return (
    <>
      <MouseTracking mouse={props.mouse} setCameraOffset={setCameraOffset} />
      <Switch>
        <Match when={time() < 3}>
          <Fractal {...props.level} />
          <h1 class="countdown">{3 - Math.floor(time())}</h1>
        </Match>
        <Match when={true}>
          <LevelGameplay
            {...props}
            marble={marble()}
            setMarble={setMarble}
            cameraOffset={cameraOffset()}
            timer={props.timer.subtimer()}
          />
        </Match>
      </Switch>
      <VectorBinding
        label="iMarblePos"
        group={0}
        id={8}
        value={xyzArray(marble())}
      />
      <MarbleCamera
        marbleRadius={props.level.marbleRadius}
        marble={marble()}
        offset={cameraOffset()}
      />
    </>
  );
}

function animate(base: number, anim: number, time: Accessor<number>) {
  return base + (anim && anim * Math.sin(time() * 0.9));
}

type LevelGameplayProps = {
  level: LevelData;
  timer: FrameTimer;
  marble: Vec;
  setMarble: Setter<Vec>;
  cameraOffset: Vec;
  heldKeys: Set<string>;
};

function LevelGameplay(props: LevelGameplayProps) {
  const time = useTime(() => props.timer);

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
    const { marbleRadius } = props.level;
    let v = VEC_ZERO;
    let p = VEC_ZERO;
    let deltaTime = 0;

    return step;

    function step() {
      deltaTime = timer.deltaTime;
      if (!deltaTime) return;

      let onGround = false;
      p = props.marble;

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

      props.setMarble(p);
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
      rotateAboutY(cameraMatrix, props.cameraOffset.x);

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
    </>
  );
}

function MouseTracking(props: {
  mouse: MouseAccessors;
  setCameraOffset: Setter<Vec>;
}): undefined {
  createComputed<Vec | undefined>((prev) => {
    const data = props.mouse;

    // drop tracking data if the mouse button is not pressed
    if (!data.buttons()) return;

    const m = data.pos();
    if (!prev) return m;

    const diff = scale(subtractVec(m, prev), 1 / 320);

    props.setCameraOffset((camera) => {
      let { x, y } = subtractVec(camera, diff);
      while (x > Math.PI) x -= 2 * Math.PI;
      while (x < Math.PI) x += 2 * Math.PI;

      y = Math.min(Math.max(y, -Math.PI / 2), Math.PI / 2);

      return vec(x, y, camera.z);
    });

    return m;
  });
}
