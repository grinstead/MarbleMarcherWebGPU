import "./MainMenu.css";
import { createMemo, useContext } from "solid-js";
import { OrbitCamera } from "./Camera.tsx";
import { Fractal } from "./Fractal.tsx";
import { FractalShape } from "./LevelData.ts";
import { HideMarble } from "./Marble.tsx";
import {
  addVec,
  GameLoopContext,
  Props,
  rgb,
  scale,
  useGameEngine,
  useTime,
  vec,
} from "@grinstead/ambush";
import { sounds } from "./hacks.ts";

export type MainMenuProps = {
  onPlay: () => void;
};

const ButtonSource = Symbol("Button");

export function MainMenu(props: MainMenuProps) {
  const engine = useGameEngine();

  const playHoverSound = () => {
    engine.audio.enable();
    engine.audio.play(ButtonSource, sounds.menuHover);
  };

  return (
    <>
      <div class="overlay-menu">
        <div class="title">Marble Marcher</div>
        <button
          onClick={() => {
            engine.audio.enable();
            engine.audio.play(ButtonSource, sounds.menuClick);
            props.onPlay();
          }}
          onMouseEnter={playHoverSound}
        >
          Play
        </button>
        <button onMouseEnter={playHoverSound} disabled>
          Levels
        </button>
        <button onMouseEnter={playHoverSound} disabled>
          Controls
        </button>
      </div>
      <FractalBackground />
    </>
  );
}

function FractalBackground() {
  const { timer } = useContext(GameLoopContext)!;
  const time = useTime(() => timer.subtimer());

  const shape = createMemo<FractalShape>(() => {
    // set time to a theoretical frame to match original marble marcher
    const t = time() * 60;

    return {
      scale: 1.6,
      angle1: 2 + 0.5 * Math.cos(t * 0.0021),
      angle2: Math.PI + 0.5 * Math.cos(t * 0.000287),
      offset: vec(
        -4 + 0.5 * Math.sin(t * 0.00161),
        -1 + 0.2 * Math.sin(t * 0.00123),
        -1 + 0.1 * Math.cos(t * 0.00137)
      ),
    };
  });

  const camera = createMemo<Props<typeof OrbitCamera>>(() => {
    // constants copied from marble marcher
    const dist = 10;
    const orbitPos = vec(0, 3, 0);
    const theta = 0.12 * time() - 2;
    const perp = vec(Math.sin(theta), 0, Math.cos(theta));

    const camPos = addVec(orbitPos, scale(perp, dist));

    const lookX = Math.atan2(perp.x, perp.z) + 0.5;
    const lookY = -0.41;

    return {
      target: camPos,
      offset: vec(lookX, lookY),
    };
  });

  return (
    <>
      <Fractal
        {...shape()}
        color={rgb(-0.2, -0.1, -0.6)}
        marbleRadius={1}
        isPlanet={false}
        flagPosition={vec(999, 999, 999)}
      />
      <HideMarble />
      <OrbitCamera {...camera()} />
    </>
  );
}
