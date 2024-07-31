import "./MainMenu.css";
import {
  createMemo,
  createRenderEffect,
  createSignal,
  Signal,
  useContext,
} from "solid-js";
import { OrbitCamera } from "./Camera.tsx";
import { Fractal, FractalProps } from "./Fractal.tsx";
import { HideMarble } from "./Marble.tsx";
import {
  GameLoopContext,
  Props,
  rgb,
  scale,
  useGameEngine,
  useTime,
  vec3,
} from "@grinstead/ambush";
import { FAR_AWAY, sounds } from "./hacks.ts";

export type MainMenuProps = {
  onPlay: (fromFractal: FractalProps) => void;
};

const ButtonSource = Symbol("Button");

export function MainMenu(props: MainMenuProps) {
  const { audio } = useGameEngine();

  const fractal = createSignal<FractalProps>(genericFractal());

  const playHoverSound = () => {
    audio.enable();
    audio.play(ButtonSource, sounds.menuHover);
  };

  return (
    <>
      <div class="overlay-menu">
        <div class="title">Marble Marcher</div>
        <button
          onClick={() => {
            audio.enable();
            audio.play(ButtonSource, sounds.menuClick);
            props.onPlay(fractal[0]());
          }}
          onMouseEnter={playHoverSound}
        >
          Play
        </button>
        {/* <button onMouseEnter={playHoverSound} disabled>
          Levels
        </button>
        <button onMouseEnter={playHoverSound} disabled>
          Controls
        </button> */}
      </div>
      <FractalBackground fractal={fractal} />
    </>
  );
}

function FractalBackground(props: { fractal: Signal<FractalProps> }) {
  const { timer } = useContext(GameLoopContext)!;
  const time = useTime(() => timer.subtimer());

  createRenderEffect(() => {
    props.fractal[1](genericFractal(time() * 60));
  });

  const camera = createMemo<Props<typeof OrbitCamera>>(() => {
    // constants copied from marble marcher
    const dist = 10;
    const orbitPos = vec3(0, 3, 0);
    const theta = 0.12 * time() - 2;
    const perp = vec3(Math.sin(theta), 0, Math.cos(theta));

    const camPos = orbitPos.plus(scale(perp, dist));

    const lookX = Math.atan2(perp.x, perp.z) + 0.5;
    const lookY = -0.41;

    return {
      target: camPos,
      offset: vec3(lookX, lookY, 0),
    };
  });

  return (
    <>
      <Fractal {...props.fractal[0]()} />
      <HideMarble />
      <OrbitCamera {...camera()} />
    </>
  );
}

const GENERIC_FRACTAL = {
  color: rgb(-0.2, -0.1, -0.6),
  marbleRadius: 1,
  isPlanet: false,
  flagPosition: FAR_AWAY,
};

export function genericFractal(frame: number = 0): FractalProps {
  return {
    ...GENERIC_FRACTAL,
    scale: 1.6,
    angle1: 2 + 0.5 * Math.cos(frame * 0.0021),
    angle2: Math.PI + 0.5 * Math.cos(frame * 0.000287),
    offset: vec3(
      -4 + 0.5 * Math.sin(frame * 0.00161),
      -1 + 0.2 * Math.sin(frame * 0.00123),
      -1 + 0.1 * Math.cos(frame * 0.00137)
    ),
  };
}
