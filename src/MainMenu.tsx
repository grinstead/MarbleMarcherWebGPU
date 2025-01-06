import "./MainMenu.css";
import {
  createMemo,
  createRenderEffect,
  createSignal,
  onMount,
  Signal,
  useContext,
} from "solid-js";
import { OrbitCamera } from "./Camera.tsx";
import { Fractal, FractalProps, genericFractal } from "./Fractal.tsx";
import { HideMarble } from "./Marble.tsx";
import {
  GameLoopContext,
  Props,
  scale,
  useGameEngine,
  useTime,
  vec3,
} from "@grinstead/ambush";
import { sounds } from "./hacks.ts";

export type MainMenuProps = {
  onPlay: (fromFractal: FractalProps) => void;
};

const ButtonSource = Symbol("Button");

export function MainMenu(props: MainMenuProps) {
  const { audio, loop } = useGameEngine();

  onMount(() => {
    loop.timer.unpause();
  });

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
