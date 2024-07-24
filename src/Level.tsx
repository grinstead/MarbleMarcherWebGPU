import {
  FrameTimer,
  GameLoop,
  GameLoopContext,
  MouseAccessors,
  VEC_X,
  VEC_Y,
  VEC_ZERO,
  Vec,
  addVec,
  cross,
  dot,
  magnitude,
  normalize,
  rescale,
  scale,
  subtractVec,
  useGameEngine,
  useTime,
  vec,
  vecEqual,
} from "@grinstead/ambush";
import { Fractal, FractalProps, nearestPoint } from "./Fractal.tsx";
import { LevelData } from "./LevelData.ts";
import {
  Accessor,
  Match,
  Setter,
  Show,
  Switch,
  createComputed,
  createMemo,
  createSignal,
  useContext,
} from "solid-js";
import { IDENTITY, MatrixBinary, rotateAboutY } from "./Matrix.ts";
import { MarbleCamera } from "./Camera.tsx";
import { Marble } from "./Marble.tsx";
import { MARBLE_SOURCE, playBounceSound, sounds } from "./hacks.ts";
import { TimeCounter } from "./UI.tsx";

const MARBLE_BOUNCE = 1.2; //Range 1.0 to 2.0

// forces are the original repos * 60fps * 60fps
const GRAVITY = 18;
const GROUND_FORCE = 28.8;
const AIR_FORCE = 14.4;
const GROUND_FRICTION = 0.99;
const AIR_FRICTION = 0.995;

const GROUND_RATIO = 1.15;

const NUM_PHYSICS_STEPS = 6;

const VICTORY_SECONDS = 3;

export type LevelProps = {
  level: LevelData;
  onVictory: () => void;
  heldKeys: Set<string>;
};

export type LevelEndState = {
  time: number;
  endVelocity: Vec;
  endPosition: Vec;
  fractal: FractalProps;
};

function LevelWrapper(props: LevelProps) {
  const gameloop = useContext(GameLoopContext)!;

  const [timer, setTimer] = createSignal(gameloop.timer.subtimer());

  return (
    <Show keyed when={timer()}>
      {(timer) => (
        <Level
          {...props}
          timer={timer}
          onReset={() => {
            setTimer(gameloop.timer.subtimer());
          }}
        />
      )}
    </Show>
  );
}

export { LevelWrapper as Level };

export type InternalLevelProps = {
  timer: FrameTimer;
  onReset: () => void;
} & LevelProps;

