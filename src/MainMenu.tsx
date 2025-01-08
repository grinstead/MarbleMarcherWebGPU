import "./MainMenu.css";
import {
  createMemo,
  createRenderEffect,
  createSignal,
  For,
  Match,
  onMount,
  Show,
  Signal,
  Switch,
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
import { persisted } from "./GameStore.ts";
import { levels } from "./LevelData.ts";
import { TimerText } from "./UI.tsx";
import { usePersisted } from "./Persisted.ts";

export type MainMenuProps = {
  onPlay: (chosenLevel: number, fromFractal: FractalProps) => void;
};

const ButtonSource = Symbol("Button");

type MainMenuScreen = "main" | "levelSelect";

function useButtonSounds() {
  const { audio } = useGameEngine();

  return {
    hover() {
      audio.enable();
      audio.play(ButtonSource, sounds.menuHover);
    },

    click() {
      audio.enable();
      audio.play(ButtonSource, sounds.menuClick);
    },
  };
}

export function MainMenu(props: MainMenuProps) {
  const { loop } = useGameEngine();

  const [screen, setScreen] = createSignal<MainMenuScreen>("main");

  onMount(() => {
    loop.timer.unpause();
  });

  const fractal = createSignal<FractalProps>(genericFractal());

  const buttonSounds = useButtonSounds();

  const results = usePersisted(persisted().results);

  return (
    <>
      <div class="overlay-menu">
        <Switch>
          <Match when={screen() === "main"}>
            <div class="title">Marble Marcher</div>
            <button
              onClick={() => {
                buttonSounds.click();

                const mostRecent = persisted().mostRecentlyPlayed.get();
                const mostRecentIndex =
                  mostRecent != null
                    ? levels.findIndex((l) => l.title === mostRecent)
                    : -1;

                props.onPlay(
                  mostRecentIndex < 0 ? 0 : mostRecentIndex,
                  fractal[0]()
                );
              }}
              onMouseEnter={buttonSounds.hover}
            >
              Play
            </button>
            <button
              onClick={() => {
                buttonSounds.click();
                setScreen("levelSelect");
              }}
              onMouseEnter={buttonSounds.hover}
            >
              Level Select
            </button>
          </Match>
          <Match when={screen() === "levelSelect"}>
            <div class="level-select">
              <div>
                <button
                  onClick={() => {
                    buttonSounds.click();
                    setScreen("main");
                  }}
                  onMouseEnter={buttonSounds.hover}
                >
                  &lt; Back
                </button>
              </div>
              <For each={levels}>
                {(level, i) => {
                  const bestTime = createMemo(
                    () => results()[level.title].bestTime
                  );

                  return (
                    <div>
                      <Show
                        when={results()[level.title] != null}
                        fallback={<div class="level-unknown">???</div>}
                      >
                        <button
                          onClick={() => {
                            buttonSounds.click();
                            props.onPlay(i(), fractal[0]());
                          }}
                          onMouseEnter={buttonSounds.hover}
                        >
                          {level.title}
                        </button>
                        <Show when={bestTime() != null}>
                          <div class="timer victory">
                            <TimerText seconds={bestTime()!} />
                          </div>
                        </Show>
                      </Show>
                    </div>
                  );
                }}
              </For>
            </div>
          </Match>
        </Switch>
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