function Level(props: InternalLevelProps) {
  const { mouse } = useGameEngine();
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

  const [worldMatrix, setWorldMatrix] = createSignal<Float32Array>(IDENTITY, {
    equals: arrayEqual,
  });

  /**
   * Defined if we have a victory, the actual value is the final speed of the marble
   */
  const [victory, setVictory] = createSignal<LevelEndState>();

  return (
    <>
      <MouseTracking mouse={mouse} setCameraOffset={setCameraOffset} />
      <Switch>
        <Match when={time() < 3}>
          <Fractal {...props.level} />
          <h1 class="countdown">{3 - Math.floor(time())}</h1>
        </Match>
        <Match when={!victory()}>
          <LevelGameplay
            heldKeys={props.heldKeys}
            level={props.level}
            marble={marble()}
            onVictory={setVictory}
            setMarble={setMarble}
            setWorldMatrix={setWorldMatrix}
            cameraOffset={cameraOffset()}
            onReset={props.onReset}
            timer={props.timer.subtimer()}
          />
        </Match>
        <Match when={true}>
          <LevelCelebration
            onVictory={props.onVictory}
            setMarble={setMarble}
            worldMatrix={worldMatrix()}
            state={victory()!}
          />
        </Match>
      </Switch>
      <Marble position={marble()} />
      <MarbleCamera
        marbleRadius={props.level.marbleRadius}
        worldMatrix={worldMatrix()}
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
  onVictory: (state: LevelEndState) => void;
  setMarble: Setter<Vec>;
  setWorldMatrix: Setter<Float32Array>;
  cameraOffset: Vec;
  heldKeys: Set<string>;
  onReset: () => void;
};

function LevelGameplay(props: LevelGameplayProps) {
  const engine = useGameEngine();

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

  const fractal = createMemo(() => ({
    ...shape(),
    color: props.level.color,
    marbleRadius: props.level.marbleRadius,
    isPlanet: props.level.isPlanet,
    flagPosition: props.level.flagPosition,
  }));

  const runStep = createMemo(() => {
    const { heldKeys, timer } = props;
    const { marbleRadius } = props.level;
    let v = VEC_ZERO;
    let p = VEC_ZERO;
    let deltaTime = 0;
    const worldMatrix = new MatrixBinary();

    return step;

    function step() {
      if (heldKeys.has("r")) {
        props.onReset();
        return;
      }

      deltaTime = timer.deltaTime;
      if (!deltaTime) return;

      if (props.level.isPlanet) {
        const yAxis = normalize(p) ?? VEC_Y;
        const zAxis = rescale(cross(yAxis, worldMatrix.multVec(VEC_X)), -1)!;
        const xAxis = rescale(cross(zAxis, yAxis), -1)!;

        // prettier-ignore
        worldMatrix.set(new Float32Array([
          xAxis.x, xAxis.y, xAxis.z, 0,
          yAxis.x, yAxis.y, yAxis.z, 0,
          zAxis.x, zAxis.y, zAxis.z, 0,
                0,       0,       0, 1,
        ]));
      } else {
        worldMatrix.set(IDENTITY);
      }

      props.setWorldMatrix(worldMatrix.snapshot());

      let onGround = false;
      let maxBounce = 0;
      p = props.marble;

      for (let i = 0; i < NUM_PHYSICS_STEPS; i++) {
        gravity();
        const result = collision();
        if (result === "crushed") {
          props.onReset();
          engine.audio.play(MARBLE_SOURCE, sounds.shatter);
          return;
        } else if (typeof result === "number") {
          onGround = true;
          maxBounce = Math.max(result, maxBounce);
        } else if (result === true) {
          onGround = true;
        }
        p = addVec(p, scale(v, deltaTime / NUM_PHYSICS_STEPS));
      }

      if (maxBounce > 0) {
        playBounceSound(engine.audio, maxBounce);
      }

      // add the velocity the user is inputing, but it will
      // only apply next frame
      addUserInput(onGround);

      // apply some cheap friction
      v = scale(v, onGround ? GROUND_FRICTION : AIR_FRICTION);

      if (p.y < props.level.deathBarrier) {
        props.onReset();
        return;
      }

      props.setMarble(p);

      if (isFinished()) {
        engine.audio.play(null, sounds.goal);
        props.onVictory({
          time: timer.time,
          endVelocity: v,
          endPosition: p,
          fractal: fractal(),
        });
      }
    }

    function gravity() {
      let f = marbleRadius * (GRAVITY / NUM_PHYSICS_STEPS);
      let g = (props.level.isPlanet && normalize(p)) || vec(0, 1, 0);

      v = subtractVec(v, scale(g, f * deltaTime));
    }

    /**
     * Computes collision with the fractal
     * @returns whether the fractal is "on the ground"
     */
    function collision(): boolean | number | "crushed" {
      const nearest = nearestPoint(shape(), p);
      const delta = subtractVec(nearest, p);
      const distance = magnitude(delta);

      if (distance < marbleRadius * 0.001) {
        return "crushed";
      }

      if (distance > marbleRadius) {
        // no collision
        return distance < marbleRadius * GROUND_RATIO;
      }

      const direction = scale(delta, 1 / distance);

      let dv = dot(v, direction);
      p = subtractVec(p, subtractVec(scale(direction, marbleRadius), delta));
      v = subtractVec(v, scale(direction, dv * MARBLE_BOUNCE));

      return dv;
    }

    function addUserInput(onGround: boolean) {
      const cameraMatrix = new MatrixBinary();
      rotateAboutY(cameraMatrix, props.cameraOffset.x);

      let dMarble = vec(
        (heldKeys.has("d") ? 1 : 0) - (heldKeys.has("a") ? 1 : 0),
        0,
        (heldKeys.has("s") ? 1 : 0) - (heldKeys.has("w") ? 1 : 0)
      );

      // pick rotation based off of camera rotation
      dMarble = cameraMatrix.multVec(dMarble);

      // orient to the planet
      dMarble = worldMatrix.multVec(dMarble);

      v = addVec(
        v,
        scale(
          dMarble,
          (onGround ? GROUND_FORCE : AIR_FORCE) * marbleRadius * deltaTime
        )
      );
    }

    function isFinished() {
      const flag = props.level.flagPosition;
      const inVerticalRange = props.level.isPlanet
        ? flag.y - 7 * marbleRadius <= p.y && p.y <= flag.y
        : flag.y <= p.y && p.y <= flag.y + 7 * marbleRadius;

      if (!inVerticalRange) return false;

      const fx = p.x - flag.x;
      const fz = p.z - flag.z;
      return fx * fx + fz * fz < 6 * marbleRadius * marbleRadius;
    }
  });

  return (
    <>
      <Fractal {...fractal()} />
      <GameLoop.Part step="main" work={runStep()} />
      <TimeCounter seconds={time()} />
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

function arrayEqual(a: ArrayLike<any>, b: ArrayLike<any>): boolean {
  const length = a.length;
  if (b.length !== length) return false;

  let equal = true;
  for (let i = 0; equal && i < length; i++) {
    equal = a[i] === b[i];
  }

  return equal;
}

function LevelCelebration(props: {
  setMarble: Setter<Vec>;
  state: LevelEndState;
  onVictory: () => void;
  worldMatrix: Float32Array;
}) {
  const gameloop = useContext(GameLoopContext)!;
  const time = useTime(() => gameloop.timer.subtimer());

  let originalMarble: undefined | Vec;

  return (
    <>
      <Fractal {...props.state.fractal} />
      <GameLoop.Part step="main" work={runStep} />
      <TimeCounter seconds={props.state.time} />
    </>
  );

  function runStep() {
    const { fractal } = props.state;
    const seconds = time();

    if (seconds > VICTORY_SECONDS) {
      props.onVictory();
      return;
    }

    let percentage = Math.min(seconds / (0.6 * VICTORY_SECONDS), 1);

    let height = 7.5 + Math.sin(seconds * 5);
    let target = vec(0, fractal.marbleRadius * height, 0);
    target = new MatrixBinary(props.worldMatrix).multVec(target);
    target = addVec(fractal.flagPosition, target);

    props.setMarble((prev) => {
      originalMarble ??= prev;

      const pos = addVec(
        originalMarble,
        scale(props.state.endVelocity, seconds)
      );

      return addVec(scale(pos, 1 - percentage), scale(target, percentage));
    });
  }
}

export function timerText(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const fullSeconds = Math.floor(seconds) % 60;
  const centaseconds = Math.floor((seconds - Math.floor(seconds)) * 100);

  return `${minLengthDigits(2, minutes)}:${minLengthDigits(
    2,
    fullSeconds
  )}.${minLengthDigits(2, centaseconds)}`;
}

export function minLengthDigits(minLength: number, value: number) {
  const str = String(value);
  const needs = minLength - str.length;
  return needs > 0 ? `${"0".repeat(needs)}${str}` : str;
}
